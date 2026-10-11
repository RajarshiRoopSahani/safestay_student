import { College, Prisma } from "@prisma/client";
import { distanceKm, Point } from "../utils/geo";
import { photoCaption } from "../utils/photoLabel";
import { RatingsMap, ratingSummary } from "./ratingService";

// Only these photo fields are ever sent publicly. uploaderId is NOT here on purpose.
export const publicPhotoSelect = {
  id: true,
  url: true,
  category: true,
  isOfficial: true,
  aiObservation: true,
  createdAt: true,
} satisfies Prisma.PhotoSelect;

export const propertyInclude = {
  amenities: { select: { name: true } },
  rooms: true,
  building: {
    select: { id: true, name: true, address: true, area: true, city: true, pincode: true, latitude: true, longitude: true },
  },
  photos: {
    where: { status: "APPROVED" },
    orderBy: [{ isOfficial: "desc" }, { createdAt: "desc" }],
    select: publicPhotoSelect,
  },
} satisfies Prisma.PropertyInclude;

export type PropertyWithRelations = Prisma.PropertyGetPayload<{ include: typeof propertyInclude }>;

export function nearbyColleges(p: Point, colleges: College[], radiusKm = 15, limit = 5) {
  return colleges
    .map((c) => ({ id: c.id, name: c.name, city: c.city, distanceKm: distanceKm(p, c) }))
    .filter((c) => c.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function serializeProperty(
  p: PropertyWithRelations,
  ratings: RatingsMap,
  colleges: College[],
  ref?: Point | null
) {
  const { rooms, amenities, photos, ...rest } = p;
  const availableBeds = rooms.reduce((sum, r) => sum + r.availableBeds, 0);
  const nearest = nearbyColleges(p, colleges, Infinity, 1)[0] ?? null;

  return {
    ...rest,
    amenities: amenities.map((a) => a.name),
    rooms: rooms.map((r) => ({ id: r.id, type: r.type, rent: r.rent, totalBeds: r.totalBeds, availableBeds: r.availableBeds })),
    roomTypes: Array.from(new Set(rooms.map((r) => r.type))),
    availableBeds,
    availability: availableBeds > 0 ? "Available" : "Full",
    photos: photos.map((ph) => ({ ...ph, label: photoCaption(ph) })),
    ...ratingSummary(ratings.get(p.id)),
    distanceKm: ref ? distanceKm(p, ref) : null,
    nearestCollege: nearest ? { name: nearest.name, distanceKm: nearest.distanceKm } : null,
  };
}

export type SerializedProperty = ReturnType<typeof serializeProperty>;
