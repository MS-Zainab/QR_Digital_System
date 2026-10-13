import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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

    const { id: merchantId } = await params;

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

    // Find all cards that have reached the threshold
    const readyCards = await prisma.customerCard.findMany({
      where: {
        merchantId,
        stampCount: { gte: merchant.stampsRequired },
      },
      orderBy: { updatedAt: "asc" }, // oldest first — customer waiting longest
      include: {
        customer: {
          select: { id: true, name: true, phoneNumber: true },
        },
      },
    });

    const ready = readyCards.map((c) => ({
      cardId: c.id,
      customerId: c.customer.id,
      name: c.customer.name,
      phoneNumber: c.customer.phoneNumber,
      stampCount: c.stampCount,
      readySince: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      ready,
      total: ready.length,
      rewardDescription: merchant.rewardDescription,
      stampsRequired: merchant.stampsRequired,
    });
  } catch (err) {
    console.error("Ready rewards error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}