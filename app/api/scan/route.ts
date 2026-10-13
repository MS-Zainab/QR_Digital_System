import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ScanSchema = z.object({
  merchantId: z.string().uuid("Invalid merchant ID"),
  phoneNumber: z.string().min(7, "Phone too short").max(20, "Phone too long"),
  pin: z.string().length(4, "PIN must be 4 digits"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ScanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { merchantId, phoneNumber, pin } = parsed.data;

    // 1. Find merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: "Merchant not found" },
        { status: 404 }
      );
    }

    // 2. Verify PIN
    const pinValid = await bcrypt.compare(pin, merchant.staffPinHash);
    if (!pinValid) {
      return NextResponse.json(
        { success: false, error: "Invalid staff PIN" },
        { status: 401 }
      );
    }

    // 3. Upsert customer
    const customer = await prisma.customer.upsert({
      where: { phoneNumber },
      update: {},
      create: { phoneNumber },
    });

    // 4. Upsert card + increment stamp
    const card = await prisma.customerCard.upsert({
      where: {
        customerId_merchantId: {
          customerId: customer.id,
          merchantId,
        },
      },
      update: { stampCount: { increment: 1 } },
      create: {
        customerId: customer.id,
        merchantId,
        stampCount: 1,
      },
    });

    // 5. Log the scan
    await prisma.scanLog.create({
      data: {
        customerId: customer.id,
        merchantId,
        pinUsed: pin,
      },
    });

    // 6. Check reward unlock
    const rewardUnlocked = card.stampCount >= merchant.stampsRequired;

    return NextResponse.json({
      success: true,
      stampCount: card.stampCount,
      stampsRequired: merchant.stampsRequired,
      rewardUnlocked,
      rewardDescription: merchant.rewardDescription,
      merchantName: merchant.name,
    });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}