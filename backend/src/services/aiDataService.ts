import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { Point } from "../utils/geo";
import { propertyInclude, serializeProperty, SerializedProperty } from "./propertyService";
import { getRatingsMap } from "./ratingService";

export function textFilters(q?: string): Prisma.PropertyWhereInput[] {
  const tokens = (q ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 5);
  return tokens.map((t) => {
    const c = { contains: t, mode: "insensitive" as const };
    return { OR: [{ name: c }, { area: c }, { city: c }, { address: c }, { building: { is: { name: c } } }] };
  });
}

export const lightInclude = {
  ...propertyInclude,
  photos: { ...propertyInclude.photos, take: 1 },
};

export function compact(p: SerializedProperty) {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    area: p.area,
    city: p.city,
    rent: p.rent,
    deposit: p.deposit,
    rating: p.rating,
    reviewCount: p.reviewCount,
    ratingNote: p.rating === null ? "Not enough reviews yet." : `${p.rating} / 5`,
    distanceKm: p.distanceKm,
    nearestCollege: p.nearestCollege,
    availability: p.availability,
    availableBeds: p.availableBeds,
    roomTypes: p.roomTypes,
    mealsIncluded: p.foodIncluded,
    wifi: p.wifi,
    ac: p.ac,
    cooler: p.cooler,
    attachedBathroom: p.attachedBathroom,
    parking: p.parking,
    cctvListed: p.cctv,
    furnished: p.furnished,
    laundry: p.laundry,
  };
}

export const searchInputSchema = z.object({
  q: z.string().trim().max(100).optional(),
  maxRent: z.number().int().min(0).optional(),
  minRent: z.number().int().min(0).optional(),
  type: z.enum(["HOSTEL", "PG", "ROOM", "FLAT"]).optional(),
  roomType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"]).optional(),
  mealsIncluded: z.boolean().optional(),
  wifi: z.boolean().optional(),
  ac: z.boolean().optional(),
  attachedBathroom: z.boolean().optional(),
  parking: z.boolean().optional(),
  cctvListed: z.boolean().optional(),
  furnished: z.boolean().optional(),
  availableOnly: z.boolean().optional(),
  collegeName: z.string().trim().max(100).optional(),
  maxDistanceKm: z.number().positive().max(100).optional(),
  sort: z.enum(["rent_asc", "rating_desc", "nearest", "reviews_desc"]).optional(),
  limit: z.number().int().min(1).max(8).default(5),
});
export type SearchInput = z.infer<typeof searchInputSchema>;

export async function findProperties(input: SearchInput) {
  const colleges = await prisma.college.findMany();

  let ref: (Point & { name: string }) | null = null;
  if (input.collegeName) {
    const needle = input.collegeName.toLowerCase();
    const match = colleges.find((c) => c.name.toLowerCase().includes(needle));
    if (!match) {
      return { error: `No college matches "${input.collegeName}".`, availableColleges: colleges.map((c) => c.name) };
    }
    ref = match;
  }

  const filters: Prisma.PropertyWhereInput[] = [{ isActive: true }, ...textFilters(input.q)];
  if (input.maxRent !== undefined) filters.push({ rent: { lte: input.maxRent } });
  if (input.minRent !== undefined) filters.push({ rent: { gte: input.minRent } });
  if (input.type) filters.push({ type: input.type });
  if (input.roomType) filters.push({ rooms: { some: { type: input.roomType } } });
  if (input.mealsIncluded) filters.push({ foodIncluded: true });
  if (input.wifi) filters.push({ wifi: true });
  if (input.ac) filters.push({ ac: true });
  if (input.attachedBathroom) filters.push({ attachedBathroom: true });
  if (input.parking) filters.push({ parking: true });
  if (input.cctvListed) filters.push({ cctv: true });
  if (input.furnished) filters.push({ furnished: true });
  if (input.availableOnly) filters.push({ rooms: { some: { availableBeds: { gt: 0 } } } });

  const rows = await prisma.property.findMany({ where: { AND: filters }, include: lightInclude });
  const ratings = await getRatingsMap(rows.map((r) => r.id));
  let results = rows.map((r) => serializeProperty(r, ratings, colleges, ref));

  if (ref && input.maxDistanceKm !== undefined) {
    const max = input.maxDistanceKm;
    results = results.filter((p) => p.distanceKm !== null && p.distanceKm <= max);
  }

  const dist = (p: SerializedProperty) => p.distanceKm ?? p.nearestCollege?.distanceKm ?? Infinity;
  const sort = input.sort ?? (ref ? "nearest" : "rent_asc");
  results.sort((a, b) => {
    switch (sort) {
      case "rating_desc": return (b.rating ?? -1) - (a.rating ?? -1) || b.reviewCount - a.reviewCount;
      case "nearest": return dist(a) - dist(b);
      case "reviews_desc": return b.reviewCount - a.reviewCount;
      default: return a.rent - b.rent;
    }
  });

  return {
    totalMatches: results.length,
    distanceNote: ref ? `Straight-line distance from ${ref.name}` : "No reference college used",
    properties: results.slice(0, input.limit).map(compact),
  };
}

export async function compareProperties(ids: string[]) {
  const unique = Array.from(new Set(ids)).slice(0, 4);
  const [colleges, rows] = await Promise.all([
    prisma.college.findMany(),
    prisma.property.findMany({ where: { id: { in: unique }, isActive: true }, include: lightInclude }),
  ]);
  const ratings = await getRatingsMap(rows.map((r) => r.id));
  const found = rows.map((r) => serializeProperty(r, ratings, colleges));
  return {
    properties: found.map(compact),
    notFound: unique.filter((id) => !found.some((p) => p.id === id)),
  };
}
