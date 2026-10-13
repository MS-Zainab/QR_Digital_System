import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "Phone required" }, { status: 400 });
  }

  const merchant = await prisma.merchant.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      businessType: true,
      primaryColor: true,
      stampsRequired: true,
      rewardDescription: true,
    },
  });

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  const customer = await prisma.customer.findUnique({
    where: { phoneNumber: phone },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const card = await prisma.customerCard.findUnique({
    where: {
      customerId_merchantId: {
        customerId: customer.id,
        merchantId: merchant.id,
      },
    },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const [stamps, redemptions] = await Promise.all([
    prisma.stampRequest.findMany({
      where: {
        customerId: customer.id,
        merchantId: merchant.id,
        status: "APPROVED",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    }),
    prisma.redeemedReward.findMany({
      where: {
        customerId: customer.id,
        merchantId: merchant.id,
      },
      orderBy: { redeemedAt: "desc" },
      select: { id: true, rewardText: true, redeemedAt: true, notes: true },
    }),
  ]);

  return NextResponse.json({
    id: card.id,
    stampCount: card.stampCount,
    isRedeemed: card.isRedeemed,
    merchant,
    history: {
      stamps: stamps.map((s) => ({ id: s.id, at: s.createdAt.toISOString() })),
      redemptions: redemptions.map((r) => ({
        id: r.id,
        rewardText: r.rewardText,
        at: r.redeemedAt.toISOString(),
        notes: r.notes,
      })),
    },
  });
}