import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Called by the SENDER after uploading the file copy to the receiver's S3 folder.
// The receiver later just marks the gift as seen via /api/notifications/seen.
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

    // Only the sender (who uploaded the file) can confirm
    if (!gift || gift.senderId !== userId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    if (gift.seen) {
      return NextResponse.json({ error: "Already claimed" }, { status: 409 });
    }

    // Verify destKey is under the receiver's folder
    if (!destKey.startsWith(`models/${gift.receiverId}/`)) {
      return NextResponse.json({ error: "Invalid destination key" }, { status: 400 });
    }

    // Create model record for the RECEIVER (idempotent: skip if key already exists)
    let newModel;
    const existing = await prisma.model.findFirst({ where: { key: destKey } });
    if (!existing) {
      newModel = await prisma.model.create({
        data: { userId: gift.receiverId, key: destKey },
      });
    } else {
      newModel = existing;
    }

    // Leave gift.seen = false so receiver still gets the bell notification.
    // Receiver dismisses it via /api/notifications/seen { type: "gift", id: giftId }.

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