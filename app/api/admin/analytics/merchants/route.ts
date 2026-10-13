import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

let cached: any = null;
let cachedAt = 0;
const CACHE_MS = 60_000; // 60-second cache

export async function GET() {
  const t0 = Date.now();
  try {
    // Serve from cache if fresh
    if (cached && Date.now() - cachedAt < CACHE_MS) {
      console.log(`[analytics] cache hit in ${Date.now() - t0}ms`);
      return NextResponse.json(cached);
    }

    // 1) Admin auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.log(`[analytics] auth in ${Date.now() - t0}ms`);

    // 2) ONE raw SQL query — no Prisma relation loading, no prepared stmt overhead
    const t1 = Date.now();
    const rows = await prisma.$queryRaw<
      {
        id: string;
        name: string;
        email: string;
        totalStamps: number;
        totalScans: number;
        totalRedemptions: number;
        totalCustomers: number;
      }[]
    >`
      SELECT
        m.id,
        m.name,
        m.email,
        COALESCE(s.cnt, 0)::int AS "totalStamps",
        COALESCE(sc.cnt, 0)::int AS "totalScans",
        COALESCE(r.cnt, 0)::int AS "totalRedemptions",
        COALESCE(c.cnt, 0)::int AS "totalCustomers"
      FROM "Merchant" m
      LEFT JOIN (
        SELECT "merchantId", COUNT(*)::int AS cnt
        FROM "StampRequest"
        WHERE status = 'APPROVED'
        GROUP BY "merchantId"
      ) s ON s."merchantId" = m.id
      LEFT JOIN (
        SELECT "merchantId", COUNT(*)::int AS cnt
        FROM "ScanLog"
        GROUP BY "merchantId"
      ) sc ON sc."merchantId" = m.id
      LEFT JOIN (
        SELECT "merchantId", COUNT(*)::int AS cnt
        FROM "RedeemedReward"
        GROUP BY "merchantId"
      ) r ON r."merchantId" = m.id
      LEFT JOIN (
        SELECT "merchantId", COUNT(*)::int AS cnt
        FROM "CustomerCard"
        GROUP BY "merchantId"
      ) c ON c."merchantId" = m.id
      ORDER BY m."createdAt" DESC
    `;
    console.log(`[analytics] query in ${Date.now() - t1}ms — ${rows.length} rows`);

    const enriched = rows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      status: "ACTIVE",
      totalStamps: Number(m.totalStamps),
      totalScans: Number(m.totalScans),
      totalRedemptions: Number(m.totalRedemptions),
      totalCustomers: Number(m.totalCustomers),
      growth30d: 0,
      lastActivity: null,
    }));

    const summary = {
      totalMerchants: enriched.length,
      totalCustomers: enriched.reduce((s, m) => s + m.totalCustomers, 0),
      totalStamps: enriched.reduce((s, m) => s + m.totalStamps, 0),
      totalScans: enriched.reduce((s, m) => s + m.totalScans, 0),
      totalRedemptions: enriched.reduce((s, m) => s + m.totalRedemptions, 0),
    };

    const result = { merchants: enriched, summary };
    cached = result;
    cachedAt = Date.now();

    console.log(`[analytics] total ${Date.now() - t0}ms`);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(`[analytics] FAILED after ${Date.now() - t0}ms:`, err.message);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}