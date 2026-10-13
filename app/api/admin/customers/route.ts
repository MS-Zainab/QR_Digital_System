import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const merchantId = searchParams.get("merchantId") || null;
    const format = searchParams.get("format");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        cards: {
          where: merchantId ? { merchantId } : undefined, // 👈 scope cards
          include: {
            merchant: { select: { id: true, name: true, primaryColor: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Skip customers with no cards for this merchant
    let filtered = customers;
    if (merchantId) {
      filtered = customers.filter((c) => c.cards.length > 0);
    }

    const enriched = await Promise.all(
      filtered.map(async (c) => {
        // 👇 Scope all history queries by merchantId when filter is active
        const merchantScope = merchantId ? { merchantId } : {};

        const stamps = await prisma.stampRequest.findMany({
          where: { customerId: c.id, status: "APPROVED", ...merchantScope },
          include: { merchant: { select: { id: true, name: true, primaryColor: true } } },
          orderBy: { createdAt: "desc" },
        });

        const scans = await prisma.scanLog.findMany({
          where: { customerId: c.id, ...merchantScope },
          include: { merchant: { select: { id: true, name: true, primaryColor: true } } },
          orderBy: { scannedAt: "desc" },
        });

        const redemptions = await prisma.redeemedReward.findMany({
          where: { customerId: c.id, ...merchantScope },
          include: { merchant: { select: { id: true, name: true, primaryColor: true } } },
          orderBy: { redeemedAt: "desc" },
        });

        return {
          customerId: c.id,
          name: c.name,
          phoneNumber: c.phoneNumber,
          marketingConsent: c.marketingConsent,
          joinedAt: c.createdAt.toISOString(),
          merchants: c.cards.map((card) => ({
            id: card.merchant.id,
            name: card.merchant.name,
            color: card.merchant.primaryColor || "#4f46e5",
            stampCount: card.stampCount,
            isRedeemed: card.isRedeemed,
          })),
          history: {
            stamps: stamps.map((s) => ({
              id: s.id,
              merchantId: s.merchantId,
              merchantName: s.merchant.name,
              merchantColor: s.merchant.primaryColor || "#4f46e5",
              stampCount: (s as any).stampCount ?? 1,
              isRedeemed: (s as any).isRedeemed ?? false,
              at: s.createdAt.toISOString(),
            })),
            scans: scans.map((s) => ({
              id: s.id,
              merchantId: s.merchantId,
              merchantName: s.merchant.name,
              merchantColor: s.merchant.primaryColor || "#4f46e5",
              at: s.scannedAt.toISOString(),
            })),
            redemptions: redemptions.map((r) => ({
              id: r.id,
              merchantId: r.merchantId,
              merchantName: r.merchant.name,
              merchantColor: r.merchant.primaryColor || "#4f46e5",
              rewardText: r.rewardText,
              notes: r.notes,
              at: r.redeemedAt.toISOString(),
            })),
          },
        };
      })
    );

    if (format === "csv") {
      const header = ["Name", "Phone", "Merchants", "Stamps", "Redemptions", "Opt-In", "Joined"].join(",");
      const rows = enriched.map((c) => {
        const totalStamps = c.history.stamps.reduce((s, x) => s + (x.stampCount || 0), 0);
        return [
          `"${(c.name || "").replace(/"/g, '""')}"`,
          `"${c.phoneNumber}"`,
          `"${c.merchants.map((m) => m.name).join(" | ")}"`,
          totalStamps,
          c.history.redemptions.length,
          c.marketingConsent ? "Yes" : "No",
          `"${new Date(c.joinedAt).toLocaleString()}"`,
        ].join(",");
      });
      const csv = [header, ...rows].join("\n");
      const filename = merchantId ? `customers-filtered-${Date.now()}.csv` : `all-customers-${Date.now()}.csv`;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      customers: enriched,
      total: enriched.length,
      optedIn: enriched.filter((c) => c.marketingConsent).length,
    });
  } catch (err) {
    console.error("Admin customers error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}