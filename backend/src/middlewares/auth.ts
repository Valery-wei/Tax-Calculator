//This middleware protects routes by validating a Bearer JWT token and attaching the authenticated user info to `req.user` before continuing.

import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt.js";

export type AuthedRequest = Request & { user?: { userId: string; email: string } };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = verifyJwt(header.slice("Bearer ".length));
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
