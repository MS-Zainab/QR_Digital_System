import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "merchant"
  );
}

async function main() {
  console.log("🔧 Backfilling slugs for merchants without one...\n");

  const merchants = await prisma.merchant.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  });

  if (merchants.length === 0) {
    console.log("✅ All merchants already have slugs.\n");
    return;
  }

  console.log(`Found ${merchants.length} merchants without slugs.\n`);

  for (const merchant of merchants) {
    const baseSlug = generateSlug(merchant.name);
    let slug = baseSlug;
    let suffix = 1;

    while (true) {
      const existing = await prisma.merchant.findUnique({
        where: { slug },
      });
      if (!existing) break;
      suffix++;
      slug = `${baseSlug}-${suffix}`;
      if (suffix > 50) {
        slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
        break;
      }
    }

    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { slug },
    });

    console.log(`✅ ${merchant.name} → /${slug}`);
  }

  console.log(`\n🎉 Backfilled ${merchants.length} merchants!`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());