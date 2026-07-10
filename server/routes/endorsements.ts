import { Router } from "express";
import { prisma } from "../db/client";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/endorsements — fetch current user's endorsements
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const endorsements = await prisma.endorsement.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
    });
    res.json({ endorsements });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch endorsements", details: err.message });
  }
});

// POST /api/endorsements — submit a new endorsement request
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { voucherName, voucherRole, cooperative } = req.body;

    if (!voucherName || !voucherRole || !cooperative) {
      return res.status(400).json({ error: "voucherName, voucherRole, and cooperative are required" });
    }

    const endorsement = await prisma.endorsement.create({
      data: {
        userId: req.userId!,
        voucherName,
        voucherRole,
        cooperative,
        status: "Pending",
      },
    });

    res.json({ success: true, endorsement });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create endorsement", details: err.message });
  }
});

// PUT /api/endorsements/:id/approve — approve an endorsement (admin/lender action)
router.put("/:id/approve", requireAuth, async (req: AuthRequest, res) => {
  try {
    const endorsement = await prisma.endorsement.update({
      where: { id: req.params.id },
      data: { status: "Active" },
    });
    res.json({ success: true, endorsement });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to approve endorsement", details: err.message });
  }
});

export default router;
