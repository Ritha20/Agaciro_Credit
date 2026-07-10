import React, { useState, useEffect } from "react";
import {
  User,
  Smartphone,
  CheckCircle,
  Unlink,
  Link,
  ShieldCheck,
  Activity,
  ArrowRight,
  Info,
  Lock,
  Wallet,
  Building,
  KeyRound,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface OnboardingAndUssdProps {
  score: number;
  lang: "en" | "rw" | "sw";
  onAddScorePoints: (pts: number, reason: string) => void;
  onModifyFactor: (id: string, value: number) => void;
  factors: Array<{ id: string; name: string; value: number }>;
  onMineBlock: (action: string, finalScore: number) => void;
  userProfile: {
    name: string;
    phone: string;
    occupation: string;
    cooperative: string;
    isConsented: boolean;
    isRegistered: boolean;
  };
}

interface LinkedAccount {
  id: string;
  name: string;
  type: "MoMo" | "Bank";
  provider: string;
  accountNo: string;
  status: "unlinked" | "pending" | "linked";
  balance: string;
}

export default function OnboardingAndUssd({
  score,
  lang,
  onAddScorePoints,
  onModifyFactor,
  factors,
  onMineBlock,
  userProfile: profile
}: OnboardingAndUssdProps) {
  // Localization helper
  const getContent = () => {
    switch (lang) {
      case "rw":
        return {
          title: "Kwinjira & Guhuza Imari",
          tagline: "Saba konti nshya, huza mobile money, kandi ukoreshe kode ya USSD ya koperative yawe hano.",
          profileTitle: "Umwirondoro w'Umukoresha",
          profileDesc: "Iyandikishe cyangwa winjire ngo utangire isuzuma ry'icyizere.",
          consentTitle: "Ubwumvikane bwo Gusangira Amakuru (Data Consent)",
          consentLabel: "Njemye ku mugaragaro ko amakuru y'imari yanjye akurwa kuri mobile money na SACCO asangirwa na Agaciro Assessment.",
          linkedTitle: "Guhuza Mobile Money na Banki",
          linkedDesc: "Huza konti zawe n'agaciro ngo n'amanota yawe yiyongere.",
          ussdTitle: "Kode ya USSD Simulator",
          ussdDesc: "Kanda nimero zikurikira cyangwa wandike kode ngo uhuze amakuru ukanze kuri terefone ya kera.",
          unregistered: "Ntabwo uriyandikisha. Nyamuneka yandikishe hasi.",
          btnRegister: "Iyandikishe nonaha",
          btnConsent: "Emeza uburenganzira",
          otpTitle: "Injiza Kode ya OTP yo Kwemeza",
          otpDesc: "Tugwohereje kode kuri terefone yawe ngo twemeze konti:",
          confirm: "Emeza",
          cancel: "Hagarika",
        };
      case "sw":
        return {
          title: "Sajili & Unganisha Pesa",
          tagline: "Jisajili, unganisha huduma za pesa za simu, na utumie kiigizo cha msimbo wa USSD hapa.",
          profileTitle: "Wasifu wa Mtumiaji",
          profileDesc: "Jisajili au ingia ili uanze ukaguzi wa mkopo wa Agaciro.",
          consentTitle: "Idhinisho la Kushiriki Data",
          consentLabel: "Ninakubali kwa hiari data yangu ya miamala ya simu na akiba za SACCO zitathminiwe kwa mfumo wa Agaciro.",
          linkedTitle: "Unganisha Pesa za Simu & Benki",
          linkedDesc: "Unganisha akaunti zako na kupata alama za ziada za mkopo.",
          ussdTitle: "Kipadi cha Msimbo wa USSD",
          ussdDesc: "Piga msimbo wa USSD kuingiza amana kwenda SACCO yako au kuangalia alama kupitia simu ya kitambo.",
          unregistered: "Bado haujasajiliwa. Tafadhali jisajili hapa chini.",
          btnRegister: "Jisajili Sasa",
          btnConsent: "Saini Kubali",
          otpTitle: "Ingiza Nambari ya OTP ya Usalama",
          otpDesc: "Tumeituma nambari ya siri kwenye simu yako ili kuidhinisha muunganisho:",
          confirm: "Thibitisha",
          cancel: "Ghairsi",
        };
      default:
        return {
          title: "Onboarding & Account Linker",
          tagline: "Create your profile, authorize transactional consent, link digital wallets, and simulate USSD core services.",
          profileTitle: "Profile Registration & Sign In",
          profileDesc: "Establish your sovereign identity ledger below or complete the consent mandates.",
          consentTitle: "Legal Data-Sharing Consent Directive",
          consentLabel: "I hereby authorize Agaciro Assessment to securely retrieve mobile wallet and cooperative contribution histories with partner bank institutions as cryptographic proofs.",
          linkedTitle: "Mobile Money & Banking Channels",
          linkedDesc: "Provide API authorizations to import transactional history parameters and accelerate credit rating.",
          ussdTitle: "Offline USSD Client Sandbox",
          ussdDesc: "Simulate mobile telecommunications dial lines (*182#, *150#, or *777#) to manage SACCO deposits and sync records instantly.",
          unregistered: "No sovereign profile detected. Please fill the onboard declaration.",
          btnRegister: "Create Secured Account Profile",
          btnConsent: "Digitally Sign Consent (Mined)",
          otpTitle: "Two-Factor SMS Verification",
          otpDesc: "A secure verification code has been dispatched to establish a secure ledger tunnel:",
          confirm: "Authenticate Token",
          cancel: "Cancel",
        };
    }
  };

  const textDict = getContent();

  // Link accounts list
  const [accounts, setAccounts] = useState<LinkedAccount[]>([
    { id: "acc-1", name: "MTN Mobile Money", type: "MoMo", provider: "MTN Rwanda", accountNo: "+250 788 459 210", status: "linked", balance: "145,500 RWF" },
    { id: "acc-2", name: "M-Pesa Wallet", type: "MoMo", provider: "Safaricom", accountNo: "+254 712 984 311", status: "unlinked", balance: "0 KES" },
    { id: "acc-3", name: "Bank of Kigali Portal", type: "Bank", provider: "BK Rwanda", accountNo: "BK-9812-4421-30", status: "unlinked", balance: "0 RWF" },
    { id: "acc-4", name: "Equity Bank account", type: "Bank", provider: "Equity Bank", accountNo: "EQ-1002-9844-12", status: "unlinked", balance: "0 RWF" },
  ]);

  // Auth Modal State for linking
  const [selectedAccId, setSelectedAccId] = useState<string | null>(null);
  const [linkingStep, setLinkingStep] = useState<"none" | "inputs" | "success">("none");
  const [tempAccountNo, setTempAccountNo] = useState("");

  // USSD Simulator States
  const [ussdOutputHistory, setUssdOutputHistory] = useState<string[]>([]);
  const [dialString, setDialString] = useState("");
  const [isDialed, setIsDialed] = useState(false);
  const [ussdScreenType, setUssdScreenType] = useState<"menu" | "input" | "success" | "none">("none");
  const [ussdCurrentMenu, setUssdCurrentMenu] = useState<string[]>([]);
  const [currentUssdCode, setCurrentUssdCode] = useState("");
  const [ussdStep, setUssdStep] = useState(0); // Navigation depth inside USSD
  const [ussdInputValue, setUssdInputValue] = useState("");
  const [ussdPromptText, setUssdPromptText] = useState("");

  // Trigger link account process
  const triggerLink = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    setSelectedAccId(id);
    setTempAccountNo(acc.accountNo || "");
    setLinkingStep("inputs");
  };

  const handleAccountNoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccounts(prev => prev.map(a => {
      if (a.id === selectedAccId) {
        return { ...a, status: "linked", accountNo: tempAccountNo, balance: a.provider.includes("BK") ? "480,000 RWF" : a.provider.includes("Safaricom") ? "12,400 KES" : "250,000 RWF" };
      }
      return a;
    }));
    setLinkingStep("success");
    
    // Add metrics weight to "momo" or "utility" factor in main score indicators
    if (selectedAccId === "acc-2") { // Safaricom M-pesa
      onModifyFactor("momo", Math.min(100, (factors.find(f => f.id === "momo")?.value || 75) + 15));
      onAddScorePoints(30, "M-Pesa verification synchronized");
      onMineBlock("ACCOUNT LINKED: SAFARICOM M-PESA COMPLETED", score + 30);
    } else if (selectedAccId === "acc-3") { // Bank of Kigali
      onModifyFactor("utility", Math.min(100, (factors.find(f => f.id === "utility")?.value || 65) + 10));
      onAddScorePoints(25, "Bank of Kigali sync completed");
      onMineBlock("ACCOUNT LINKED: BANK OF KIGALI ACCOUNT RETRIEVED", score + 25);
    } else if (selectedAccId === "acc-4") { // Equity
      onModifyFactor("utility", Math.min(100, (factors.find(f => f.id === "utility")?.value || 65) + 12));
      onAddScorePoints(25, "Equity Bank transactional stream linked");
      onMineBlock("ACCOUNT LINKED: EQUITY BANK ACCOUNT INTEGRATED", score + 25);
    }
  };

  const triggerUnlink = (id: string) => {
    setAccounts(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: "unlinked", balance: "0 RWF" };
      }
      return a;
    }));
    onMineBlock(`DIGITAL ACCOUNT UNLINKED BY OWNER: ${id}`, score - 20);
  };

  // USSD Simulator triggers
  const handleKeypadPress = (val: string) => {
    if (ussdScreenType !== "none") {
      // If ussd screen active and we are in an input state, append to active input
      if (ussdScreenType === "input") {
        setUssdInputValue(prev => prev + val);
      }
    } else {
      setDialString(prev => prev + val);
    }
  };

  const handleKeypadBackspace = () => {
    if (ussdScreenType === "input") {
      setUssdInputValue(prev => prev.slice(0, -1));
    } else if (ussdScreenType === "none") {
      setDialString(prev => prev.slice(0, -1));
    }
  };

  // Execute Dial
  const handleDialExecute = () => {
    const code = dialString.trim();
    if (!code) return;
    
    setCurrentUssdCode(code);
    setIsDialed(true);
    setUssdStep(0);
    setDialString("");
    setUssdInputValue("");

    if (code === "*182#") {
      // MTN MoMo Rwanda Simulation
      setUssdScreenType("menu");
      setUssdCurrentMenu([
        "MTN Mobile Money Menu:",
        "1) Check Credit Score Level",
        "2) Synchronize Data Consent Signature",
        "3) Pay Weekly SACCO Contribution",
        "4) Clear Pending Utility Invoices"
      ]);
    } else if (code === "*150#") {
      // M-Pesa Kenya Menu Simulation
      setUssdScreenType("menu");
      setUssdCurrentMenu([
        "Airtel / M-Pesa Inbound Portal:",
        "1) Link Mobile Account to Agaciro",
        "2) Check Anomaly Limits",
        "3) Query Micro-Lender Match status"
      ]);
    } else if (code === "*777#") {
      // Bank of Kigali / SACCO Portal Simulation
      setUssdScreenType("menu");
      setUssdCurrentMenu([
        "Nyarugenge Cooperative SACCO Portal:",
        "1) View Accumulated Safe Contributions",
        "2) Check Member Endorsement Status",
        "3) Transfer Weekly Share (3,000 RWF)"
      ]);
    } else {
      setUssdScreenType("menu");
      setUssdCurrentMenu([
        "Unknown Carrier protocol.",
        "Codes supported inside simulator:",
        "*182# (Rwanda MoMo Hub)",
        "*150# (M-Pesa Regional Channels)",
        "*777# (Coop SACCO Portal)"
      ]);
    }
  };

  // Handle USSD Option selections
  const handleUssdOptionSubmit = (choice: string) => {
    if (!choice.trim()) return;

    if (currentUssdCode === "*182#") {
      // MoMo
      if (ussdStep === 0) {
        if (choice === "1") {
          setUssdScreenType("menu");
          setUssdCurrentMenu([
            `Agaciro Credit Rating Bureau:`,
            `Your Active Score is: ${score} pts`,
            `Tier: ${score >= 850 ? "Platinum" : score >= 650 ? "Gold" : score >= 450 ? "Silver" : "Bronze"}`
          ]);
          setUssdStep(99); 
        } else if (choice === "2") {
          setUssdScreenType("menu");
          setUssdCurrentMenu([
            "Verifying sovereign profiles...",
            "Consensus: Signed & Cryptographically sealed.",
            "Agaciro Ledger ID: 0x82db...9a"
          ]);
          setUssdStep(99);
        } else if (choice === "3") {
          setUssdScreenType("input");
          setUssdPromptText("Enter SACCO Contribution Amount (RWF):");
          setUssdInputValue("");
          setUssdStep(13); // Contribution input flow
        } else if (choice === "4") {
          setUssdScreenType("menu");
          setUssdCurrentMenu([
            "Processing clearance tokens...",
            "Pending electricity & landlord meters: Cleared!",
            "Ecosystem Score updated successfully."
          ]);
          onModifyFactor("utility", 100);
          onAddScorePoints(35, "All municipal utility invoices resolved over off-line USSD client tunnel");
          setUssdStep(99);
        } else {
          setUssdScreenType("menu");
          setUssdCurrentMenu(["Invalid selection. Try again with 1-4."]);
        }
      } else if (ussdStep === 13) {
        // Amount entered
        const amt = parseInt(choice) || 5000;
        setUssdScreenType("input");
        setUssdPromptText(`Enter Mobile PIN to authorize ${amt.toLocaleString()} RWF deposit:`);
        setUssdInputValue("");
        setUssdStep(14); // PIN phase
      } else if (ussdStep === 14) {
        // Pin verified
        setUssdScreenType("menu");
        setUssdCurrentMenu([
          "Transaction pending network consensus...",
          "Deposit successfully compiled on ledger",
          "Contribution matched to Cooperative Savings factor!"
        ]);
        const savingsFactor = factors.find(f => f.id === "savings");
        if (savingsFactor) {
          onModifyFactor("savings", Math.min(100, savingsFactor.value + 15));
        }
        onAddScorePoints(30, "SACCO Deposit via offline USSD *182# verified");
        setUssdStep(99);
      }
    } 
    
    else if (currentUssdCode === "*150#") {
      // Airtel / M-Pesa
      if (ussdStep === 0) {
        if (choice === "1") {
          // Link
          setAccounts(prev => prev.map(a => a.id === "acc-2" ? { ...a, status: "linked", balance: "15,800 KES" } : a));
          onModifyFactor("momo", Math.min(100, (factors.find(f => f.id === "momo")?.value || 75) + 15));
          onAddScorePoints(30, "M-Pesa platform automated link over USSD.");
          setUssdScreenType("menu");
          setUssdCurrentMenu([
            "Authentication code matches.",
            "Account +254 712 984 311 safely synced.",
            "Consensus status: SECURED & ON"
          ]);
          setUssdStep(99);
        } else if (choice === "2") {
          setUssdScreenType("menu");
          setUssdCurrentMenu([
            "AI Fraud Anomaly Inspector status:",
            "Double-spend: Negative",
            "Artificially inflated velocity: Safe (0.012)"
          ]);
          setUssdStep(99);
        } else if (choice === "3") {
          setUssdScreenType("menu");
          setUssdCurrentMenu([
            "Lenders Active Matching queue:",
            "BK micro: 94% match (Interests: 8.5%)",
            "Equity Quick: 85% match (Interests: 9.0%)"
          ]);
          setUssdStep(99);
        } else {
          setUssdScreenType("menu");
          setUssdCurrentMenu(["Selection matches no gateway parameters."]);
        }
      }
    } 
    
    else if (currentUssdCode === "*777#") {
      // BK / SACCO
      if (ussdStep === 0) {
        if (choice === "1") {
          setUssdScreenType("menu");
          setUssdCurrentMenu([
            "Your Cooperative Savings Profile:",
            "Total Accumulated: 125,000 RWF",
            "Group validation multiplier: 1.2x",
            "Status: Active Member"
          ]);
          setUssdStep(99);
        } else if (choice === "2") {
          setUssdScreenType("menu");
          setUssdCurrentMenu([
            "Group Endorsements checklist status:",
            "1. Gasabo Moto Logistics: Signed",
            "2. Nyarugenge SACCO Manager: Gold Verified"
          ]);
          setUssdStep(99);
        } else if (choice === "3") {
          setUssdScreenType("menu");
          setUssdCurrentMenu([
            "Transferred 3,000 RWF to Koperative Pool.",
            "Consensus hash logged.",
            "Cooperative Savings Rate recalculated!"
          ]);
          const savingsFactor = factors.find(f => f.id === "savings");
          if (savingsFactor) {
            onModifyFactor("savings", Math.min(100, savingsFactor.value + 10));
          }
          onAddScorePoints(25, "Off-line USSD deposit contribution to cooperative SACCO pool");
          setUssdStep(99);
        } else {
          setUssdScreenType("menu");
          setUssdCurrentMenu(["Unknown Coop parameter selection."]);
        }
      }
    } else {
      setUssdScreenType("none");
      setIsDialed(false);
    }
    
    setUssdInputValue("");
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* Onboarding Overview info box */}
      <div className="bg-[#020617] border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row gap-5 items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              Sovereign Onboarding Tunnel
            </span>
            <h2 className="font-display font-black text-2xl text-white tracking-tight mt-3">
              {textDict.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {textDict.tagline}
            </p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center gap-3">
            <ShieldCheck className="text-emerald-400 w-8 h-8" />
            <div>
              <span className="block text-[8px] text-slate-500 font-mono font-bold uppercase">Consensus Key</span>
              <span className="block text-xs text-white font-mono font-bold">{profile.isRegistered ? "0x82db078ea26" : "Guest Sandbox"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Registration & Linking accounts */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section A: Clean Active Profile Proof */}
          <div className="bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3 mb-4">
              <User className="text-amber-500 w-5 h-5" />
              <h3 className="font-display font-bold text-base text-white">
                Active Peer Identity
              </h3>
            </div>

            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm font-display shadow-sm">
                  {profile.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    {profile.name}
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8.5px] font-bold">
                      Verified
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{profile.occupation} at <strong className="text-slate-300">{profile.cooperative}</strong></p>
                  <span className="text-[10px] text-slate-500 font-mono block">Mobile: {profile.phone}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-[9px] text-emerald-400 font-mono font-bold justify-center bg-emerald-500/5 py-1 px-2 rounded border border-emerald-500/10">
                🛡️ Consent Signed & Live
              </div>
            </div>
          </div>

          {/* Section B: Link Digital Wallets & Banks list */}
          <div className="bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3 mb-5">
              <Wallet className="text-[#10b981] w-5 h-5" />
              <h3 className="font-display font-bold text-base text-white">
                {textDict.linkedTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {textDict.linkedDesc}
            </p>

            {/* OTP Modals simulator inside layout */}
            {linkingStep !== "none" && (
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 mb-5 relative">
                
                {linkingStep === "inputs" && (
                  <form onSubmit={handleAccountNoSubmit} className="space-y-3.5">
                    <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">
                      🔒 Link {accounts.find(a => a.id === selectedAccId)?.name}
                    </h4>
                    <p className="text-[10.5px] text-slate-400">
                      Confirm your registered dial telephone or account number to import transaction metrics:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={tempAccountNo}
                        onChange={(e) => setTempAccountNo(e.target.value)}
                        placeholder="e.g. +250 788 459 210"
                        className="flex-1 text-xs p-2.5 bg-slate-900 border border-slate-800 text-slate-105 rounded-lg focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Link and Sync
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLinkingStep("none")}
                      className="text-[10px] text-slate-500 hover:text-slate-300 font-mono block mt-1"
                    >
                      [Cancel]
                    </button>
                  </form>
                )}

                {linkingStep === "success" && (
                  <div className="text-center space-y-2.5 py-2">
                    <CheckCircle className="text-emerald-400 w-8 h-8 mx-auto" />
                    <h4 className="text-xs font-bold text-[#10b981] uppercase tracking-widest">
                      Channel Synced Successfully!
                    </h4>
                    <p className="text-[10.5px] text-slate-400">
                      Your ledger transactions are imported securely. Your real-time credit metrics have adjusted.
                    </p>
                    <button
                      onClick={() => setLinkingStep("none")}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold rounded cursor-pointer transition-colors"
                    >
                      Return to list
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* Channels listing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {accounts.map((acc) => (
                <div key={acc.id} className="border border-slate-800 bg-slate-950/40 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-2.5 mb-3.5">
                    <div>
                      <span className="text-[9px] font-mono uppercase bg-slate-900 border border-slate-850 px-2 py-0.5 rounded font-bold text-slate-450 block w-max">
                        {acc.type} Provider
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1.5">{acc.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{acc.accountNo}</p>
                    </div>

                    {acc.status === "linked" ? (
                      <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Linked
                      </span>
                    ) : (
                      <span className="text-[8.5px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full uppercase">
                        Offline
                      </span>
                    )}
                  </div>

                  <div className="border-t border-slate-900 pt-3.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="block text-[8px] text-slate-550 uppercase font-mono tracking-wider">Indexed Balances</span>
                      <span className="block text-xs font-mono font-bold text-slate-300">{acc.balance}</span>
                    </div>

                    {acc.status === "linked" ? (
                      <button
                        onClick={() => triggerUnlink(acc.id)}
                        className="text-[9.5px] font-semibold text-rose-450 hover:text-rose-400 flex items-center gap-1 bg-rose-500/5 px-2 py-1 rounded hover:bg-rose-500/10 transition-colors border border-rose-500/10 cursor-pointer"
                      >
                        <Unlink className="w-3 h-3" /> Unlink wallet
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerLink(acc.id)}
                        className="text-[9.5px] font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded flex items-center gap-1 shadow-sm font-display transition-colors cursor-pointer"
                      >
                        <Link className="w-3 h-3" /> Link Profile
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Retro Mobile phone simulation running USSD Dial lines */}
        <div className="lg:col-span-5 bg-[#020617] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3 mb-5">
              <Smartphone className="text-amber-500 w-5 h-5" />
              <h3 className="font-display font-semibold text-xs text-slate-200 uppercase tracking-widest">
                {textDict.ussdTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              {textDict.ussdDesc}
            </p>

            {/* Mobile body wrap container */}
            <div className="max-w-[270px] mx-auto bg-slate-900 border-[7px] border-slate-950 rounded-[45px] p-4.5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[440px]">
              
              {/* Speaker / Ear piece detail */}
              <div className="w-14 h-1.5 bg-slate-950 rounded-full mx-auto mb-3"></div>

              {/* RETRO PHONE SCREEN FRAME */}
              <div className="bg-[#a3b899] text-slate-900 font-mono p-3 rounded-lg border-2 border-slate-700 min-h-[190px] flex flex-col justify-between">
                
                {/* Screen Header */}
                <div className="flex items-center justify-between text-[8px] font-bold border-b border-slate-800 pb-1 mb-1.5 opacity-80">
                  <span>📶 AGACIRO NET</span>
                  <span>10:43 UTC</span>
                </div>

                {/* Main Screen Body content */}
                <div className="flex-grow flex flex-col justify-between">
                  {ussdScreenType === "none" ? (
                    // Idle Screen state
                    <div className="text-center py-5">
                      <p className="text-[10px] font-bold">READY FOR DIAL</p>
                      <p className="text-[11px] font-black text-slate-800 mt-2 tracking-widest bg-yellow-500/10 border border-yellow-600/10 py-1 rounded select-all">
                        {dialString || "Dial a Code"}
                      </p>
                      <p className="text-[7.5px] leading-relaxed mt-4 text-slate-750 font-bold opacity-75">
                        Dial *182# for MoMo<br />Dial *150# for M-Pesa<br />Dial *777# for Coop
                      </p>
                    </div>
                  ) : (
                    // USSD Active dialogue screen
                    <div className="flex flex-col justify-between h-full space-y-1 bg-green-50/15 p-1 rounded">
                      
                      {ussdScreenType === "menu" ? (
                        <div className="space-y-1.5">
                          {ussdCurrentMenu.map((line, idx) => (
                            <p key={idx} className={`text-[8.5px] leading-tight font-bold ${idx === 0 ? "text-slate-950 border-b border-slate-700 pb-0.5" : "text-slate-900"}`}>
                              {line}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold leading-normal text-slate-950">
                            {ussdPromptText}
                          </p>
                          <p className="bg-[#94a98a] border border-slate-700 p-1 text-[11px] font-bold tracking-widest text-[#050814] rounded">
                            {ussdInputValue || " "}
                          </p>
                        </div>
                      )}

                      {/* Screen actions bar */}
                      <div className="border-t border-slate-700 pt-1.5 flex items-center justify-between text-[8px] font-bold">
                        {ussdStep !== 99 ? (
                          <>
                            <button 
                              onClick={() => {
                                setUssdScreenType("none");
                                setIsDialed(false);
                              }}
                              className="text-slate-950 uppercase cursor-pointer"
                            >
                              [Exit]
                            </button>
                            <span className="animate-pulse">● DIAL-IN</span>
                          </>
                        ) : (
                          <button 
                            onClick={() => {
                              setUssdScreenType("none");
                              setIsDialed(false);
                            }}
                            className="text-slate-950 uppercase text-center w-full block cursor-pointer"
                          >
                            [OK / Exit Menu]
                          </button>
                        )}
                      </div>

                    </div>
                  )}
                </div>

              </div>

              {/* Action keypad buttons to type inside USSD menu options */}
              {ussdScreenType === "input" && (
                <div className="bg-slate-950 rounded-lg p-2.5 my-2.5 border border-slate-850">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ussdInputValue}
                      onChange={(e) => setUssdInputValue(e.target.value)}
                      placeholder="Type choice and submit"
                      className="flex-1 text-xs p-1.5 bg-slate-900 border border-slate-800 text-white rounded font-mono"
                    />
                    <button
                      onClick={() => handleUssdOptionSubmit(ussdInputValue)}
                      className="px-2 py-1.5 bg-amber-500 text-slate-950 font-bold font-mono text-[9.5px] rounded cursor-pointer shrink-0"
                    >
                      SEND
                    </button>
                  </div>
                </div>
              )}

              {ussdScreenType === "menu" && ussdStep !== 99 && (
                <div className="bg-slate-950 rounded-lg p-2.5 my-2.5 border border-slate-850">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter menu option"
                      value={ussdInputValue}
                      onChange={(e) => setUssdInputValue(e.target.value)}
                      className="flex-1 text-xs p-1.5 bg-slate-900 border border-slate-800 text-white rounded font-mono"
                    />
                    <button
                      onClick={() => handleUssdOptionSubmit(ussdInputValue)}
                      className="px-3 py-1 bg-[#10b981] text-slate-950 font-bold font-mono text-[9.5px] rounded cursor-pointer shrink-0"
                    >
                      SEND
                    </button>
                  </div>
                </div>
              )}

              {/* PHYSICAL STYLE NUMERIC CONTROLLER KEYPAD */}
              <div className="grid grid-cols-3 gap-2.5 mt-3 px-1">
                {[
                  { label: "1", val: "1" },
                  { label: "2 ABC", val: "2" },
                  { label: "3 DEF", val: "3" },
                  { label: "4 GHI", val: "4" },
                  { label: "5 JKL", val: "5" },
                  { label: "6 MNO", val: "6" },
                  { label: "7 PQRS", val: "7" },
                  { label: "8 TUV", val: "8" },
                  { label: "9 WXYZ", val: "9" },
                  { label: "*", val: "*" },
                  { label: "0", val: "0" },
                  { label: "#", val: "#" },
                ].map((key) => (
                  <button
                    key={key.label}
                    onClick={() => handleKeypadPress(key.val)}
                    className="h-10 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors active:scale-95 shadow-sm border border-slate-950"
                  >
                    <span className="font-bold text-xs leading-none">{key.val}</span>
                    <span className="text-[7px] text-slate-500 font-bold uppercase mt-0.5 leading-none">{key.label.split(" ").slice(1).join("")}</span>
                  </button>
                ))}

                {/* Backspace & Main Green Dial Buttons */}
                <button
                  onClick={handleKeypadBackspace}
                  className="h-10 bg-slate-950 hover:bg-slate-900 border border-rose-500/10 text-rose-400 text-[10px] font-mono leading-none font-bold rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                >
                  Clear ⌫
                </button>
                <div className="placeholder"></div>
                <button
                  onClick={handleDialExecute}
                  className="h-10 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs uppercase rounded-lg flex items-center justify-center cursor-pointer shadow-md shadow-emerald-500/15 transition-all"
                >
                  Dial 📞
                </button>
              </div>

              {/* Bottom mic hole detail */}
              <div className="w-1.5 h-1.5 bg-slate-950 rounded-full mx-auto mt-4"></div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
