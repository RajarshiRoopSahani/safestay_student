import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { releaseBeds, reserveBeds } from "../services/bookingService";

const createSchema = z.object({
  propertyId: z.string().min(1),
  roomType: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "DORMITORY"]),
  moveInDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
    .transform((s) => new Date(`${s}T00:00:00.000Z`))
    .refine((d) => !isNaN(d.getTime()), "Invalid date")
    .refine((d) => {
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const limit = new Date(today.getTime() + 365 * 86400000);
      return d >= today && d <= limit;
    }, "Move-in date must be between today and one year from now"),
  occupants: z.number().int().min(1).max(10),
  contactName: z.string().trim().min(2).max(60),
  contactPhone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Invalid phone number"),
  note: z.string().trim().max(500).optional(),
});

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "CANCELLED"]),
});

const listSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const bookingSelect = {
  id: true,
  roomType: true,
  moveInDate: true,
  occupants: true,
  contactName: true,
  contactPhone: true,
  note: true,
  status: true,
  createdAt: true,
  property: { select: { id: true, name: true, type: true, area: true, city: true, rent: true } },
} as const;

// Admins additionally see the account behind the request.
const adminBookingSelect = {
  ...bookingSelect,
  user: { select: { id: true, name: true, email: true } },
} as const;

export async function createBooking(req: Request, res: Response) {
  const data = createSchema.parse(req.body);
  const userId = req.user!.id;

  const property = await prisma.property.findUnique({
    where: { id: data.propertyId },
    select: { id: true, isActive: true, rooms: { select: { type: true, availableBeds: true } } },
  });
  if (!property || !property.isActive) throw new AppError(404, "Property not found");

  const matching = property.rooms.filter((r) => r.type === data.roomType);
  if (matching.length === 0) throw new AppError(400, "This property has no rooms of that type");

  const available = matching.reduce((sum, r) => sum + r.availableBeds, 0);
  if (available < data.occupants) {
    throw new AppError(400, `Only ${available} bed(s) currently available for that room type`);
  }

  const open = await prisma.booking.findFirst({
    where: { userId, propertyId: data.propertyId, status: { in: ["PENDING", "APPROVED"] } },
    select: { id: true },
  });
  if (open) throw new AppError(409, "You already have an active booking request for this property");

  const booking = await prisma.booking.create({
    data: { ...data, userId },
    select: bookingSelect,
  });

  res.status(201).json({
    booking,
    message: "Booking request sent. The property is not reserved until it is approved. Please visit and verify before paying anything.",
  });
}

export async function listBookings(req: Request, res: Response) {
  const { status, page, limit } = listSchema.parse(req.query);
  const isAdmin = req.user!.role === "ADMIN";
  const where = { ...(isAdmin ? {} : { userId: req.user!.id }), ...(status ? { status } : {}) };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: isAdmin ? adminBookingSelect : bookingSelect,
    }),
    prisma.booking.count({ where }),
  ]);

  res.json({ total, page, totalPages: Math.max(1, Math.ceil(total / limit)), bookings });
}

export async function getBooking(req: Request, res: Response) {
  const id = String(req.params.id);
  const isAdmin = req.user!.role === "ADMIN";

  const booking = await prisma.booking.findFirst({
    where: { id, ...(isAdmin ? {} : { userId: req.user!.id }) },
    select: isAdmin ? adminBookingSelect : bookingSelect,
  });
  if (!booking) throw new AppError(404, "Booking not found");

  res.json({ booking });
}

export async function updateBooking(req: Request, res: Response) {
  const id = String(req.params.id);
  const { status: next } = updateSchema.parse(req.body);
  const isAdmin = req.user!.role === "ADMIN";

  const booking = await prisma.booking.findFirst({
    where: { id, ...(isAdmin ? {} : { userId: req.user!.id }) },
  });
  if (!booking) throw new AppError(404, "Booking not found");

  // Who can do what
  if (isAdmin) {
    if (booking.status !== "PENDING" || (next !== "APPROVED" && next !== "REJECTED")) {
      throw new AppError(400, "Admins can only approve or reject PENDING requests");
    }
  } else {
    if (next !== "CANCELLED") throw new AppError(403, "Students can only cancel their own requests");
    if (booking.status !== "PENDING" && booking.status !== "APPROVED") {
      throw new AppError(400, `A ${booking.status.toLowerCase()} request cannot be cancelled`);
    }
  }

  await prisma.$transaction(async (tx) => {
    if (next === "APPROVED") {
      const ok = await reserveBeds(tx, booking.propertyId, booking.roomType, booking.occupants);
      if (!ok) throw new AppError(409, "Not enough beds are available to approve this request");
    }
    if (booking.status === "APPROVED" && next === "CANCELLED") {
      await releaseBeds(tx, booking.propertyId, booking.roomType, booking.occupants);
    }
    await tx.booking.update({ where: { id }, data: { status: next } });
  });

  const updated = await prisma.booking.findUnique({
    where: { id },
    select: isAdmin ? adminBookingSelect : bookingSelect,
  });
  res.json({ booking: updated, message: `Booking ${next.toLowerCase()}` });
}
