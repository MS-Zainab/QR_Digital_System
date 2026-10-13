import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePkPhone } from "@/lib/phoneValidation";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneRaw = searchParams.get("phone");

    if (!phoneRaw) {
      return NextResponse.json(
        { error: "phone query parameter required" },
        { status: 400 }
      );
    }

    // Normalize to local Pakistani format (11 digits)
    const normalizedPhone = normalizePkPhone(phoneRaw) || phoneRaw;

    const customer = await prisma.customer.findUnique({
      where: { phoneNumber: normalizedPhone },
      include: {
        cards: {
          include: {
            merchant: {
              select: {
                id: true,
                name: true,
                primaryColor: true,
                businessType: true,
                stampsRequired: true,
                rewardDescription: true,
                logoUrl: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        scans: {
          include: {
            merchant: {
              select: {
                id: true,
                name: true,
                primaryColor: true,
              },
            },
          },
          orderBy: { scannedAt: "desc" },
          take: 50,
        },
      },
    });

    if (!customer) {
      return NextResponse.json({
        customer: null,
        cards: [],
        scans: [],
      });
    }

    // Enrich cards with rewardReady flag
    const enrichedCards = customer.cards.map((card) => ({
      ...card,
      rewardReady:
        card.merchant && card.stampCount >= card.merchant.stampsRequired,
    }));

    return NextResponse.json({
      customer: {
        id: customer.id,
        phoneNumber: customer.phoneNumber,
        name: customer.name,
      },
      cards: enrichedCards,
      scans: customer.scans,
    });
  } catch (err) {
    console.error("Cards fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}