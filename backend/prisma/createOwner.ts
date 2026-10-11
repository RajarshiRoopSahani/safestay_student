import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  const name = process.env.OWNER_NAME?.trim() || "Property Owner";

  if (!email || !password) {
    throw new Error("Set OWNER_EMAIL and OWNER_PASSWORD before running this script.");
  }

  if (password.length < 12) {
    throw new Error("OWNER_PASSWORD must be at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name,
      role: "OWNER",
    },
    create: {
      name,
      email,
      passwordHash,
      role: "OWNER",
    },
  });

  console.log(`Owner account ready: ${email}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());