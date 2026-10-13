import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { evaluateSubscription } from "@/lib/subscriptionGuard";

export async function GET(
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

    const merchant = await prisma.merchant.findUnique({
      where: { id },
      select: {
        email: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        currentPeriodEndsAt: true,
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (merchant.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const check = evaluateSubscription(merchant);
    return NextResponse.json({
      allowed: check.allowed,
      status: check.status,
      isTrial: check.isTrial,
      isActive: check.isActive,
      isExpired: check.isExpired,
      isPending: check.isPending,
      daysLeft: check.daysLeft,
      hoursLeft: check.hoursLeft,
      reason: check.reason,
      trialEndsAt: check.trialEndsAt?.toISOString() ?? null,
      effectiveEndDate: check.effectiveEndDate?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("Subscription status error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}