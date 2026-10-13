import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { email: email.toLowerCase() },
        select: {
      id: true,
      name: true,
      businessType: true,
      logoUrl: true,
      primaryColor: true,
      stampsRequired: true,
      rewardDescription: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
      slug: true,
    },
  });

  if (!merchant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(merchant);
}