import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import type { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const SUPABASE_JWT_SECRET = process.env.VITE_SUPABASE_ANON_KEY || "";

function getSupabaseJwtSecret(): string {
  const url = process.env.VITE_SUPABASE_URL || "";
  const match = url.match(/https:\/\/([^.]+)/);
  const projectRef = match ? match[1] : "";
  return SUPABASE_JWT_SECRET;
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token) as any;

    if (!decoded?.sub) {
      return next();
    }

    const user = await storage.getUserBySupabaseId(decoded.sub);
    if (user) {
      req.user = user;
    }
  } catch {
    // Silently continue without auth
  }
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token) as any;

    if (!decoded?.sub) {
      return res.status(401).json({ message: "Invalid token" });
    }

    let user = await storage.getUserBySupabaseId(decoded.sub);

    if (!user && decoded.email) {
      const emailUser = await storage.getUserByEmail(decoded.email);
      if (emailUser && !emailUser.supabaseId) {
        await storage.updateUser(emailUser.id, { supabaseId: decoded.sub });
        user = { ...emailUser, supabaseId: decoded.sub };
      }
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Authentication failed" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    if ((req.user.role === "vendor" || req.user.role === "staff") && !req.user.approved) {
      return res.status(403).json({ message: "Account pending approval" });
    }
    next();
  };
}
