import React, { useState, useEffect, useCallback } from "react";
import {
  Users, FileText, ShieldCheck, Key, RefreshCw, LogOut,
  PlusCircle, Trash2, ToggleLeft, ToggleRight, Search, Copy,
  TrendingUp, Activity, Award, ChevronLeft, ChevronRight, CheckCircle, XCircle,
} from "lucide-react";
import EcosystemMap from "./EcosystemMap";
import * as adminApi from "../adminApi";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Stats { totalUsers: number; totalLogs: number; totalEndorsements: number; lenderCount: number; avgScore: number; tierCounts: Record<string, number>; }
interface AdminUser { id: string; name: string; phone: string; occupation: string; cooperative: string; language: string; createdAt: string; latestScore: number | null; latestTier: string | null; lastScoredAt: string | null; activeEndorsements: number; auditLogCount: number; factors: { momo: number; savings: number; utility: number } | null; }
interface AuditLog { id: string; action: string; scoreBefore: number; scoreAfter: number; source: string; metadata: any; createdAt: string; user: { name: string; phone: string }; }
interface Endorsement { id: string; voucherName: string; voucherRole: string; cooperative: string; status: string; createdAt: string; user: { name: string; phone: string }; }
interface LenderToken { id: string; lenderName: string; token: string; isActive: boolean; queryCount: number; createdAt: string; lastUsedAt: string | null; }

type AdminTab = "overview" | "users" | "audit" | "endorsements" | "lenders" | "system";

// ─── Tier badge helper ────────────────────────────────────────────────────────
const TierBadge = ({ tier }: { tier: string | null }) => {
  if (!tier) return <span className="text-slate-500 text-[9px]">—</span>;
  const cls = tier === "Platinum" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : tier === "Gold" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    : tier === "Silver" ? "text-slate-300 bg-slate-800 border-slate-700"
    : "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${cls}`}>{tier}</span>;
};

