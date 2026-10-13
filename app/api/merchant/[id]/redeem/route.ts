import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscriptionGuard";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify merchant auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: merchantId } = await params;
    const body = await req.json();
    const { customerId, notes } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId required" },
        { status: 400 }
      );
    }

    // Verify merchant belongs to user
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        email: true,
        stampsRequired: true,
        rewardDescription: true,
      },
    });

    if (
      !merchant ||
      merchant.email.toLowerCase() !== user.email?.toLowerCase()
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
        // Check subscription status
    const check = await checkSubscription(merchantId);
    if (!check || !check.allowed) {
      return NextResponse.json(
        {
          error: check?.reason || "Subscription inactive",
          subscriptionStatus: check?.status,
        },
        { status: 403 }
      );
    }
    // Find the customer's card
    const card = await prisma.customerCard.findUnique({
      where: {
        customerId_merchantId: { customerId, merchantId },
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Customer has no card here" },
        { status: 404 }
      );
    }

    if (card.stampCount < merchant.stampsRequired) {
      return NextResponse.json(
        {
          error: `Customer has only ${card.stampCount}/${merchant.stampsRequired} stamps — reward not ready`,
        },
        { status: 400 }
      );
    }

    // Redeem: create record + reset card
    const redeemedAt = new Date();

    const [redemption] = await prisma.$transaction([
      prisma.redeemedReward.create({
        data: {
          cardId: card.id,
          customerId,
          merchantId,
          rewardText: merchant.rewardDescription,
          redeemedAt,
          notes: notes || null,
        },
      }),
      prisma.customerCard.update({
        where: { id: card.id },
        data: { stampCount: 0, isRedeemed: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      redemptionId: redemption.id,
      redeemedAt: redeemedAt.toISOString(),
      rewardText: merchant.rewardDescription,
    });
  } catch (err) {
    console.error("Redeem error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}