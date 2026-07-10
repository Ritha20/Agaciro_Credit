/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { CreditTier, ScoreFactor, Endorsement, BlockchainRecord } from "./types";
import { TRANSLATIONS, LocaleKey } from "./components/Localization";
import ScoreIndicator from "./components/ScoreIndicator";
import BlockchainLedger from "./components/BlockchainLedger";
import OnboardingAndUssd from "./components/OnboardingAndUssd";
import AiCoachAndLoans from "./components/AiCoachAndLoans";
import AdminPanel from "./components/AdminPanel";

import * as api from "./api";

// Cryptographic hash helper (simulates SHA-256 signatures)
const generateSimulatedHash = (index: number, prevHash: string, score: number, action: string) => {
  const seedString = `${index}-${prevHash}-${score}-${action}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return "0000" + Math.abs(hash).toString(16).padStart(12, "0") + "ea26";
};

export default function App() {
  const vecLogoRef = React.useRef(null);
  
  // 1. Core State: Cross-border Language localization
  const [lang, setLang] = useState<"en" | "rw" | "sw">("en");
  const t = (key: LocaleKey) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"][key];

  // 1b. Outdoor High-Contrast Theme state selection
  const [themeMode, setThemeMode] = useState<"midnight" | "light">("light");

  // Sync state to the document root element class list
  useEffect(() => {
    if (themeMode === "light") {
      document.documentElement.classList.add("theme-light");
    } else {
      document.documentElement.classList.remove("theme-light");
    }
  }, [themeMode]);

  // Admin panel overlay toggle
  const [showAdmin, setShowAdmin] = useState(false);

  // 2. Navigation Active Tab selection
  const [activeTab, setActiveTab] = useState<"score" | "coach">("score");

  // 2b. Progressive user onboarding stage state (landing -> auth -> link -> dashboard)
  const [onboardingStage, setOnboardingStage] = useState<"landing" | "auth" | "link" | "dashboard">(
    localStorage.getItem("agaciro_token") ? "auth" : "landing"
  );
  const [userProfile, setUserProfile] = useState<{
    name: string;
    phone: string;
    occupation: string;
    cooperative: string;
    isConsented: boolean;
    isRegistered: boolean;
  }>({
    name: "",
    phone: "",
    occupation: "Agribusiness Trader",
    cooperative: "",
    isConsented: false,
    isRegistered: false,
  });

  // 2c. Simplified sub-state indicators to clear up congestion & facilitate automatic skipping of linking
  const [authTab, setAuthTab] = useState<"demo" | "login" | "signup">("demo");
  const [skipLinkStep, setSkipLinkStep] = useState<boolean>(true);
  const [regOccType, setRegOccType] = useState<string>("Agribusiness Trader");
  const [customOcc, setCustomOcc] = useState<string>("");
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem("agaciro_token"));
  const [authStep, setAuthStep] = useState<"form" | "otp">("form");
  const [authError, setAuthError] = useState<string | null>(null);
  const [otpPending, setOtpPending] = useState<{ phone: string; name: string; occupation: string; cooperative: string } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Notification banners state
  const [alerts, setAlerts] = useState<{ id: string; text: string; type: "success" | "info" }[]>([]);

  // 3. Alternative Scoring Parameters Configuration
  const [factors, setFactors] = useState<ScoreFactor[]>([
    {
      id: "momo",
      name: "Mobile Money Terminal Flow",
      nameRw: "Ibice by'Ubucuruzi ku Gice bya Momo",
      nameSw: "Mzunguko wa Pesa za Simu (Momo)",
      value: 0,
      maxValue: 100,
      weight: 0.35,
      description: "Aggregated monthly ledger deposits and customer transfer velocity.",
      descriptionRw: "Ingano y'amafaranga anyuzwa kuri mobile money buri kwezi.",
      descriptionSw: "Kiasi cha amana na miamala ya kila mwezi ya pesa ya simu."
    },
    {
      id: "savings",
      name: "Cooperative Savings Rate",
      nameRw: "Imisanzu ya Koperative na SACCO",
      nameSw: "Kiwango cha Akiba cha Ushirika",
      value: 0,
      maxValue: 100,
      weight: 0.25,
      description: "Consistency indices of weekly savings contributions logged inside SACCOs.",
      descriptionRw: "Umutekano n'ingano y'imisanzu yo kubitsa buri cyumweru muri koperative.",
      descriptionSw: "Uthabiti wa michango yako ya kila wiki ya akiba kwenye SACCO."
    },
    {
      id: "utility",
      name: "Utility Settlement Targets",
      nameRw: "Kwishura Imirimo mbonera ya Leta",
      nameSw: "Malipo ya Huduma za Jamii",
      value: 0,
      maxValue: 100,
      weight: 0.20,
      description: "On-time clearance indicators of water, electricity, and local trade rent bills.",
      descriptionRw: "Amasezerano yo kwishyura amazi, umuriro n'imisoro ku gihe.",
      descriptionSw: "Uaminifu wa malipo ya bili za maji, umeme, na kodi ya kibanda."
    }
  ]);

  // 4. Verification Vouchers state (Community Endorsements)
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);

  // 5. Blockchain Distributed Ledger records trail State
  const [blockchain, setBlockchain] = useState<BlockchainRecord[]>([]);

  // Restore session from stored JWT on mount
  useEffect(() => {
    if (authToken) {
      api.getMe().then((data) => {
        if (data.user) {
          setUserProfile({
            name: data.user.name,
            phone: data.user.phone,
            occupation: data.user.occupation,
            cooperative: data.user.cooperative,
            isConsented: data.user.consented,
            isRegistered: true,
          });
          setOnboardingStage("dashboard");
          setActiveTab("score");
        } else {
          localStorage.removeItem("agaciro_token");
          setAuthToken(null);
        }
      }).catch(() => {
        localStorage.removeItem("agaciro_token");
        setAuthToken(null);
      });
    }
  }, []);

  // Load real data from server when dashboard opens
  useEffect(() => {
    if (onboardingStage === "dashboard" && authToken) {
      api.getScoreSummary().then((data) => {
        if (data.factors) {
          setFactors(prev => prev.map(f => {
            if (f.id === "momo") return { ...f, value: data.factors.momoValue };
            if (f.id === "savings") return { ...f, value: data.factors.savingsValue };
            if (f.id === "utility") return { ...f, value: data.factors.utilityValue };
            return f;
          }));
        }
        // Load real endorsements from DB
        api.getEndorsements().then((eData) => {
          if (eData.endorsements) {
            setEndorsements(eData.endorsements.map((e: any) => ({
              id: e.id,
              vouchName: e.voucherName,
              role: e.voucherRole,
              cooperative: e.cooperative,
              vouchedAt: new Date(e.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
              status: e.status,
            })));
          }
        }).catch(() => setEndorsements([]));
        // Replace fake blockchain with real score history from DB
        if (data.history && data.history.length > 0) {
          setBlockchain(data.history.map((item: any, idx: number) => ({
            blockIndex: idx + 1,
            hash: `0000${item.id.slice(-16)}`,
            prevHash: idx === 0 ? "0000000000000000" : `0000${data.history[idx - 1].id.slice(-16)}`,
            action: item.reason.toUpperCase().replace(/_/g, " "),
            scoreAfter: item.score,
            timestamp: new Date(item.computedAt).toISOString().replace("T", " ").substring(0, 19) + " UTC",
          })));
        } else {
          setBlockchain([]);
        }
      }).catch(() => {});
    }
  }, [onboardingStage, authToken]);

  // Combined score calculations (Max 1000)
  const getCalculatedScore = () => {
    // Sliders provide up to 500 points
    const weightedSum = factors.reduce((acc, f) => acc + (f.value / f.maxValue) * f.weight * 500, 0);
    // Active vouchers count (Max 4 * 50 pts = 200 pts)
    const activeEndorsementsCount = endorsements.filter(e => e.status === "Active").length;
    const vouchContributions = Math.min(200, activeEndorsementsCount * 50);
    // Base core = 300 pts
    return Math.round(300 + weightedSum + vouchContributions);
  };

  const calculatedScore = getCalculatedScore();

  // Tier level resolution
  const getCalculatedTier = (scoreVal: number): CreditTier => {
    if (scoreVal < 450) return "Bronze";
    if (scoreVal < 650) return "Silver";
    if (scoreVal < 850) return "Gold";
    return "Platinum";
  };

  const calculatedTier = getCalculatedTier(calculatedScore);

  // Mine a new block onto the cryptographically simulated chain
  const mineBlock = (actionMessage: string, finalScore: number) => {
    const prevBlock = blockchain[0] || { hash: "00000000000000000000", blockIndex: 0 };
    const nextIndex = prevBlock.blockIndex + 1;
    const nextHash = generateSimulatedHash(nextIndex, prevBlock.hash, finalScore, actionMessage);
    
    const newBlock: BlockchainRecord = {
      blockIndex: nextIndex,
      hash: nextHash,
      prevHash: prevBlock.hash,
      action: actionMessage,
      scoreAfter: finalScore,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC"
    };

    setBlockchain(prev => [newBlock, ...prev]);
  };

  // Add temporary notifications
  const pushNotification = (text: string, type: "success" | "info" = "success") => {
    const newAlert = { id: Date.now().toString(), text, type };
    setAlerts(prev => [newAlert, ...prev]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
    }, type === "info" ? 60000 : 4500);
  };

  // Handle transaction factor modifications
  const handleFactorChange = (id: string, newValue: number) => {
    setFactors(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, value: newValue };
      }
      return f;
    }));
  };

  // Recalculating score updates and writing logs
  useEffect(() => {
    const updateLabel = `LEDGER FLOW CALCULATION RE-OPTIMIZED`;
    const delayDebounce = setTimeout(() => {
      mineBlock(updateLabel, calculatedScore);
      pushNotification(lang === "rw" ? "Amanota y'icyizere yavuguruwe kuri ledger!" : "Alternative credit rating recalculated on ledger consensus!");
      if (authToken) {
        const momo = factors.find(f => f.id === "momo")?.value ?? 0;
        const savings = factors.find(f => f.id === "savings")?.value ?? 0;
        const utility = factors.find(f => f.id === "utility")?.value ?? 0;
        api.updateFactors(momo, savings, utility)
          .then(() => api.computeScore("slider_update"))
          .catch(() => {});
      }
    }, 1800);

    return () => clearTimeout(delayDebounce);
  }, [factors]);

  // Handling manual leader endorsement voucher submission
  const handleAddEndorsement = async (name: string, role: string, coop: string) => {
    if (authToken) {
      try {
        const result = await api.createEndorsement(name, role, coop);
        if (result.success && result.endorsement) {
          const e = result.endorsement;
          const newEnd: Endorsement = {
            id: e.id,
            vouchName: e.voucherName,
            role: e.voucherRole,
            cooperative: e.cooperative,
            vouchedAt: new Date(e.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
            status: e.status,
          };
          setEndorsements(prev => [...prev, newEnd]);
          mineBlock(`ENDORSEMENT REQUEST: ${name.toUpperCase()} (${coop.toUpperCase()})`, calculatedScore);
          pushNotification(`Endorsement request sent to ${name} — pending approval.`, "info");
        }
      } catch {
        pushNotification("Failed to submit endorsement. Try again.", "info");
      }
    } else {
      // Demo mode — local only
      const newEnd: Endorsement = {
        id: `end-${Date.now()}`,
        vouchName: name,
        role: role,
        cooperative: coop,
        vouchedAt: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        status: "Active",
      };
      setEndorsements(prev => [...prev, newEnd]);
      mineBlock(`COMMUNITY VOUCH SIGNED: ${name.toUpperCase()} (${coop.toUpperCase()})`, calculatedScore + 50);
      pushNotification(`Endorsement by ${name} successfully signed & verified!`, "success");
    }
  };

  // Unlocking score points via AI Coach rewards
  const handleAddScorePoints = (pts: number, reason: string) => {
    pushNotification(`Reward Bonus! +${pts} pts: ${reason}`, "success");
    mineBlock(`COACH ADVANTAGE MILESTONE LEVEL ACQUIRED`, calculatedScore + pts);
  };

  if (showAdmin) {
    return <AdminPanel onExit={() => setShowAdmin(false)} />;
  }

  return (
    <div className={`min-h-screen flex flex-col justify-between selection:bg-amber-500/30 selection:text-white border-t-4 border-amber-500 transition-colors duration-300 ${
      themeMode === "light" ? "theme-light bg-slate-50 text-slate-900" : "theme-midnight bg-[#0F172A] text-slate-100"
    }`}>
      
      {/* 1. Header Banner */}
      <header className="bg-[#020617] border-b border-slate-800 py-4 px-6 sticky top-0 z-50 shadow-md">
        <div id="header-container" className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand Identity / Vector Logo concept */}
          <div className="flex items-center gap-3">
            
            {/* SVG Logo Icon: Rising Curve Arrow blended with a Protective Shield */}
            <svg 
              ref={vecLogoRef}
              id="svg-brand-shield-logo"
              className="w-12 h-12 shadow-md rounded-xl p-1 bg-[#090d1f] border border-slate-800" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Backing Shield (Dignity/Trust) - Blue & Gold */}
              <path 
                d="M50 8C26 12 18 20 18 42C18 64 36 82 50 90C64 82 82 64 82 42C82 20 74 12 50 8Z" 
                fill="#020617" /* Dark Rich Void */
                stroke="#eab308" /* Dignity Gold */
                strokeWidth="4"
              />
              {/* Shield inner highlight */}
              <path 
                d="M50 14C31.5 17.5 24.5 24 24.5 42C24.5 59.5 39 74.5 50 81.5" 
                stroke="#22c55e" /* Growth Green */
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Rising growth curve / Upward Arrow (Growth/Hustle) */}
              <path 
                d="M32 70C42 66 48 50 62 40" 
                stroke="#22c55e" /* Clean green curve */
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path 
                d="M52 40H64V52" 
                stroke="#eab308" /* Gold arrow pointers */
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Core Spark dot */}
              <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
            </svg>

            <div>
              <h1 className="font-display font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5 leading-none">
                {t("title")}
                <span className="bg-amber-500/20 text-[#eab308] border border-amber-500/30 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  East Africa
                </span>
              </h1>
              <p className="text-[11px] font-medium text-slate-400 italic mt-1 font-display">
                &ldquo;{t("tagline")}&rdquo;
              </p>
            </div>
          </div>

          {/* Controls: Multi-language matrix switch & Status */}
          <div id="header-controls" className="flex flex-wrap items-center gap-3 md:ml-auto">
            
            {/* Sync checks */}
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400 font-mono text-[9px] bg-[#020617]/80 border border-slate-800 px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Consensus: active</span>
            </div>

            {/* Language dropdown selectors */}
            <div className="flex items-center gap-1 bg-[#090d1f] rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => { setLang("en"); pushNotification("Localized in English Language"); }}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  lang === "en" ? "bg-slate-800 text-white shadow-md border border-slate-700" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => { setLang("rw"); pushNotification("Ikinyarwanda cyemejwe nka rurimi"); }}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  lang === "rw" ? "bg-slate-800 text-white shadow-md border border-slate-700" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                RW
              </button>
              <button
                onClick={() => { setLang("sw"); pushNotification("Kiswahili kimeidhinishwa sasa"); }}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  lang === "sw" ? "bg-slate-800 text-white shadow-md border border-slate-700" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                SW
              </button>
            </div>

            {/* Global Theme Toggle: Symbol-Only Combined Toggle (shows the mode you are NOT in) */}
            <button
              onClick={() => { 
                const nextMode = themeMode === "light" ? "midnight" : "light";
                setThemeMode(nextMode); 
                if (nextMode === "light") {
                  pushNotification(lang === "rw" ? "Uburyo bwo Hanze bwa High-Contrast bwemejwe!" : lang === "sw" ? "Kiwango cha juu cha mwangaza kimeamilishwa" : "Outdoor High-Contrast theme activated!"); 
                } else {
                  pushNotification(lang === "rw" ? "Midnight Blue yatsindiwe" : lang === "sw" ? "Midnight Blue imewezeshwa" : "Midnight Blue theme active"); 
                }
              }}
              className="p-1.5 bg-[#090d1f] hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-all cursor-pointer flex items-center justify-center shrink-0"
              title={themeMode === "light" ? (lang === "rw" ? "Guhindura kuri Midnight" : "Switch to Midnight") : (lang === "rw" ? "Guhindura hanze" : "Switch to Light Mode")}
            >
              {themeMode === "light" ? (
                <Moon className="w-4 h-4 text-amber-500" />
              ) : (
                <Sun className="w-4 h-4 text-yellow-400" />
              )}
            </button>

            {/* Profile Info block on the FAR right edge */}
            {userProfile.isRegistered && (
              <div id="user-profile-widget" className="flex items-center gap-2 bg-[#0c192d] border border-slate-800 rounded-xl px-3 py-1 text-xs">
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] text-slate-950 font-black">
                  {userProfile.name[0] || "U"}
                </div>
                <div className="text-left font-sans">
                  <h4 className="text-[10px] font-bold text-slate-200 leading-tight">{userProfile.name}</h4>
                  <p className="text-[8px] text-slate-400 font-mono leading-none">{userProfile.occupation}</p>
                </div>
                <button
                  onClick={() => {
                    setUserProfile({ name: "", phone: "", occupation: "Agribusiness Trader", cooperative: "", isConsented: false, isRegistered: false });
                    setFactors(prev => prev.map(f => ({ ...f, value: 0 })));
                    setEndorsements([]);
                    setBlockchain([]);
                    setOnboardingStage("auth");
                    setAuthToken(null);
                    setAuthStep("form");
                    localStorage.removeItem("agaciro_token");
                    pushNotification("Profile disconnected. Session terminated.");
                  }}
                  className="ml-2 text-[9px] hover:text-rose-400 text-slate-500 font-mono cursor-pointer"
                  title="Sign out & reset"
                >
                  [Sign Out]
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Status Notifications Panel overlay */}
      {alerts.length > 0 && (
        <div className="fixed top-20 right-6 z-40 space-y-2 max-w-sm pointer-events-none animate-fade-in">
          {alerts.map((al) => (
            <div key={al.id} className="bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 shadow-2xl text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-green-500 shrink-0 shadow-[0_0_8px_#10b981]"></span>
              <p className="font-semibold">{al.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progressive Multi-step Onboarding Stepper (Only shown during initial Setup stages) */}
      {(onboardingStage === "auth" || onboardingStage === "link") && (
        <div className="max-w-3xl mx-auto mt-6 px-4">
          <div className="bg-[#020617] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                onboardingStage === "auth" ? "bg-amber-500 text-slate-950 font-bold" : "bg-emerald-550 text-white font-black"
              }`}>
                {onboardingStage === "auth" ? "1" : "✓"}
              </span>
              <div>
                <h4 className="text-xs font-bold text-white">{lang === "rw" ? "Umutekano & Umwirondoro" : "1. Setup Profile"}</h4>
                <p className="text-[10px] text-slate-400">{lang === "rw" ? "Ubufatanye na SACCO" : "Sovereign phone & name form"}</p>
              </div>
            </div>

            <div className="hidden sm:block grow mx-2 border-b border-dashed border-slate-800"></div>

            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                onboardingStage === "link" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"
              }`}>
                2
              </span>
              <div>
                <h4 className={`text-xs font-bold ${onboardingStage === "link" ? "text-white" : "text-slate-400"}`}>{lang === "rw" ? "Guhuza imari" : "2. Link Accounts"}</h4>
                <p className="text-[10px] text-slate-500">{lang === "rw" ? "Mobile money & Banki" : "Channel weights & USSD code"}</p>
              </div>
            </div>

            <div className="hidden sm:block grow mx-2 border-b border-dashed border-slate-800"></div>

            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-800 text-slate-400">
                3
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-400">{lang === "rw" ? "Agaciro Dashboard" : "3. Score Dashboard"}</h4>
                <p className="text-[10px] text-slate-500">{lang === "rw" ? "Amanota anyuranye" : "Live indicators unlocked"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Tab View Navigation */}
      <main className="grow max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* ── LANDING PAGE ── */}
        {onboardingStage === "landing" && (
          <div className="animate-fade-in">

            {/* Hero */}
            <div className="text-center py-12 md:py-16 px-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-6">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                {lang === "rw" ? "Iharanira Agaciro" : lang === "sw" ? "Heshima Katika Kila Muamala" : "Alternative Credit · East Africa"}
              </div>
              <h1 className="font-display font-extrabold text-3xl md:text-5xl text-white leading-tight tracking-tight mb-4">
                {lang === "rw"
                  ? <>Inguzanyo ku bantu <span className="text-amber-400">miliyoni 300</span> Africa yibagiye</>
                  : lang === "sw"
                  ? <>Mkopo kwa watu <span className="text-amber-400">milioni 300</span> Afrika iliosahau</>
                  : <>Credit for the <span className="text-amber-400">300 million</span> Africa forgot</>}
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto mb-8">
                {lang === "rw"
                  ? "Nta konti ya banki. Nta mateka y'inguzanyo. Nta nguzanyo. Ni uko bimeze ku banyabikorwa benshi bo muri Afrika y'Iburasirazuba — kugeza ubu."
                  : lang === "sw"
                  ? "Hakuna akaunti ya benki. Hakuna historia ya mkopo. Hakuna mkopo. Hiyo ndiyo hali ya wajasiriamali wengi wa Afrika Mashariki — hadi sasa."
                  : "No bank account. No credit history. No loan. That's the reality for most East African entrepreneurs — until now."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setOnboardingStage("auth")}
                  className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-amber-500/20 cursor-pointer transition-all hover:scale-105"
                >
                  {lang === "rw" ? "Kubona Amanota Yawe Kubuntu →" : lang === "sw" ? "Pata Alama Yako Bure →" : "Get Your Score Free →"}
                </button>
                <button
                  onClick={() => { setOnboardingStage("auth"); setAuthTab("login"); }}
                  className="px-8 py-3.5 border border-slate-700 hover:border-slate-500 text-slate-300 font-bold text-sm rounded-2xl cursor-pointer transition-colors"
                >
                  {lang === "rw" ? "Injira" : lang === "sw" ? "Ingia" : "Sign In"}
                </button>
              </div>
            </div>

            {/* 4 Data Sources */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { icon: "📱", title: lang === "rw" ? "Mobile Money" : "Mobile Money", sub: lang === "rw" ? "Imicungire ya MTN MoMo" : lang === "sw" ? "Miamala ya MTN MoMo" : "MTN MoMo transaction flow", color: "border-yellow-500/20 bg-yellow-500/5" },
                { icon: "🏦", title: lang === "rw" ? "Imisanzu ya SACCO" : lang === "sw" ? "Akiba ya SACCO" : "SACCO Savings", sub: lang === "rw" ? "Imisanzu ya koperative" : lang === "sw" ? "Michango ya ushirika" : "Weekly cooperative contributions", color: "border-emerald-500/20 bg-emerald-500/5" },
                { icon: "⚡", title: lang === "rw" ? "Kwishura Imirimo" : lang === "sw" ? "Bili za Huduma" : "Utility Payments", sub: lang === "rw" ? "Amazi, umuriro, imisoro" : lang === "sw" ? "Maji, umeme, kodi" : "Water, electricity, rent on time", color: "border-blue-500/20 bg-blue-500/5" },
                { icon: "🤝", title: lang === "rw" ? "Ubufatanye" : lang === "sw" ? "Udhamini" : "Community Vouching", sub: lang === "rw" ? "Inzitizi z'abayobozi" : lang === "sw" ? "Dhamana za viongozi" : "SACCO leaders endorse you", color: "border-purple-500/20 bg-purple-500/5" },
              ].map(({ icon, title, sub, color }) => (
                <div key={title} className={`border rounded-2xl p-5 text-center ${color}`}>
                  <div className="text-3xl mb-3">{icon}</div>
                  <h3 className="text-xs font-extrabold text-white mb-1">{title}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{sub}</p>
                </div>
              ))}
            </div>

            {/* Score tiers */}
            <div className="bg-[#020617] border border-slate-800 rounded-2xl p-6 mb-8">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-4">
                {lang === "rw" ? "Amategeko y'Amanota (300–1000)" : lang === "sw" ? "Viwango vya Alama (300–1000)" : "Score Tiers (300–1000)"}
              </p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { tier: "Bronze", range: "300–449", color: "text-amber-400 border-amber-500/30 bg-amber-500/5", desc: lang === "rw" ? "Intangiriro" : lang === "sw" ? "Mwanzo" : "Starting out" },
                  { tier: "Silver", range: "450–649", color: "text-slate-300 border-slate-600 bg-slate-800/40", desc: lang === "rw" ? "Uruziga" : lang === "sw" ? "Inakua" : "Growing trust" },
                  { tier: "Gold", range: "650–849", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5", desc: lang === "rw" ? "Zibakwa" : lang === "sw" ? "Imara" : "Established" },
                  { tier: "Platinum", range: "850–1000", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5", desc: lang === "rw" ? "Hejuru" : lang === "sw" ? "Bora" : "Premium access" },
                ].map(({ tier, range, color, desc }) => (
                  <div key={tier} className={`border rounded-xl p-3 text-center ${color}`}>
                    <p className="text-xs font-extrabold">{tier}</p>
                    <p className="text-[9px] font-mono mt-0.5 opacity-70">{range}</p>
                    <p className="text-[9px] mt-1 opacity-60">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Social proof strip */}
            <div className="grid grid-cols-3 gap-4 mb-10 text-center">
              {[
                { n: "300M+", label: lang === "rw" ? "Bantu badafite inguzanyo" : lang === "sw" ? "Watu bila mkopo" : "People without credit access" },
                { n: "4", label: lang === "rw" ? "Inkomoko z'amakuru" : lang === "sw" ? "Vyanzo vya data" : "Alternative data sources" },
                { n: "1000", label: lang === "rw" ? "Amanota yo hejuru" : lang === "sw" ? "Alama ya juu" : "Maximum score points" },
              ].map(({ n, label }) => (
                <div key={n}>
                  <p className="text-3xl font-extrabold text-amber-400 font-display">{n}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Final CTA */}
            <div className="text-center pb-6">
              <button
                onClick={() => setOnboardingStage("auth")}
                className="px-10 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/20 cursor-pointer transition-all hover:scale-105"
              >
                {lang === "rw" ? "Tangira Ubure →" : lang === "sw" ? "Anza Bure →" : "Start for Free →"}
              </button>
              <p className="text-[10px] text-slate-500 mt-3">
                {lang === "rw" ? "Nta mafaranga asabwa · Nta banki isabwa · 2 minutes" : lang === "sw" ? "Bila malipo · Bila benki · Dakika 2" : "No fees · No bank account required · 2 minutes"}
              </p>
            </div>

          </div>
        )}

        {/* Onboarding Stage 1: Auth screen */}
        {onboardingStage === "auth" && (
          <div className="max-w-md mx-auto my-6 bg-[#020617] border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 text-amber-550 border border-amber-500/20 rounded-2xl mb-4 font-black text-lg italic font-display">
                A
              </div>
              <h2 className="font-display font-bold text-lg text-white tracking-tight">
                {lang === "rw" ? "Kwiyandikisha ku Gaciro" : lang === "sw" ? "Kitovu cha Mkopo Agaciro" : "Agaciro Credit Verification"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {lang === "rw" 
                  ? "Soresha, yandika cyangwa winjire ngo utangire isuzuma risanzwe" 
                  : "Create your peer ledger profile & alternative credit verification"}
              </p>
            </div>

            {/* Tab switcher: Demo / Sign In / Create Account */}
            <div className="flex bg-slate-950 border border-slate-850 rounded-xl p-1 mb-5">
              <button type="button"
                onClick={() => { setAuthTab("demo"); setAuthStep("form"); setOtpPending(null); setOtpCode(""); setAuthError(null); }}
                className={`flex-1 text-center py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${authTab === "demo" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
              >
                {lang === "rw" ? "Demo" : "Demo"}
              </button>
              <button type="button"
                onClick={() => { setAuthTab("login"); setAuthStep("form"); setOtpPending(null); setOtpCode(""); setAuthError(null); }}
                className={`flex-1 text-center py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${authTab === "login" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
              >
                {lang === "rw" ? "Injira" : "Sign In"}
              </button>
              <button type="button"
                onClick={() => { setAuthTab("signup"); setAuthStep("form"); setOtpPending(null); setOtpCode(""); setAuthError(null); }}
                className={`flex-1 text-center py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${authTab === "signup" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
              >
                {lang === "rw" ? "Iyandikishe" : "Create Account"}
              </button>
            </div>

            {/* Error banner */}
            {authError && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-2.5 text-xs text-rose-400 font-medium flex items-center justify-between">
                <span>{authError}</span>
                <button onClick={() => setAuthError(null)} className="text-rose-500 hover:text-rose-300 ml-2 cursor-pointer">✕</button>
              </div>
            )}

            {/* DEMO — Quick select */}
            {authTab === "demo" && (
              <div className="space-y-3 mb-6 animate-fade-in">
                <span className="block text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 text-center mb-1">
                  {lang === "rw" ? "HITAMO INDANGAMUNTU ISANZWE" : "DEMO ONLY — SELECT A SAMPLE PROFILE"}
                </span>
                <button type="button"
                  onClick={() => {
                    setUserProfile({ name: "Clément Muhire", phone: "+250 788 459 210", occupation: "Agribusiness Trader", cooperative: "Nyarugenge Food Coop", isConsented: true, isRegistered: true });
                    setFactors(prev => prev.map(f => f.id === "momo" ? { ...f, value: 75 } : f.id === "savings" ? { ...f, value: 80 } : f.id === "utility" ? { ...f, value: 65 } : f));
                    setEndorsements([
                      { id: "end-d1", vouchName: "Claver Nsegimana", role: "Motorcycle taxi Coop President", cooperative: "Gasabo Moto Logistics", vouchedAt: "June 10, 2026", status: "Active" },
                      { id: "end-d2", vouchName: "Asha Omari", role: "SACCO Regional Manager", cooperative: "Cleansave Nyarugenge SACCO", vouchedAt: "June 14, 2026", status: "Active" },
                    ]);
                    setOnboardingStage("dashboard"); setActiveTab("score");
                    pushNotification("Demo mode: Clément Muhire (data is not saved)");
                  }}
                  className="w-full text-left p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between transition-all group cursor-pointer hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg text-emerald-400 flex items-center justify-center font-bold text-xs">CM</div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-400 font-display">Clément Muhire</h4>
                      <p className="text-[10px] text-slate-400">Coffee Exporter coop</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Select</span>
                </button>
                <button type="button"
                  onClick={() => {
                    setUserProfile({ name: "Asha Omari", phone: "+254 712 984 311", occupation: "Retail Kiosk Hustler", cooperative: "Nyarugenge Retail Group", isConsented: true, isRegistered: true });
                    setFactors(prev => prev.map(f => f.id === "momo" ? { ...f, value: 60 } : f.id === "savings" ? { ...f, value: 55 } : f.id === "utility" ? { ...f, value: 45 } : f));
                    setEndorsements([
                      { id: "end-d3", vouchName: "John Kamau", role: "Savings Group Treasurer", cooperative: "Eastleigh Retail SACCO", vouchedAt: "June 18, 2026", status: "Active" },
                    ]);
                    setOnboardingStage("dashboard"); setActiveTab("score");
                    pushNotification("Demo mode: Asha Omari (data is not saved)");
                  }}
                  className="w-full text-left p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between transition-all group cursor-pointer hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg text-amber-400 flex items-center justify-center font-bold text-xs">AO</div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-400 font-display">Asha Omari</h4>
                      <p className="text-[10px] text-slate-400">Market food kiosk</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Select</span>
                </button>
              </div>
            )}

            {/* SIGN IN — phone → OTP */}
            {authTab === "login" && authStep === "form" && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                const phone = (e.target as any).elements.loginPhone.value.trim();
                setAuthLoading(true); setAuthError(null);
                try {
                  const check = await api.checkPhone(phone);
                  if (!check.exists) {
                    setAuthError("No account found for this number. Please create an account first.");
                    return;
                  }
                  setOtpPending({ phone, name: check.name || "", occupation: "", cooperative: "" });
                  const result = await api.requestOtp(phone, check.name || "", "", "");
                  setAuthStep("otp");
                  pushNotification(result.dev_code ? `Welcome back ${check.name}! Dev OTP: ${result.dev_code}` : `OTP sent to ${phone}`, "info");
                } catch {
                  setAuthError("Network error. Please check your connection.");
                } finally {
                  setAuthLoading(false);
                }
              }} className="space-y-4 animate-fade-in mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{lang === "rw" ? "Nimero ya Telefone" : "Phone Number"}</label>
                  <input type="tel" name="loginPhone" required autoFocus placeholder="+250 788 123 456"
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-amber-500 focus:outline-none" />
                </div>
                <button type="submit" disabled={authLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer">
                  {authLoading ? "Checking..." : (lang === "rw" ? "Ohereza kode →" : "Send OTP Code →")}
                </button>
                <p className="text-center text-[10px] text-slate-500">
                  No account yet?{" "}
                  <button type="button" onClick={() => { setAuthTab("signup"); setAuthError(null); }} className="text-amber-400 hover:underline cursor-pointer">Create one here</button>
                </p>
              </form>
            )}

            {/* OTP step — shared by login and signup */}
            {(authTab === "login" || authTab === "signup") && authStep === "otp" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!otpPending) return;
                  setAuthLoading(true);
                  try {
                    const result = await api.verifyOtp(otpPending.phone, otpCode);
                    if (result.success && result.token) {
                      localStorage.setItem("agaciro_token", result.token);
                      setAuthToken(result.token);
                      setUserProfile({
                        name: result.user.name,
                        phone: result.user.phone,
                        occupation: result.user.occupation,
                        cooperative: result.user.cooperative,
                        isConsented: true,
                        isRegistered: true,
                      });
                      setAuthStep("form");
                      setOtpCode("");
                      setOtpPending(null);
                      setAuthError(null);
                      if (skipLinkStep) {
                        setOnboardingStage("dashboard");
                        setActiveTab("score");
                        handleAddScorePoints(40, "Sovereign Profile Verified & Consented");
                        pushNotification("Account verified! Welcome to Agaciro Credit.");
                      } else {
                        setOnboardingStage("link");
                        pushNotification("Account verified! Link your accounts.");
                      }
                    } else {
                      pushNotification(result.error || "Invalid OTP. Please try again.", "info");
                    }
                  } catch {
                    pushNotification("Network error. Please check your connection.", "info");
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                className="space-y-4 animate-fade-in mb-6"
              >
                <div className="text-center">
                  <p className="text-xs text-slate-400">OTP sent to <span className="text-white font-bold">{otpPending?.phone}</span></p>
                  <p className="text-[10px] text-slate-500 mt-1">Enter the 6-digit verification code</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Verification Code</label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full text-center text-xl font-mono tracking-widest p-3 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading || otpCode.length !== 6}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {authLoading ? "⏳ Verifying — please wait..." : "Verify & Login ➔"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthStep("form"); setOtpCode(""); setOtpPending(null); setAuthError(null); }}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Go back
                </button>
              </form>
            )}

            {/* CREATE ACCOUNT form */}
            {authTab === "signup" && authStep === "form" && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const nameVal = target.elements.regName.value;
                  const phoneVal = target.elements.regPhone.value.trim();
                  const rawOcc = target.elements.regOcc.value;
                  const customVal = target.elements.regCustomOcc ? target.elements.regCustomOcc.value : "";
                  const occVal = rawOcc === "Other" ? (customVal || "Sovereign Entrepreneur") : rawOcc;
                  const coopVal = target.elements.regCoop.value;
                  const consentVal = target.elements.regConsent.checked;

                  if (!consentVal) {
                    setAuthError("You must authorize data sharing to generate your credit score.");
                    return;
                  }

                  setAuthLoading(true); setAuthError(null);
                  try {
                    // Check if phone is already taken before registering
                    const check = await api.checkPhone(phoneVal);
                    if (check.exists) {
                      setAuthError(`This phone number is already registered (${check.name}). Please sign in instead.`);
                      return;
                    }
                    const result = await api.requestOtp(phoneVal, nameVal, occVal, coopVal, lang);
                    if (result.success) {
                      setOtpPending({ phone: phoneVal, name: nameVal, occupation: occVal, cooperative: coopVal });
                      setAuthStep("otp");
                      pushNotification(result.dev_code ? `Dev OTP: ${result.dev_code}` : `OTP sent to ${phoneVal}`, "info");
                    } else {
                      setAuthError(result.error || "Failed to send OTP. Try again.");
                    }
                  } catch {
                    setAuthError("Network error. Please check your connection.");
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                className="space-y-4 animate-fade-in mb-6"
              >
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{lang === "rw" ? "Amazina Yuzuye" : "Full Name"}</label>
                  <input
                    type="text"
                    name="regName"
                    required
                    placeholder="e.g. Clément Muhire"
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{lang === "rw" ? "Terefone" : "Phone Number"}</label>
                  <input type="tel" name="regPhone" required placeholder="+250 788 123 456"
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-amber-500 focus:outline-none" />
                  <p className="text-[10px] text-slate-500 mt-1">Must be unique — one account per number</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{lang === "rw" ? "Umwuga" : "Occupation"}</label>
                    <select
                      name="regOcc"
                      value={regOccType}
                      onChange={(e) => setRegOccType(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Agribusiness Trader">{lang === "rw" ? "Trader (Ubucuruzi)" : "Agribusiness Trader"}</option>
                      <option value="Motorcycle Taxi Operator">{lang === "rw" ? "Motari (Moto Taxi)" : "Motorcycle Taxi Operator"}</option>
                      <option value="Retail Kiosk Hustler">{lang === "rw" ? "Kiosk (Umucuruzi)" : "Retail Kiosk Hustler"}</option>
                      <option value="Cooperative Savings Farmer">{lang === "rw" ? "Umuhinzi (Farmer)" : "Cooperative Savings Farmer"}</option>
                      <option value="Hardware Retailer">{lang === "rw" ? "Ibikoresho (Hardware)" : "Hardware Retailer"}</option>
                      <option value="Tailor or Seamstress">{lang === "rw" ? "Umudofori (Tailor)" : "Tailor or Seamstress"}</option>
                      <option value="Livestock Breeder">{lang === "rw" ? "Umworozi (Livestock)" : "Livestock Breeder"}</option>
                      <option value="Artisan Craftsman">{lang === "rw" ? "Umbaji / Umwubatsi" : "Artisan Builder/Craft"}</option>
                      <option value="Other">{lang === "rw" ? "Ibindi (Byandike hano...)" : "Other (Specify...)"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{lang === "rw" ? "Koperative" : "Cooperative"}</label>
                    <input
                      type="text"
                      name="regCoop"
                      required
                      placeholder="e.g. Gasabo Moto Coop"
                      className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {regOccType === "Other" && (
                  <div className="animate-fade-in">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      {lang === "rw" ? "Andika Umwuga wawe hano" : "Specify your custom occupation"}
                    </label>
                    <input
                      type="text"
                      name="regCustomOcc"
                      required
                      value={customOcc}
                      onChange={(e) => setCustomOcc(e.target.value)}
                      placeholder={lang === "rw" ? "Urugero: Umurobyi cyangwa Umuboshyi..." : "e.g. Fisherman, Weaver, Plumber..."}
                      className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}

                <label className="flex items-start gap-2 text-slate-300 font-medium text-[10px] select-none cursor-pointer mt-1 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  <input
                    type="checkbox"
                    name="regConsent"
                    defaultChecked={true}
                    className="w-3.5 h-3.5 text-amber-500 border-slate-800 bg-slate-950 rounded cursor-pointer accent-amber-500 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-xs text-white">{lang === "rw" ? "Kwemera Gusangira Amakuru" : "Authorize Data Retrieval"}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{lang === "rw" ? "Amakuru y'imari na koperative ihuzwa ku mutekano." : "Authorize retrieval of historical transactions."}</p>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {authLoading ? "Sending OTP..." : (lang === "rw" ? "Kora Konti nonaha" : "Create Account ➔")}
                </button>
                <p className="text-center text-[10px] text-slate-500">
                  Already have an account?{" "}
                  <button type="button" onClick={() => { setAuthTab("login"); setAuthError(null); }} className="text-amber-400 hover:underline cursor-pointer">Sign in here</button>
                </p>
              </form>
            )}

            {/* Smart Skip option for returning users - Satisfying: "if its not the first time skip the part of linking" */}
            <div className="border-t border-slate-900 pt-4 mt-2">
              <label className="flex items-center gap-2.5 text-slate-400 text-[10px] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipLinkStep}
                  onChange={(e) => setSkipLinkStep(e.target.checked)}
                  className="w-4 h-4 text-amber-500 border-slate-800 bg-slate-950 rounded accent-amber-500"
                />
                <div>
                  <span className="font-bold text-slate-200">
                    {lang === "rw" ? "Ohereza vuba kuri Dashboard (Returning User)" : "Returning User: Skip wallet-linking step"}
                  </span>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    {lang === "rw" ? "Kuraho guhuza imari ku bakoze mbere" : "Bypass wizard straight to live indicators."}
                  </p>
                </div>
              </label>
            </div>

          </div>
        )}

        {/* Onboarding Stage 2: Linking Account + USSD Sandbox Side-by-Side */}
        {onboardingStage === "link" && (
          <div className="space-y-6">
            
            {/* Elegant completion visual header */}
            <div className="bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6 mb-2 animate-fade-in text-slate-100">
              <div className="text-left space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500/15 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {lang === "rw" ? "Konti & USSD" : "Wallet Setup"}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    ● Optionally link accounts
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  {lang === "rw" ? "Huza imirongo y'amakuru n'isuzuma" : "Connect Accounts & Dial USSD"}
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  {lang === "rw" 
                    ? "Huza konti za mobile money na banki ziri hasi cyangwa dula kode zabo ku mutekano." 
                    : "Connect digital money or dial USSD codes to sync ledger assets. You can also skip this and go straight to your dashboard."}
                </p>
              </div>
              <button
                onClick={() => {
                  setOnboardingStage("dashboard");
                  setActiveTab("score");
                  pushNotification(lang === "rw" ? "Suku yuzuye ya Dashboard yemejwe!" : "Dashboard unlocked successfully!");
                  mineBlock("DASHBOARD LIVE VIEW UNLOCKED - PROGRESSIVE ONBOARD COMPLETED", calculatedScore);
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase rounded-xl shadow-sm cursor-pointer shrink-0 transition-colors"
              >
                {lang === "rw" ? "Binjirire ku Biro ➔" : "Skip & Go to Dashboard ➔"}
              </button>
            </div>

            {/* Embedded interactive sandboxed account linker + USSD console */}
            <div className="animate-fade-in bg-slate-900/40 p-4 border border-slate-800/80 rounded-3xl">
              <OnboardingAndUssd 
                score={calculatedScore}
                lang={lang}
                onAddScorePoints={handleAddScorePoints}
                onModifyFactor={handleFactorChange}
                factors={factors}
                onMineBlock={mineBlock}
                userProfile={userProfile}
              />
            </div>
          </div>
        )}

        {/* Onboarding Stage 3: Full Dashboard mode unlocked */}
        {onboardingStage === "dashboard" && (
          <>
            {/* Filter Navigation list */}
            <div id="navigation-root" className="flex items-center gap-0.5 border-b border-slate-800 overflow-x-auto pb-px">
              
              <button
                onClick={() => setActiveTab("score")}
                className={`px-5 py-3 text-xs font-bold tracking-tight border-b-2 hover:text-[#eab308] transition-all shrink-0 cursor-pointer ${
                  activeTab === "score" 
                    ? "border-amber-500 text-amber-400 font-extrabold bg-[#020617]/30 rounded-t-lg" 
                    : "border-transparent text-slate-400"
                }`}
              >
                📊 {t("scoreTitle")}
              </button>

              <button
                onClick={() => setActiveTab("coach")}
                className={`px-5 py-3 text-xs font-bold tracking-tight border-b-2 hover:text-[#eab308] transition-all shrink-0 cursor-pointer ${
                  activeTab === "coach"
                    ? "border-amber-500 text-amber-400 font-extrabold bg-[#020617]/30 rounded-t-lg"
                    : "border-transparent text-slate-400"
                }`}
              >
                ✨ {lang === "rw" ? "AI Umutoza & Inguzanyo" : lang === "sw" ? "AI Kocha & Mikopo" : "AI Coach & Loans"}
              </button>

            </div>

            {/* Tab content renderer panels */}
            <div id="viewport-tab-content" className="w-full">
              
              {activeTab === "score" && (
                <div className="animate-fade-in">
                  <ScoreIndicator
                    score={calculatedScore}
                    tier={calculatedTier}
                    isAuthenticated={!!authToken}
                    factors={factors}
                    onFactorChange={handleFactorChange}
                    endorsements={endorsements}
                    onAddEndorsement={handleAddEndorsement}
                    lang={lang}
                    blockchain={blockchain}
                    themeMode={themeMode}
                    onMomoSynced={(momoScore) => {
                      setFactors(prev => prev.map(f =>
                        f.id === "momo" ? { ...f, value: momoScore } : f
                      ));
                      pushNotification(`MoMo synced! Score updated to ${momoScore}/100.`);
                    }}
                  />
                </div>
              )}

              {activeTab === "coach" && (
                <div className="animate-fade-in">
                  <AiCoachAndLoans
                    lang={lang}
                    score={calculatedScore}
                    tier={calculatedTier}
                  />
                </div>
              )}

            </div>
          </>
        )}

      </main>

      {/* 3. Global Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-500 py-5 px-6 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-6">
            <span>NODE: <strong className="text-slate-300">AWS-AF-SOUTH-1</strong></span>
            <span>UPTIME: <strong className="text-emerald-500">99.998%</strong></span>
            <span>API: <strong className="text-[#eab308]">FIX 4.4 / BINARY</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <span>PACKETS: <span className="text-[#22c55e] font-bold">0 DROP</span></span>
            <span className="text-[#eab308] font-bold tracking-wider uppercase">DIGNITY IN EVERY TRANSACTION</span>
            <button
              onClick={() => setShowAdmin(true)}
              className="text-slate-800 hover:text-slate-500 text-[9px] font-mono cursor-pointer transition-colors"
              title="Admin panel"
            >
              [admin]
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
}
