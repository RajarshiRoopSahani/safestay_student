-- CreateEnum
CREATE TYPE "ListingVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MapPlaceCategory" AS ENUM ('HOSTEL', 'PG', 'ROOM', 'APARTMENT', 'COLLEGE', 'LANDMARK', 'OTHER');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "verificationStatus" "ListingVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MapPlace" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'OPENSTREETMAP',
    "name" TEXT NOT NULL,
    "category" "MapPlaceCategory" NOT NULL DEFAULT 'OTHER',
    "address" TEXT,
    "city" TEXT,
    "area" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION,
    "website" TEXT,
    "phone" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedById" TEXT,
    "claimedAt" TIMESTAMP(3),
    "userId" TEXT,

    CONSTRAINT "MapPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MapPlace_externalId_key" ON "MapPlace"("externalId");

-- CreateIndex
CREATE INDEX "MapPlace_city_area_idx" ON "MapPlace"("city", "area");

-- CreateIndex
CREATE INDEX "MapPlace_latitude_longitude_idx" ON "MapPlace"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "MapPlace_category_idx" ON "MapPlace"("category");

-- AddForeignKey
ALTER TABLE "MapPlace" ADD CONSTRAINT "MapPlace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
