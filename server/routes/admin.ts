import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../db/client";
import crypto from "crypto";

const router = Router();

// ── Admin auth middleware ──────────────────────────────────────────────────
// Expects header: X-Admin-Secret: <value of ADMIN_SECRET env var>
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

router.use(requireAdmin);

// ── GET /api/admin/stats ───────────────────────────────────────────────────
router.get("/stats", async (_req, res) => {
  const [totalUsers, totalLogs, totalEndorsements, lenderCount, scoreRows] = await Promise.all([
    prisma.user.count(),
    prisma.auditLog.count(),
    prisma.endorsement.count(),
    prisma.lenderToken.count({ where: { isActive: true } }),
    prisma.scoreHistory.findMany({ orderBy: { computedAt: "desc" }, take: 1000, select: { score: true, tier: true } }),
  ]);

  const tierCounts = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
  let scoreSum = 0;
  for (const r of scoreRows) {
    tierCounts[r.tier as keyof typeof tierCounts] = (tierCounts[r.tier as keyof typeof tierCounts] || 0) + 1;
    scoreSum += r.score;
  }
  const avgScore = scoreRows.length ? Math.round(scoreSum / scoreRows.length) : 0;

  res.json({ totalUsers, totalLogs, totalEndorsements, lenderCount, avgScore, tierCounts });
});

// ── GET /api/admin/users ───────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const search = (req.query.search as string) || "";

  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { phone: { contains: search } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        scoreFactors: true,
        scoreHistory: { orderBy: { computedAt: "desc" }, take: 1, select: { score: true, tier: true, computedAt: true } },
        endorsements: { where: { status: "Active" }, select: { id: true } },
        _count: { select: { auditLogs: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      occupation: u.occupation,
      cooperative: u.cooperative,
      language: u.language,
      createdAt: u.createdAt,
      latestScore: u.scoreHistory[0]?.score ?? null,
      latestTier: u.scoreHistory[0]?.tier ?? null,
      lastScoredAt: u.scoreHistory[0]?.computedAt ?? null,
      activeEndorsements: u.endorsements.length,
      auditLogCount: u._count.auditLogs,
      factors: u.scoreFactors
        ? { momo: u.scoreFactors.momoValue, savings: u.scoreFactors.savingsValue, utility: u.scoreFactors.utilityValue }
        : null,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// ── GET /api/admin/audit-logs ──────────────────────────────────────────────
router.get("/audit-logs", async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 30;
  const userId = req.query.userId as string | undefined;

  const where = userId ? { userId } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, phone: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ logs, total, page, pages: Math.ceil(total / limit) });
});

// ── GET /api/admin/endorsements ────────────────────────────────────────────
router.get("/endorsements", async (req, res) => {
  const status = req.query.status as string | undefined;
  const where = status ? { status } : {};
  const endorsements = await prisma.endorsement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, phone: true } } },
  });
  res.json({ endorsements });
});

// ── PUT /api/admin/endorsements/:id ───────────────────────────────────────
router.put("/endorsements/:id", async (req, res) => {
  const { status } = req.body;
  if (!["Active", "Pending", "Rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const updated = await prisma.endorsement.update({ where: { id: req.params.id }, data: { status } });
  res.json({ success: true, endorsement: updated });
});

// ── GET /api/admin/lender-tokens ──────────────────────────────────────────
router.get("/lender-tokens", async (_req, res) => {
  const tokens = await prisma.lenderToken.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ tokens });
});

// ── POST /api/admin/lender-tokens ─────────────────────────────────────────
router.post("/lender-tokens", async (req, res) => {
  const { lenderName } = req.body;
  if (!lenderName?.trim()) return res.status(400).json({ error: "lenderName required" });
  const token = `ltkn_${crypto.randomBytes(24).toString("hex")}`;
  const created = await prisma.lenderToken.create({ data: { lenderName: lenderName.trim(), token } });
  res.json({ success: true, token: created });
});

// ── PATCH /api/admin/lender-tokens/:id ────────────────────────────────────
router.patch("/lender-tokens/:id", async (req, res) => {
  const { isActive } = req.body;
  const updated = await prisma.lenderToken.update({
    where: { id: req.params.id },
    data: { isActive: Boolean(isActive) },
  });
  res.json({ success: true, token: updated });
});

// ── DELETE /api/admin/lender-tokens/:id ───────────────────────────────────
router.delete("/lender-tokens/:id", async (req, res) => {
  await prisma.lenderToken.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
