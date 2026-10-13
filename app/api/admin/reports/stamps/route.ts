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

  const stamps = await prisma.stampRequest.findMany({
    where: { status: "APPROVED" },
    include: {
      merchant: { select: { name: true } },
      customer: { select: { name: true, phoneNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = ["Date (PKT)", "Merchant", "Customer", "Phone", "Status"].join(",");
  const rows = stamps.map((s) => {
    const pkt = new Date(s.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
    return [
      `"${pkt}"`,
      `"${s.merchant.name}"`,
      `"${(s.customer.name || "").replace(/"/g, '""')}"`,
      `"${s.customer.phoneNumber}"`,
      `"${s.status}"`,
    ].join(",");
  });
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="stamps-${Date.now()}.csv"`,
    },
  });
}