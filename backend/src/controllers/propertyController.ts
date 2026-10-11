import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { getRatingsMap } from "../services/ratingService";
import {
  nearbyColleges,
  propertyInclude,
  serializeProperty,
} from "../services/propertyService";

const roomTypeEnum = z.enum([
  "SINGLE",
  "DOUBLE",
  "TRIPLE",
  "DORMITORY",
]);

const roomSchema = z
  .object({
    type: roomTypeEnum,
    rent: z.number().int().min(0).max(1000000),
    totalBeds: z.number().int().min(1).max(500),
    availableBeds: z.number().int().min(0).max(500),
  })
  .refine(
    (r) => r.availableBeds <= r.totalBeds,
    {
      message: "availableBeds cannot exceed totalBeds",
    }
  );

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  type: z.enum(["HOSTEL", "PG", "ROOM", "FLAT"]),
  description: z.string().trim().min(10).max(3000),
  buildingId: z.string().nullable().optional(),
  address: z.string().trim().min(5).max(250),
  city: z.string().trim().min(2).max(60),
  area: z.string().trim().min(2).max(60),
  pincode: z.string().trim().max(10).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  rent: z.number().int().min(0).max(1000000),
  deposit: z.number().int().min(0).max(1000000),

  foodIncluded: z.boolean().optional(),
  wifi: z.boolean().optional(),
  ac: z.boolean().optional(),
  cooler: z.boolean().optional(),
  attachedBathroom: z.boolean().optional(),
  laundry: z.boolean().optional(),
  parking: z.boolean().optional(),
  cctv: z.boolean().optional(),
  furnished: z.boolean().optional(),
  electricityIncluded: z.boolean().optional(),

  waterInfo: z.string().trim().max(500).optional(),
  rules: z.string().trim().max(2000).optional(),
  securityInfo: z.string().trim().max(1000).optional(),
  nearbyPlaces: z.string().trim().max(1000).optional(),

  isActive: z.boolean().optional(),

  amenities: z
    .array(z.string().trim().min(1).max(40))
    .max(30)
    .optional(),

  rooms: z.array(roomSchema).max(20).optional(),
});

const updateSchema = createSchema.partial();

async function assertBuildingExists(buildingId?: string | null) {
  if (!buildingId) return;

  const b = await prisma.building.findUnique({
    where: { id: buildingId },
  });

  if (!b) {
    throw new AppError(400, "buildingId does not exist");
  }
}

const amenityConnect = (names: string[]) => ({
  connectOrCreate: names.map((name) => ({
    where: { name },
    create: { name },
  })),
});

export async function getProperty(req: Request, res: Response) {
  const id = String(req.params.id);

  const property = await prisma.property.findUnique({
    where: { id },
    include: propertyInclude,
  });

  if (
    !property ||
    (!property.isActive && req.user?.role !== "ADMIN")
  ) {
    throw new AppError(404, "Property not found");
  }

  const [
    colleges,
    sameAreaRows,
    sameBuildingRows,
  ] = await Promise.all([
    prisma.college.findMany(),

    prisma.property.findMany({
      where: {
        isActive: true,
        id: { not: id },
        area: property.area,
        ...(property.buildingId
          ? {
              buildingId: {
                not: property.buildingId,
              },
            }
          : {}),
      },
      include: propertyInclude,
      take: 4,
    }),

    property.buildingId
      ? prisma.property.findMany({
          where: {
            isActive: true,
            id: { not: id },
            buildingId: property.buildingId,
          },
          include: propertyInclude,
          take: 10,
        })
      : Promise.resolve([]),
  ]);

  const ids = [
    id,
    ...sameAreaRows.map((p) => p.id),
    ...sameBuildingRows.map((p) => p.id),
  ];

  const ratings = await getRatingsMap(ids);

  const detail = serializeProperty(
    property,
    ratings,
    colleges
  );

  const { photos, ...rest } = detail;

  res.json({
    property: {
      ...rest,
      officialPhotos: photos.filter(
        (p) => p.isOfficial
      ),
      communityPhotos: photos.filter(
        (p) => !p.isOfficial
      ),
    },

    nearbyColleges: nearbyColleges(
      property,
      colleges
    ),

    sameBuilding: sameBuildingRows.map((p) =>
      serializeProperty(
        p,
        ratings,
        colleges
      )
    ),

    similarNearby: sameAreaRows.map((p) =>
      serializeProperty(
        p,
        ratings,
        colleges
      )
    ),

    notice:
      "Photos and reviews are shared by students and may not show the current condition. Please visit and verify the property personally before booking.",
  });
}

