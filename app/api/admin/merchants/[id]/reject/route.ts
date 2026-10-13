import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const merchant = await prisma.merchant.findUnique({ where: { id } });
    if (!merchant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.merchant.update({
      where: { id },
      data: { subscriptionStatus: "CANCELLED" },
    });

    await prisma.subscriptionHistory.create({
      data: {
        merchantId: id,
        action: "REJECTED",
        performedBy: user.email || "admin",
        notes: "Rejected by admin",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reject error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}