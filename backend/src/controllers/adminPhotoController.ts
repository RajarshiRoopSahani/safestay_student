import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { deleteImage } from "../services/imageService";
import { analyzePhotoUrl } from "../services/photoAnalysisService";

const listSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const moderateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export async function adminListPhotos(req: Request, res: Response) {
  const { status, page, limit } = listSchema.parse(req.query);

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where: { status },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        url: true,
        category: true,
        isOfficial: true,
        status: true,
        createdAt: true,
        uploaderId: true,
        aiObservation: true,
        property: { select: { id: true, name: true, area: true } },
        _count: { select: { reports: true } },
      },
    }),
    prisma.photo.count({ where: { status } }),
  ]);

  res.json({ total, page, totalPages: Math.max(1, Math.ceil(total / limit)), photos });
}

export async function moderatePhoto(req: Request, res: Response) {
  const id = String(req.params.id);
  const { status } = moderateSchema.parse(req.body);

  const existing = await prisma.photo.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError(404, "Photo not found");

  const photo = await prisma.photo.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  });
  res.json({ photo, message: `Photo marked ${status}` });
}

export async function deletePhoto(req: Request, res: Response) {
  const id = String(req.params.id);
  const photo = await prisma.photo.findUnique({ where: { id }, select: { id: true, cloudinaryId: true } });
  if (!photo) throw new AppError(404, "Photo not found");

  await prisma.photo.delete({ where: { id } });
  await deleteImage(photo.cloudinaryId);
  res.json({ message: "Photo deleted" });
}

export async function analyzePhoto(req: Request, res: Response) {
  const id = String(req.params.id);
  const photo = await prisma.photo.findUnique({ where: { id }, select: { id: true, url: true } });
  if (!photo) throw new AppError(404, "Photo not found");

  const { observations, privacyConcern } = await analyzePhotoUrl(photo.url);
  await prisma.photo.update({ where: { id }, data: { aiObservation: observations } });

  res.json({
    aiObservation: observations,
    privacyConcern,
    notice: "AI-generated observation. Please verify personally.",
  });
}

export async function clearAnalysis(req: Request, res: Response) {
  const id = String(req.params.id);
  const existing = await prisma.photo.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError(404, "Photo not found");
  await prisma.photo.update({ where: { id }, data: { aiObservation: null } });
  res.json({ message: "AI observation removed" });
}
