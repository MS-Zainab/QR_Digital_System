import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; customerId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: merchantId, customerId } = await params;

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { email: true, stampsRequired: true, rewardDescription: true },
    });

    if (
      !merchant ||
      merchant.email.toLowerCase() !== user.email?.toLowerCase()
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const card = await prisma.customerCard.findUnique({
      where: {
        customerId_merchantId: { customerId, merchantId },
      },
    });

    const visits = await prisma.scanLog.findMany({
      where: { customerId, merchantId },
      orderBy: { scannedAt: "desc" },
      select: {
        id: true,
        scannedAt: true,
      },
    });

    const redemptions = await prisma.redeemedReward.findMany({
      where: { customerId, merchantId },
      orderBy: { redeemedAt: "desc" },
      select: {
        id: true,
        rewardText: true,
        redeemedAt: true,
        notes: true,
      },
    });

    const consent = await prisma.customerMerchantConsent.findUnique({
      where: {
        customerId_merchantId: { customerId, merchantId },
      },
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        joinedAt: customer.createdAt.toISOString(),
      },
      card: card
        ? {
            stampCount: card.stampCount,
            isRedeemed: card.isRedeemed,
            updatedAt: card.updatedAt.toISOString(),
          }
        : null,
      visits: visits.map((v) => ({
        id: v.id,
        scannedAt: v.scannedAt.toISOString(),
      })),
      redemptions: redemptions.map((r) => ({
        id: r.id,
        rewardText: r.rewardText,
        redeemedAt: r.redeemedAt.toISOString(),
        notes: r.notes,
      })),
      consent: {
        consented: consent?.consented ?? false,
        consentedAt: consent?.consentedAt?.toISOString() ?? null,
      },
      stampsRequired: merchant.stampsRequired,
      rewardDescription: merchant.rewardDescription,
    });
  } catch (err) {
    console.error("Customer detail error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}