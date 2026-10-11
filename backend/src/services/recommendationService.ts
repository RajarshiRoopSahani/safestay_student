import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { Point } from "../utils/geo";
import { aiConfigured, callClaude, textOf } from "./aiClient";
import { compact, lightInclude, textFilters } from "./aiDataService";
import { serializeProperty } from "./propertyService";
import { getRatingsMap } from "./ratingService";

export const recommendSchema = z.object({
  budget: z.number().int().min(0).max(1000000).optional(),
  location: z.string().trim().max(100).optional(),
  collegeId: z.string().min(1).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  maxDistance: z.number().positive().max(100).optional(),
  roomType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"]).optional(),
  food: z.boolean().optional(),
  wifi: z.boolean().optional(),
  ac: z.boolean().optional(),
  bathroom: z.boolean().optional(),
  parking: z.boolean().optional(),
  security: z.boolean().optional(), // means: CCTV is listed
  furnished: z.boolean().optional(),
  limit: z.number().int().min(1).max(10).default(5),
});
export type RecommendInput = z.infer<typeof recommendSchema>;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export async function recommend(input: RecommendInput) {
  const colleges = await prisma.college.findMany();

  let ref: (Point & { name: string }) | null = null;
  if (input.collegeId) {
    const c = colleges.find((x) => x.id === input.collegeId);
    if (!c) throw new AppError(404, "College not found");
    ref = c;
  } else if (input.lat !== undefined && input.lng !== undefined) {
    ref = { latitude: input.lat, longitude: input.lng, name: "your selected location" };
  }
  if (input.maxDistance !== undefined && !ref) {
    throw new AppError(400, "Choose a college or location to use a distance limit");
  }

  const where: Prisma.PropertyWhereInput[] = [{ isActive: true }, ...textFilters(input.location)];
  const rows = await prisma.property.findMany({ where: { AND: where }, include: lightInclude });
  const ratings = await getRatingsMap(rows.map((r) => r.id));

  const wants = [
    { on: input.food, key: "mealsIncluded", label: "meals" },
    { on: input.wifi, key: "wifi", label: "Wi-Fi" },
    { on: input.ac, key: "ac", label: "AC" },
    { on: input.bathroom, key: "attachedBathroom", label: "an attached bathroom" },
    { on: input.parking, key: "parking", label: "parking" },
    { on: input.security, key: "cctvListed", label: "CCTV (as listed)" },
    { on: input.furnished, key: "furnished", label: "furnishing" },
  ].filter((w) => w.on);

  const ranked = [];

  for (const row of rows) {
    const p = serializeProperty(row, ratings, colleges, ref);
    const c = compact(p) as Record<string, unknown> & ReturnType<typeof compact>;

    // Hard filters
    const typeRooms = input.roomType ? p.rooms.filter((r) => r.type === input.roomType) : p.rooms;
    if (input.roomType && typeRooms.length === 0) continue;

    const rent = input.roomType ? Math.min(...typeRooms.map((r) => r.rent)) : p.rent;
    if (input.budget !== undefined && rent > input.budget) continue;

    if (ref && input.maxDistance !== undefined && (p.distanceKm === null || p.distanceKm > input.maxDistance)) continue;

    const beds = typeRooms.reduce((s, r) => s + r.availableBeds, 0);

    // Soft scoring
    const matched = wants.filter((w) => c[w.key] === true);
    const missing = wants.filter((w) => c[w.key] !== true);

    const reqScore = wants.length ? matched.length / wants.length : 1;
    const availScore = beds > 0 ? 1 : 0;
    const dist = p.distanceKm ?? p.nearestCollege?.distanceKm ?? null;
    const distScore = ref && dist !== null ? Math.max(0, 1 - dist / (input.maxDistance ?? 10)) : 0.5;
    const rentScore = input.budget ? Math.max(0, Math.min(1, 1 - rent / input.budget)) : 0.5;
    const ratingScore = p.rating !== null ? p.rating / 5 : 0.5;

    const matchScore = Math.round(
      100 * (0.35 * reqScore + 0.15 * availScore + 0.2 * distScore + 0.15 * rentScore + 0.15 * ratingScore)
    );

    // Reasons and caveats, built only from real data
    const reasons: string[] = [];
    if (input.budget !== undefined) reasons.push(`its ${input.roomType ? input.roomType.toLowerCase() + " room " : ""}rent of ${inr(rent)} is within your budget of ${inr(input.budget)}`);
    if (ref && p.distanceKm !== null) reasons.push(`it is about ${p.distanceKm} km from ${ref.name}`);
    if (matched.length) reasons.push(`it lists ${matched.map((m) => m.label).join(", ")}`);
    if (beds > 0) reasons.push(`${beds} bed(s) are currently listed as available`);
    if (p.rating !== null) reasons.push(`it has a ${p.rating}/5 rating from ${p.reviewCount} approved student reviews`);

    const caveats: string[] = [];
    if (missing.length) caveats.push(`Does not list: ${missing.map((m) => m.label).join(", ")}`);
    if (beds === 0) caveats.push("No beds are currently listed as available");
    if (p.rating === null) caveats.push("Not enough reviews yet to show a rating");
    caveats.push("Distances are straight-line estimates. Please visit and verify before booking.");

    ranked.push({
      property: { ...c, startingRentForYourRoomType: rent, thumbnail: p.photos[0]?.url ?? null },
      matchScore,
      reasons,
      caveats,
      explanation: reasons.length ? `Recommended because ${reasons.join("; ")}.` : "Matches your search.",
    });
  }

  ranked.sort((a, b) => b.matchScore - a.matchScore);
  const top = ranked.slice(0, input.limit);

  // Optional: a short AI-written summary based only on the facts above
  let summary: string | null = null;
  if (aiConfigured && top.length > 0) {
    try {
      const facts = top.slice(0, 3).map((r) => ({
        name: r.property.name,
        matchScore: r.matchScore,
        reasons: r.reasons,
        caveats: r.caveats.slice(0, -1),
      }));
      const resp = await callClaude({
        system:
          "You summarize accommodation recommendations for students. Use ONLY the facts in the JSON. Do not add any detail. Never claim a place is safe or unsafe. Write 3 to 4 plain sentences.",
        messages: [{ role: "user", content: JSON.stringify({ preferences: input, options: facts }) }],
        maxTokens: 300,
      });
      summary = textOf(resp.content) || null;
    } catch {
      summary = null; // the recommendations still work without the AI summary
    }
  }

  return {
    total: ranked.length,
    recommendations: top,
    summary,
    note:
      ranked.length === 0
        ? "No properties match all of your budget, distance and room-type limits. Try relaxing one of them."
        : "Match scores are calculated from your preferences, availability, distance, rent and approved ratings.",
  };
}
