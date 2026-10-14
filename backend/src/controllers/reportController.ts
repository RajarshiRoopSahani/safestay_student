
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";

const reportSchema = z
  .object({
    type: z.enum([
      "FAKE_PROPERTY",
      "INCORRECT_INFO",
      "MISLEADING_INFO",
      "INAPPROPRIATE_PHOTO",
      "SPAM",
      "PRIVACY_ISSUE",
      "OTHER",
    ]),
    details: z.string().trim().min(10).max(1000),
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

  if (data.propertyId) {
    const item = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { id: true },
    });
    if (!item) throw new AppError(404, "Property not found");
  }

  if (data.photoId) {
    const item = await prisma.photo.findUnique({
      where: { id: data.photoId },
      select: { id: true },
    });
    if (!item) throw new AppError(404, "Photo not found");
  }

  if (data.reviewId) {
    const item = await prisma.review.findUnique({
      where: { id: data.reviewId },
      select: { id: true },
    });
    if (!item) throw new AppError(404, "Review not found");
  }

  const duplicate = await prisma.report.findFirst({
    where: {
      reporterId,
      propertyId: data.propertyId ?? null,
      photoId: data.photoId ?? null,
      reviewId: data.reviewId ?? null,
      status: { in: ["OPEN", "IN_REVIEW", "REOPENED"] },
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new AppError(409, "You already have an open report for this item");
  }

  const report = await prisma.report.create({
    data: { ...data, reporterId },
    select: { id: true, type: true, status: true, createdAt: true },
  });

  res.status(201).json({
    report,
    message: "Thank you. Our team will review your report.",
  });
}

export async function resolveReport(req: Request, res: Response) {
  const reportId = String(req.params.id);
  const note = z.string().trim().min(3).max(500).parse(req.body.resolutionNote);

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      property: { select: { ownerId: true } },
      photo: { select: { property: { select: { ownerId: true } } } },
      review: { select: { property: { select: { ownerId: true } } } },
    },
  });

  if (!report) throw new AppError(404, "Report not found");

  const ownerId =
    report.property?.ownerId ??
    report.photo?.property.ownerId ??
    report.review?.property.ownerId;

  if (req.user!.role !== "ADMIN" && ownerId !== req.user!.id) {
    throw new AppError(403, "You cannot update this report");
  }

  if (report.status === "REJECTED" || report.status === "RESOLVED") {
    throw new AppError(400, "This report cannot be resolved in its current state");
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: "IN_REVIEW",
      resolutionNote: note,
      resolvedAt: new Date(),
    },
    select: { id: true, status: true, resolutionNote: true, resolvedAt: true },
  });

  res.json({
    report: updated,
    message: "Marked as fixed. Waiting for student confirmation.",
  });
}

export async function confirmReport(req: Request, res: Response) {
  const reportId = String(req.params.id);
  const confirmed = z.boolean().parse(req.body.confirmed);

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      reporterId: true,
      status: true,
      resolvedAt: true,
    },
  });

  if (!report) throw new AppError(404, "Report not found");

  if (report.reporterId !== req.user!.id) {
    throw new AppError(403, "Only the report creator can confirm it");
  }

  if (report.status !== "IN_REVIEW" || !report.resolvedAt) {
    throw new AppError(400, "This report is not awaiting confirmation");
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: confirmed ? "RESOLVED" : "REOPENED",
      resolvedAt: confirmed ? report.resolvedAt : null,
      resolutionNote: confirmed ? undefined : null,
    },
    select: { id: true, status: true },
  });

  res.json({
    report: updated,
    message: confirmed
      ? "Problem marked as resolved"
      : "Report reopened. The owner needs to address it again.",
  });
}
