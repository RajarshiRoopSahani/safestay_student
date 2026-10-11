import { PrismaClient, PropertyType, RoomType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type Features = {
  foodIncluded?: boolean; wifi?: boolean; ac?: boolean; cooler?: boolean;
  attachedBathroom?: boolean; laundry?: boolean; parking?: boolean;
  cctv?: boolean; furnished?: boolean; electricityIncluded?: boolean;
};

const buildingsData = {
  aliganjPlaza: { name: "Demo Plaza", address: "Demo Plaza, Sample Road, Aliganj", city: "Lucknow", area: "Aliganj", pincode: "226024", latitude: 26.8883, longitude: 80.944 },
  aliganjLane: { name: "Demo Residency Block", address: "Demo Lane, Sector Demo, Aliganj", city: "Lucknow", area: "Aliganj", pincode: "226024", latitude: 26.8921, longitude: 80.9508 },
  gomtiBlock: { name: "Demo Gomti Block", address: "Demo Block, Sample Avenue, Gomti Nagar", city: "Lucknow", area: "Gomti Nagar", pincode: "226010", latitude: 26.8523, longitude: 81.007 },
  deoriaCourt: { name: "Demo Court", address: "Demo Court, Sample Road, Deoria", city: "Deoria", area: "Deoria", pincode: "274001", latitude: 26.5024, longitude: 83.7791 },
  jaunpurHouse: { name: "Demo House", address: "Demo House, Sample Street, Jaunpur", city: "Jaunpur", area: "Jaunpur", pincode: "222001", latitude: 25.7464, longitude: 82.6837 },
} as const;

type BuildingKey = keyof typeof buildingsData;

const collegesData = [
  { name: "Demo Engineering College (Aliganj)", city: "Lucknow", latitude: 26.895, longitude: 80.948 },
  { name: "Demo Institute of Technology (Gomti Nagar)", city: "Lucknow", latitude: 26.856, longitude: 81.01 },
  { name: "Demo Degree College (Deoria)", city: "Deoria", latitude: 26.505, longitude: 83.78 },
  { name: "Demo College (Jaunpur)", city: "Jaunpur", latitude: 25.75, longitude: 82.69 },
];

const amenityNames = ["Wi-Fi", "Meals", "Air Conditioning", "Cooler", "Attached Bathroom", "Laundry", "Parking", "CCTV", "Power Backup", "Study Room", "Gym", "RO Water"];

const propertiesData: {
  name: string; type: PropertyType; building: BuildingKey; description: string;
  rent: number; deposit: number; features: Features; amenities: string[];
  rooms: { type: RoomType; rent: number; totalBeds: number; availableBeds: number }[];
}[] = [
  {
    name: "SafeStay Residency", type: "HOSTEL", building: "aliganjPlaza",
    description: "A sample hostel for students with common study area and meals.",
    rent: 8000, deposit: 8000,
    features: { foodIncluded: true, wifi: true, ac: true, attachedBathroom: true, laundry: true, cctv: true, furnished: true, electricityIncluded: true },
    amenities: ["Wi-Fi", "Meals", "Air Conditioning", "Attached Bathroom", "Laundry", "CCTV", "Power Backup", "Study Room"],
    rooms: [
      { type: "SINGLE", rent: 10000, totalBeds: 10, availableBeds: 2 },
      { type: "DOUBLE", rent: 8000, totalBeds: 20, availableBeds: 5 },
    ],
  },
  {
    name: "Student Heights", type: "HOSTEL", building: "aliganjLane",
    description: "A sample budget hostel with Wi-Fi and meals.",
    rent: 7000, deposit: 5000,
    features: { foodIncluded: true, wifi: true, cooler: true, laundry: true, cctv: true },
    amenities: ["Wi-Fi", "Meals", "Cooler", "Laundry", "CCTV", "RO Water"],
    rooms: [
      { type: "DOUBLE", rent: 7000, totalBeds: 24, availableBeds: 6 },
      { type: "TRIPLE", rent: 6000, totalBeds: 30, availableBeds: 9 },
    ],
  },
  {
    name: "Campus View PG", type: "PG", building: "aliganjLane",
    description: "A sample paying-guest accommodation near a college area.",
    rent: 6500, deposit: 6500,
    features: { wifi: true, cooler: true, attachedBathroom: true, parking: true },
    amenities: ["Wi-Fi", "Cooler", "Attached Bathroom", "Parking", "RO Water"],
    rooms: [
      { type: "SINGLE", rent: 8000, totalBeds: 6, availableBeds: 1 },
      { type: "DOUBLE", rent: 6500, totalBeds: 12, availableBeds: 4 },
    ],
  },
  {
    name: "Green Valley Hostel", type: "HOSTEL", building: "gomtiBlock",
    description: "A sample hostel with gym and study room.",
    rent: 7500, deposit: 7500,
    features: { foodIncluded: true, wifi: true, ac: true, parking: true, cctv: true, furnished: true },
    amenities: ["Wi-Fi", "Meals", "Air Conditioning", "Parking", "CCTV", "Gym", "Study Room"],
    rooms: [
      { type: "SINGLE", rent: 9500, totalBeds: 8, availableBeds: 0 },
      { type: "DOUBLE", rent: 7500, totalBeds: 20, availableBeds: 3 },
    ],
  },
  {
    name: "Scholar Stay", type: "PG", building: "gomtiBlock",
    description: "A sample PG with simple rooms and shared facilities.",
    rent: 6000, deposit: 4000,
    features: { wifi: true, cooler: true },
    amenities: ["Wi-Fi", "Cooler", "RO Water"],
    rooms: [
      { type: "DOUBLE", rent: 6000, totalBeds: 14, availableBeds: 5 },
      { type: "TRIPLE", rent: 5000, totalBeds: 18, availableBeds: 7 },
    ],
  },
  {
    name: "Demo Budget Rooms", type: "ROOM", building: "deoriaCourt",
    description: "Sample basic rooms for rent.",
    rent: 4500, deposit: 3000,
    features: { cooler: true },
    amenities: ["Cooler", "RO Water"],
    rooms: [{ type: "SINGLE", rent: 4500, totalBeds: 5, availableBeds: 2 }],
  },
  {
    name: "Jaunpur Student Nest", type: "PG", building: "jaunpurHouse",
    description: "A sample PG with meals included.",
    rent: 5000, deposit: 3500,
    features: { foodIncluded: true, wifi: true, cooler: true },
    amenities: ["Wi-Fi", "Meals", "Cooler"],
    rooms: [{ type: "DOUBLE", rent: 5000, totalBeds: 10, availableBeds: 4 }],
  },
  {
    name: "Aliganj Studio Flat", type: "FLAT", building: "aliganjPlaza",
    description: "A sample furnished flat suitable for small groups.",
    rent: 9500, deposit: 10000,
    features: { wifi: true, ac: true, attachedBathroom: true, parking: true, furnished: true, cctv: true },
    amenities: ["Wi-Fi", "Air Conditioning", "Attached Bathroom", "Parking", "CCTV", "Power Backup"],
    rooms: [{ type: "SINGLE", rent: 9500, totalBeds: 3, availableBeds: 1 }],
  },
];

async function main() {
  // Reset demo data (safe to re-run)
  await prisma.property.deleteMany({ where: { isDemo: true } });
  await prisma.building.deleteMany();
  await prisma.college.deleteMany();

  // Demo users (skipped when SEED_DEMO_USERS=false, for example in production)
  if (process.env.SEED_DEMO_USERS !== "false") {
    const adminHash = await bcrypt.hash("Admin@12345", 12);
    const studentHash = await bcrypt.hash("Student@12345", 12);
    await prisma.user.upsert({
      where: { email: "admin@safestay.demo" }, update: {},
      create: { name: "Demo Admin", email: "admin@safestay.demo", passwordHash: adminHash, role: "ADMIN" },
    });
    await prisma.user.upsert({
      where: { email: "student@safestay.demo" }, update: {},
      create: { name: "Demo Student", email: "student@safestay.demo", passwordHash: studentHash, role: "STUDENT" },
    });
  }

  for (const name of amenityNames) {
    await prisma.amenity.upsert({ where: { name }, update: {}, create: { name } });
  }

  await prisma.college.createMany({ data: collegesData });

  const buildingIds: Record<string, string> = {};
  for (const [key, b] of Object.entries(buildingsData)) {
    const created = await prisma.building.create({ data: b });
    buildingIds[key] = created.id;
  }

  for (const p of propertiesData) {
    const b = buildingsData[p.building];
    await prisma.property.create({
      data: {
        name: p.name,
        type: p.type,
        description: `[DEMO DATA] ${p.description}`,
        buildingId: buildingIds[p.building],
        address: b.address, city: b.city, area: b.area, pincode: b.pincode,
        latitude: b.latitude, longitude: b.longitude,
        rent: p.rent, deposit: p.deposit,
        ...p.features,
        waterInfo: "Demo info: water supply details not verified.",
        rules: "Demo rules: visitors until 8 PM. Quiet hours after 10 PM.",
        securityInfo: p.features.cctv ? "Demo info: CCTV listed in common areas." : "Demo info: no security details listed.",
        nearbyPlaces: "Demo info: grocery store, tea stall and bus stop nearby.",
        isDemo: true,
        amenities: { connect: p.amenities.map((name) => ({ name })) },
        rooms: { create: p.rooms },
      },
    });
  }

  console.log("Seed complete: 4 colleges, 5 buildings, 8 demo properties (demo users unless SEED_DEMO_USERS=false).");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