export async function createProperty(
  req: Request,
  res: Response
) {
  if (!req.user) {
    throw new AppError(
      401,
      "Authentication required"
    );
  }

  const {
    amenities,
    rooms,
    ...data
  } = createSchema.parse(req.body);

  await assertBuildingExists(
    data.buildingId
  );

  /*
   * OWNER:
   * Automatically attach the new property
   * to the logged-in owner's account.
   *
   * ADMIN:
   * Keep ownerId empty for now so the
   * existing admin workflow continues to work.
   */
  const ownerId =
    req.user.role === "OWNER"
      ? req.user.id
      : undefined;

  const created =
    await prisma.property.create({
      data: {
        ...data,

        ...(ownerId
          ? {
              ownerId,
            }
          : {}),

        ...(amenities
          ? {
              amenities:
                amenityConnect(amenities),
            }
          : {}),

        ...(rooms
          ? {
              rooms: {
                create: rooms,
              },
            }
          : {}),
      },

      select: {
        id: true,
        ownerId: true,
      },
    });

  res.status(201).json({
    id: created.id,
    ownerId: created.ownerId,
    message: "Property created",
  });
}

export async function updateProperty(
  req: Request,
  res: Response
) {
  const id = String(req.params.id);

  const {
    amenities,
    rooms,
    ...data
  } = updateSchema.parse(req.body);

  const existing =
    await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
      },
    });

  if (!existing) {
    throw new AppError(
      404,
      "Property not found"
    );
  }

  /*
   * OWNER can only update their own property.
   * ADMIN can update any property.
   */
  if (
    req.user?.role === "OWNER" &&
    existing.ownerId !== req.user.id
  ) {
    throw new AppError(
      403,
      "You can only update your own properties"
    );
  }

  await assertBuildingExists(
    data.buildingId
  );

  await prisma.$transaction(
    async (tx) => {
      if (rooms) {
        await tx.room.deleteMany({
          where: {
            propertyId: id,
          },
        });

        await tx.room.createMany({
          data: rooms.map((r) => ({
            ...r,
            propertyId: id,
          })),
        });
      }

      if (amenities) {
        await tx.property.update({
          where: { id },
          data: {
            amenities: {
              set: [],
            },
          },
        });
      }

      await tx.property.update({
        where: { id },
        data: {
          ...data,

          /*
           * Do NOT allow an owner to change
           * ownerId through the request body.
           */
          ...(amenities
            ? {
                amenities:
                  amenityConnect(
                    amenities
                  ),
              }
            : {}),
        },
      });
    }
  );

  res.json({
    id,
    message: "Property updated",
  });
}

export async function deleteProperty(
  req: Request,
  res: Response
) {
  const id = String(req.params.id);

  const existing =
    await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
      },
    });

  if (!existing) {
    throw new AppError(
      404,
      "Property not found"
    );
  }

  /*
   * OWNER can only delete their own property.
   * ADMIN can delete any property.
   */
  if (
    req.user?.role === "OWNER" &&
    existing.ownerId !== req.user.id
  ) {
    throw new AppError(
      403,
      "You can only delete your own properties"
    );
  }

  await prisma.property.delete({
    where: { id },
  });

  res.json({
    message: "Property deleted",
  });
}

export async function getMyProperties(
  req: Request,
  res: Response
) {
  if (!req.user) {
    throw new AppError(401, "Authentication required");
  }

  const properties = await prisma.property.findMany({
    where:
      req.user.role === "ADMIN"
        ? {}
        : { ownerId: req.user.id },
    include: {
      building: true,
      amenities: true,
      rooms: true,
      photos: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json({ properties });
}
