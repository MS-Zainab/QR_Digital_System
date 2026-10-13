import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
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
      select: { email: true, stampsRequired: true },
    });

    if (
      !merchant ||
      merchant.email.toLowerCase() !== user.email?.toLowerCase()
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const filter = searchParams.get("filter") || "all";
    const format = searchParams.get("format");

    // Build where clause
    const where: any = { merchantId };

    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search } },
        ],
      };
    }

    // Fetch all cards for this merchant
    let cards = await prisma.customerCard.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            marketingConsent: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Enrich with visit count + redemption count + consent
    const customerIds = cards.map((c) => c.customerId);

    const [visits, redemptions, consents] = await Promise.all([
      prisma.scanLog.groupBy({
        by: ["customerId"],
        where: { merchantId, customerId: { in: customerIds } },
        _count: { customerId: true },
      }),
      prisma.redeemedReward.groupBy({
        by: ["customerId"],
        where: { merchantId, customerId: { in: customerIds } },
        _count: { customerId: true },
      }),
      prisma.customerMerchantConsent.findMany({
        where: { merchantId, customerId: { in: customerIds } },
        select: { customerId: true, consented: true },
      }),
    ]);

    const visitMap = new Map(
      visits.map((v) => [v.customerId, v._count.customerId])
    );
    const redemptionMap = new Map(
      redemptions.map((r) => [r.customerId, r._count.customerId])
    );
    const consentMap = new Map(
      consents.map((c) => [c.customerId, c.consented])
    );

    let enriched = cards.map((c) => ({
      cardId: c.id,
      customerId: c.customer.id,
      name: c.customer.name,
      phoneNumber: c.customer.phoneNumber,
      stampCount: c.stampCount,
      totalVisits: visitMap.get(c.customer.id) || 0,
      totalRedemptions: redemptionMap.get(c.customer.id) || 0,
      marketingConsent: consentMap.get(c.customer.id) || false,
      lastVisit: c.updatedAt.toISOString(),
      joinedAt: c.customer.createdAt.toISOString(),
    }));

    // Apply filters
    if (filter === "opted-in") {
      enriched = enriched.filter((c) => c.marketingConsent);
    } else if (filter === "recent") {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      enriched = enriched.filter(
        (c) => new Date(c.lastVisit).getTime() > sevenDaysAgo
      );
    } else if (filter === "inactive") {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      enriched = enriched.filter(
        (c) => new Date(c.lastVisit).getTime() < thirtyDaysAgo
      );
    }

    // CSV export
    if (format === "csv") {
      const header = [
        "Name",
        "Phone",
        "Total Visits",
        "Total Redemptions",
        "Current Stamps",
        "Marketing Opt-In",
        "Last Visit",
        "Joined",
      ].join(",");

      const rows = enriched.map((c) =>
        [
          `"${(c.name || "").replace(/"/g, '""')}"`,
          `"${c.phoneNumber}"`,
          c.totalVisits,
          c.totalRedemptions,
          c.stampCount,
          c.marketingConsent ? "Yes" : "No",
          `"${new Date(c.lastVisit).toLocaleString()}"`,
          `"${new Date(c.joinedAt).toLocaleString()}"`,
        ].join(",")
      );

      const csv = [header, ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="customers-${merchantId.slice(
            0,
            8
          )}.csv"`,
        },
      });
    }

    // Sort: opted-in first, then by last visit
    enriched.sort((a, b) => {
      if (a.marketingConsent !== b.marketingConsent) {
        return a.marketingConsent ? -1 : 1;
      }
      return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
    });

    return NextResponse.json({
      customers: enriched,
      total: enriched.length,
      optedIn: enriched.filter((c) => c.marketingConsent).length,
      stampsRequired: merchant.stampsRequired,
    });
  } catch (err) {
    console.error("Merchant customers error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}