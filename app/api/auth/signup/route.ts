import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// 🔒 Top ~100 most common/leaked passwords — block these at signup
// Free alternative to Supabase's Pro-only HaveIBeenPwned check
const WEAK_PASSWORDS = new Set([
  "password", "password1", "password123", "password12", "password1234",
  "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop",
  "abc12345", "abc123456", "letmein1", "letmein12", "welcome1",
  "welcome123", "admin123", "admin1234", "iloveyou", "iloveyou1",
  "monkey123", "dragon123", "football", "football1", "baseball",
  "sunshine1", "sunshine", "princess1", "princess", "superman1",
  "superman", "qwerty1234", "asdfghjkl", "qwerty12345", "starwars1",
  "whatever1", "trustno1", "jordan23", "harley1", "ranger1",
  "iwantu", "shadow1", "michael1", "jennifer", "12121212",
  "qazwsx123", "qazwsxedc", "zaq12wsx", "1q2w3e4r", "1q2w3e4r5t",
  "1qaz2wsx", "q1w2e3r4", "q1w2e3r4t5", "asdf1234", "asdfasdf",
  "zxcvbnm1", "0987654321", "123123123", "11223344", "11111111",
  "00000000", "99999999", "1234abcd", "abcd1234", "testtest",
  "test1234", "tester123", "aaaa1111", "a1b2c3d4", "p@ssw0rd",
  "passw0rd", "password!", "password@", "admin@123", "root1234",
  "changeme", "changeme1", "newpassword", "secret123", "letmein123",
  "freedom1", "maggie1", "buster1", "soccer1", "hockey1",
  "killer1", "george1", "charlie1", "andrew1", "michelle1",
  "daniel1", "jessica1", "pepper1", "banana1", "chelsea1",
  "amanda1", "ashley1", "nicole1", "summer1", "winter1",
]);

const SignupSchema = z.object({
  businessName: z.string().min(2, "Business name too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessType: z.enum(["cafe", "restaurant", "salon", "retail"]),
  rewardDescription: z.string().min(3, "Describe the reward"),
  stampsRequired: z.number().int().min(3).max(20).default(10),
  primaryColor: z.string().default("#4f46e5"),
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 🔒 Block commonly leaked/guessable passwords
    if (WEAK_PASSWORDS.has(data.password.toLowerCase())) {
      return NextResponse.json(
        {
          error:
            "This password is too common and easily guessed. Please choose a stronger one.",
        },
        { status: 400 }
      );
    }

    // 🔒 Require at least: 1 lowercase, 1 uppercase, 1 digit, 1 symbol
    // (Matches Supabase's "Strong" requirement)
    const hasLower = /[a-z]/.test(data.password);
    const hasUpper = /[A-Z]/.test(data.password);
    const hasDigit = /\d/.test(data.password);
    const hasSymbol = /[^A-Za-z0-9]/.test(data.password);

    if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
      return NextResponse.json(
        {
          error:
            "Password must contain lowercase, uppercase letters, a digit, and a symbol.",
        },
        { status: 400 }
      );
    }

    // 1. Check if merchant email already exists
    const existing = await prisma.merchant.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 400 }
      );
    }

    // 2. Create Supabase auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email.toLowerCase(),
        password: data.password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create account" },
        { status: 400 }
      );
    }

    // 3. Prepare trial dates
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 15);

    const bcrypt = await import("bcryptjs");
    const defaultPinHash = await bcrypt.hash("0000", 10);

    // 4. Auto-generate slug from business name
    const baseSlug = data.businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);

    let slug = baseSlug || "merchant";

    let suffix = 1;
    while (true) {
      const existingSlug = await prisma.merchant.findUnique({ where: { slug } });
      if (!existingSlug) break;
      suffix++;
      slug = `${baseSlug}-${suffix}`;
      if (suffix > 50) {
        slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
        break;
      }
    }

    // 5. Create Merchant record
    const merchant = await prisma.merchant.create({
      data: {
        name: data.businessName,
        email: data.email.toLowerCase(),
        passwordHash: authData.user.id,
        businessType: data.businessType,
        rewardDescription: data.rewardDescription,
        stampsRequired: data.stampsRequired,
        primaryColor: data.primaryColor,
        staffPinHash: defaultPinHash,
        trialEndsAt,
        subscriptionStatus: "PENDING_APPROVAL",
        slug,
      },
    });

    // 6. Log subscription history
    await prisma.subscriptionHistory.create({
      data: {
        merchantId: merchant.id,
        action: "SIGNUP_PENDING",
        daysAdded: 0,
        performedBy: "system",
        notes: "Awaiting admin approval",
      },
    });

    return NextResponse.json({
      success: true,
      merchantId: merchant.id,
      userId: authData.user.id,
      status: merchant.subscriptionStatus,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}