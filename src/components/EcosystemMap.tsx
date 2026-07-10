import React, { useState, useEffect } from "react";
import {
  Globe,
  Cpu,
  Layers,
  Settings,
  Database,
  Activity,
  Sparkles,
  RefreshCw,
  UserCheck,
  Play,
  CheckCircle,
  TrendingUp,
  Coins,
  Lock,
  Shield,
  ArrowRight,
  Terminal,
  Zap,
  CheckSquare,
  Users
} from "lucide-react";

interface EcosystemMapProps {
  score: number;
  lang: "en" | "rw" | "sw";
}

interface TelemetryLog {
  timestamp: string;
  module: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  id: string;
}

export default function EcosystemMap({ score, lang }: EcosystemMapProps) {
  const [activeLayer, setActiveLayer] = useState<string>("processing");
  const [activeJourneyStep, setActiveJourneyStep] = useState<number>(0);
  const [regionalHub, setRegionalHub] = useState<string>("Kigali Core");
  const [logs, setLogs] = useState<TelemetryLog[]>([
    { id: "init-1", timestamp: "07:07:01 UTC", module: "SYSTEM", message: "Secured dataflow tunnel synchronized", type: "success" },
    { id: "init-2", timestamp: "07:07:02 UTC", module: "INGEST", message: "Mobile money API connector listening on /v2/momo/mtn", type: "info" },
    { id: "init-3", timestamp: "07:07:04 UTC", module: "LEDGER", message: "Blockchain state hash verified (0x0000a94e...)", type: "success" }
  ]);
  const [isSimulatingPipe, setIsSimulatingPipe] = useState<boolean>(false);
  const [currentSamplePayload, setCurrentSamplePayload] = useState<string>(
    JSON.stringify({
      msisdn: "+250788123456",
      coopId: "COOP-KIGALI-MOTO-04",
      lastUtilityPayment: "2026-06-15",
      momoMonthlyVolume: 145000,
      savingsFrequencyWeeks: 4,
      rentOnTimeStreak: 12
    }, null, 2)
  );

  const addLog = (module: string, message: string, type: "success" | "info" | "warning" | "error" = "info") => {
    const newLog: TelemetryLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString().split("T")[1].slice(0, 8) + " UTC",
      module,
      message,
      type
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50));
  };

  const simulateIngestion = (source: string) => {
    setIsSimulatingPipe(true);
    addLog("SOURCE", `Triggered payload pulling from external partner: ${source}`, "info");

    setTimeout(() => {
      addLog("INGESTION", `Raw transactional state extracted securely from ${source} endpoint`, "success");
    }, 400);

    setTimeout(() => {
      addLog("NORMALIZER", "Unified compliance parser mapped dates and normalized regional currency to RWF", "info");
      addLog("FRAUD_AI", "Checking double-spending patterns & structural validation indices...", "info");
    }, 1100);

    setTimeout(() => {
      addLog("FRAUD_AI", "Anti-abuse checks completed. Anomaly score: 0.0041 (Safe limit: < 0.15)", "success");
      addLog("SCORING", `Computing dynamic vector weights. Score recalculated based on current score params...`, "success");
    }, 1800);

    setTimeout(() => {
      addLog("LEDGER", `Blockchain checkpoint generated. Appending ledger record with index hash...`, "success");
      addLog("SERVER", "Direct bank match probabilities updated on banking gateway client registries.", "success");
      setIsSimulatingPipe(false);
    }, 2500);
  };

  const runJourneySimulationStep = (stepIdx: number) => {
    setActiveJourneyStep(stepIdx);
    const stepsModules = [
      { name: "ONBOARDING", action: "User register & accepted MT-Money API consent checklist" },
      { name: "DATAPULL", action: "Pulled MTN-Airtel transactions & utility meters" },
      { name: "SCORING", action: "Normalized data feeds processed through weight formulas" },
      { name: "DASHBOARD", action: "Generated dashboard metrics, points and gamified badges" },
      { name: "BANKMATCH", action: "Direct micro-lenders matched with cryptographic trust proofs" },
      { name: "EXPANSION", action: "Regional multi-currencies converted securely inside Forex Bot" }
    ];
    const item = stepsModules[stepIdx];
    addLog(item.name, item.action, "success");
  };

  return (
    <div className="space-y-6 w-full">
      {/* Dynamic Header */}
      <div className="bg-[#020617] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-550/10 text-amber-400 border border-amber-500/20">
                <Activity className="w-3 h-3 animate-pulse" /> Live Telemetry Linked
              </span>
              <span className="text-xs text-slate-500 font-mono">Node ID: e3ea3e31</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
              <RefreshCw className="text-amber-500 w-6 h-6 animate-spin-slow" />
              Dynamic Dataflow & System Architecture Map
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Explore step-by-step how user transactions flow from mobile networks, through our processing, storage, and ledger layers, to active lenders and global Forex hedging models.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 bg-slate-950 border border-slate-805 p-1.5 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold font-mono pl-2">ACTIVE HUB:</span>
            {["Kigali Core", "Nairobi Hub", "Dar Grid"].map((hub) => (
              <button
                key={hub}
                onClick={() => {
                  setRegionalHub(hub);
                  addLog("GATEWAY", `Rerouting API stream requests through ${hub.toUpperCase()} gateway`, "info");
                }}
                className={`text-[9.5px] font-mono font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                  regionalHub === hub 
                    ? "bg-amber-500 text-slate-950 font-extrabold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {hub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout containing Interactive Diagram on left, Telemetry Logs on right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Interactive Diagram Layer Column (Left side) */}
        <div className="xl:col-span-8 bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
              <div className="flex items-center gap-2">
                <Layers className="text-amber-500 w-5 h-5" />
                <h3 className="font-display font-bold text-base text-white tracking-tight">
                  Layers of the Trust Ecosystem
                </h3>
              </div>
              <span className="text-[10px] text-slate-450 font-mono">
                Click a layer node below to inspect details
              </span>
            </div>

            {/* Interactive multi-layer visual blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
              
              {/* Node 1: Data Sources */}
              <div 
                onClick={() => {
                  setActiveLayer("sources");
                  addLog("INSPECTOR", "Exploring layer: Partner Data Sources (Mobile Money, Utilities, Rent)", "info");
                }}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  activeLayer === "sources"
                    ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-white"
                    : "bg-[#050814]/40 border-slate-805 hover:border-slate-700 text-slate-350"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Globe className={`w-4 h-4 ${activeLayer === "sources" ? "text-amber-400" : "text-slate-400"}`} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">1. Data Sources</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 mb-1">Decentralized Inbound</h4>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  Mobile Money APIs, landlords, utility grids, and SACCO deposits feed our incoming channels directly.
                </p>
                <div className="mt-3 flex items-center justify-between text-[9px] font-mono border-t border-slate-850 pt-2 text-slate-500">
                  <span>Corridors: 4 active</span>
                  <span className="text-emerald-400">Stream: Live</span>
                </div>
              </div>

              {/* Node 2: Ingestion Layer */}
              <div 
                onClick={() => {
                  setActiveLayer("ingest");
                  addLog("INSPECTOR", "Exploring layer: Secure Ingestion Streams & Standard ETL Connectors", "info");
                }}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  activeLayer === "ingest"
                    ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-white"
                    : "bg-[#050814]/40 border-slate-805 hover:border-slate-700 text-slate-350"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Zap className={`w-4 h-4 ${activeLayer === "ingest" ? "text-amber-400" : "text-slate-400"}`} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">2. Ingestion</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 mb-1">ETL & Consent Pipelines</h4>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  Extracts and standardizes diverse formats. Runs instant client consensus rules prior to storage.
                </p>
                <div className="mt-3 flex items-center justify-between text-[9px] font-mono border-t border-slate-850 pt-2 text-slate-500">
                  <span>Queues: Active</span>
                  <span className="text-emerald-400">Security: TLS 1.3</span>
                </div>
              </div>

              {/* Node 3: Processing Layer */}
              <div 
                onClick={() => {
                  setActiveLayer("processing");
                  addLog("INSPECTOR", "Exploring layer: Data Normalization, Fraud AI & Scoring Engine", "info");
                }}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  activeLayer === "processing"
                    ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-white"
                    : "bg-[#050814]/40 border-slate-805 hover:border-slate-700 text-slate-350"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Cpu className={`w-4 h-4 ${activeLayer === "processing" ? "text-amber-400" : "text-slate-400"}`} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">3. AI Processing</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 mb-1">Normalization & Fraud AI</h4>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  Evaluates timeliness, patterns and contributions. Runs automated anomaly detection algorithms.
                </p>
                <div className="mt-3 flex items-center justify-between text-[9px] font-mono border-t border-slate-850 pt-2 text-slate-500">
                  <span>Models: 2 loaded</span>
                  <span className="text-amber-400">Inference: 4ms</span>
                </div>
              </div>

              {/* Node 4: Storage Layer */}
              <div 
                onClick={() => {
                  setActiveLayer("storage");
                  addLog("INSPECTOR", "Exploring layer: Postgres relational nodes & proof of trust Blockchain", "info");
                }}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  activeLayer === "storage"
                    ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-white"
                    : "bg-[#050814]/40 border-slate-805 hover:border-slate-700 text-slate-350"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Database className={`w-4 h-4 ${activeLayer === "storage" ? "text-amber-400" : "text-slate-400"}`} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">4. Storage & Ledger</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 mb-1">Sql DB + Trust Ledger</h4>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  Houses structured databases for fast index queries alongside a tamper-proof cryptographic ledger.
                </p>
                <div className="mt-3 flex items-center justify-between text-[9px] font-mono border-t border-slate-850 pt-2 text-slate-500">
                  <span>Type: PostgreSQL</span>
                  <span className="text-emerald-400">Chains: Signed</span>
                </div>
              </div>

              {/* Node 5: Application Layer */}
              <div 
                onClick={() => {
                  setActiveLayer("app");
                  addLog("INSPECTOR", "Exploring layer: Application Portal & Bank Gateway Integrations", "info");
                }}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  activeLayer === "app"
                    ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-white"
                    : "bg-[#050814]/40 border-slate-805 hover:border-slate-700 text-slate-350"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Users className={`w-4 h-4 ${activeLayer === "app" ? "text-amber-400" : "text-slate-400"}`} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">5. Application</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 mb-1">MFI API & Coach Agent</h4>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  Houses banking endpoints for direct loan matching alongside our real-time AI financial planner coach.
                </p>
                <div className="mt-3 flex items-center justify-between text-[9px] font-mono border-t border-slate-850 pt-2 text-slate-500">
                  <span>Endpoints: 12 open</span>
                  <span className="text-emerald-400">Response: SECURED</span>
                </div>
              </div>

              {/* Node 6: Feedback Loop */}
              <div 
                onClick={() => {
                  setActiveLayer("feedback");
                  addLog("INSPECTOR", "Exploring layer: Feedback Loop & Continuous Model Retraining", "info");
                }}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  activeLayer === "feedback"
                    ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.05)] text-white"
                    : "bg-[#050814]/40 border-slate-805 hover:border-slate-700 text-slate-350"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <RefreshCw className={`w-4 h-4 ${activeLayer === "feedback" ? "text-amber-400" : "text-slate-400"}`} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">6. Feedback Loop</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 mb-1">Loan Updates & Retrain</h4>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  Repayment metrics update the score instantly, continuously retraining the model based on true histories.
                </p>
                <div className="mt-3 flex items-center justify-between text-[9px] font-mono border-t border-slate-850 pt-2 text-slate-500">
                  <span>Sync Interval: Hourly</span>
                  <span className="text-[#38bdf8]">Automatic</span>
                </div>
              </div>

            </div>

            {/* Selected Layer Comprehensive Technical breakdown */}
            <div className="bg-[#050814] border border-slate-805 rounded-xl p-5 mb-6">
              
              {activeLayer === "sources" && (
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-amber-400 tracking-wider font-mono uppercase flex items-center justify-between">
                    <span>Target Layer: Partner Inbound Data sources</span>
                    <span className="text-[9px] text-slate-500">REST APIs / Sockets</span>
                  </h4>
                  <p className="text-[11.5px] leading-relaxed text-slate-300">
                    Our inbound ingestion engines gather continuous real-time ledger histories across multiple channels:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                    <div className="border border-slate-850 bg-slate-950 p-3 rounded-lg">
                      <h5 className="font-bold text-white text-[11px] mb-1">Mobile Money Pools</h5>
                      <span className="text-[10px] text-slate-400 leading-normal block">
                        Gathers MT-Money logs directly inside transactional nodes (MTN Rwanda, Airtel Money, Safaricom M-Pesa metrics).
                      </span>
                    </div>
                    <div className="border border-slate-850 bg-slate-950 p-3 rounded-lg">
                      <h5 className="font-bold text-white text-[11px] mb-1">Utility & Rent Inbound</h5>
                      <span className="text-[10px] text-slate-400 leading-normal block">
                        Landlord and municipal utility accounts feedback scheduled parameters regarding tenant credit worthiness.
                      </span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-850 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[10px] font-mono text-slate-450">Simulate incoming transactional payloads on the pipeline:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => simulateIngestion("MTN Mobile Money")}
                        disabled={isSimulatingPipe}
                        className="text-[10px] font-bold px-3 py-1.5 bg-slate-900 border border-slate-800 hover:text-white rounded-lg cursor-pointer hover:bg-slate-805 disabled:opacity-50 transition-colors"
                      >
                        ⚡ MTN Money Sync
                      </button>
                      <button
                        onClick={() => simulateIngestion("Utility Bills")}
                        disabled={isSimulatingPipe}
                        className="text-[10px] font-bold px-3 py-1.5 bg-slate-900 border border-slate-800 hover:text-white rounded-lg cursor-pointer hover:bg-slate-805 disabled:opacity-50 transition-colors"
                      >
                        ⚡ Electricity Inbound
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeLayer === "ingest" && (
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-amber-400 tracking-wider font-mono uppercase flex items-center justify-between">
                    <span>Target Layer: Ingestion ETL Pipeline & Consent Gateway</span>
                    <span className="text-[9px] text-slate-500">JSON schema val</span>
                  </h4>
                  <p className="text-[11.5px] leading-relaxed text-slate-300">
                    Filters, parses, and converts inbound feeds. To preserve absolute privacy, the system strictly checks client data-sharing consent signatures before loading records.
                  </p>
                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold font-mono text-slate-450 uppercase">Unified Payload Schema Register</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <pre className="text-[9.5px] font-mono text-slate-300 bg-[#020617]/55 p-3.5 rounded border border-slate-850 overflow-x-auto leading-relaxed max-h-36 scrollbar-thin">
                      {currentSamplePayload}
                    </pre>
                  </div>
                </div>
              )}

              {activeLayer === "processing" && (
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-amber-400 tracking-wider font-mono uppercase flex items-center justify-between">
                    <span>Target Layer: Normalization & Fraud Anomaly Neural Core</span>
                    <span className="text-[9px] text-slate-500">Inference node</span>
                  </h4>
                  <p className="text-[11.5px] leading-relaxed text-slate-300">
                    Raw entries are standardized across dynamic intervals. Our localized scoring engine applies risk values while checking transaction velocity to eliminate duplicate balances or artificial inflation.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 text-center">
                      <span className="block text-[8px] text-slate-500 uppercase font-mono font-bold">Timeliness Weight</span>
                      <strong className="text-lg text-white font-mono block mt-1">35%</strong>
                      <span className="text-[9px] text-slate-450">Mobile money deposit patterns</span>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 text-center">
                      <span className="block text-[8px] text-slate-500 uppercase font-mono font-bold">Savings Consistency</span>
                      <strong className="text-lg text-white font-mono block mt-1">25%</strong>
                      <span className="text-[9px] text-slate-450">SACCO logs track</span>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-850 text-center">
                      <span className="block text-[8px] text-slate-500 uppercase font-mono font-bold">Fraud Anomaly Limit</span>
                      <strong className="text-lg text-emerald-400 font-mono block mt-1">&lt; 0.15</strong>
                      <span className="text-[9px] text-slate-450">Z-score filter threshold</span>
                    </div>
                  </div>
                </div>
              )}

              {activeLayer === "storage" && (
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-amber-400 tracking-wider font-mono uppercase flex items-center justify-between">
                    <span>Target Layer: PostgreSQL databases & cryptographic blockchain ledger</span>
                    <span className="text-[9px] text-slate-500">Immutability ledger</span>
                  </h4>
                  <p className="text-[11.5px] leading-relaxed text-slate-300">
                    Uses multi-model partitioning. Fast, relational structures store operational profiles, while our secure blockchain ledger maintains transaction cryptographic logs to prevent post-signature score adjustments.
                  </p>
                  <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-lg flex items-center gap-3">
                    <Lock className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <h5 className="font-bold text-white text-[11px]">Secure SHA-256 Block Chaining</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Each change compiles an encrypted hash referencing previous system states. Banks can verify public keys instantly without inspecting raw client telemetry.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeLayer === "app" && (
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-amber-400 tracking-wider font-mono uppercase flex items-center justify-between">
                    <span>Target Layer: MFI Secure API Gateways & AI Advisor Coaching Node</span>
                    <span className="text-[9px] text-slate-400">Rest API / OAuth v2</span>
                  </h4>
                  <p className="text-[11.5px] leading-relaxed text-slate-300">
                    Provides direct interface portals for partner banks. Our matching systems process scores via secure API gateways to disburse funds in under an hour.
                  </p>
                  <div className="border border-slate-850 bg-slate-950 p-3.5 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-amber-400 font-bold uppercase">Dynamic matching rates</span>
                      <span className="block text-[11px] text-slate-300 font-semibold mt-0.5">Average approval lag: 1.8 seconds</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase font-mono">Verified SDK client</span>
                  </div>
                </div>
              )}

              {activeLayer === "feedback" && (
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-amber-400 tracking-wider font-mono uppercase flex items-center justify-between">
                    <span>Target Layer: Multi-signature Feedback parameters</span>
                    <span className="text-[9px] text-slate-500">Autonomous loop</span>
                  </h4>
                  <p className="text-[11.5px] leading-relaxed text-slate-300">
                    Ensures an adaptive credit ecosystem. When borrowers settle loans with MFIs, successful repayment profiles feed returning data vectors back to the scoring engine, improving the user's score and refining the global model's prediction values.
                  </p>
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center gap-3">
                    <TrendingUp className="text-emerald-400 w-5 h-5 shrink-0" />
                    <span className="text-[10px] text-slate-400 leading-normal">
                      Borrower repayment success matches are fed back instantly to update local rating clusters, forming a positive economic cycle.
                    </span>
                  </div>
                </div>
              )}

            </div>

          </div>

          <div className="pt-4 border-t border-slate-850 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-950/20 -mx-6 -mb-6 p-5 rounded-b-2xl">
            <div className="flex items-center gap-2.5">
              <Shield className="text-emerald-400 w-5 h-4" />
              <span className="text-[10.5px] text-slate-400">
                You are currently exploring live system telemetry logs in the right panel. Use interactive simulators to monitor pipeline executions.
              </span>
            </div>
            <button
              onClick={() => {
                simulateIngestion("Cooperative Ledger upload");
              }}
              disabled={isSimulatingPipe}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-[10.5px] font-bold tracking-wider uppercase rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
            >
              Run Global Ingestion test
            </button>
          </div>
        </div>

        {/* Telemetry Log Terminal + Walkthrough Step Selector (Right side) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* Section A: User Journey walkthrough step panel */}
          <div className="bg-[#020617] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2.5">
                <UserCheck className="text-amber-500 w-4 h-4" />
                <h3 className="font-display font-display font-semibold text-xs text-slate-200 uppercase tracking-wider">
                  Workflow: User Journey Steps
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                Click a step to simulate the system actions at that stage:
              </p>

              <div className="space-y-2.5">
                {[
                  { title: "1. Onboarding Register", desc: "User registers via mobile app or USSD/SMS portal", step: 0 },
                  { title: "2. Data Ingest Inbound", desc: "APIs extract transaction, utility & SACCO inputs", step: 1 },
                  { title: "3. Score Generation", desc: "Normalization Engine computes score & anomaly limits", step: 2 },
                  { title: "4. User Dashboard Visuals", desc: "Displays credit ranking, badges, and history", step: 3 },
                  { title: "5. MFI API Integration", desc: "Suggested lenders query scores dynamically", step: 4 },
                  { title: "6. Regional Expansion", desc: "Cross-border currencies mapped to Forex hedge tools", step: 5 }
                ].map((item) => {
                  const isActive = activeJourneyStep === item.step;
                  return (
                    <button
                      key={item.step}
                      onClick={() => runJourneySimulationStep(item.step)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer block ${
                        isActive 
                          ? "bg-amber-500/10 border-amber-500/60 text-white font-medium" 
                          : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-bold ${isActive ? "text-amber-400" : "text-slate-350"}`}>
                          {item.title}
                        </span>
                        {isActive && <CheckSquare className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[10px] text-slate-450 leading-relaxed">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section B: Scrolling Log console */}
          <div className="bg-slate-950 text-slate-300 border border-slate-850 rounded-2xl p-5 shadow-2xl flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3.5">
              <div className="flex items-center gap-2">
                <Terminal className="text-amber-500 w-4 h-4 animate-pulse" />
                <h3 className="font-mono text-xs font-bold text-slate-200 uppercase tracking-widest">
                  Terminal Telemetry Monitor
                </h3>
              </div>
              <button
                onClick={() => setLogs([
                  { id: "cl-1", timestamp: "07:07:00 UTC", module: "SYSTEM", message: "Telemetry panel manually synchronized and cleaned", type: "info" }
                ])}
                className="text-[9px] font-mono hover:text-white transition-colors uppercase font-bold text-slate-500 cursor-pointer"
              >
                Clear terminal
              </button>
            </div>

            {/* Scroll view of the telemetry logs */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-[9.5px] leading-relaxed scrollbar-thin">
              {logs.map((log) => {
                const badgeColor = log.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : log.type === "error" 
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                  : log.type === "warning"
                  ? "bg-amber-500/10 text-amber-400 border-amber-505/20"
                  : "bg-slate-900 border-slate-800 text-slate-400";
                  
                return (
                  <div key={log.id} className="border-b border-slate-900 pb-2 flex flex-col gap-1 hover:bg-slate-900/20">
                    <div className="flex items-center justify-between text-[8px] text-slate-550">
                      <span className="font-bold text-slate-500">{log.timestamp}</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold border ${badgeColor}`}>
                        [{log.module}]
                      </span>
                    </div>
                    <p className="text-slate-300 pr-1 select-all">{log.message}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-900 pt-3 mt-3 flex items-center justify-between text-[8.5px] font-mono text-slate-500">
              <span>STATUS: GREEN</span>
              <span>INBOUND COUNT: {logs.length}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
