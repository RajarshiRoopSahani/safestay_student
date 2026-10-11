import { Request, Response } from "express";
import { College, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { getRatingsMap } from "../services/ratingService";
import { propertyInclude, serializeProperty, SerializedProperty } from "../services/propertyService";
import { distanceKm, Point } from "../utils/geo";
import { searchOSMPlaces } from "../services/openStreetMapService";

const boolish = z
  .enum(["true", "false"])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === "true"));

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  city: z.string().trim().max(60).optional(),
  area: z.string().trim().max(60).optional(),
  collegeId: z.string().trim().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  maxDistance: z.coerce.number().positive().max(100).optional(),
  minRent: z.coerce.number().int().min(0).optional(),
  maxRent: z.coerce.number().int().min(0).optional(),
  type: z.enum(["HOSTEL", "PG", "ROOM", "FLAT"]).optional(),
  roomType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"]).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  food: boolish,
  wifi: boolish,
  ac: boolish,
  bathroom: boolish,
  parking: boolish,
  cctv: boolish,
  available: boolish,
  sort: z.enum(["rent_asc", "rating_desc", "nearest", "reviews_desc", "recommended"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const TYPE_WORDS: Record<string, "HOSTEL" | "PG" | "ROOM" | "FLAT"> = {
  hostel: "HOSTEL", hostels: "HOSTEL", pg: "PG", pgs: "PG", room: "ROOM", rooms: "ROOM", flat: "FLAT", flats: "FLAT",
};

function tokenClause(token: string): Prisma.PropertyWhereInput {
  const contains = { contains: token, mode: "insensitive" as const };
  const or: Prisma.PropertyWhereInput[] = [
    { name: contains },
    { area: contains },
    { city: contains },
    { address: contains },
    { pincode: contains },
    { building: { is: { name: contains } } },
  ];
  const mappedType = TYPE_WORDS[token.toLowerCase()];
  if (mappedType) or.push({ type: mappedType });
  return { OR: or };
}

type Reference = { type: "college" | "location"; name?: string; radiusKm: number | null } & Point;

function recommendedScore(p: SerializedProperty, maxRent: number): number {
  const ratingPart = p.rating !== null ? p.rating / 5 : 0.5; // unknown rating = neutral
  const dist = p.distanceKm ?? p.nearestCollege?.distanceKm ?? null;
  const distPart = dist !== null ? Math.max(0, 1 - dist / 10) : 0.5;
  const rentPart = maxRent > 0 ? 1 - p.rent / maxRent : 0.5;
  return 0.4 * ratingPart + 0.3 * distPart + 0.3 * rentPart;
}

export async function searchProperties(req: Request, res: Response) {
  const q = querySchema.parse(req.query);
  const colleges = await prisma.college.findMany();
  const mapPlaces = q.q
  ? await searchOSMPlaces(q.q, q.city ?? "Lucknow").catch(() => [])
  : [];

  // 1. Work out the reference point (college or the student's location)
  const text = (q.q ?? "").trim();
  let reference: Reference | null = null;
  let useTextFilter = text.length > 0;

  if (q.collegeId) {
    const college = colleges.find((c) => c.id === q.collegeId);
    if (!college) throw new AppError(404, "College not found");
    reference = { type: "college", name: college.name, latitude: college.latitude, longitude: college.longitude, radiusKm: q.maxDistance ?? 10 };
  } else if (q.lat !== undefined && q.lng !== undefined) {
    reference = { type: "location", latitude: q.lat, longitude: q.lng, radiusKm: q.maxDistance ?? null };
  } else if (text) {
    // "Near Engineering College" style searches
    const collegeIntent = /^near\s+/i.test(text) || /(college|institute|university)/i.test(text);
    if (collegeIntent) {
      const needle = text.replace(/^near\s+/i, "").toLowerCase();
      const match: College | undefined = needle.length >= 3 ? colleges.find((c) => c.name.toLowerCase().includes(needle)) : undefined;
      if (match) {
        reference = { type: "college", name: match.name, latitude: match.latitude, longitude: match.longitude, radiusKm: q.maxDistance ?? 10 };
        useTextFilter = false;
      }
    }
  }

  // 2. Database filters
  const filters: Prisma.PropertyWhereInput[] = [{ isActive: true }];
  if (useTextFilter) {
    text.split(/\s+/).filter(Boolean).slice(0, 5).forEach((t) => filters.push(tokenClause(t)));
  }
  if (q.type) filters.push({ type: q.type });
  if (q.city) filters.push({ city: { equals: q.city, mode: "insensitive" } });
  if (q.area) filters.push({ area: { contains: q.area, mode: "insensitive" } });
  if (q.minRent !== undefined) filters.push({ rent: { gte: q.minRent } });
  if (q.maxRent !== undefined) filters.push({ rent: { lte: q.maxRent } });
  if (q.food) filters.push({ foodIncluded: true });
  if (q.wifi) filters.push({ wifi: true });
  if (q.ac) filters.push({ ac: true });
  if (q.bathroom) filters.push({ attachedBathroom: true });
  if (q.parking) filters.push({ parking: true });
  if (q.cctv) filters.push({ cctv: true });
  if (q.roomType) filters.push({ rooms: { some: { type: q.roomType } } });
  if (q.available) filters.push({ rooms: { some: { availableBeds: { gt: 0 } } } });

  const rows = await prisma.property.findMany({
    where: { AND: filters },
    include: { ...propertyInclude, photos: { ...propertyInclude.photos, take: 3 } },
  });

  const ratings = await getRatingsMap(rows.map((r) => r.id));
  let results = rows.map((r) => serializeProperty(r, ratings, colleges, reference));

  // 3. In-memory filters
  if (reference && reference.radiusKm !== null) {
    const radius = reference.radiusKm;
    results = results.filter((p) => p.distanceKm !== null && p.distanceKm <= radius);
  }
  if (q.minRating !== undefined) {
    const min = q.minRating;
    results = results.filter((p) => p.rating !== null && p.rating >= min);
  }

  // 4. Sorting
  const sort = q.sort ?? (reference ? "nearest" : "recommended");
  const distOf = (p: SerializedProperty) => p.distanceKm ?? p.nearestCollege?.distanceKm ?? Infinity;
  const maxRent = results.reduce((m, p) => Math.max(m, p.rent), 0);

  results.sort((a, b) => {
    switch (sort) {
      case "rent_asc": return a.rent - b.rent;
      case "rating_desc": return (b.rating ?? -1) - (a.rating ?? -1) || b.reviewCount - a.reviewCount;
      case "nearest": return distOf(a) - distOf(b);
      case "reviews_desc": return b.reviewCount - a.reviewCount;
      default: return recommendedScore(b, maxRent) - recommendedScore(a, maxRent);
    }
  });

  // 5. "Nearby" information for the whole result set
  const total = results.length;
  const summary = { HOSTEL: 0, PG: 0, ROOM: 0, FLAT: 0 };
  results.forEach((p) => { summary[p.type] += 1; });

  const buildingIds = Array.from(new Set(results.map((p) => p.buildingId).filter((id): id is string => !!id)));
  const buildings = buildingIds.length
    ? await prisma.building.findMany({
        where: { id: { in: buildingIds } },
        select: { id: true, name: true, address: true, area: true, city: true },
      })
    : [];

  let nearbyCollegeList: { id: string; name: string; city: string; distanceKm: number }[] = [];
  if (total > 0) {
    const center: Point = {
      latitude: results.reduce((s, p) => s + p.latitude, 0) / total,
      longitude: results.reduce((s, p) => s + p.longitude, 0) / total,
    };
    nearbyCollegeList = colleges
      .map((c) => ({ id: c.id, name: c.name, city: c.city, distanceKm: distanceKm(center, c) }))
      .filter((c) => c.distanceKm <= 10)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);
  }

  // 6. Pagination
  const start = (q.page - 1) * q.limit;
  res.json({
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.max(1, Math.ceil(total / q.limit)),
    sort,
    reference,
    mapPlaces,
    results: results.slice(start, start + q.limit),
    nearby: {
      countsByType: summary,
      buildings,
      colleges: nearbyCollegeList,
      note: "Nearby transport, food and other facilities are listed on each property page when provided by the property.",
    },
  });
}
