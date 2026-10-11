import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";

const reportSchema = z
  .object({
    type: z.enum(["FAKE_PROPERTY", "INCORRECT_INFO", "MISLEADING_INFO", "INAPPROPRIATE_PHOTO", "SPAM", "PRIVACY_ISSUE", "OTHER"]),
    details: z.string().trim().min(10, "Please describe the issue (at least 10 characters)").max(1000),
    propertyId: z.string().min(1).optional(),
    photoId: z.string().min(1).optional(),
    reviewId: z.string().min(1).optional(),
  })
  .refine((d) => d.propertyId || d.photoId || d.reviewId, {
    message: "Provide a propertyId, photoId or reviewId to report",
  });

export async function createReport(req: Request, res: Response) {
  const data = reportSchema.parse(req.body);
  const reporterId = req.user!.id;

  // Make sure whatever is being reported actually exists
  if (data.propertyId) {
    const p = await prisma.property.findUnique({ where: { id: data.propertyId }, select: { id: true } });
    if (!p) throw new AppError(404, "Property not found");
  }
  if (data.photoId) {
    const ph = await prisma.photo.findUnique({ where: { id: data.photoId }, select: { id: true } });
    if (!ph) throw new AppError(404, "Photo not found");
  }
  if (data.reviewId) {
    const r = await prisma.review.findUnique({ where: { id: data.reviewId }, select: { id: true } });
    if (!r) throw new AppError(404, "Review not found");
  }

  // Stop the same student from spamming reports about the same thing
  const duplicate = await prisma.report.findFirst({
    where: {
      reporterId,
      propertyId: data.propertyId ?? null,
      photoId: data.photoId ?? null,
      reviewId: data.reviewId ?? null,
      status: { in: ["OPEN", "IN_REVIEW"] },
    },
    select: { id: true },
  });
  if (duplicate) throw new AppError(409, "You already have an open report for this item");

  const report = await prisma.report.create({
    data: { ...data, reporterId },
    select: { id: true, type: true, status: true, createdAt: true },
  });

  res.status(201).json({ report, message: "Thank you. Our team will review your report." });
}
