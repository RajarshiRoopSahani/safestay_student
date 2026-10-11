import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";

const listSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const moderateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export async function adminListReviews(req: Request, res: Response) {
  const { status, page, limit } = listSchema.parse(req.query);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { status },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        rating: true,
        text: true,
        verified: true,
        status: true,
        createdAt: true,
        userId: true,
        property: { select: { id: true, name: true, area: true } },
        _count: { select: { reports: true } },
      },
    }),
    prisma.review.count({ where: { status } }),
  ]);

  res.json({ total, page, totalPages: Math.max(1, Math.ceil(total / limit)), reviews });
}

export async function moderateReview(req: Request, res: Response) {
  const id = String(req.params.id);
  const { status } = moderateSchema.parse(req.body);

  const existing = await prisma.review.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError(404, "Review not found");

  const review = await prisma.review.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  });
  res.json({ review, message: `Review marked ${status}` });
}

export async function deleteReview(req: Request, res: Response) {
  const id = String(req.params.id);
  const existing = await prisma.review.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError(404, "Review not found");
  await prisma.review.delete({ where: { id } });
  res.json({ message: "Review deleted" });
}
