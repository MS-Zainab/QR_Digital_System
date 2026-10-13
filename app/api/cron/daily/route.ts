import { NextResponse } from "next/server";
import { generateNotificationsForAllMerchants } from "@/lib/generateNotifications";

/**
 * Cron endpoint — runs daily.
 * Protects against unauthorized access via CRON_SECRET header.
 *
 * Vercel automatically sends: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  try {
    // Vercel automatically adds this header when running crons
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, enforce it (production)
    // If not set, allow (local dev)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Starting daily notification generation...");

    const result = await generateNotificationsForAllMerchants();

    console.log(
      `[CRON] Done. Created: ${result.created}, Skipped: ${result.skipped}, Total: ${result.totalScanned}`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    console.error("[CRON] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}