import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { signToken } from "../utils/token";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Invalid phone number").optional(),
  role: z.enum(["STUDENT", "OWNER"]).default("STUDENT"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const publicUser = { id: true, name: true, email: true, phone: true, role: true, createdAt: true } as const;

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, phone: data.phone, passwordHash, role: data.role},
    select: publicUser,
  });

  const token = signToken({ id: user.id, role: user.role });
  res.status(201).json({ token, user });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const valid = user ? await bcrypt.compare(data.password, user.passwordHash) : false;
  if (!user || !valid) throw new AppError(401, "Invalid email or password");

  const token = signToken({ id: user.id, role: user.role });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt },
  });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: publicUser });
  if (!user) throw new AppError(404, "User not found");
  res.json({ user });
}

// Structure only: real password-reset emails need an email service (added later if you want it).
export async function forgotPassword(req: Request, res: Response) {
  forgotSchema.parse(req.body);
  res.json({ message: "If an account exists for this email, reset instructions will be sent." });
}
