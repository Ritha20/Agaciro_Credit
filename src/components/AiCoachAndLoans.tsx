import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, RefreshCw, TrendingUp, ShieldCheck, X, CheckCircle } from "lucide-react";
import * as api from "../api";

interface Message { role: "user" | "model"; content: string; }

interface LoanMatch {
  bankName: string;
  approvalProbability: number;
  interestRate: string;
  maxAmount: string;
  status: string;
  dynamicPitch: string;
}

interface Props {
  lang: "en" | "rw" | "sw";
  score: number;
  tier: string;
}

const PURPOSES = [
  "Working capital / stock purchase",
  "Equipment or tools",
  "School fees",
  "Medical expenses",
  "Home improvement",
  "Expand business",
  "Agricultural inputs",
  "Other",
];

const DURATIONS = ["3 months", "6 months", "12 months", "18 months", "24 months", "36 months"];

export default function AiCoachAndLoans({ lang, score, tier }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [loans, setLoans] = useState<LoanMatch[]>([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const [loansLoaded, setLoansLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Application modal state
  const [applyingTo, setApplyingTo] = useState<LoanMatch | null>(null);
  const [applyAmount, setApplyAmount] = useState("");
  const [applyPurpose, setApplyPurpose] = useState(PURPOSES[0]);
  const [applyDuration, setApplyDuration] = useState(DURATIONS[2]);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<string[]>([]); // lender names already applied to
  const [applySuccess, setApplySuccess] = useState(false);

  const langCode = lang === "rw" ? "Kinyarwanda" : lang === "sw" ? "Swahili" : "English";

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setChatLoading(true);
    try {
      const data = await api.callCoach(userMsg.content, messages, langCode);
      setMessages(prev => [...prev, { role: "model", content: data.text || "Sorry, I could not respond right now." }]);
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Network error. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchLoans = async () => {
    setLoansLoading(true);
    try {
      const data = await api.getLoans();
      setLoans(data.matches || []);
      setLoansLoaded(true);
    } catch {
      setLoansLoaded(true);
    } finally {
      setLoansLoading(false);
    }
  };

  const submitApplication = async () => {
    if (!applyingTo || !applyAmount || applying) return;
    setApplying(true);
    try {
      await api.applyForLoan({
        lenderName: applyingTo.bankName,
        amount: parseInt(applyAmount.replace(/\D/g, "")),
        purpose: applyPurpose,
        duration: applyDuration,
        scoreAtTime: score,
        tierAtTime: tier,
      });
      setApplied(prev => [...prev, applyingTo.bankName]);
      setApplySuccess(true);
      setTimeout(() => {
        setApplySuccess(false);
        setApplyingTo(null);
        setApplyAmount("");
        setApplyPurpose(PURPOSES[0]);
        setApplyDuration(DURATIONS[2]);
      }, 2500);
    } catch {
      // still close modal on error — don't block user
      setApplyingTo(null);
    } finally {
      setApplying(false);
    }
  };

  const tierColor = (t: string) => {
    if (t === "Platinum") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (t === "Gold") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    if (t === "Silver") return "text-slate-300 bg-slate-800/60 border-slate-700";
    return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  };

  const probColor = (p: number) =>
    p >= 0.8 ? "text-emerald-400" : p >= 0.5 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* ── APPLICATION MODAL ── */}
      {applyingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#020617] border border-slate-700 rounded-2xl shadow-2xl p-6 animate-fade-in">
            {applySuccess ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="font-display font-extrabold text-lg text-white">
                  {lang === "rw" ? "Gusaba byoherejwe!" : lang === "sw" ? "Ombi Limewasilishwa!" : "Application Submitted!"}
                </h3>
                <p className="text-xs text-slate-400 mt-2">
                  {lang === "rw"
                    ? `${applyingTo.bankName} bazakwishyura mu masaha 24–48.`
                    : lang === "sw"
                    ? `${applyingTo.bankName} itawasiliana nawe ndani ya masaa 24–48.`
                    : `${applyingTo.bankName} will review and contact you within 24–48 hours.`}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-display font-extrabold text-base text-white">
                      {lang === "rw" ? "Saba Inguzanyo" : lang === "sw" ? "Omba Mkopo" : "Apply for Loan"}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{applyingTo.bankName} · {applyingTo.interestRate} · Max {applyingTo.maxAmount}</p>
                  </div>
                  <button onClick={() => setApplyingTo(null)} className="text-slate-500 hover:text-white cursor-pointer transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Score badge */}
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-[10px] text-slate-300">
                      {lang === "rw" ? "Amanota yawe" : lang === "sw" ? "Alama yako" : "Your score"}: <strong className="text-amber-400">{score}/1000</strong>
                      <span className={`ml-2 font-bold text-[9px] px-1.5 py-0.5 rounded-full border ${tierColor(tier)}`}>{tier}</span>
                    </p>
                    <span className={`ml-auto text-[9px] font-bold ${probColor(applyingTo.approvalProbability)}`}>
                      {Math.round(applyingTo.approvalProbability * 100)}% approval chance
                    </span>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                      {lang === "rw" ? "Ingano (RWF)" : lang === "sw" ? "Kiasi (RWF)" : "Amount (RWF)"}
                    </label>
                    <input
                      type="number"
                      value={applyAmount}
                      onChange={e => setApplyAmount(e.target.value)}
                      placeholder={lang === "rw" ? "urugero: 200000" : "e.g. 200000"}
                      className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-amber-500 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  {/* Purpose */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                      {lang === "rw" ? "Impamvu" : lang === "sw" ? "Kusudi" : "Purpose"}
                    </label>
                    <select
                      value={applyPurpose}
                      onChange={e => setApplyPurpose(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-amber-500 focus:outline-none cursor-pointer"
                    >
                      {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                      {lang === "rw" ? "Igihe" : lang === "sw" ? "Muda" : "Duration"}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DURATIONS.map(d => (
                        <button key={d} onClick={() => setApplyDuration(d)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                            applyDuration === d
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                              : "text-slate-400 border-slate-800 hover:border-slate-700"
                          }`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={submitApplication}
                    disabled={applying || !applyAmount}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-extrabold text-xs uppercase rounded-xl cursor-pointer transition-colors"
                  >
                    {applying
                      ? (lang === "rw" ? "Kohereza..." : lang === "sw" ? "Inatuma..." : "Submitting...")
                      : (lang === "rw" ? "Ohereza Gusaba →" : lang === "sw" ? "Wasilisha Ombi →" : "Submit Application →")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── AI COACH ── */}
      <div className="lg:col-span-7 bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col" style={{ minHeight: 520 }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="font-display font-bold text-lg text-white tracking-tight">
            {lang === "rw" ? "AI Umutoza w'Imari" : lang === "sw" ? "AI Kocha wa Kifedha" : "AI Financial Coach"}
          </h3>
          <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${tierColor(tier)}`}>
            {tier} · {score} pts
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1" style={{ maxHeight: 340 }}>
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-slate-500 italic">
                {lang === "rw"
                  ? "Baza inama z'imari, uko wakura amanota, cyangwa uko wagura ubucuruzi..."
                  : lang === "sw"
                  ? "Uliza ushauri wa kifedha, jinsi ya kukuza alama yako, au kupanua biashara..."
                  : "Ask how to boost your score, calculate interest, plan your savings, or grow your business..."}
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["How do I reach Gold tier?", "What loans can I get?", "How to save more with my SACCO?"].map(q => (
                  <button key={q} onClick={() => setInput(q)}
                    className="text-[10px] bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 px-3 py-1 rounded-full transition-colors cursor-pointer">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] text-xs px-4 py-2.5 rounded-2xl leading-relaxed ${
                m.role === "user"
                  ? "bg-amber-500 text-slate-950 font-semibold rounded-br-sm"
                  : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 text-slate-400 text-xs px-4 py-2.5 rounded-2xl rounded-bl-sm">
                <span className="animate-pulse">
                  {lang === "rw" ? "Umutoza aratekereza..." : lang === "sw" ? "Kocha anafikiria..." : "Agaciro Coach is thinking..."}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder={lang === "rw" ? "Baza inama..." : lang === "sw" ? "Uliza swali..." : "Ask your coach..."}
            className="flex-1 text-xs p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={chatLoading || !input.trim()}
            className="p-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 rounded-xl transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── LOAN MATCHING ── */}
      <div className="lg:col-span-5 bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-display font-bold text-lg text-white tracking-tight">
              {lang === "rw" ? "Inguzanyo Zijyanye" : lang === "sw" ? "Mikopo Inayofaa" : "Matched Loans"}
            </h3>
          </div>
          <button
            onClick={fetchLoans}
            disabled={loansLoading}
            className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 hover:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loansLoading ? "animate-spin" : ""}`} />
            {loansLoaded
              ? (lang === "rw" ? "Vugurura" : lang === "sw" ? "Onyesha tena" : "Refresh")
              : (lang === "rw" ? "Shaka Inguzanyo" : lang === "sw" ? "Tafuta Mikopo" : "Find Loans")}
          </button>
        </div>

        {!loansLoaded && (
          <div className="flex-1 flex items-center justify-center text-center py-8">
            <div>
              <ShieldCheck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-500">
                {lang === "rw"
                  ? "Kanda 'Shaka Inguzanyo' kugirango ubone inguzanyo zijyanye n'amanota yawe"
                  : lang === "sw"
                  ? "Bonyeza 'Tafuta Mikopo' kuona mikopo inayofaa alama yako"
                  : "Click Find Loans to see credit offers matched to your real score"}
              </p>
            </div>
          </div>
        )}

        {loansLoaded && (
          <div className="space-y-3 flex-1 overflow-y-auto">
            {loans.map((loan, i) => {
              const alreadyApplied = applied.includes(loan.bankName);
              const canApply = loan.status !== "Locked" && !alreadyApplied;
              return (
                <div key={i} className="bg-[#050814] border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-bold text-white leading-tight">{loan.bankName}</h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      loan.status === "Highly Matched"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : loan.status === "Unlocked"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic mb-2 leading-relaxed">{loan.dynamicPitch}</p>
                  <div className="flex items-center gap-3 text-[10px] font-mono mb-2.5">
                    <span className="text-slate-500">Rate: <strong className="text-slate-200">{loan.interestRate}</strong></span>
                    <span className="text-slate-500">Max: <strong className="text-slate-200">{loan.maxAmount}</strong></span>
                    <span className={`ml-auto font-bold ${probColor(loan.approvalProbability)}`}>
                      {Math.round(loan.approvalProbability * 100)}%
                    </span>
                  </div>
                  <button
                    onClick={() => canApply && setApplyingTo(loan)}
                    disabled={!canApply}
                    className={`w-full py-1.5 text-[10px] font-bold rounded-lg border transition-colors cursor-pointer ${
                      alreadyApplied
                        ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 cursor-default"
                        : canApply
                        ? "text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                        : "text-slate-600 border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    {alreadyApplied
                      ? (lang === "rw" ? "✓ Koherejwe" : lang === "sw" ? "✓ Limewasilishwa" : "✓ Applied")
                      : canApply
                      ? (lang === "rw" ? "Saba Inguzanyo →" : lang === "sw" ? "Omba Mkopo →" : "Apply →")
                      : (lang === "rw" ? "Ntabwo bibonetse" : lang === "sw" ? "Haifiki" : "Score too low")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
