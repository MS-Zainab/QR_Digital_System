import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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
      select: { email: true, name: true },
    });

    if (
      !merchant ||
      merchant.email.toLowerCase() !== user.email?.toLowerCase()
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    // === CSV export for a specific month ===
    if (format === "csv" && yearParam && monthParam) {
      const year = parseInt(yearParam);
      const month = parseInt(monthParam);

      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      const scans = await prisma.scanLog.findMany({
        where: {
          merchantId,
          scannedAt: { gte: start, lte: end },
        },
        include: {
          customer: {
            select: { name: true, phoneNumber: true },
          },
        },
        orderBy: { scannedAt: "asc" },
      });

      const redemptions = await prisma.redeemedReward.findMany({
        where: {
          merchantId,
          redeemedAt: { gte: start, lte: end },
        },
        include: {
          customer: {
            select: { name: true, phoneNumber: true },
          },
        },
        orderBy: { redeemedAt: "asc" },
      });

      const header = [
        "Date",
        "Time",
        "Type",
        "Customer Name",
        "Customer Phone",
      ].join(",");

      const rows: string[] = [];

      scans.forEach((s) => {
        const d = new Date(s.scannedAt);
        rows.push(
          [
            `"${d.toISOString().split("T")[0]}"`,
            `"${d.toTimeString().split(" ")[0]}"`,
            "Stamp",
            `"${(s.customer.name || "").replace(/"/g, '""')}"`,
            `"${s.customer.phoneNumber}"`,
          ].join(",")
        );
      });

      redemptions.forEach((r) => {
        const d = new Date(r.redeemedAt);
        rows.push(
          [
            `"${d.toISOString().split("T")[0]}"`,
            `"${d.toTimeString().split(" ")[0]}"`,
            "Reward Redeemed",
            `"${(r.customer.name || "").replace(/"/g, '""')}"`,
            `"${r.customer.phoneNumber}"`,
          ].join(",")
        );
      });

      const csv = [header, ...rows].join("\n");
      const filename = `${merchant.name.replace(/\s+/g, "-")}-${MONTH_NAMES[month - 1]}-${year}.csv`;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // === CSV export for custom date range ===
    if (format === "csv" && startParam && endParam) {
      const start = new Date(startParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endParam);
      end.setHours(23, 59, 59, 999);

      const scans = await prisma.scanLog.findMany({
        where: {
          merchantId,
          scannedAt: { gte: start, lte: end },
        },
        include: {
          customer: { select: { name: true, phoneNumber: true } },
        },
        orderBy: { scannedAt: "asc" },
      });

      const redemptions = await prisma.redeemedReward.findMany({
        where: {
          merchantId,
          redeemedAt: { gte: start, lte: end },
        },
        include: {
          customer: { select: { name: true, phoneNumber: true } },
        },
        orderBy: { redeemedAt: "asc" },
      });

      const header = [
        "Date",
        "Time",
        "Type",
        "Customer Name",
        "Customer Phone",
      ].join(",");

      const rows: string[] = [];

      scans.forEach((s) => {
        const d = new Date(s.scannedAt);
        rows.push(
          [
            `"${d.toISOString().split("T")[0]}"`,
            `"${d.toTimeString().split(" ")[0]}"`,
            "Stamp",
            `"${(s.customer.name || "").replace(/"/g, '""')}"`,
            `"${s.customer.phoneNumber}"`,
          ].join(",")
        );
      });

      redemptions.forEach((r) => {
        const d = new Date(r.redeemedAt);
        rows.push(
          [
            `"${d.toISOString().split("T")[0]}"`,
            `"${d.toTimeString().split(" ")[0]}"`,
            "Reward Redeemed",
            `"${(r.customer.name || "").replace(/"/g, '""')}"`,
            `"${r.customer.phoneNumber}"`,
          ].join(",")
        );
      });

      const csv = [header, ...rows].join("\n");
      const filename = `${merchant.name.replace(/\s+/g, "-")}-${startParam}-to-${endParam}.csv`;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // === JSON: get monthly summaries ===
    const allScans = await prisma.scanLog.findMany({
      where: { merchantId },
      select: { scannedAt: true, customerId: true },
      orderBy: { scannedAt: "desc" },
    });

    const allRedemptions = await prisma.redeemedReward.findMany({
      where: { merchantId },
      select: { redeemedAt: true },
    });

    const allCustomers = await prisma.customer.findMany({
      where: {
        cards: { some: { merchantId } },
      },
      select: { id: true, createdAt: true },
    });

    // Group by month
    const monthlyMap = new Map<
      string,
      {
        month: number;
        year: number;
        label: string;
        totalScans: number;
        uniqueCustomers: Set<string>;
        newCustomers: number;
        rewardsRedeemed: number;
        stampsIssued: number;
      }
    >();

    const ensureMonth = (date: Date) => {
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          label: `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`,
          totalScans: 0,
          uniqueCustomers: new Set(),
          newCustomers: 0,
          rewardsRedeemed: 0,
          stampsIssued: 0,
        });
      }
      return monthlyMap.get(key)!;
    };

    allScans.forEach((s) => {
      const d = new Date(s.scannedAt);
      const m = ensureMonth(d);
      m.totalScans++;
      m.uniqueCustomers.add(s.customerId);
      m.stampsIssued++;
    });

    allRedemptions.forEach((r) => {
      const d = new Date(r.redeemedAt);
      const m = ensureMonth(d);
      m.rewardsRedeemed++;
    });

    allCustomers.forEach((c) => {
      const d = new Date(c.createdAt);
      const m = ensureMonth(d);
      m.newCustomers++;
    });

    const reports = Array.from(monthlyMap.values())
      .map((m) => ({
        month: m.month,
        year: m.year,
        label: m.label,
        totalScans: m.totalScans,
        uniqueCustomers: m.uniqueCustomers.size,
        newCustomers: m.newCustomers,
        rewardsRedeemed: m.rewardsRedeemed,
        stampsIssued: m.stampsIssued,
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

    return NextResponse.json({ reports });
  } catch (err) {
    console.error("Reports error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}