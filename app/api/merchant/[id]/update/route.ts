import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(2, "Business name too short").max(100).optional(),
  businessType: z
    .enum(["cafe", "restaurant", "salon", "retail"])
    .optional(),
  rewardDescription: z
    .string()
    .min(3, "Reward description too short")
    .max(200)
    .optional(),
  stampsRequired: z
    .number()
    .int()
    .min(3, "At least 3 stamps required")
    .max(20, "Max 20 stamps")
    .optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format")
    .optional(),
  slug: z
    .string()
    .min(3, "Slug too short")
    .max(40, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and dashes")
    .optional(),
});
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verify merchant is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: merchantId } = await params;

    // 2. Verify this merchant belongs to the logged-in user
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
            select: {
        id: true,
        email: true,
        name: true,
        businessType: true,
        rewardDescription: true,
        stampsRequired: true,
        primaryColor: true,
        subscriptionStatus: true,
        slug: true,
      },
    });

    if (
      !merchant ||
      merchant.email.toLowerCase() !== user.email?.toLowerCase()
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 3. Block updates for expired merchants
    if (
      merchant.subscriptionStatus === "EXPIRED" ||
      merchant.subscriptionStatus === "BLOCKED" ||
      merchant.subscriptionStatus === "CANCELLED" ||
      merchant.subscriptionStatus === "PENDING_APPROVAL"
    ) {
      return NextResponse.json(
        {
          error:
            "Your account is not active. Please contact support to reactivate.",
        },
        { status: 403 }
      );
    }

    // 4. Validate input
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // 5. Build update object with only provided fields
    const updates: any = {};
    const data = parsed.data;

    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.businessType !== undefined)
      updates.businessType = data.businessType;
    if (data.rewardDescription !== undefined)
      updates.rewardDescription = data.rewardDescription.trim();
    if (data.stampsRequired !== undefined)
      updates.stampsRequired = data.stampsRequired;
    if (data.primaryColor !== undefined)
      updates.primaryColor = data.primaryColor;
        if (data.slug !== undefined) {
      const newSlug = data.slug.trim().toLowerCase();
      // Check uniqueness (excluding current merchant)
      const existing = await prisma.merchant.findUnique({
        where: { slug: newSlug },
      });
      if (existing && existing.id !== merchantId) {
        return NextResponse.json(
          { error: "This URL is already taken. Try a different one." },
          { status: 400 }
        );
      }
      updates.slug = newSlug;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No changes provided" },
        { status: 400 }
      );
    }

    // 6. Apply updates
    const updated = await prisma.merchant.update({
      where: { id: merchantId },
      data: updates,
            select: {
        id: true,
        name: true,
        businessType: true,
        rewardDescription: true,
        stampsRequired: true,
        primaryColor: true,
        slug: true,
      },
    });

    // 7. Log the change (optional — for audit trail)
    console.log(
      `[Merchant Update] ${merchant.name} (${merchantId}) updated:`,
      Object.keys(updates).join(", ")
    );

    return NextResponse.json({
      success: true,
      merchant: updated,
      updatedFields: Object.keys(updates),
    });
  } catch (err) {
    console.error("Merchant update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}