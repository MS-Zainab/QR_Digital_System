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
      select: { id: true, name: true, email: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Generate a magic link with token_hash flow
    // This gives us a URL to /auth/confirm which sets fresh session
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: merchant.email,
        options: {
          redirectTo: `${appUrl}/merchant/dashboard`,
        },
      });

    if (linkError || !linkData) {
      console.error("[Impersonate] Supabase error:", linkError);
      return NextResponse.json(
        {
          error: linkError?.message || "Failed to generate access link",
        },
        { status: 500 }
      );
    }

    // Extract token_hash from the generated link
    const actionLink = linkData.properties?.action_link;
    const hashedToken = linkData.properties?.hashed_token;

    if (!actionLink || !hashedToken) {
      return NextResponse.json(
        { error: "Failed to generate valid link" },
        { status: 500 }
      );
    }

    // Build a custom URL that goes through our own /auth/impersonate route
    // which will clear existing session and set the new one
    const impersonateUrl = `${appUrl}/auth/impersonate?token_hash=${encodeURIComponent(
      hashedToken
    )}&email=${encodeURIComponent(merchant.email)}`;

    console.log(
      `[IMPERSONATE] ${user.email} → ${merchant.name} (${merchant.email})`
    );

    return NextResponse.json({
      success: true,
      merchant: merchant.name,
      email: merchant.email,
      impersonateUrl,
    });
  } catch (err) {
    console.error("[Impersonate] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}