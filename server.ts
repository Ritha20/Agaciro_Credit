import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import authRoutes from "./server/routes/auth";
import scoreRoutes from "./server/routes/score";
import endorsementRoutes from "./server/routes/endorsements";
import adminRoutes from "./server/routes/admin";
import momoRoutes from "./server/routes/momo";
import loanRoutes from "./server/routes/loans";
import { optionalAuth, AuthRequest } from "./server/middleware/auth";
import { prisma } from "./server/db/client";

dotenv.config();

function generateCoachFallback(message: string, score: number, tier: string, lang: string): string {
  const msg = message.toLowerCase();
  const nextTier = tier === "Bronze" ? "Silver (450 pts)" : tier === "Silver" ? "Gold (650 pts)" : tier === "Gold" ? "Platinum (850 pts)" : "the top";
  const ptsNeeded = tier === "Bronze" ? 450 - score : tier === "Silver" ? 650 - score : tier === "Gold" ? 850 - score : 0;

  const tips: Record<string, { en: string; rw: string; sw: string }> = {
    score: {
      en: `Your current Agaciro Score is ${score}/1000 (${tier} tier). To reach ${nextTier}, you need ${ptsNeeded > 0 ? `${ptsNeeded} more points` : "you're already at the top!"}. Focus on: (1) Increasing your Mobile Money transaction volume, (2) Making cooperative savings contributions on time, and (3) Paying utility bills before due dates. Each active community endorsement also adds 35–50 points.`,
      rw: `Amanota yawe ni ${score}/1000 (${tier}). Kugirango ugere kuri ${nextTier}, ukeneye ${ptsNeeded > 0 ? `${ptsNeeded} amanota` : "uri hejuru!"}. Gukonjesha: (1) Gutera imbere imicungire ya mobile money, (2) Kwishyura imisanzu ya koperative ku gihe, (3) Kwishyura amazi n'umuriro mbere y'igihe. Endorsement imwe yiyongera ${ptsNeeded} amanota.`,
      sw: `Alama yako ya sasa ni ${score}/1000 (${tier}). Ili kufika ${nextTier}, unahitaji ${ptsNeeded > 0 ? `pointi ${ptsNeeded} zaidi` : "uko juu tayari!"}. Zingatia: (1) Kuongeza miamala ya pesa ya simu, (2) Kulipa michango ya ushirika kwa wakati, (3) Kulipa bili za huduma mapema.`,
    },
    loan: {
      en: `With your ${tier} score of ${score}/1000, you qualify for microfinance loans from Urwego Bank and cooperative SACCOs. ${tier === "Bronze" ? "Focus on reaching Silver (450 pts) to unlock Equity Bank offers." : tier === "Silver" ? "You're close to Gold — at 650 pts, Bank of Kigali BK Quick becomes available at 9.5% APR." : "Your Gold/Platinum status unlocks premium rates as low as 9.5% APR from major banks."} Click 'Find Loans' on the right panel to see your current matches.`,
      rw: `Hamwe n'amanota yawe ya ${score}/1000 (${tier}), wagabanya inguzanyo kuri Urwego Bank na koperative. ${tier === "Bronze" ? "Gereka kuri Silver (450 pts) kugirango ufungure Equity Bank." : "Ugezeho amanota make cyane ngo ufungure inguzanyo nini."} Kanda 'Find Loans' kugirango ubone utumanzi.`,
      sw: `Na alama yako ya ${score}/1000 (${tier}), unastahili mikopo kutoka Urwego Bank na vikundi vya SACCO. ${tier === "Bronze" ? "Fikia Silver (pointi 450) kufungua tofa za Equity Bank." : "Karibu sana kupanda daraja na kufungua riba nafuu zaidi."} Bonyeza 'Find Loans' upande wa kulia kuona mechi zako.`,
    },
    savings: {
      en: `To improve your Cooperative Savings score: (1) Set up automatic weekly transfers to your SACCO — even small amounts like 2,000 RWF/week build strong patterns. (2) Never miss a monthly contribution — consistency counts more than amount. (3) Ask your cooperative leader to log your contributions digitally. This directly feeds your Agaciro score.`,
      rw: `Kugirango unonosore ikiciro cy'imisanzu ya koperative: (1) Shyiraho gutura automatike buri cyumweru muri SACCO yawe. (2) Ntiwigeze utakaza imisanzu ya buri kwezi — umutekano ni ingenzi kuruta ingano. (3) Saba umuyobozi wa koperative yawe kwandika imisanzu yawe mu buryo bwa dijital.`,
      sw: `Kuboresha akaunti yako ya akiba ya ushirika: (1) Weka uhamisho wa otomatiki wa kila wiki kwenye SACCO yako. (2) Usiache malipo ya kila mwezi — uthabiti ni muhimu zaidi kuliko kiasi. (3) Omba kiongozi wa ushirika wako kurekodi michango yako kidijitali.`,
    },
    momo: {
      en: `To boost your Mobile Money score: (1) Increase your monthly transaction volume — aim for at least 15 transactions/month. (2) Use mobile money for business payments, not just personal transfers. (3) Keep your MoMo account active with regular deposits. Higher velocity = higher score. Your MoMo factor currently contributes up to 245 pts to your total score.`,
      rw: `Kugirango unonosore ikiciro cya Mobile Money: (1) Ongera umubare w'inyandiko buri kwezi — gerageza nibura 15 mu kwezi. (2) Koresha mobile money mu bihugu bya ubucuruzi, si ibyinjizwa gusa. (3) Shyiraho amafaranga buri gihe. Mobile Money itanga nibura 245 pts ku manota yawe yose.`,
      sw: `Kuimarisha alama yako ya Pesa ya Simu: (1) Ongeza idadi ya miamala ya kila mwezi — lenga angalau miamala 15/mwezi. (2) Tumia pesa za simu kwa malipo ya biashara, si tu uhamisho wa kibinafsi. (3) Weka akaunti yako ya MoMo ikiwa hai.`,
    },
    endorse: {
      en: `Community endorsements are powerful — each active one adds 35 points. To get more: (1) Ask your cooperative president or SACCO manager to vouch for you. (2) Reach out to a local market leader or sector official. (3) Religious leaders and community elders also qualify. Go to the Score tab and click "Add Endorsement" to submit requests. You can have up to 4 active endorsements (140 pts total).`,
      rw: `Endorsements za sosiyete ni ingirakamaro — imwe yiyongeraho 35 amanota. Kugirango ubone byinshi: (1) Saba umuyobozi wa koperative cyangwa umuyobozi wa SACCO. (2) Saba umuyobozi w'isoko cyangwa umukozi wa leta. (3) Abayobozi b'amadini ni barebwa neza. Jya ku kiciro cya 'Score' ukande 'Add Endorsement'.`,
      sw: `Vyeti vya jamii ni vya nguvu — kila kimoja kinaongeza pointi 35. Kupata zaidi: (1) Omba rais wa ushirika wako au meneja wa SACCO. (2) Wasiliana na kiongozi wa soko au ofisa wa eneo. (3) Viongozi wa dini na wazee wa jamii pia wanastahili. Nenda kwenye kichupo cha 'Score' na ubonyeze 'Add Endorsement'.`,
    },
    default: {
      en: `As your Agaciro Coach, here's personalized advice for your ${tier} profile (${score}/1000): Your top 3 actions this week are — (1) Log at least 5 mobile money transactions to grow your MoMo score, (2) Confirm your cooperative savings deposit is recorded for this month, and (3) Request one community endorsement from a trusted leader. These three actions alone could add 50–80 points to your score. What specific challenge can I help you with?`,
      rw: `Nk'umutoza wawe wa Agaciro, dore inama zihariye ku ${tier} yawe (${score}/1000): Ibikorwa by'ingenzi 3 iki cyumweru: (1) Andika nibura ibyerekeye 5 za mobile money, (2) Emeza ko imisanzu ya koperative yanditswe uku kwezi, (3) Saba endorsement imwe uvuye ku muyobozi wizewe. Ibi bikorwa bishobora kongera 50–80 amanota. Ni ikihe kibazo gikugoye?`,
      sw: `Kama kocha wako wa Agaciro, hapa kuna ushauri wa kibinafsi kwa ${tier} yako (${score}/1000): Vitendo 3 muhimu wiki hii: (1) Rekodi angalau miamala 5 ya pesa za simu, (2) Thibitisha amana yako ya ushirika imerekodiwa mwezi huu, (3) Omba kibali kimoja cha jamii kutoka kwa kiongozi mwaminifu. Hizi peke yake zinaweza kuongeza pointi 50–80. Ni tatizo gani mahususi naweza kukusaidia?`,
    },
  };

  const getLangText = (key: keyof typeof tips) => {
    const l = lang === "Kinyarwanda" ? "rw" : lang === "Swahili" ? "sw" : "en";
    return tips[key][l];
  };

  if (msg.includes("score") || msg.includes("point") || msg.includes("tier") || msg.includes("manota") || msg.includes("alama")) return getLangText("score");
  if (msg.includes("loan") || msg.includes("credit") || msg.includes("borrow") || msg.includes("inguzanyo") || msg.includes("mkopo")) return getLangText("loan");
  if (msg.includes("saving") || msg.includes("sacco") || msg.includes("cooperat") || msg.includes("imisanzu") || msg.includes("akiba")) return getLangText("savings");
  if (msg.includes("momo") || msg.includes("mobile money") || msg.includes("transaction") || msg.includes("transfer")) return getLangText("momo");
  if (msg.includes("endorse") || msg.includes("vouch") || msg.includes("leader") || msg.includes("community") || msg.includes("umuyobozi")) return getLangText("endorse");
  return getLangText("default");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth routes
  app.use("/api/auth", authRoutes);
  app.use("/api/score", scoreRoutes);
  app.use("/api/endorsements", endorsementRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/momo", momoRoutes);
  app.use("/api/loans", loanRoutes);

  const PORT = 3000;

  // Initialize Gemini safely
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API client initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY is not defined. AI endpoints will run in sandbox fallback mode.");
  }

  // --- API ROUTE: Health check ---
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      current_time: new Date().toISOString(),
      ai_available: !!ai
    });
  });

  // --- API ROUTE: AI Financial Coach ---
  app.post("/api/coach", optionalAuth, async (req: AuthRequest, res) => {
    const message: string = req.body?.message || "";
    let userLang: string = req.body?.language || "English";
    let userTier: string = req.body?.tier || "Silver";
    let userScore: number = req.body?.score || 680;
    try {
      const { history } = req.body;

      // If authenticated, pull real score/tier from DB
      if (req.userId) {
        const latest = await prisma.scoreHistory.findFirst({
          where: { userId: req.userId },
          orderBy: { computedAt: "desc" },
        });
        if (latest) { userScore = latest.score; userTier = latest.tier; }
      }

      const systemInstruction = `You are "Agaciro AI Credit Coach", the primary financial empowerment advisor inside the Agaciro Credit dashboard. 
Our brand identity stands for "Dignity in Every Transaction" and "Your Hustle, Your Credit". 
Your goal is to guide informal sector workers, cooperatives, motorcycle riders (Gens de Moto), and market traders in East Africa (Rwanda, Kenya, Uganda) on how to understand, build, and maintain their credit scores.

Respond professionally, warm, respectful, and highly action-oriented. Avoid dry corporate jargon. Keep your replies concise (under 200 words if possible) to maintain engagement on mobile/web layouts.
Always answer in the chosen language: ${userLang}. (If the language is Kinyarwanda or Swahili, respond purely in that language using a natural, dignified local tone!).

Context of current user:
- Tier: ${userTier} (Bronze, Silver, Gold, Platinum)
- Current Agaciro Score: ${userScore}/1000
- Custom Goal: Climb to the next tier to unlock cheaper bank interest rates and higher micro-investment limits.

Provide helpful advice with at least one practical action item (e.g., "Pay your upcoming mobile money utility target on time", "Request a cooperative leader endorsement", "Log 3 more daily trade receipt uploads").
If the user asks about the Forex Algorithmic Trading Bot (the Agaciro algorithmic yield shield for micro-investments), explain that Agaciro uses a sophisticated 7-layer quantitative system (Prediction models, inputs, risk management, stops, the Chaos/Kalman ledger) to generate small safe yields for savings, encouraging them to keep practicing good credit to unlock higher bot limits!`;

      if (!ai) {
        return res.json({ text: generateCoachFallback(message, userScore, userTier, userLang) });
      }

      // Format previous history into Gemini context
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const chatTurn of history) {
          contents.push({
            role: chatTurn.role === "user" ? "user" as const : "model" as const,
            parts: [{ text: chatTurn.content }]
          });
        }
      }
      contents.push({
        role: "user" as const,
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text || generateCoachFallback(message, userScore, userTier, userLang) });
    } catch (err: any) {
      console.error("Error in AI Coach:", err);
      res.json({ text: generateCoachFallback(message, userScore, userTier, userLang) });
    }
  });

  // --- API ROUTE: Live Macro News Feed for Forex Backtesting ---
  app.post("/api/forex/news", async (req, res) => {
    const { pair } = req.body || {};
    const targetPair = pair || "USD/RWF";
    try {
      const systemInstruction = `You are a real-time macroeconomic research feed generator.
Generate 3 realistic, market-moving news headlines that impact the Exchange Rate of ${targetPair}.
The news should sound highly professional, timely (dated around June 2026), and directly related to Central Bank operations, regional East African Community (EAC) cross-border trade, national agricultural outputs (tea/coffee), or mobile telecom innovations.

Output your response strictly as a JSON array of 3 objects with the following keys:
- headline (string)
- timestamp (string, relative, e.g. "2 hours ago", "Yesterday")
- sentimentScore (number, from -1.0 to +1.0 where negative is bearish for the base currency, positive is bullish)
- volatilityImpact (string, "Low", "Medium", "High")
- description (string, 1-2 sentence explanation)`;

      if (!ai) {
        // High quality static fallback data
        const staticNews: Record<string, any[]> = {
          "USD/RWF": [
            {
              headline: "National Bank of Rwanda Adjusts Reverse Repo Rate citing Agriculture Export Surpluses",
              timestamp: "1 hour ago",
              sentimentScore: 0.4,
              volatilityImpact: "Medium",
              description: "A surge in high-value specialty tea and coffee exports creates local RWF liquidity, prompting structural adjustments."
            },
            {
              headline: "EAC Cross-Border Digital Settlement Platform Goes Live in Kigali and Nairobi",
              timestamp: "4 hours ago",
              sentimentScore: 0.6,
              volatilityImpact: "High",
              description: "New direct multi-currency processing bypasses international routing fees, increasing regional trade efficiencies."
            },
            {
              headline: "Global Freight Pricing Increases Operational Pressure on Import Commodities",
              timestamp: "12 hours ago",
              sentimentScore: -0.3,
              volatilityImpact: "Low",
              description: "Rising maritime freight prices put slight inflationary pressure, marginally increasing USD import conversion demands."
            }
          ],
          "USD/KES": [
            {
              headline: "Central Bank of Kenya Intervenes to Moister Eurobond Debt Servicing Reservoirs",
              timestamp: "30 mins ago",
              sentimentScore: -0.2,
              volatilityImpact: "High",
              description: "Strategic reserve shifts temporarily bolster USD reserves, stabilizing local shilling intraday trading curves."
            },
            {
              headline: "Silicon Savannah Fintech Hub Logs Record Remittance Flux from EAC Diasporas",
              timestamp: "3 hours ago",
              sentimentScore: 0.5,
              volatilityImpact: "Medium",
              description: "Mobile remittance rails process record volume, amplifying local liquidity pools and bolstering trade settlements."
            },
            {
              headline: "East Africa Tea Auctions Log Substantial Price Bounces in Mombasa Markets",
              timestamp: "1 day ago",
              sentimentScore: 0.7,
              volatilityImpact: "High",
              description: "Global beverage demand pushes tea bidding levels, triggering strong commercial conversion into domestic currency."
            }
          ]
        };

        const headlines = staticNews[targetPair] || staticNews["USD/RWF"];
        return res.json({ headlines });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Generate 3 current macro news items for ${targetPair}`,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.8
        }
      });

      const parsedHeadlines = JSON.parse(response.text || "[]");
      res.json({ headlines: parsedHeadlines });
    } catch (err: any) {
      console.error("Error generating Forex news:", err);
      // Serve static fallback so backtester never crashes
      const fallbackNews = [
        {
          headline: `EAC Trade Facilitation Council Announces Harmonized Clearing Guidelines for ${targetPair}`,
          timestamp: "Just now",
          sentimentScore: 0.3,
          volatilityImpact: "Medium",
          description: "Streamlined clearing processes reduce delays across regional points, improving transactional flow."
        }
      ];
      res.json({ headlines: fallbackNews });
    }
  });

  // --- API ROUTE: AI-Powered Loan Matching ---
  app.post("/api/match-loans", optionalAuth, async (req: AuthRequest, res) => {
    try {
      let { score, tier } = req.body;

      // If authenticated, pull real score/tier from DB
      if (req.userId) {
        const latest = await prisma.scoreHistory.findFirst({
          where: { userId: req.userId },
          orderBy: { computedAt: "desc" },
        });
        if (latest) { score = latest.score; tier = latest.tier; }
      }
      const userScore = score || 680;
      const userTier = tier || "Silver";

      const systemInstruction = `You are the Automated Microfinance and Bank API integration system of Agaciro Credit.
Based on the client's current tier (${userTier}) and score (${userScore}/1000), recommend three local credit providers in East Africa (such as Bank of Kigali, Equity Bank, Urwego Bank, Cleanshop Cooperative, or regional SACCOs) that have matched APIs.
Your output must be returned strictly in JSON format as an array of 3 objects containing:
- bankName (string, e.g. "Urwego microfinance", "Bank of Kigali", "EAC Cooperative")
- approvalProbability (number, 0 to 1 percentage)
- interestRate (string, e.g. "8% apr", "12% apr")
- maxAmount (string, e.g. "300,000 RWF", "1,500,000 KES")
- status (string, "Highly Matched", "Unlocked", "Requires Platinum to Unlock")
- dynamicPitch (string, 1-sentence personalized pitch advising why this belongs to their tier)`;

      if (!ai) {
        const fallbacks = [
          {
            bankName: "Urwego Microfinance Bank",
            approvalProbability: userTier === "Bronze" ? 0.65 : userTier === "Silver" ? 0.85 : 0.95,
            interestRate: "11.2% APR",
            maxAmount: userTier === "Bronze" ? "150,000 RWF" : userTier === "Silver" ? "400,000 RWF" : "800,000 RWF",
            status: "Highly Matched",
            dynamicPitch: "An incredible starter loan dedicated to expanding retail kiosks, custom-tailored for our Agaciro " + userTier + " members."
          },
          {
            bankName: "Equity Bank East Africa",
            approvalProbability: userTier === "Bronze" ? 0.40 : userTier === "Silver" ? 0.70 : 0.90,
            interestRate: "13.5% APR",
            maxAmount: userTier === "Bronze" ? "500,000 RWF" : userTier === "Silver" ? "1,200,000 RWF" : "3,000,000 RWF",
            status: userTier === "Bronze" ? "Requires Silver Tier" : "Unlocked",
            dynamicPitch: "Perfect for motorcycle operators upgrading to electric propulsion, backed by carbon credits."
          },
          {
            bankName: "Bank of Kigali (BK Quick)",
            approvalProbability: userTier === "Bronze" ? 0.15 : userTier === "Silver" ? 0.45 : 0.88,
            interestRate: "9.5% APR",
            maxAmount: "5,000,000 RWF",
            status: (userTier === "Platinum" || userTier === "Gold") ? "Highly Matched" : "Requires Gold Tier",
            dynamicPitch: "Prime bank financing for cooperative distribution leaders. Upgrading your score will unlock this premium tier."
          }
        ];
        return res.json({ matches: fallbacks });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Generate financial offers matching a user with credit tier ${userTier} and score ${userScore}`,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.6
        }
      });

      const parsedMatches = JSON.parse(response.text || "[]");
      res.json({ matches: parsedMatches });
    } catch (err) {
      console.error("Error matching loans:", err);
      // Safeguard fallback client
      res.status(500).json({ error: "Could not generate match recommendations" });
    }
  });

  // --- VITE MIDDLEWARE CONFIGURATION ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware attached in development mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files server configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server successfully running on port http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start full-stack server:", error);
});
