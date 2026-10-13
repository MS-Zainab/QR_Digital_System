import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!user || user.email?.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const redemptions = await prisma.redeemedReward.findMany({
    include: {
      merchant: { select: { name: true } },
      customer: { select: { name: true, phoneNumber: true } },
    },
    orderBy: { redeemedAt: "desc" },
  });

  const header = ["Date (PKT)", "Merchant", "Customer", "Phone", "Reward", "Notes"].join(",");
  const rows = redemptions.map((r) => {
    const pkt = new Date(r.redeemedAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
    return [
      `"${pkt}"`,
      `"${r.merchant.name}"`,
      `"${(r.customer.name || "").replace(/"/g, '""')}"`,
      `"${r.customer.phoneNumber}"`,
      `"${(r.rewardText || "").replace(/"/g, '""')}"`,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ].join(",");
  });
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="redemptions-${Date.now()}.csv"`,
    },
  });
}