import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { checkSubscription } from "@/lib/subscriptionGuard";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const request = await prisma.stampRequest.findUnique({
      where: { id },
      include: {
        merchant: { select: { id: true, email: true, stampsRequired: true } },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (
      request.merchant.email.toLowerCase() !== user.email?.toLowerCase()
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
        // Check subscription status
    const check = await checkSubscription(request.merchantId);
    if (!check || !check.allowed) {
      return NextResponse.json(
        {
          error: check?.reason || "Subscription inactive",
          subscriptionStatus: check?.status,
        },
        { status: 403 }
      );
    }
    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: `Request already ${request.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (request.expiresAt < new Date()) {
      await prisma.stampRequest.update({
        where: { id },
        data: { status: "EXPIRED", respondedAt: new Date() },
      });
      return NextResponse.json({ error: "Request expired" }, { status: 410 });
    }

    // Approve the request
    const now = new Date();

    // 1. Increment customer card stamp
    const card = await prisma.customerCard.upsert({
      where: {
        customerId_merchantId: {
          customerId: request.customerId,
          merchantId: request.merchantId,
        },
      },
      update: { stampCount: { increment: 1 } },
      create: {
        customerId: request.customerId,
        merchantId: request.merchantId,
        stampCount: 1,
      },
    });

    // 2. Log the scan
    await prisma.scanLog.create({
      data: {
        customerId: request.customerId,
        merchantId: request.merchantId,
        pinUsed: "APPROVED",
      },
    });

    // 3. Mark request approved
    await prisma.stampRequest.update({
      where: { id },
      data: { status: "APPROVED", respondedAt: now },
    });

    const rewardUnlocked = card.stampCount >= request.merchant.stampsRequired;

    return NextResponse.json({
      success: true,
      stampCount: card.stampCount,
      rewardUnlocked,
    });
  } catch (err) {
    console.error("Approve error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}