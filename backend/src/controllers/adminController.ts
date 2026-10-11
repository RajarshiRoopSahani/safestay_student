import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function getStats(_req: Request, res: Response) {
  const [
    totalStudents,
    totalProperties,
    activeProperties,
    totalBookings,
    pendingBookings,
    pendingPhotos,
    pendingReviews,
    openReports,
    bookingsByStatus,
    propertiesByType,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.property.count(),
    prisma.property.count({ where: { isActive: true } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.photo.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.property.groupBy({ by: ["type"], _count: { _all: true } }),
  ]);

  res.json({
    totalStudents,
    totalProperties,
    activeProperties,
    inactiveProperties: totalProperties - activeProperties,
    totalBookings,
    pendingBookings,
    pendingPhotos,
    pendingReviews,
    openReports,
    bookingsByStatus: Object.fromEntries(bookingsByStatus.map((b) => [b.status, b._count._all])),
    propertiesByType: Object.fromEntries(propertiesByType.map((p) => [p.type, p._count._all])),
  });
}

const usersSchema = pageSchema.extend({
  q: z.string().trim().max(100).optional(),
  role: z.enum(["STUDENT", "ADMIN"]).optional(),
});

export async function listUsers(req: Request, res: Response) {
  const { page, limit, q, role } = usersSchema.parse(req.query);

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { bookings: true, reviews: true, photos: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ total, page, totalPages: Math.max(1, Math.ceil(total / limit)), users });
}

const propertiesSchema = pageSchema.extend({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// Unlike the public search, this includes deactivated properties.
export async function listAdminProperties(req: Request, res: Response) {
  const { page, limit, q, status } = propertiesSchema.parse(req.query);

  const where: Prisma.PropertyWhereInput = {
    ...(status ? { isActive: status === "active" } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { area: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        area: true,
        city: true,
        rent: true,
        isActive: true,
        isDemo: true,
        createdAt: true,
        rooms: { select: { id: true, type: true, rent: true, totalBeds: true, availableBeds: true } },
        _count: { select: { reviews: true, photos: true, bookings: true, reports: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  res.json({ total, page, totalPages: Math.max(1, Math.ceil(total / limit)), properties });
}

// ----- Buildings -----

const buildingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().min(5).max(250),
  city: z.string().trim().min(2).max(60),
  area: z.string().trim().min(2).max(60),
  pincode: z.string().trim().max(10).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export async function listBuildings(_req: Request, res: Response) {
  const buildings = await prisma.building.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { properties: true } } },
  });
  res.json({ buildings });
}

export async function createBuilding(req: Request, res: Response) {
  const data = buildingSchema.parse(req.body);
  const building = await prisma.building.create({ data });
  res.status(201).json({ building });
}

export async function updateBuilding(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = buildingSchema.partial().parse(req.body);
  const existing = await prisma.building.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError(404, "Building not found");
  const building = await prisma.building.update({ where: { id }, data });
  res.json({ building });
}

// ----- Rooms -----

const roomUpdateSchema = z
  .object({
    type: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"]).optional(),
    rent: z.number().int().min(0).max(1000000).optional(),
    totalBeds: z.number().int().min(1).max(500).optional(),
    availableBeds: z.number().int().min(0).max(500).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Send at least one field to update" });

const roomCreateSchema = z
  .object({
    type: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"]),
    rent: z.number().int().min(0).max(1000000),
    totalBeds: z.number().int().min(1).max(500),
    availableBeds: z.number().int().min(0).max(500),
  })
  .refine((r) => r.availableBeds <= r.totalBeds, { message: "availableBeds cannot exceed totalBeds" });

export async function addRoom(req: Request, res: Response) {
  const propertyId = String(req.params.id);
  const data = roomCreateSchema.parse(req.body);
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
  if (!property) throw new AppError(404, "Property not found");
  const room = await prisma.room.create({ data: { ...data, propertyId } });
  res.status(201).json({ room });
}

export async function updateRoom(req: Request, res: Response) {
  const id = String(req.params.id);
  const data = roomUpdateSchema.parse(req.body);
  const existing = await prisma.room.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Room not found");

  const totalBeds = data.totalBeds ?? existing.totalBeds;
  const availableBeds = data.availableBeds ?? existing.availableBeds;
  if (availableBeds > totalBeds) throw new AppError(400, "availableBeds cannot exceed totalBeds");

  const room = await prisma.room.update({ where: { id }, data });
  res.json({ room });
}

export async function deleteRoom(req: Request, res: Response) {
  const id = String(req.params.id);
  const existing = await prisma.room.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new AppError(404, "Room not found");
  await prisma.room.delete({ where: { id } });
  res.json({ message: "Room deleted" });
}
