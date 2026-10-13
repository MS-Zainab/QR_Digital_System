import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateNotificationsForAllMerchants } from "@/lib/generateNotifications";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const result = await generateNotificationsForAllMerchants();

    console.log(
      `[Notifications] Generated: ${result.created}, Skipped: ${result.skipped}`
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Generate notifications error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}