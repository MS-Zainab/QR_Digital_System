import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auto-expire if past TTL
    await prisma.stampRequest.updateMany({
      where: {
        id,
        status: "PENDING",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED", respondedAt: new Date() },
    });

    const request = await prisma.stampRequest.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            name: true,
            stampsRequired: true,
            rewardDescription: true,
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If approved, get the customer's current card for this merchant
    let stampCount = 0;
    if (request.status === "APPROVED") {
      const card = await prisma.customerCard.findUnique({
        where: {
          customerId_merchantId: {
            customerId: request.customerId,
            merchantId: request.merchantId,
          },
        },
      });
      stampCount = card?.stampCount ?? 0;
    }

    return NextResponse.json({
      id: request.id,
      status: request.status,
      expiresAt: request.expiresAt.toISOString(),
      merchantName: request.merchant.name,
      stampCount,
      stampsRequired: request.merchant.stampsRequired,
      rewardDescription: request.merchant.rewardDescription,
    });
  } catch (err) {
    console.error("Status error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}