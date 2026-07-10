import { Router } from "express";
import jwt from "jsonwebtoken";
import { createRequire } from "module";
import { prisma } from "../db/client";

const router = Router();

const require = createRequire(import.meta.url);

// Lazy init — only created when first OTP is sent so missing env vars don't crash startup
let sms: any = null;
function getSms() {
  if (!sms) {
    const AfricasTalking = require("africastalking");
    const at = AfricasTalking({
      apiKey: process.env.AT_API_KEY || "sandbox",
      username: process.env.AT_USERNAME || "sandbox",
    });
    sms = at.SMS;
  }
  return sms;
}

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/check-phone
// Returns whether the phone is already registered
router.post("/check-phone", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });

    const user = await prisma.user.findUnique({ where: { phone } });
    res.json({ exists: !!user, name: user?.name ?? null });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to check phone", details: err.message });
  }
});

// POST /api/auth/request-otp
// Finds or creates a user then sends a 6-digit OTP via SMS
router.post("/request-otp", async (req, res) => {
  try {
    const { phone, name, occupation, cooperative, language } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      if (!name || !occupation || !cooperative) {
        return res.status(400).json({
          error: "Name, occupation, and cooperative are required for new users",
        });
      }
      user = await prisma.user.create({
        data: {
          phone,
          name,
          occupation,
          cooperative,
          language: language || "en",
        },
      });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpCode.create({
      data: { userId: user.id, code, expiresAt },
    });

    try {
      await Promise.race([
        getSms().send({
          to: [phone],
          message: `Your Agaciro Credit code is: ${code}. Valid for 10 minutes. Do not share this code.`,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("SMS timeout")), 5000)),
      ]);
    } catch (smsErr: any) {
      console.warn("SMS skipped:", smsErr.message);
    }

    const isDev = process.env.NODE_ENV !== "production";
    res.json({
      success: true,
      message: isDev ? "OTP generated (SMS skipped in dev)" : "OTP sent to " + phone,
      ...(isDev && { dev_code: code }),
    });
  } catch (err: any) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ error: "Failed to send OTP", details: err.message });
  }
});

// POST /api/auth/verify-otp
// Verifies the OTP code and returns a JWT token
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: "Phone and code are required" });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otp = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      return res.status(401).json({ error: "Invalid or expired code" });
    }

    // Mark OTP used and set consent
    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
    await prisma.user.update({ where: { id: user.id }, data: { consented: true } });

    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        occupation: user.occupation,
        cooperative: user.cooperative,
        language: user.language,
      },
    });
  } catch (err: any) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ error: "Failed to verify OTP", details: err.message });
  }
});

// GET /api/auth/me
// Returns the currently logged-in user's profile (requires JWT)
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token required" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err: any) {
    console.error("JWT /me error:", err.message);
    res.status(401).json({ error: "Invalid or expired token", debug: err.message });
  }
});

export default router;
