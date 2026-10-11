import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type TokenPayload = {
  id: string;
  role: "STUDENT" | "OWNER" | "ADMIN";
};
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
 return {
  id: decoded.id as string,
  role: decoded.role as "STUDENT" | "OWNER" | "ADMIN",
};
}
