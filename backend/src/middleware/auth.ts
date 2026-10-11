import { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler";
import { verifyToken } from "../utils/token";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required"));
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles: Array<"STUDENT" | "OWNER" | "ADMIN">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new AppError(403, "You do not have permission"));
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const payload = verifyToken(header.slice(7));
      req.user = { id: payload.id, role: payload.role };
    } catch {
      // Invalid token: treat the visitor as a guest.
    }
  }
  next();
}
