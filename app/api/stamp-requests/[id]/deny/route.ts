import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const request = await prisma.stampRequest.findUnique({
      where: { id },
      include: { merchant: { select: { email: true } } },
    });

    if (!request) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (request.merchant.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: `Request already ${request.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    await prisma.stampRequest.update({
      where: { id },
      data: { status: "DENIED", respondedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Deny error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}