import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const merchant = await prisma.merchant.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const [totalStamps, totalCustomers, rewardsRedeemed, recentScans] =
      await Promise.all([
        prisma.scanLog.count({ where: { merchantId: id } }),
        prisma.customerCard.count({ where: { merchantId: id } }),
        prisma.customerCard.count({
          where: { merchantId: id, isRedeemed: true },
        }),
        prisma.scanLog.findMany({
          where: {
            merchantId: id,
            scannedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { scannedAt: "desc" },
          take: 50,
          include: {
            customer: {
              select: { phoneNumber: true, name: true },
            },
          },
        }),
      ]);

    return NextResponse.json({
      merchantName: merchant.name,
      totalStamps,
      totalCustomers,
      rewardsRedeemed,
      recentScans: recentScans.map((s) => ({
        id: s.id,
        phone: s.customer.phoneNumber,
        name: s.customer.name,
        scannedAt: s.scannedAt,
      })),
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}