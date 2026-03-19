import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/S3";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { giftId } = await req.json();
    if (!giftId) return NextResponse.json({ error: "Missing giftId" }, { status: 400 });

    const gift = await prisma.modelGift.findUnique({
      where: { id: giftId },
      include: { model: true },
    });

    if (!gift || gift.receiverId !== userId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const sourceKey = gift.model.key;
    const fileName = sourceKey.split("/").pop() || `${crypto.randomUUID()}.glb`;
    const destKey = `models/${userId}/${crypto.randomUUID()}-${fileName}`;

    // Copy in S3
    await s3.send(
      new CopyObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        CopySource: `${process.env.AWS_S3_BUCKET}/${sourceKey}`,
        Key: destKey,
      })
    );

    // Create model record
    await prisma.model.create({
      data: { userId, key: destKey },
    });

    // Mark gift as seen
    await prisma.modelGift.update({
      where: { id: giftId },
      data: { seen: true },
    });

    return NextResponse.json({ ok: true, destKey });
  } catch (err) {
    console.error("ACCEPT GIFT ERROR:", err);
    return NextResponse.json({ error: "Failed to accept gift" }, { status: 500 });
  }
}