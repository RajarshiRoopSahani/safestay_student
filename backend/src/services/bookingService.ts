import { Prisma, RoomType } from "@prisma/client";

// Takes beds from rooms of this type. Returns false if there are not enough.
export async function reserveBeds(
  tx: Prisma.TransactionClient,
  propertyId: string,
  roomType: RoomType,
  count: number
): Promise<boolean> {
  const rooms = await tx.room.findMany({
    where: { propertyId, type: roomType, availableBeds: { gt: 0 } },
    orderBy: { availableBeds: "desc" },
  });
  const total = rooms.reduce((sum, r) => sum + r.availableBeds, 0);
  if (total < count) return false;

  let remaining = count;
  for (const room of rooms) {
    const take = Math.min(room.availableBeds, remaining);
    await tx.room.update({ where: { id: room.id }, data: { availableBeds: { decrement: take } } });
    remaining -= take;
    if (remaining === 0) break;
  }
  return true;
}

// Gives beds back (never above a room's total beds).
export async function releaseBeds(
  tx: Prisma.TransactionClient,
  propertyId: string,
  roomType: RoomType,
  count: number
): Promise<void> {
  const rooms = await tx.room.findMany({ where: { propertyId, type: roomType } });
  let remaining = count;
  for (const room of rooms) {
    const space = room.totalBeds - room.availableBeds;
    const give = Math.min(space, remaining);
    if (give > 0) {
      await tx.room.update({ where: { id: room.id }, data: { availableBeds: { increment: give } } });
      remaining -= give;
    }
    if (remaining === 0) break;
  }
}
