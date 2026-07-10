import { Router } from "express";
import { prisma } from "../db/client";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

// POST /api/loans/apply
router.post("/apply", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { lenderName, amount, purpose, duration, scoreAtTime, tierAtTime } = req.body;

  if (!lenderName || !amount || !purpose || !duration) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const application = await prisma.loanApplication.create({
    data: {
      userId,
      lenderName,
      amount: parseInt(amount),
      purpose,
      duration,
      scoreAtTime: scoreAtTime || 0,
      tierAtTime: tierAtTime || "Bronze",
      status: "Submitted",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "LOAN_APPLICATION_SUBMITTED",
      scoreBefore: scoreAtTime || 0,
      scoreAfter: scoreAtTime || 0,
      source: "user_portal",
      metadata: { lenderName, amount, purpose, duration },
    },
  });

  res.json({ success: true, application });
});

// GET /api/loans/my-applications
router.get("/my-applications", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const applications = await prisma.loanApplication.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ applications });
});

export default router;
