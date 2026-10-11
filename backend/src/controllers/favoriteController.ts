import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { getRatingsMap } from "../services/ratingService";
import { propertyInclude, serializeProperty } from "../services/propertyService";

const addSchema = z.object({ propertyId: z.string().min(1) });

export async function addFavorite(req: Request, res: Response) {
  const { propertyId } = addSchema.parse(req.body);
  const userId = req.user!.id;

  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, isActive: true } });
  if (!property || !property.isActive) throw new AppError(404, "Property not found");

  // upsert = adding twice is harmless
  await prisma.favorite.upsert({
    where: { userId_propertyId: { userId, propertyId } },
    update: {},
    create: { userId, propertyId },
  });

  res.status(201).json({ message: "Added to favorites", propertyId });
}

export async function removeFavorite(req: Request, res: Response) {
  const propertyId = String(req.params.propertyId);
  await prisma.favorite.deleteMany({ where: { userId: req.user!.id, propertyId } });
  res.json({ message: "Removed from favorites", propertyId });
}

export async function listFavorites(req: Request, res: Response) {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id, property: { isActive: true } },
    orderBy: { createdAt: "desc" },
    include: { property: { include: { ...propertyInclude, photos: { ...propertyInclude.photos, take: 3 } } } },
  });

  const [colleges, ratings] = await Promise.all([
    prisma.college.findMany(),
    getRatingsMap(favorites.map((f) => f.propertyId)),
  ]);

  res.json({
    favorites: favorites.map((f) => serializeProperty(f.property, ratings, colleges)),
  });
}
