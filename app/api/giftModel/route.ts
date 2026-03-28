import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/S3";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { receiverId, modelKey, message } = await req.json();

    if (!receiverId || !modelKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify model belongs to sender
    const model = await prisma.model.findFirst({
      where: { key: modelKey, userId },
    });

    if (!model) {
      return NextResponse.json({ error: "Model not found or not yours" }, { status: 404 });
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    // Create gift record in DB
    const gift = await prisma.modelGift.create({
      data: {
        senderId: userId,
        receiverId,
        modelId: model.id,
        message: message?.trim() || null,
        seen: false,
      },
    });

    // Generate signed URL so frontend can read the source file
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: modelKey,
    });
    const sourceUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });

    // Build destination key under receiver's folder
    const fileName = modelKey.split("/").pop() || `${crypto.randomUUID()}.glb`;
    const destKey = `models/${receiverId}/${crypto.randomUUID()}-${fileName}`;

    return NextResponse.json({
      giftId: gift.id,
      sourceUrl,
      destKey,
      message,
    });
  } catch (err) {
    console.error("GIFT ERROR:", err);
    return NextResponse.json({ error: "Failed to prepare gift" }, { status: 500 });
  }
}