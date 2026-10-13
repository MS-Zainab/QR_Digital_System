import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!user || user.email?.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { title, body } = await req.json();

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Title and body required" }, { status: 400 });
  }

  // Get all merchant IDs
  const merchants = await prisma.merchant.findMany({
    select: { id: true },
  });

  if (merchants.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Create a notification for each merchant
  const result = await prisma.notification.createMany({
    data: merchants.map((m) => ({
      merchantId: m.id,
      type: "ADMIN_MESSAGE",
      title: title.trim(),
      message: body.trim(),
      read: false,
    })),
  });

  return NextResponse.json({ ok: true, sent: result.count });
}