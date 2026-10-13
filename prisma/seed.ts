import { PrismaClient, BusinessType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");
    // Ensure platform settings exist
  await prisma.platformSettings.upsert({
    where: { id: "global" },
    update: {},
    create: { id: "global", signupMode: "AUTO" },
  });
  console.log("✅ Platform settings initialized (mode: AUTO)\n");

  const pinHash = await bcrypt.hash("1234", 10);

  // Trial ends 15 days from now
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 15);

  const demos = [
    {
      name: "Cafe Bliss",
      email: "cafe@example.com",
      passwordHash: pinHash,
      businessType: BusinessType.cafe,
      primaryColor: "#d97706",
      stampsRequired: 10,
      rewardDescription: "Free signature coffee",
      staffPinHash: pinHash,
      trialEndsAt,
    },
    {
      name: "Glamour Salon",
      email: "salon@example.com",
      passwordHash: pinHash,
      businessType: BusinessType.salon,
      primaryColor: "#db2777",
      stampsRequired: 8,
      rewardDescription: "Free haircut",
      staffPinHash: pinHash,
      trialEndsAt,
    },
    {
      name: "Urban Threads",
      email: "retail@example.com",
      passwordHash: pinHash,
      businessType: BusinessType.retail,
      primaryColor: "#059669",
      stampsRequired: 12,
      rewardDescription: "20% off next purchase",
      staffPinHash: pinHash,
      trialEndsAt,
    },
  ];

  for (const demo of demos) {
    const existing = await prisma.merchant.findFirst({
      where: { name: demo.name },
    });

    if (existing) {
      console.log(`⏭️  Skipped (exists): ${existing.name}`);
      continue;
    }

    const merchant = await prisma.merchant.create({ data: demo });
    console.log(`✅ Created: ${merchant.name}`);
    console.log(`   Email: ${merchant.email}`);
    console.log(`   Password: 1234`);
    console.log(`   Staff PIN: 1234`);
    console.log(`   Trial ends: ${merchant.trialEndsAt.toISOString()}\n`);
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });