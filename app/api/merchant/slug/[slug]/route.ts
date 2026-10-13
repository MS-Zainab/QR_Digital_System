import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const normalizedSlug = slug.toLowerCase().trim();

    const merchant = await prisma.merchant.findUnique({
      where: { slug: normalizedSlug },
      select: {
        id: true,
        name: true,
        businessType: true,
        rewardDescription: true,
        stampsRequired: true,
        primaryColor: true,
        logoUrl: true,
        subscriptionStatus: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Blocked if subscription inactive
    if (
      merchant.subscriptionStatus !== "TRIAL" &&
      merchant.subscriptionStatus !== "ACTIVE"
    ) {
      return NextResponse.json(
        { error: "Store temporarily unavailable" },
        { status: 403 }
      );
    }

    return NextResponse.json(merchant);
  } catch (err) {
    console.error("Slug lookup error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}