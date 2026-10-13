import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();

  try {
    const merchant = await prisma.merchant.update({
      where: { id },
      data: {
        subscriptionStatus: body.subscriptionStatus,
        trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : undefined,
        currentPeriodEndsAt: body.currentPeriodEndsAt
          ? new Date(body.currentPeriodEndsAt)
          : null,
        customPricePerMonth: body.customPricePerMonth ?? null,
        subscriptionNotes: body.subscriptionNotes ?? null,
      },
    });

    // Log this change in SubscriptionHistory
    await prisma.subscriptionHistory.create({
      data: {
        merchantId: id,
        action: "ADMIN_UPDATE",
        performedBy: user.email || "admin",
        notes: `Status: ${body.subscriptionStatus} · Price: ${body.customPricePerMonth ?? "N/A"}`,
      },
    });

    return NextResponse.json({ ok: true, merchant });
  } catch (e: any) {
    console.error("Update subscription error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}