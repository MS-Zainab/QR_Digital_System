import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");
  const now = new Date();

  const [pending, active, expired, blocked] = await Promise.all([
    // PENDING — waiting for approval
    prisma.merchant.findMany({
      where: { subscriptionStatus: "PENDING_APPROVAL" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, businessType: true,
        subscriptionStatus: true, merchantStatus: true,
        trialEndsAt: true, currentPeriodEndsAt: true,
        holdReason: true, blockReason: true, createdAt: true,
      },
    }),
    // ACTIVE — currently valid trial or paid, not blocked/held
    prisma.merchant.findMany({
      where: {
        merchantStatus: "ACTIVE",
        OR: [
          { subscriptionStatus: "TRIAL", trialEndsAt: { gte: now } },
          { subscriptionStatus: "ACTIVE", currentPeriodEndsAt: { gte: now } },
          { subscriptionStatus: "ACTIVE", currentPeriodEndsAt: null },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, businessType: true,
        subscriptionStatus: true, merchantStatus: true,
        trialStartedAt: true, trialEndsAt: true, currentPeriodEndsAt: true,
        customPricePerMonth: true, subscriptionNotes: true,
        holdReason: true, blockReason: true, createdAt: true,
      },
    }),
    // EXPIRED — trial/subscription ended but merchant not blocked
    prisma.merchant.findMany({
      where: {
        merchantStatus: "ACTIVE",
        OR: [
          { subscriptionStatus: "TRIAL", trialEndsAt: { lt: now } },
          { subscriptionStatus: "ACTIVE", currentPeriodEndsAt: { lt: now } },
          { subscriptionStatus: "EXPIRED" },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, businessType: true,
        subscriptionStatus: true, merchantStatus: true,
        trialEndsAt: true, currentPeriodEndsAt: true,
        holdReason: true, blockReason: true, createdAt: true,
      },
    }),
    // BLOCKED / HELD / REMOVED / CANCELLED
    prisma.merchant.findMany({
      where: {
        OR: [
          { merchantStatus: { in: ["ON_HOLD", "BLOCKED", "REMOVED"] } },
          { subscriptionStatus: { in: ["ON_HOLD", "BLOCKED", "CANCELLED"] } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, businessType: true,
        subscriptionStatus: true, merchantStatus: true,
        trialEndsAt: true, currentPeriodEndsAt: true,
        holdReason: true, blockReason: true, createdAt: true,
      },
    }),
  ]);

  if (format === "csv") {
    const all = [...pending, ...active, ...expired, ...blocked];
    const header = [
      "ID", "Name", "Email", "Business Type",
      "Subscription", "Merchant Status", "Trial Ends",
      "Current Period Ends", "Price/Month", "Reason", "Created",
    ].join(",");
    const rows = all.map((m: any) =>
      [
        `"${m.id}"`,
        `"${(m.name || "").replace(/"/g, '""')}"`,
        `"${(m.email || "").replace(/"/g, '""')}"`,
        `"${m.businessType || ""}"`,
        `"${m.subscriptionStatus || "PENDING_APPROVAL"}"`,
        `"${m.merchantStatus || "ACTIVE"}"`,
        `"${m.trialEndsAt ? new Date(m.trialEndsAt).toISOString() : ""}"`,
        `"${m.currentPeriodEndsAt ? new Date(m.currentPeriodEndsAt).toISOString() : ""}"`,
        `"${m.customPricePerMonth ?? ""}"`,
        `"${m.holdReason || m.blockReason || ""}"`,
        `"${m.createdAt ? new Date(m.createdAt).toISOString() : ""}"`,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="merchants-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ pending, active, expired, blocked });
}