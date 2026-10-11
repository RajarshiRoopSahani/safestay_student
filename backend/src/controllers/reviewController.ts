import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { getRatingsMap, ratingSummary } from "../services/ratingService";

const createSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(10, "Review must be at least 10 characters").max(1000),
});

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

// Only these fields are public. userId is NOT included on purpose.
const publicReviewSelect = {
  id: true,
  rating: true,
  text: true,
  verified: true,
  createdAt: true,
} as const;

function labelled<T extends { verified: boolean }>(review: T) {
  return { ...review, label: review.verified ? "Verified Student Review" : "Student Review" };
}

async function assertActiveProperty(id: string) {
  const property = await prisma.property.findUnique({ where: { id }, select: { id: true, isActive: true } });
  if (!property || !property.isActive) throw new AppError(404, "Property not found");
}

export async function listReviews(req: Request, res: Response) {
  const propertyId = String(req.params.id);
  const { page, limit } = listSchema.parse(req.query);
  await assertActiveProperty(propertyId);

  const where = { propertyId, status: "APPROVED" as const };

  const [reviews, total, ratings, distribution] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: publicReviewSelect,
    }),
    prisma.review.count({ where }),
    getRatingsMap([propertyId]),
    prisma.review.groupBy({ by: ["rating"], where, _count: { _all: true } }),
  ]);

  // A logged-in student can see their own review status (even while pending).
  let myReview = null;
  if (req.user) {
    const mine = await prisma.review.findUnique({
      where: { propertyId_userId: { propertyId, userId: req.user.id } },
      select: { ...publicReviewSelect, status: true },
    });
    myReview = mine ? labelled(mine) : null;
  }

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach((d) => { counts[d.rating] = d._count._all; });

  res.json({
    ...ratingSummary(ratings.get(propertyId)),
    distribution: counts,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    reviews: reviews.map(labelled),
    myReview,
  });
}

export async function createReview(req: Request, res: Response) {
  const propertyId = String(req.params.id);
  const userId = req.user!.id;
  const data = createSchema.parse(req.body);
  await assertActiveProperty(propertyId);

  const existing = await prisma.review.findUnique({
    where: { propertyId_userId: { propertyId, userId } },
    select: { id: true },
  });
  if (existing) throw new AppError(409, "You have already reviewed this property");

  // Verified = the student has an approved booking for this property.
  const approvedBooking = await prisma.booking.findFirst({
    where: { propertyId, userId, status: "APPROVED" },
    select: { id: true },
  });

  const review = await prisma.review.create({
    data: { propertyId, userId, rating: data.rating, text: data.text, verified: !!approvedBooking },
    select: { ...publicReviewSelect, status: true },
  });

  res.status(201).json({
    review: labelled(review),
    message: "Thanks! Your review will appear after moderation.",
  });
}
