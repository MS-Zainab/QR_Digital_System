import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { normalizePkPhone } from "@/lib/phoneValidation";
import { evaluateSubscription } from "@/lib/subscriptionGuard";
import { z } from "zod";

const REQUEST_TTL_SECONDS = 90;
const VISIT_WINDOW_HOURS = 4;

// ─────────────────────────────────────────────
// POST — Create a new stamp request (customer)
// ─────────────────────────────────────────────

const CreateSchema = z.object({
  merchantId: z.string().uuid(),
  phoneNumber: z.string().min(7).max(20),
  name: z.string().min(1).max(60),
  marketingConsent: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { merchantId, phoneNumber, name, marketingConsent } = parsed.data;

    // Normalize Pakistani phone
    const normalizedPhone = normalizePkPhone(phoneNumber);
    if (!normalizedPhone) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid Pakistani mobile number (11 digits, e.g. 03001234567)",
        },
        { status: 400 }
      );
    }

    // 1. Verify merchant exists — INCLUDE ALL FIELDS WE NEED
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        currentPeriodEndsAt: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // 2. Check subscription (with auto-expiry detection)
    const subCheck = evaluateSubscription({
      subscriptionStatus: merchant.subscriptionStatus,
      trialEndsAt: merchant.trialEndsAt,
      currentPeriodEndsAt: merchant.currentPeriodEndsAt,
    });

    if (!subCheck.allowed) {
      return NextResponse.json(
        {
          error:
            "This store's loyalty program is temporarily unavailable. Please try again later.",
        },
        { status: 403 }
      );
    }

    // 3. Upsert customer
    const customer = await prisma.customer.upsert({
      where: { phoneNumber: normalizedPhone },
      update: { name: name.trim() },
      create: { phoneNumber: normalizedPhone, name: name.trim() },
    });

    // 4. Handle marketing consent per merchant
    const existingConsent = await prisma.customerMerchantConsent.findUnique({
      where: {
        customerId_merchantId: {
          customerId: customer.id,
          merchantId,
        },
      },
    });

    if (!existingConsent) {
      await prisma.customerMerchantConsent.create({
        data: {
          customerId: customer.id,
          merchantId,
          consented: marketingConsent,
          consentedAt: marketingConsent ? new Date() : null,
        },
      });

      if (marketingConsent && !customer.marketingConsent) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            marketingConsent: true,
            consentGivenAt: new Date(),
          },
        });
      }
    } else if (marketingConsent && !existingConsent.consented) {
      await prisma.customerMerchantConsent.update({
        where: { id: existingConsent.id },
        data: { consented: true, consentedAt: new Date() },
      });

      if (!customer.marketingConsent) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            marketingConsent: true,
            consentGivenAt: new Date(),
          },
        });
      }
    }

    // 5. Enforce 4-hour visit window
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - VISIT_WINDOW_HOURS);

    const recentApproved = await prisma.stampRequest.findFirst({
      where: {
        customerId: customer.id,
        merchantId,
        status: "APPROVED",
        respondedAt: { gte: windowStart },
      },
      orderBy: { respondedAt: "desc" },
    });

    if (recentApproved?.respondedAt) {
      const nextAvailable = new Date(recentApproved.respondedAt);
      nextAvailable.setHours(nextAvailable.getHours() + VISIT_WINDOW_HOURS);

      return NextResponse.json(
        {
          error: "You already got a stamp here recently",
          nextAvailable: nextAvailable.toISOString(),
        },
        { status: 429 }
      );
    }

    // 6. Check for existing pending request (avoid spam)
    const pending = await prisma.stampRequest.findFirst({
      where: {
        customerId: customer.id,
        merchantId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (pending) {
      return NextResponse.json({
        success: true,
        requestId: pending.id,
        expiresAt: pending.expiresAt.toISOString(),
        merchantName: merchant.name,
        isExisting: true,
      });
    }

    // 7. Create new request
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + REQUEST_TTL_SECONDS);

    const request = await prisma.stampRequest.create({
      data: {
        customerId: customer.id,
        merchantId,
        status: "PENDING",
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      requestId: request.id,
      expiresAt: request.expiresAt.toISOString(),
      merchantName: merchant.name,
      isExisting: false,
    });
  } catch (err) {
    console.error("Create request error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// GET — List pending requests (merchant)
// ─────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get("merchantId");

    if (!merchantId) {
      return NextResponse.json(
        { error: "merchantId required" },
        { status: 400 }
      );
    }

    // Verify this merchant belongs to the logged-in user
    // INCLUDE email this time
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, email: true },
    });

    if (
      !merchant ||
      merchant.email.toLowerCase() !== user.email?.toLowerCase()
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Expire old pending requests
    await prisma.stampRequest.updateMany({
      where: {
        merchantId,
        status: "PENDING",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    // Fetch current pending
    const requests = await prisma.stampRequest.findMany({
      where: {
        merchantId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "asc" },
      include: {
        customer: {
          select: { id: true, name: true, phoneNumber: true },
        },
      },
    });

    const enriched = await Promise.all(
      requests.map(async (r) => {
        const card = await prisma.customerCard.findUnique({
          where: {
            customerId_merchantId: {
              customerId: r.customerId,
              merchantId,
            },
          },
          select: { stampCount: true, isRedeemed: true },
        });
        return {
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          expiresAt: r.expiresAt.toISOString(),
          customer: {
            id: r.customer.id,
            name: r.customer.name,
            phoneNumber: r.customer.phoneNumber,
          },
          currentStamps: card?.stampCount ?? 0,
        };
      })
    );

    return NextResponse.json({ requests: enriched });
  } catch (err) {
    console.error("List requests error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}