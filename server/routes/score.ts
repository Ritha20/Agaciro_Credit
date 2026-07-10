import { Router } from "express";
import { prisma } from "../db/client";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// Scoring weights
const BASE_SCORE = 300;
const MAX_MOMO = 245;    // 35% of 700
const MAX_SAVINGS = 175; // 25% of 700
const MAX_UTILITY = 140; // 20% of 700
const MAX_ENDORSEMENT = 140; // 4 active endorsements × 35 pts each

function computeScore(
  momoValue: number,
  savingsValue: number,
  utilityValue: number,
  activeEndorsements: number
): number {
  const momo = (momoValue / 100) * MAX_MOMO;
  const savings = (savingsValue / 100) * MAX_SAVINGS;
  const utility = (utilityValue / 100) * MAX_UTILITY;
  const endorsement = Math.min(activeEndorsements * 35, MAX_ENDORSEMENT);
  return Math.round(BASE_SCORE + momo + savings + utility + endorsement);
}

function getTier(score: number): string {
  if (score >= 850) return "Platinum";
  if (score >= 650) return "Gold";
  if (score >= 450) return "Silver";
  return "Bronze";
}

// POST /api/score/compute
// Computes the score from current factors and saves a snapshot
router.post("/compute", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const [factors, endorsements, lastHistory] = await Promise.all([
      prisma.scoreFactor.findUnique({ where: { userId } }),
      prisma.endorsement.count({ where: { userId, status: "Active" } }),
      prisma.scoreHistory.findFirst({
        where: { userId },
        orderBy: { computedAt: "desc" },
      }),
    ]);

    const momoValue = factors?.momoValue ?? 0;
    const savingsValue = factors?.savingsValue ?? 0;
    const utilityValue = factors?.utilityValue ?? 0;

    const score = computeScore(momoValue, savingsValue, utilityValue, endorsements);
    const tier = getTier(score);
    const scoreBefore = lastHistory?.score ?? 0;

    const [history] = await Promise.all([
      prisma.scoreHistory.create({
        data: { userId, score, tier, reason: req.body.reason ?? "manual_compute" },
      }),
      prisma.auditLog.create({
        data: {
          userId,
          action: "SCORE_COMPUTED",
          scoreBefore,
          scoreAfter: score,
          source: "system",
          metadata: { momoValue, savingsValue, utilityValue, activeEndorsements: endorsements },
        },
      }),
    ]);

    res.json({
      score,
      tier,
      breakdown: {
        base: BASE_SCORE,
        momo: Math.round((momoValue / 100) * MAX_MOMO),
        savings: Math.round((savingsValue / 100) * MAX_SAVINGS),
        utility: Math.round((utilityValue / 100) * MAX_UTILITY),
        endorsements: Math.min(endorsements * 35, MAX_ENDORSEMENT),
      },
      computedAt: history.computedAt,
    });
  } catch (err: any) {
    console.error("Score compute error:", err);
    res.status(500).json({ error: "Failed to compute score", details: err.message });
  }
});

// GET /api/score/summary
// Returns the latest score, factors, and recent history
router.get("/summary", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const [factors, endorsements, latest, history] = await Promise.all([
      prisma.scoreFactor.findUnique({ where: { userId } }),
      prisma.endorsement.count({ where: { userId, status: "Active" } }),
      prisma.scoreHistory.findFirst({
        where: { userId },
        orderBy: { computedAt: "desc" },
      }),
      prisma.scoreHistory.findMany({
        where: { userId },
        orderBy: { computedAt: "desc" },
        take: 10,
      }),
    ]);

    res.json({
      score: latest?.score ?? 0,
      tier: latest?.tier ?? "Bronze",
      factors: {
        momoValue: factors?.momoValue ?? 0,
        savingsValue: factors?.savingsValue ?? 0,
        utilityValue: factors?.utilityValue ?? 0,
        activeEndorsements: endorsements,
      },
      history,
    });
  } catch (err: any) {
    console.error("Score summary error:", err);
    res.status(500).json({ error: "Failed to fetch summary", details: err.message });
  }
});

// PUT /api/score/factors
// Update the raw input values (0–100) then recompute
router.put("/factors", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { momoValue, savingsValue, utilityValue } = req.body;

    const clamp = (v: unknown) =>
      typeof v === "number" ? Math.max(0, Math.min(100, v)) : undefined;

    const data: Record<string, number> = {};
    const cMomo = clamp(momoValue);
    const cSavings = clamp(savingsValue);
    const cUtility = clamp(utilityValue);
    if (cMomo !== undefined) data.momoValue = cMomo;
    if (cSavings !== undefined) data.savingsValue = cSavings;
    if (cUtility !== undefined) data.utilityValue = cUtility;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid factor values provided" });
    }

    await prisma.scoreFactor.upsert({
      where: { userId },
      update: data,
      create: { userId, momoValue: cMomo ?? 0, savingsValue: cSavings ?? 0, utilityValue: cUtility ?? 0 },
    });

    res.json({ success: true, updated: data });
  } catch (err: any) {
    console.error("Factor update error:", err);
    res.status(500).json({ error: "Failed to update factors", details: err.message });
  }
});

export default router;
