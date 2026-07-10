const BASE = "/api";

export const getToken = () => localStorage.getItem("agaciro_token");
export const setToken = (t: string) => localStorage.setItem("agaciro_token", t);
export const clearToken = () => localStorage.removeItem("agaciro_token");

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function checkPhone(phone: string) {
  const res = await fetch(`${BASE}/auth/check-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

export async function requestOtp(
  phone: string,
  name: string,
  occupation: string,
  cooperative: string,
  language = "en"
) {
  const res = await fetch(`${BASE}/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name, occupation, cooperative, language }),
  });
  return res.json();
}

export async function verifyOtp(phone: string, code: string) {
  const res = await fetch(`${BASE}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${BASE}/auth/me`, { headers: authHeaders() });
  return res.json();
}

export async function getScoreSummary() {
  const res = await fetch(`${BASE}/score/summary`, { headers: authHeaders() });
  return res.json();
}

export async function updateFactors(
  momoValue: number,
  savingsValue: number,
  utilityValue: number
) {
  const res = await fetch(`${BASE}/score/factors`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ momoValue, savingsValue, utilityValue }),
  });
  return res.json();
}

export async function getEndorsements() {
  const res = await fetch(`${BASE}/endorsements`, { headers: authHeaders() });
  return res.json();
}

export async function createEndorsement(
  voucherName: string,
  voucherRole: string,
  cooperative: string
) {
  const res = await fetch(`${BASE}/endorsements`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ voucherName, voucherRole, cooperative }),
  });
  return res.json();
}

export async function approveEndorsement(id: string) {
  const res = await fetch(`${BASE}/endorsements/${id}/approve`, {
    method: "PUT",
    headers: authHeaders(),
  });
  return res.json();
}

export async function callCoach(message: string, history: { role: string; content: string }[], language: string) {
  const res = await fetch("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ message, history, language }),
  });
  return res.json();
}

export async function getLoans() {
  const res = await fetch("/api/match-loans", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({}),
  });
  return res.json();
}

export async function computeScore(reason?: string) {
  const res = await fetch(`${BASE}/score/compute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

export async function syncMomo() {
  const res = await fetch(`${BASE}/momo/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  return res.json();
}

export async function applyForLoan(data: {
  lenderName: string;
  amount: number;
  purpose: string;
  duration: string;
  scoreAtTime: number;
  tierAtTime: string;
}) {
  const res = await fetch(`${BASE}/loans/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getMomoStatus() {
  const res = await fetch(`${BASE}/momo/status`, { headers: authHeaders() });
  return res.json();
}
