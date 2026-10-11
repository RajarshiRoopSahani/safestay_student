import { prisma } from "../config/prisma";

// A property needs at least this many approved reviews before we show a rating.
export const MIN_REVIEWS = 3;

export type RatingsMap = Map<string, { avg: number; count: number }>;

export async function getRatingsMap(propertyIds: string[]): Promise<RatingsMap> {
  const map: RatingsMap = new Map();
  if (propertyIds.length === 0) return map;

  const rows = await prisma.review.groupBy({
    by: ["propertyId"],
    where: { propertyId: { in: propertyIds }, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  for (const row of rows) {
    map.set(row.propertyId, { avg: row._avg.rating ?? 0, count: row._count._all });
  }
  return map;
}

export function ratingSummary(r?: { avg: number; count: number }) {
  const count = r?.count ?? 0;
  if (!r || count < MIN_REVIEWS) {
    return { rating: null as number | null, reviewCount: count, ratingLabel: "Not enough reviews yet." };
  }
  const rating = Math.round(r.avg * 10) / 10;
  return { rating: rating as number | null, reviewCount: count, ratingLabel: `${rating} / 5` };
}
