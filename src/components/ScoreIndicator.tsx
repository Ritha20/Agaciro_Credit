import React, { useState, useCallback } from "react";
import * as api from "../api";
import { 
  Award, 
  HelpCircle, 
  Users, 
  ShieldCheck, 
  ChevronRight, 
  PlusCircle, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Coins
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { CreditTier, ScoreFactor, Endorsement, BlockchainRecord } from "../types";
import { TRANSLATIONS, LocaleKey } from "./Localization";

interface ScoreIndicatorProps {
  score: number;
  tier: CreditTier;
  factors: ScoreFactor[];
  onFactorChange: (id: string, newValue: number) => void;
  endorsements: Endorsement[];
  onAddEndorsement: (name: string, role: string, coop: string) => void;
  lang: "en" | "rw" | "sw";
  blockchain?: BlockchainRecord[];
  themeMode?: "midnight" | "light";
  isAuthenticated?: boolean;
  onMomoSynced?: (momoScore: number) => void;
}

export default function ScoreIndicator({
  score,
  tier,
  factors,
  onFactorChange,
  endorsements,
  onAddEndorsement,
  lang,
  blockchain = [],
  themeMode = "midnight",
  isAuthenticated = false,
  onMomoSynced,
}: ScoreIndicatorProps) {
  const t = (key: LocaleKey) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"][key];

  const [momoSyncing, setMomoSyncing] = useState(false);
  const [momoSyncResult, setMomoSyncResult] = useState<{ success: boolean; message: string; balance?: { amount: number; currency: string } } | null>(null);

  const handleMomoSync = useCallback(async () => {
    setMomoSyncing(true);
    setMomoSyncResult(null);
    try {
      const result = await api.syncMomo();
      setMomoSyncResult({ success: result.success, message: result.message, balance: result.balance });
      if (result.success && onMomoSynced) {
        onMomoSynced(result.momoScore);
      }
    } catch {
      setMomoSyncResult({ success: false, message: "Could not connect to MoMo. Try again." });
    } finally {
      setMomoSyncing(false);
    }
  }, [onMomoSynced]);

  // Community endorsement request modal / state
  const [showVouchForm, setShowVouchForm] = useState(false);
  const [leaderName, setLeaderName] = useState("");
  const [leaderRole, setLeaderRole] = useState("Cooperative Chairperson");
  const [coopName, setCoopName] = useState("");

  const handleVouchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leaderName && coopName) {
      onAddEndorsement(leaderName, leaderRole, coopName);
      setLeaderName("");
      setCoopName("");
      setShowVouchForm(false);
    }
  };

  // Get color configurations depending on Credit Tier
  const getTierSpecs = (currentTier: CreditTier) => {
    switch (currentTier) {
      case "Bronze":
        return {
          textColor: "text-amber-400",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/20",
          gradient: "from-amber-500 to-amber-700",
          ringColor: "ring-amber-550/10",
          nextTier: "Silver",
          ptsNeeded: 450 - score
        };
      case "Silver":
        return {
          textColor: "text-slate-300",
          bgColor: "bg-slate-800/60",
          borderColor: "border-slate-700",
          gradient: "from-slate-400 to-slate-600",
          ringColor: "ring-slate-500/10",
          nextTier: "Gold",
          ptsNeeded: 650 - score
        };
      case "Gold":
        return {
          textColor: "text-yellow-400",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/20",
          gradient: "from-yellow-400 to-amber-500",
          ringColor: "ring-yellow-500/10",
          nextTier: "Platinum",
          ptsNeeded: 850 - score
        };
      case "Platinum":
        return {
          textColor: "text-emerald-400",
          bgColor: "bg-emerald-500/15",
          borderColor: "border-emerald-500/30",
          gradient: "from-emerald-400 to-teal-500",
          ringColor: "ring-emerald-500/15",
          nextTier: "Maximum",
          ptsNeeded: 0
        };
    }
  };

  const specs = getTierSpecs(tier);

  // Compute indicator color
  const getIndicatorColor = (val: number) => {
    if (val < 50) return "text-rose-400 bg-rose-500/10 border border-rose-500/20";
    if (val < 80) return "text-amber-450 bg-amber-500/10 border border-amber-500/20";
    return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* COLUMN 1: Donut Score Display Card */}
      <div id="card-credit-donut" className="lg:col-span-5 bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-between min-h-105">
        
        {/* Header */}
        <div className="w-full text-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border ${specs.bgColor} ${specs.textColor} ${specs.borderColor}`}>
            <Sparkles className="w-3.5 h-3.5" />
            {t(`tier${tier}` as LocaleKey)}
          </span>
          <h3 className="font-display font-bold text-lg text-white mt-3.5 tracking-tight">
            {t("scoreTitle")}
          </h3>
        </div>

        {/* Donut SVG Meter */}
        <div className="relative my-6 flex items-center justify-center">
          <svg className="w-56 h-56 transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="112"
              cy="112"
              r="94"
              className="stroke-slate-800"
              strokeWidth="14"
              fill="transparent"
            />
            {/* Progress Circle with tech amber/gold color */}
            <circle
              cx="112"
              cy="112"
              r="94"
              className="stroke-amber-500 transition-all duration-700 ease-out"
              strokeWidth="14"
              strokeDasharray={2 * Math.PI * 94}
              strokeDashoffset={2 * Math.PI * 94 * (1 - score / 1000)}
              strokeLinecap="round"
              fill="transparent"
              style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.3))" }}
            />
          </svg>
          
          {/* Inner content */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="font-display font-medium text-slate-500 text-xs uppercase tracking-widest leading-none">
              AGACIRO SCORE
            </span>
            <span className="font-display font-bold text-5xl text-white tracking-tight my-2.5">
              {score}
            </span>
            <span className="text-slate-300 text-xs font-semibold bg-slate-900 border border-slate-800 px-3 py-1 rounded-md">
              out of 1000
            </span>
          </div>
        </div>

        {/* Level Progression Indicator */}
        <div className="w-full bg-[#050814] border border-slate-800/80 rounded-xl p-3.5 text-center">
          {tier !== "Platinum" ? (
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              🪙 You are only <strong className="text-amber-400 font-bold">{specs.ptsNeeded} points</strong> away from <strong>{specs.nextTier} Level</strong>, unlocking 2.5% lower interest rates!
            </p>
          ) : (
            <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" /> Platinum Status Unlock: Best credit terms and max trading liquidity bounds!
            </p>
          )}
        </div>

      </div>

      {/* COLUMN 2: Factors Simulation Sliders */}
      <div id="card-credit-sliders" className="lg:col-span-7 bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-lg text-white tracking-tight">
              {t("simulateTitle")}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {t("simulateDesc")}
          </p>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-4.5 my-6">
          {factors.map((factor) => {
            const label = lang === "rw" ? factor.nameRw : lang === "sw" ? factor.nameSw : factor.name;
            const desc = lang === "rw" ? factor.descriptionRw : lang === "sw" ? factor.descriptionSw : factor.description;
            const indicatorCls = getIndicatorColor(factor.value);
            const isMomo = factor.id === "momo";

            return (
              <div key={factor.id} className="bg-[#050814] rounded-xl p-3.5 border border-slate-850 transition-all hover:bg-slate-900/40 hover:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100 tracking-tight uppercase">
                        {label}
                      </span>
                      {isMomo && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                          isAuthenticated
                            ? momoSyncResult?.success
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                              : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                            : "text-slate-500 bg-slate-800 border-slate-700"
                        }`}>
                          {isAuthenticated
                            ? momoSyncResult?.success
                              ? (lang === "rw" ? "MoMo · Nizewe" : lang === "sw" ? "MoMo · Imesawazishwa" : "MoMo · Synced")
                              : (lang === "rw" ? "MoMo · Ntabwo Nizewe" : lang === "sw" ? "MoMo · Haijalandanishwa" : "MoMo · Not synced")
                            : "DEMO"}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 max-w-70 mt-0.5 leading-normal">
                      {isMomo && isAuthenticated
                        ? momoSyncResult
                          ? momoSyncResult.message
                          : (lang === "rw"
                              ? "Kanda 'Huza MoMo' kugirango uhuze amakuru y'ukuri avuye muri MTN"
                              : lang === "sw"
                              ? "Bonyeza 'Sawazisha MoMo' kupata data halisi kutoka MTN"
                              : "Click 'Sync MoMo' to pull your real MTN MoMo account data")
                        : desc}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${indicatorCls}`}>
                      {factor.value}%
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      (×{Math.round(factor.weight * 100)}%)
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max={factor.maxValue}
                  value={factor.value}
                  onChange={(e) => onFactorChange(factor.id, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                {isMomo && isAuthenticated && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={handleMomoSync}
                      disabled={momoSyncing}
                      className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                    >
                      {momoSyncing ? (
                        <>
                          <span className="w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                          {lang === "rw" ? "Kuhuza..." : lang === "sw" ? "Inasawazisha..." : "Syncing..."}
                        </>
                      ) : (
                        <>
                          📱 {lang === "rw" ? "Huza MoMo" : lang === "sw" ? "Sawazisha MoMo" : "Sync from MoMo"}
                        </>
                      )}
                    </button>
                    {momoSyncResult?.balance && (
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                        Balance: {momoSyncResult.balance.amount.toLocaleString()} {momoSyncResult.balance.currency}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Base Score Indicator Math Detail */}
        <div className="text-[10px] bg-[#050814] text-slate-400 font-mono p-2.5 rounded border border-slate-850 flex flex-wrap items-center justify-between gap-1">
          <span>ALGORITHM SEED: <strong className="text-white">300 pts</strong></span>
          <span>+</span>
          <span>WEIGHTED TRANSACTION TARGETS (Max 500)</span>
          <span>+</span>
          <span>COMMUNITY VOUCHERS (Max 200)</span>
        </div>

      </div>

      {/* SEC 2.5: Score History Chart */}
      <div id="card-score-history-chart" className="lg:col-span-12 bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h3 className="font-display font-bold text-lg text-white tracking-tight">
                {lang === "rw" ? "Amateka y'Amanota" : lang === "sw" ? "Historia ya Alama" : "Score History"}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {lang === "rw"
                ? "Ingendo y'amanota yawe y'icyizere uko itera imbere igihe cyose."
                : lang === "sw"
                ? "Safari ya alama yako ya mkopo kadri unavyoendelea."
                : "Your credit score journey over time — every data sync and endorsement recorded."}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {blockchain.length > 0 && (
              <>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">
                    {lang === "rw" ? "Ntandiko" : lang === "sw" ? "Matukio" : "Events"}
                  </p>
                  <p className="text-lg font-extrabold text-amber-400 font-mono">{blockchain.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">
                    {lang === "rw" ? "Iherezo" : lang === "sw" ? "Sasa" : "Latest"}
                  </p>
                  <p className="text-lg font-extrabold text-emerald-400 font-mono">{blockchain[0]?.scoreAfter ?? "—"}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">
                    {lang === "rw" ? "Tangiriro" : lang === "sw" ? "Awali" : "Start"}
                  </p>
                  <p className="text-lg font-extrabold text-slate-300 font-mono">{blockchain[blockchain.length - 1]?.scoreAfter ?? "—"}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="w-full h-64" id="score-trend-chart">
          {blockchain.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[...blockchain].reverse().map(b => ({
                  date: b.timestamp.slice(0, 10),
                  score: b.scoreAfter,
                  action: b.action,
                  timestamp: b.timestamp,
                }))}
                margin={{ top: 10, right: 20, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={themeMode === "light" ? "#cbd5e1" : "#1e293b"} />
                <XAxis
                  dataKey="date"
                  stroke={themeMode === "light" ? "#475569" : "#64748b"}
                  fontSize={9}
                  fontWeight="bold"
                  tickLine={false}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis
                  domain={[280, 1000]}
                  stroke={themeMode === "light" ? "#475569" : "#64748b"}
                  fontSize={9}
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const tier = d.score >= 850 ? "Platinum" : d.score >= 650 ? "Gold" : d.score >= 450 ? "Silver" : "Bronze";
                      const tierColor = tier === "Platinum" ? "text-emerald-400" : tier === "Gold" ? "text-yellow-400" : tier === "Silver" ? "text-slate-300" : "text-amber-400";
                      return (
                        <div className={`border p-3 rounded-xl shadow-xl text-left ${
                          themeMode === "light" ? "bg-white border-slate-200 text-slate-900" : "bg-[#090d1f] border-slate-700 text-slate-100"
                        }`}>
                          <p className="text-[9px] text-slate-400 font-mono mb-1">{d.timestamp.slice(0, 16)} UTC</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-amber-400 font-mono">{d.score}</span>
                            <span className={`text-[10px] font-bold uppercase ${tierColor}`}>{tier}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1 italic max-w-48 leading-relaxed">{d.action.toLowerCase().replace(/_/g, " ")}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#020617" }}
                  activeDot={{ r: 6, fill: "#fbbf24" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 border border-dashed border-slate-800 rounded-xl">
              <TrendingUp className="w-8 h-8 text-slate-700" />
              <div className="text-center">
                <p className="text-xs font-bold text-slate-500">
                  {lang === "rw" ? "Nta mateka arahari" : lang === "sw" ? "Hakuna historia bado" : "No score history yet"}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">
                  {lang === "rw" ? "Hindura amakuru yawe kugirango utangire kubona ingendo" : lang === "sw" ? "Sawazisha data yako kuona safari yako" : "Sync your MoMo data or add an endorsement to start your journey"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEC 3: Community Endorsements Block */}
      <div id="card-endorsements" className="lg:col-span-8 bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <h3 className="font-display font-bold text-lg text-white tracking-tight">
                {t("endorsementTitle")}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {t("endorsementDesc")}
            </p>
          </div>
          
          <button
            onClick={() => setShowVouchForm(!showVouchForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.8 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            {t("requestVouch")}
          </button>
        </div>

        {/* Dynamic Vouch Request Form */}
        {showVouchForm && (
          <form onSubmit={handleVouchSubmit} className="bg-[#050814] border border-amber-500/20 rounded-xl p-4 mb-4 animate-slide-down">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-3">
              Request Leader Verification Voucher
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Leader Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Papa Nkurunziza"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-900 border border-slate-800 text-slate-100 rounded-md focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Leader Title</label>
                <select
                  value={leaderRole}
                  onChange={(e) => setLeaderRole(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-900 border border-slate-800 text-slate-500 rounded-md focus:border-amber-500 focus:outline-none"
                >
                  <option value="Cooperative Chairperson">Cooperative Chairperson</option>
                  <option value="Savings Group Treasurer">Savings Group Treasurer</option>
                  <option value="Muganda Coordinator">Umuganda Local Coordinator</option>
                  <option value="SACCO Regional Auditor">SACCO Auditor</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Organization / Coop</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kigali Moto Coop"
                  value={coopName}
                  onChange={(e) => setCoopName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-900 border border-slate-800 text-slate-100 rounded-md focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowVouchForm(false)}
                className="text-xs text-slate-400 px-3 py-1 hover:bg-slate-800 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4.5 py-1.5 rounded-md shadow-xs transition-colors"
              >
                Submit Claim (Adds 50 Score pts)
              </button>
            </div>
          </form>
        )}

        {/* Endorsements List */}
        {endorsements.length === 0 && (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
            <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              {lang === "rw"
                ? "Nta nyandiko z'inzego zabonetse — saba umuyobozi wa koperative yawe"
                : lang === "sw"
                ? "Hakuna vyeti vya jamii bado — omba kiongozi wa ushirika wako"
                : "No community endorsements yet — click \"Request Endorsement\" to ask a cooperative leader"}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {endorsements.map((end) => (
            <div key={end.id} className="border border-slate-800 bg-[#050814]/55 rounded-xl p-3.5 flex items-start justify-between hover:border-slate-700 transition-colors">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs mt-0.5 border border-emerald-500/20">
                  {end.vouchName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{end.vouchName}</h4>
                  <p className="text-[10px] text-slate-400">{end.role} at <strong className="text-slate-300">{end.cooperative}</strong></p>
                  <span className="text-[9px] font-mono text-slate-500 mt-0.5 block">{end.vouchedAt}</span>
                </div>
              </div>

              <div>
                {end.status === "Active" ? (
                  <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 text-emerald-400 font-bold text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    {t("vouchActive")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 bg-amber-500/10 text-amber-400 font-bold text-[9px] px-2 py-0.5 rounded-full border border-amber-550/20 uppercase animate-pulse">
                    {t("vouchPending")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEC 4: Badges / Gamification */}
      <div id="card-badges" className="lg:col-span-4 bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Award className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="font-display font-bold text-lg text-white tracking-tight">
              {t("badgesTitle")}
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-normal mb-4">
            Gamified badges and milestones prove your hustle and raise your micro-investment multiplier constraints!
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs border border-yellow-500/20">
                🏷️
              </div>
              <div>
                <h4 className="text-xs font-bold text-yellow-100 leading-tight">Daily Habit Tracker</h4>
                <p className="text-[9px] text-yellow-300">Matched 8 sequential daily transactions ledger posts!</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 bg-blue-500/5 border border-blue-500/15 rounded-xl">
              <div className="w-8 h-8 bg-blue-500/25 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs border border-blue-500/20">
                🏠
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 leading-tight">Steady Rent Payer</h4>
                <p className="text-[9px] text-slate-400 font-medium">Transacted landlord settlement via mobile wallet for 4 continuous quarters.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 opacity-45 hover:opacity-100 transition-opacity bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white shrink-0 border border-slate-700">
                🚀
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 leading-tight">SACCO Legend</h4>
                <p className="text-[9px] text-slate-500">Qualify by depositing savings of 25,000 RWF / KES each week (Locked).</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 mt-4 text-center">
          <span className="text-[9px] text-slate-400 font-mono uppercase bg-slate-900 border border-slate-800 px-3 py-1 rounded">
            LEVEL MULTIPLIER: {tier === "Gold" ? "1.5x" : tier === "Platinum" ? "2.0x" : tier === "Silver" ? "1.2x" : "1.0x"} Yield Maxima
          </span>
        </div>
      </div>

    </div>
  );
}