// ─── Stat tile ────────────────────────────────────────────────────────────────
const StatTile = ({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) => (
  <div className="bg-[#020617] border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</p>
      <p className="text-2xl font-extrabold text-white font-display mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPanel({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [authed, setAuthed] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userPages, setUserPages] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPages, setAuditPages] = useState(1);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [endFilter, setEndFilter] = useState("");
  const [lenderTokens, setLenderTokens] = useState<LenderToken[]>([]);
  const [newLenderName, setNewLenderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    adminApi.setAdminSecret(secretInput);
    try {
      const data = await adminApi.getStats();
      if (data.error) { setLoginError("Wrong secret key."); adminApi.clearAdminSecret(); return; }
      setStats(data);
      setAuthed(true);
    } catch { setLoginError("Could not reach server."); adminApi.clearAdminSecret(); }
  };

  const loadStats = useCallback(async () => {
    const data = await adminApi.getStats();
    setStats(data);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(userPage, userSearch);
      setUsers(data.users); setUserTotal(data.total); setUserPages(data.pages);
    } finally { setLoading(false); }
  }, [userPage, userSearch]);

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs(auditPage);
      setAuditLogs(data.logs); setAuditTotal(data.total); setAuditPages(data.pages);
    } finally { setLoading(false); }
  }, [auditPage]);

  const loadEndorsements = useCallback(async () => {
    const data = await adminApi.getEndorsements(endFilter || undefined);
    setEndorsements(data.endorsements);
  }, [endFilter]);

  const loadLenderTokens = useCallback(async () => {
    const data = await adminApi.getLenderTokens();
    setLenderTokens(data.tokens);
  }, []);

  useEffect(() => { if (!authed) return; if (tab === "overview") loadStats(); if (tab === "users") loadUsers(); if (tab === "audit") loadAuditLogs(); if (tab === "endorsements") loadEndorsements(); if (tab === "lenders") loadLenderTokens(); }, [tab, authed]);
  useEffect(() => { if (authed && tab === "users") loadUsers(); }, [userPage, userSearch]);
  useEffect(() => { if (authed && tab === "audit") loadAuditLogs(); }, [auditPage]);
  useEffect(() => { if (authed && tab === "endorsements") loadEndorsements(); }, [endFilter]);

  const createToken = async () => {
    if (!newLenderName.trim()) return;
    await adminApi.createLenderToken(newLenderName.trim());
    setNewLenderName(""); loadLenderTokens(); showToast("Token created");
  };

  const toggleToken = async (id: string, current: boolean) => {
    await adminApi.toggleLenderToken(id, !current); loadLenderTokens();
  };

  const deleteToken = async (id: string) => {
    if (!confirm("Delete this lender token? This cannot be undone.")) return;
    await adminApi.deleteLenderToken(id); loadLenderTokens(); showToast("Token deleted");
  };

  const setEndStatus = async (id: string, status: string) => {
    await adminApi.setEndorsementStatus(id, status); loadEndorsements(); showToast(`Endorsement ${status}`);
  };

  const copyToken = (token: string) => { navigator.clipboard.writeText(token); showToast("Copied to clipboard"); };

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#020617] border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-rose-400" />
            </div>
            <h1 className="font-display font-extrabold text-xl text-white">Agaciro Admin</h1>
            <p className="text-xs text-slate-400 mt-1">Enter the admin secret key to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{loginError}</p>}
            <input
              type="password"
              value={secretInput}
              onChange={e => setSecretInput(e.target.value)}
              placeholder="Admin secret key"
              required
              autoFocus
              className="w-full text-xs p-3 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-rose-500 focus:outline-none"
            />
            <button type="submit" className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase rounded-xl cursor-pointer transition-colors">
              Access Admin Panel →
            </button>
          </form>
          <button onClick={onExit} className="mt-4 w-full text-center text-xs text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
            ← Back to app
          </button>
        </div>
      </div>
    );
  }

  const navTabs: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "users", label: "Users", icon: Users },
    { key: "audit", label: "Audit Logs", icon: FileText },
    { key: "endorsements", label: "Endorsements", icon: Award },
    { key: "lenders", label: "Lender Tokens", icon: Key },
    { key: "system", label: "System Map", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-2 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-[#020617] border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-sm text-white tracking-tight">Agaciro Admin</h1>
            <p className="text-[9px] text-slate-500 font-mono">Control Panel · Restricted Access</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {stats && <span className="text-[10px] text-slate-400 font-mono hidden sm:block">{stats.totalUsers} users · {stats.avgScore} avg score</span>}
          <button
            onClick={() => { adminApi.clearAdminSecret(); setAuthed(false); }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 text-xs text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer hover:bg-amber-500/10"
          >
            ← User App
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 border-r border-slate-800 min-h-[calc(100vh-57px)] bg-[#020617] pt-4 hidden md:block">
          <nav className="space-y-0.5 px-2">
            {navTabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  tab === key ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#020617] border-t border-slate-800 flex z-40">
          {navTabs.map(({ key, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)} className={`flex-1 py-3 flex items-center justify-center transition-colors cursor-pointer ${tab === key ? "text-rose-400" : "text-slate-500"}`}>
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 p-6 pb-20 md:pb-6 max-w-6xl">

          {/* ── OVERVIEW ── */}
          {tab === "overview" && stats && (
            <div className="space-y-6">
              <h2 className="text-lg font-extrabold text-white font-display">System Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile label="Total Users" value={stats.totalUsers} icon={Users} color="bg-amber-500/10 text-amber-400" />
                <StatTile label="Audit Events" value={stats.totalLogs} icon={FileText} color="bg-blue-500/10 text-blue-400" />
                <StatTile label="Endorsements" value={stats.totalEndorsements} icon={Award} color="bg-emerald-500/10 text-emerald-400" />
                <StatTile label="Avg Score" value={stats.avgScore} sub="across all users" icon={TrendingUp} color="bg-rose-500/10 text-rose-400" />
              </div>
              <div className="bg-[#020617] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Tier Distribution</h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { tier: "Platinum", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                    { tier: "Gold", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
                    { tier: "Silver", color: "text-slate-300 bg-slate-800 border-slate-700" },
                    { tier: "Bronze", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                  ].map(({ tier, color }) => (
                    <div key={tier} className={`rounded-xl border p-4 text-center ${color}`}>
                      <p className="text-2xl font-extrabold">{stats.tierCounts[tier] || 0}</p>
                      <p className="text-[10px] font-bold uppercase mt-1">{tier}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#020617] border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                <Key className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">{stats.lenderCount} Active Lender Token{stats.lenderCount !== 1 ? "s" : ""}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Banks and microfinance institutions querying the score API</p>
                </div>
                <button onClick={() => setTab("lenders")} className="ml-auto text-[10px] text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg hover:bg-amber-500/10 cursor-pointer transition-colors">
                  Manage →
                </button>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {tab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-white font-display">Users <span className="text-slate-500 text-sm font-normal">({userTotal})</span></h2>
                <button onClick={loadUsers} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={userSearch}
                  onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                  placeholder="Search by name or phone..."
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-[#020617] border border-slate-800 rounded-xl text-slate-100 focus:border-rose-500 focus:outline-none"
                />
              </div>
              {loading ? <p className="text-xs text-slate-500 py-4 text-center">Loading...</p> : (
                <div className="bg-[#020617] border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-left">
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Name / Phone</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase hidden sm:table-cell">Occupation</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Score / Tier</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase hidden md:table-cell">Factors</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Vouches</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase hidden lg:table-cell">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr key={u.id} className={`border-b border-slate-900 hover:bg-slate-900/40 transition-colors ${i % 2 === 0 ? "" : "bg-slate-950/20"}`}>
                          <td className="px-4 py-3">
                            <p className="font-bold text-white">{u.name}</p>
                            <p className="font-mono text-slate-400 text-[10px]">{u.phone}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{u.occupation}</td>
                          <td className="px-4 py-3">
                            <p className="font-mono font-bold text-amber-400">{u.latestScore ?? "—"}</p>
                            <TierBadge tier={u.latestTier} />
                          </td>
                          <td className="px-4 py-3 font-mono text-[10px] text-slate-400 hidden md:table-cell">
                            {u.factors
                              ? <span>M:{u.factors.momo} S:{u.factors.savings} U:{u.factors.utility}</span>
                              : <span className="text-slate-600">none</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${u.activeEndorsements > 0 ? "text-emerald-400" : "text-slate-600"}`}>
                              {u.activeEndorsements}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-[10px] hidden lg:table-cell">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No users found</td></tr>
                      )}
                    </tbody>
                  </table>
                  {userPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                      <span className="text-[10px] text-slate-400">Page {userPage} of {userPages}</span>
                      <div className="flex gap-2">
                        <button disabled={userPage === 1} onClick={() => setUserPage(p => p - 1)} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                        <button disabled={userPage === userPages} onClick={() => setUserPage(p => p + 1)} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── AUDIT LOGS ── */}
          {tab === "audit" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-white font-display">Audit Logs <span className="text-slate-500 text-sm font-normal">({auditTotal})</span></h2>
                <button onClick={loadAuditLogs} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              {loading ? <p className="text-xs text-slate-500 py-4 text-center">Loading...</p> : (
                <div className="space-y-2">
                  {auditLogs.map(log => (
                    <div key={log.id} className="bg-[#020617] border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.scoreAfter > log.scoreBefore ? "bg-emerald-500" : log.scoreAfter < log.scoreBefore ? "bg-rose-500" : "bg-slate-600"}`} />
                        <div>
                          <p className="font-mono font-bold text-[10px] text-white uppercase tracking-wider">{log.action}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{log.user.name} · <span className="font-mono">{log.user.phone}</span></p>
                          {log.metadata && <p className="text-[9px] text-slate-500 mt-0.5 font-mono">{JSON.stringify(log.metadata).slice(0, 80)}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] font-mono">
                            <span className="text-slate-500">{log.scoreBefore}</span>
                            <span className="text-slate-600 mx-1">→</span>
                            <span className={log.scoreAfter > log.scoreBefore ? "text-emerald-400 font-bold" : log.scoreAfter < log.scoreBefore ? "text-rose-400 font-bold" : "text-slate-300"}>{log.scoreAfter}</span>
                          </p>
                          <p className="text-[9px] text-slate-500 font-mono">{log.source}</p>
                        </div>
                        <p className="text-[9px] text-slate-500 font-mono">{new Date(log.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {auditLogs.length === 0 && <p className="text-xs text-slate-500 py-8 text-center">No audit logs yet</p>}
                  {auditPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] text-slate-400">Page {auditPage} of {auditPages}</span>
                      <div className="flex gap-2">
                        <button disabled={auditPage === 1} onClick={() => setAuditPage(p => p - 1)} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                        <button disabled={auditPage === auditPages} onClick={() => setAuditPage(p => p + 1)} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── ENDORSEMENTS ── */}
          {tab === "endorsements" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-white font-display">Endorsements</h2>
                <div className="flex gap-2">
                  {["", "Pending", "Active", "Rejected"].map(s => (
                    <button key={s} onClick={() => setEndFilter(s)}
                      className={`text-[10px] px-3 py-1 rounded-lg border font-bold cursor-pointer transition-colors ${endFilter === s ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "text-slate-400 border-slate-800 hover:border-slate-700"}`}>
                      {s || "All"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {endorsements.map(e => (
                  <div key={e.id} className="bg-[#020617] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-xs">{e.voucherName}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${e.status === "Active" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : e.status === "Rejected" ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>
                          {e.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{e.voucherRole} · {e.cooperative}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">For: <span className="text-slate-300">{e.user.name}</span> ({e.user.phone})</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {e.status !== "Active" && (
                        <button onClick={() => setEndStatus(e.id, "Active")} className="flex items-center gap-1 text-[10px] text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg hover:bg-emerald-500/10 cursor-pointer transition-colors">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                      )}
                      {e.status !== "Rejected" && (
                        <button onClick={() => setEndStatus(e.id, "Rejected")} className="flex items-center gap-1 text-[10px] text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-colors">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {endorsements.length === 0 && <p className="text-xs text-slate-500 py-8 text-center">No endorsements found</p>}
              </div>
            </div>
          )}

          {/* ── LENDER TOKENS ── */}
          {tab === "lenders" && (
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold text-white font-display">Lender API Tokens</h2>
              <div className="bg-[#020617] border border-slate-800 rounded-2xl p-4 flex gap-3">
                <input
                  value={newLenderName}
                  onChange={e => setNewLenderName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createToken()}
                  placeholder="Lender name (e.g. Urwego Microfinance)"
                  className="flex-1 text-xs p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:border-rose-500 focus:outline-none"
                />
                <button onClick={createToken} className="flex items-center gap-1.5 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 rounded-xl cursor-pointer transition-colors shrink-0">
                  <PlusCircle className="w-3.5 h-3.5" /> Issue Token
                </button>
              </div>
              <div className="space-y-3">
                {lenderTokens.map(t => (
                  <div key={t.id} className="bg-[#020617] border border-slate-800 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-white text-xs">{t.lenderName}</p>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${t.isActive ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-slate-500 bg-slate-800 border-slate-700"}`}>
                            {t.isActive ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate max-w-xs">
                            {t.token}
                          </code>
                          <button onClick={() => copyToken(t.token)} className="text-slate-500 hover:text-amber-400 cursor-pointer transition-colors shrink-0">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-500 font-mono mt-1.5">
                          {t.queryCount} queries · Created {new Date(t.createdAt).toLocaleDateString()}
                          {t.lastUsedAt && ` · Last used ${new Date(t.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleToken(t.id, t.isActive)} className="text-slate-400 hover:text-amber-400 cursor-pointer transition-colors" title={t.isActive ? "Disable" : "Enable"}>
                          {t.isActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => deleteToken(t.id)} className="text-slate-500 hover:text-rose-400 cursor-pointer transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {lenderTokens.length === 0 && <p className="text-xs text-slate-500 py-8 text-center">No lender tokens yet — issue one above</p>}
              </div>
            </div>
          )}

          {/* ── SYSTEM MAP ── */}
          {tab === "system" && (
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold text-white font-display">System Dataflow Map</h2>
              <EcosystemMap score={stats?.avgScore ?? 680} lang="en" />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
