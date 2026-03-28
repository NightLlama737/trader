import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Called by the RECEIVER after they accept the gift and the frontend has uploaded the file
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { giftId, destKey } = await req.json();

    if (!giftId || !destKey) {
      return NextResponse.json({ error: "Missing giftId or destKey" }, { status: 400 });
    }

    const gift = await prisma.modelGift.findUnique({
      where: { id: giftId },
    });

    if (!gift || gift.receiverId !== userId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    if (gift.seen) {
      return NextResponse.json({ error: "Already claimed" }, { status: 409 });
    }

    // Verify the destKey is under receiver's folder
    if (!destKey.startsWith(`models/${userId}/`)) {
      return NextResponse.json({ error: "Invalid destination key" }, { status: 400 });
    }

    // Create model record for receiver
    const newModel = await prisma.model.create({
      data: {
        userId,
        key: destKey,
      },
    });

    // Mark gift as seen/claimed
    await prisma.modelGift.update({
      where: { id: giftId },
      data: { seen: true },
    });

    return NextResponse.json({
      ok: true,
      model: newModel,
      destKey,
    });
  } catch (err) {
    console.error("CONFIRM GIFT ERROR:", err);
    return NextResponse.json({ error: "Failed to confirm gift" }, { status: 500 });
  }
}