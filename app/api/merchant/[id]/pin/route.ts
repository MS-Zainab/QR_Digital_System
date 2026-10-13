import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const PinSchema = z.object({
  currentPin: z.string().length(4, "Current PIN must be 4 digits"),
  newPin: z.string().length(4, "New PIN must be 4 digits"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = PinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { currentPin, newPin } = parsed.data;

    const merchant = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(currentPin, merchant.staffPinHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Current PIN is incorrect" },
        { status: 401 }
      );
    }

    const newHash = await bcrypt.hash(newPin, 10);

    await prisma.merchant.update({
      where: { id },
      data: { staffPinHash: newHash },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PIN update error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}