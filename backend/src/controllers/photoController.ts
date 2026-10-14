import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { detectImageType, uploadImage } from "../services/imageService";
import { publicPhotoSelect } from "../services/propertyService";
import { PHOTO_NOTICE, photoCaption } from "../utils/photoLabel";

const categories = ["ROOM", "BATHROOM", "BUILDING", "COMMON_AREA", "ENTRANCE", "FURNITURE", "SURROUNDINGS", "MAINTENANCE", "OTHER"] as const;

const uploadSchema = z.object({
  category: z.enum(categories),
  official: z.enum(["true", "false"]).optional(),
});

const listSchema = z.object({
  category: z.enum(categories).optional(),
});

const MAX_PENDING_PER_USER = 5;

async function assertActiveProperty(id: string) {
  const property = await prisma.property.findUnique({ where: { id }, select: { id: true, isActive: true } });
  if (!property || !property.isActive) throw new AppError(404, "Property not found");
}

export async function uploadPhoto(req: Request, res: Response) {
  console.log("PHOTO UPLOAD API HIT");
  const propertyId = String(req.params.id);
  const { category, official } = uploadSchema.parse(req.body);
  await assertActiveProperty(propertyId);

  if (!req.file) throw new AppError(400, "Please attach an image in the 'photo' field");
  if (!detectImageType(req.file.buffer)) {
    throw new AppError(400, "The file is not a valid JPG, PNG or WebP image");
  }

  // Admins can upload official photos, which are approved immediately.
  const isAdminOfficial = req.user!.role === "ADMIN" && official === "true";

  if (!isAdminOfficial) {
    const pending = await prisma.photo.count({
      where: { uploaderId: req.user!.id, status: "PENDING" },
    });
    if (pending >= MAX_PENDING_PER_USER) {
      throw new AppError(429, "You have several photos awaiting review. Please wait until they are reviewed.");
    }
  }

  const { url, publicId } = await uploadImage(req.file.buffer, `safestay/properties/${propertyId}`);

  const photo = await prisma.photo.create({
    data: {
      propertyId,
      uploaderId: req.user!.id, // internal only, never returned publicly
      url,
      cloudinaryId: publicId,
      category,
      isOfficial: isAdminOfficial,
      status: "APPROVED",
    },
    select: { ...publicPhotoSelect, status: true },
  });

  res.status(201).json({
    photo: { ...photo, label: photoCaption(photo) },
    message: isAdminOfficial
      ? "Official photo added"
      : "Thanks! Your photo will appear after moderation. Your identity is never shown publicly.",
  });
}

export async function listPhotos(req: Request, res: Response) {
  const propertyId = String(req.params.id);
  const { category } = listSchema.parse(req.query);
  await assertActiveProperty(propertyId);

  const photos = await prisma.photo.findMany({
    where: { propertyId, status: "APPROVED", ...(category ? { category } : {}) },
    orderBy: [{ isOfficial: "desc" }, { createdAt: "desc" }],
    select: publicPhotoSelect, // uploaderId is not selected
  });

  const withLabels = photos.map((p) => ({ ...p, label: photoCaption(p) }));

  res.json({
    officialPhotos: withLabels.filter((p) => p.isOfficial),
    communityPhotos: withLabels.filter((p) => !p.isOfficial),
    total: withLabels.length,
    notice: PHOTO_NOTICE,
  });
}

// A student can see the review status of their own uploads.
export async function myPhotos(req: Request, res: Response) {
  const photos = await prisma.photo.findMany({
    where: { uploaderId: req.user!.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      category: true,
      status: true,
      createdAt: true,
      property: { select: { id: true, name: true } },
    },
  });
  res.json({ photos });
}
