import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: merchantId } = await params;

    // Verify merchant belongs to logged-in user
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { email: true, stampsRequired: true },
    });

    if (
      !merchant ||
      merchant.email.toLowerCase() !== user.email?.toLowerCase()
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all customer cards for this merchant
    const cards = await prisma.customerCard.findMany({
      where: { merchantId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            createdAt: true,
          },
        },
      },
    });

    const customerIds = cards.map((c) => c.customerId);

    // Get visit counts per customer
    const visits = await prisma.scanLog.groupBy({
      by: ["customerId"],
      where: { merchantId, customerId: { in: customerIds } },
      _count: { customerId: true },
    });
    const visitMap = new Map(
      visits.map((v) => [v.customerId, v._count.customerId])
    );

    // Get redemption counts per customer
    const redemptions = await prisma.redeemedReward.groupBy({
      by: ["customerId"],
      where: { merchantId, customerId: { in: customerIds } },
      _count: { customerId: true },
    });
    const redemptionMap = new Map(
      redemptions.map((r) => [r.customerId, r._count.customerId])
    );

    // Enrich all cards with visit/redemption counts
    const enriched = cards.map((c) => ({
      customerId: c.customer.id,
      name: c.customer.name,
      phoneNumber: c.customer.phoneNumber,
      stampCount: c.stampCount,
      totalVisits: visitMap.get(c.customer.id) || 0,
      totalRedemptions: redemptionMap.get(c.customer.id) || 0,
      lastVisit: c.updatedAt,
      joinedAt: c.customer.createdAt,
    }));

    // === 1. Top customers (by visits) ===
    const topCustomers = [...enriched]
      .sort((a, b) => b.totalVisits - a.totalVisits)
      .slice(0, 10)
      .map((c) => ({
        name: c.name,
        phoneNumber: c.phoneNumber,
        totalVisits: c.totalVisits,
        totalRedemptions: c.totalRedemptions,
        stampCount: c.stampCount,
      }));

    // === 2. New this month ===
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newCustomers = enriched
      .filter((c) => new Date(c.joinedAt) >= thirtyDaysAgo)
      .sort(
        (a, b) =>
          new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      )
      .map((c) => ({
        name: c.name,
        phoneNumber: c.phoneNumber,
        joinedAt: c.joinedAt.toISOString(),
        totalVisits: c.totalVisits,
      }));

    // === 3. Inactive (no visit in 30+ days) ===
    const inactiveCustomers = enriched
      .filter((c) => new Date(c.lastVisit) < thirtyDaysAgo)
      .sort(
        (a, b) =>
          new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime()
      )
      .map((c) => ({
        name: c.name,
        phoneNumber: c.phoneNumber,
        lastVisit: c.lastVisit.toISOString(),
        totalVisits: c.totalVisits,
      }));

    // === 4. Almost rewarded (1-2 stamps away) ===
    const almostRewarded = enriched
      .filter(
        (c) =>
          c.stampCount > 0 &&
          c.stampCount < merchant.stampsRequired &&
          merchant.stampsRequired - c.stampCount <= 2
      )
      .map((c) => ({
        name: c.name,
        phoneNumber: c.phoneNumber,
        stampCount: c.stampCount,
        remaining: merchant.stampsRequired - c.stampCount,
      }));

    // === 5. Reward ready (>= required) ===
    const rewardReady = enriched
      .filter((c) => c.stampCount >= merchant.stampsRequired)
      .map((c) => ({
        name: c.name,
        phoneNumber: c.phoneNumber,
        stampCount: c.stampCount,
      }));

    // === 6. Averages ===
    const avgVisits =
      enriched.length > 0
        ? enriched.reduce((sum, c) => sum + c.totalVisits, 0) / enriched.length
        : 0;
    const avgStamps =
      enriched.length > 0
        ? enriched.reduce((sum, c) => sum + c.stampCount, 0) / enriched.length
        : 0;

    return NextResponse.json({
      totalCustomers: enriched.length,
      stampsRequired: merchant.stampsRequired,
      averages: {
        avgVisits: Math.round(avgVisits * 10) / 10,
        avgStamps: Math.round(avgStamps * 10) / 10,
      },
      topCustomers,
      newCustomers,
      inactiveCustomers,
      almostRewarded,
      rewardReady,
    });
  } catch (err) {
    console.error("Analytics insights error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}