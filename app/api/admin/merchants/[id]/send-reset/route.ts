import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    if (!user || !adminEmail || user.email?.toLowerCase() !== adminEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: merchantId } = await params;

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { name: true, email: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(
      merchant.email,
      {
        redirectTo: `${appUrl}/merchant/login`,
      }
    );

    if (error) {
      console.error("[Send Reset] Supabase error:", error);
      return NextResponse.json(
        {
          error:
            error.message ||
            "Failed to send reset email. Check Supabase SMTP settings.",
        },
        { status: 500 }
      );
    }

    console.log(
      `[SEND RESET] ${user.email} → sent reset to ${merchant.email}`
    );

    return NextResponse.json({
      success: true,
      email: merchant.email,
    });
  } catch (err) {
    console.error("[Send Reset] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}