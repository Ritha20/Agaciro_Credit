import React, { useState } from "react";
import { 
  ShieldCheck, 
  HelpCircle, 
  Terminal, 
  ArrowRight,
  Database,
  Fingerprint,
  RefreshCw,
  AlertTriangle,
  Lock
} from "lucide-react";
import { BlockchainRecord } from "../types";
import { TRANSLATIONS, LocaleKey } from "./Localization";

interface BlockchainLedgerProps {
  ledger: BlockchainRecord[];
  lang: "en" | "rw" | "sw";
}

export default function BlockchainLedger({ ledger, lang }: BlockchainLedgerProps) {
  const t = (key: LocaleKey) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"][key];

  // AI Fraud parameters
  const [fraudSensitivity, setFraudSensitivity] = useState(50);
  const [testTxValue, setTestTxValue] = useState(48000); // RWF transaction
  const [isDoubleSpendTestActive, setIsDoubleSpendTestActive] = useState(false);
  const [fraudResults, setFraudResults] = useState<{
    status: "Clean" | "Warning" | "Flagged";
    scoreImpact: number;
    diagnostics: string;
  } | null>(null);

  const testMomoTransaction = () => {
    setIsDoubleSpendTestActive(true);
    setTimeout(() => {
      setIsDoubleSpendTestActive(false);

      // Simple AI rule: high transaction amounts paired with high sensitivity flag suspicious cycles
      if (testTxValue > 80000 && fraudSensitivity > 65) {
        setFraudResults({
          status: "Flagged",
          scoreImpact: -75,
          diagnostics: "ALERT: Highly recurring loop identified. Dynamic multi-agent checks flag Wash-Depositing cycle between sister-SACCO wallets."
        });
      } else if (testTxValue > 40000 && fraudSensitivity > 40) {
        setFraudResults({
          status: "Warning",
          scoreImpact: 0,
          diagnostics: "NOTICE: Extreme intraday transfer velocity detected. Flagged for secondary manual audit routing."
        });
      } else {
        setFraudResults({
          status: "Clean",
          scoreImpact: 15,
          diagnostics: "PASSED: Velocity ratios within standard bounds. Tokenized biometric audit trail verified by Kigali Telecom gateway."
        });
      }
    }, 850);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      
      {/* 1. Blockchain Visualization Column */}
      <div id="blockchain-visual" className="lg:col-span-8 bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Lock className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="font-display font-bold text-lg text-white tracking-tight">
              {t("blockchainTitle")}
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            {t("blockchainDesc")}
          </p>
        </div>

        {/* Chain ledger horizontal flow chart */}
        <div className="space-y-3.5 my-4 overflow-y-auto max-h-[360px] pr-1 scrollbar-thin">
          {ledger.map((block, idx) => (
            <div 
              key={block.blockIndex} 
              className={`border rounded-xl p-4 transition-all duration-300 ${
                idx === 0 
                  ? "border-[#eab308]/40 bg-[#eab308]/5 shadow-[0_0_12px_rgba(234,179,8,0.1)]" 
                  : "border-slate-800 bg-[#050814]/40 hover:bg-[#050814] hover:border-slate-700"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                
                {/* Visual Block identifier */}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    idx === 0 
                      ? "bg-amber-500 text-slate-950 border-amber-600 shadow-md font-bold" 
                      : "bg-[#090d1f] text-slate-400 border-slate-800"
                  }`}>
                    <Database className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-mono font-bold text-slate-200">BLOCK #{block.blockIndex}</span>
                      {idx === 0 && (
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono font-bold text-[8px] px-1.5 py-0.2 rounded uppercase tracking-wide">
                          Latest Tail
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{block.timestamp}</span>
                  </div>
                </div>

                {/* Block activity and outcome */}
                <div className="flex-1 md:px-4">
                  <p className="text-xs font-bold text-slate-100 tracking-wide uppercase">
                    {block.action}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-mono text-slate-500">HASH: </span>
                    <span className="text-[9px] font-mono bg-[#090d1f] border border-slate-850 text-[#eab308] px-1.5 py-0.5 rounded truncate max-w-[120px] md:max-w-none">
                      {block.hash}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">PREV: </span>
                    <span className="text-[9px] font-mono bg-[#090d1f] border border-slate-850 text-slate-400 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                      {block.prevHash}
                    </span>
                  </div>
                </div>

                {/* Score resulting state */}
                <div className="text-right flex md:flex-col items-center md:items-end justify-between md:justify-center shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    TRUST LEDGER
                  </span>
                  <span className="text-sm font-display font-extrabold text-amber-400">
                    {block.scoreAfter} pts
                  </span>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Network integrity check footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              Consensus Synchronized
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Node: Kigali-West-Mainframe // SHA-256 Ledger
          </span>
        </div>

      </div>

      {/* 2. AI Fraud Control Panel Column */}
      <div id="fraud-analyzer" className="lg:col-span-4 bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-lg text-white tracking-tight">
              Anti-Fraud Watchdog
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-normal mb-4">
            Continuous anomaly detection triggers. Automated agent checks flag wash-trading loops, fake endorsements, and cash pool cycles.
          </p>

          {/* Controller 1: Sensitivity threshold */}
          <div className="bg-[#050814] border border-slate-850 rounded-xl p-3.5 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-300 uppercase">
                AI Detection Sensitivity
              </span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.2 rounded-full">
                {fraudSensitivity}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              value={fraudSensitivity}
              onChange={(e) => setFraudSensitivity(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[8px] text-slate-500 mt-1.5 font-mono uppercase">
              <span>Loose Sandbox</span>
              <span>High Security Bank Spec</span>
            </div>
          </div>

          {/* Mock Input Transaction Value */}
          <div className="bg-[#050814] border border-slate-850 rounded-xl p-3.5 mb-4">
            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1.5">
              Simulated Momo Transfer Spike
            </label>
            <div className="flex items-center gap-2 bg-[#090d1f] border border-slate-800 rounded-lg p-1.5">
              <span className="text-xs font-bold text-slate-400 px-1">RWF</span>
              <input
                type="number"
                step="5000"
                value={testTxValue}
                onChange={(e) => setTestTxValue(Math.max(1000, parseInt(e.target.value) || 0))}
                className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
              />
            </div>
            <p className="text-[9px] text-slate-500 mt-1.5">
              Large single-day bursts can trigger Wash-Deposit alert layers at high sensitivities.
            </p>
          </div>

          {/* Test Action */}
          <button
            onClick={testMomoTransaction}
            disabled={isDoubleSpendTestActive}
            className="w-full py-2 bg-amber-500 text-slate-950 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {isDoubleSpendTestActive ? (
              <span className="flex items-center justify-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Calculating Multi-agent Entropy...
              </span>
            ) : (
              "Evaluate Transaction Integrity"
            )}
          </button>
        </div>

        {/* Results indicator */}
        <div className="h-32 mt-4">
          {fraudResults ? (
            <div className={`rounded-xl p-3.5 border animate-fade-in text-xs ${
              fraudResults.status === "Clean"
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : fraudResults.status === "Warning"
                ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                : "bg-rose-500/10 border-rose-500/25 text-rose-400"
            }`}>
              <div className="flex items-center justify-between font-bold uppercase text-[10px] tracking-wide mb-1">
                <span>Result: {fraudResults.status}</span>
                <span className="font-mono">Score Impact: {fraudResults.scoreImpact > 0 ? "+" : ""}{fraudResults.scoreImpact}</span>
              </div>
              <p className="text-[10px] leading-relaxed mt-1">
                {fraudResults.diagnostics}
              </p>
            </div>
          ) : (
            <div className="border border-dashed border-slate-800 rounded-xl p-3.5 flex flex-col items-center justify-center text-center text-[10px] text-slate-400 h-full">
              <Fingerprint className="w-6 h-6 text-slate-600 mb-2" />
              <span>Input a simulated transaction transfer above to run real-time entropy detection logs.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
