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
      select: {
        id: true,
        name: true,
        businessType: true,
        logoUrl: true,
        primaryColor: true,
        stampsRequired: true,
        rewardDescription: true,
        // ⚠️ NOT including staffPinHash or qrSecret
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(merchant);
  } catch (err) {
    console.error("Merchant fetch error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}