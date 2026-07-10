import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userPhone?: string;
}

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET!) as { userId: string; phone: string };
      req.userId = payload.userId;
      req.userPhone = payload.phone;
    } catch {
      // invalid token — proceed unauthenticated
    }
  }
  next();
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; phone: string };
    req.userId = payload.userId;
    req.userPhone = payload.phone;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
