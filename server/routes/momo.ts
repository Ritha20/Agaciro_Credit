import { Router } from "express";
import { prisma } from "../db/client";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { validateMoMoAccount, getMoMoBalance, balanceToScore } from "../services/momo";

const router = Router();

router.use(requireAuth);

// POST /api/momo/sync
// Validates the user's phone on MTN MoMo, reads balance, updates momoValue in scoreFactor
router.post("/sync", async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "User not found" });

  // 1. Validate MoMo account for this phone number
  const validation = await validateMoMoAccount(user.phone);

  // 2. Get sandbox balance
  const balance = await getMoMoBalance();

  let momoScore = 0;
  let balanceAmount = 0;
  let currency = "RWF";

  if (balance) {
    balanceAmount = balance.amount;
    currency = balance.currency;
    momoScore = balanceToScore(balanceAmount, currency);
  } else if (validation.valid) {
    momoScore = 30; // Account exists but balance unavailable
  }

  // 3. Update or create scoreFactor row
  const existing = await prisma.scoreFactor.findUnique({ where: { userId } });
  if (existing) {
    await prisma.scoreFactor.update({
      where: { userId },
      data: { momoValue: momoScore, momoSyncedAt: new Date() },
    });
  } else {
    await prisma.scoreFactor.create({
      data: {
        userId,
        momoValue: momoScore,
        savingsValue: 0,
        utilityValue: 0,
        momoSyncedAt: new Date(),
      },
    });
  }

  // 4. Recompute and store new score
  const factors = await prisma.scoreFactor.findUnique({ where: { userId } });
  if (factors) {
    const weighted =
      (factors.momoValue / 100) * 0.35 * 500 +
      (factors.savingsValue / 100) * 0.25 * 500 +
      (factors.utilityValue / 100) * 0.20 * 500;
    const activeEndorsements = await prisma.endorsement.count({
      where: { userId, status: "Active" },
    });
    const score = Math.round(300 + weighted + Math.min(200, activeEndorsements * 50));
    const tier =
      score >= 850 ? "Platinum" : score >= 650 ? "Gold" : score >= 450 ? "Silver" : "Bronze";

    await prisma.scoreHistory.create({
      data: { userId, score, tier, reason: "momo_sync" },
    });
    await prisma.auditLog.create({
      data: {
        userId,
        action: "MOMO_SYNC",
        scoreBefore: 0,
        scoreAfter: score,
        source: "mtn_momo_sandbox",
        metadata: { momoScore, balance: balanceAmount, currency, accountValid: validation.valid },
      },
    });
  }

  res.json({
    success: true,
    momoScore,
    accountValid: validation.valid,
    accountName: validation.name || null,
    balance: balance ? { amount: balanceAmount, currency } : null,
    message: validation.valid
      ? `MoMo account verified. Score updated to ${momoScore}/100.`
      : "MoMo account not found for this number. Score set to 0.",
  });
});

// GET /api/momo/status — check if MoMo is synced for this user
router.get("/status", async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const factors = await prisma.scoreFactor.findUnique({ where: { userId } });
  res.json({
    synced: !!(factors?.momoSyncedAt),
    momoScore: factors?.momoValue ?? 0,
    syncedAt: factors?.momoSyncedAt ?? null,
  });
});

export default router;
