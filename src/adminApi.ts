const ADMIN_SECRET_KEY = "agaciro_admin_secret";

export const getAdminSecret = () => localStorage.getItem(ADMIN_SECRET_KEY) || "";
export const setAdminSecret = (s: string) => localStorage.setItem(ADMIN_SECRET_KEY, s);
export const clearAdminSecret = () => localStorage.removeItem(ADMIN_SECRET_KEY);

function adminHeaders(): Record<string, string> {
  return { "X-Admin-Secret": getAdminSecret(), "Content-Type": "application/json" };
}

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(`/api/admin${path}`, { ...opts, headers: { ...adminHeaders(), ...(opts?.headers || {}) } });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  return res.json();
}

export const getStats = () => api("/stats");
export const getUsers = (page = 1, search = "") => api(`/users?page=${page}&search=${encodeURIComponent(search)}`);
export const getAuditLogs = (page = 1, userId?: string) => api(`/audit-logs?page=${page}${userId ? `&userId=${userId}` : ""}`);
export const getEndorsements = (status?: string) => api(`/endorsements${status ? `?status=${status}` : ""}`);
export const setEndorsementStatus = (id: string, status: string) => api(`/endorsements/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
export const getLenderTokens = () => api("/lender-tokens");
export const createLenderToken = (lenderName: string) => api("/lender-tokens", { method: "POST", body: JSON.stringify({ lenderName }) });
export const toggleLenderToken = (id: string, isActive: boolean) => api(`/lender-tokens/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) });
export const deleteLenderToken = (id: string) => api(`/lender-tokens/${id}`, { method: "DELETE" });
