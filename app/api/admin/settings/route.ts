import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.platformSettings.upsert({
      where: { id: "global" },
      update: {},
      create: { id: "global", signupMode: "AUTO" },
    });
    return NextResponse.json(settings);
  } catch (err) {
    console.error("Settings fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { signupMode } = body;

    if (signupMode !== "AUTO" && signupMode !== "MANUAL") {
      return NextResponse.json(
        { error: "signupMode must be AUTO or MANUAL" },
        { status: 400 }
      );
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: "global" },
      update: { signupMode },
      create: { id: "global", signupMode },
    });

    return NextResponse.json(settings);
  } catch (err) {
    console.error("Settings update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}