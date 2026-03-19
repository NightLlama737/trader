import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { PutObjectCommand, GetObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/S3";
import crypto from "crypto";

// POST /api/purchase - buyer initiates purchase
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { offModelId } = await req.json();
    if (!offModelId) return NextResponse.json({ error: "Missing offModelId" }, { status: 400 });

    const offModel = await prisma.offModel.findUnique({
      where: { id: offModelId },
      include: { user: { select: { id: true } } },
    });
    if (!offModel) return NextResponse.json({ error: "Model not found" }, { status: 404 });
    if (offModel.userId === userId) return NextResponse.json({ error: "Cannot buy your own model" }, { status: 400 });

    // Check if there's already a pending purchase
    const existing = await prisma.purchase.findFirst({
      where: { buyerId: userId, offModelId, status: "PENDING" },
    }).catch(() => null);

    if (existing) return NextResponse.json({ error: "Purchase request already pending" }, { status: 409 });

    const purchase = await prisma.purchase.create({
      data: {
        buyerId: userId,
        sellerId: offModel.userId,
        offModelId,
        status: "PENDING",
      },
    });

    return NextResponse.json({ purchase });
  } catch (err) {
    console.error("PURCHASE ERROR:", err);
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}

// PUT /api/purchase - seller responds to purchase
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { purchaseId, action } = await req.json();
    if (!purchaseId || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        offModel: true,
        buyer: { select: { id: true, nickname: true } },
      },
    });

    if (!purchase || purchase.sellerId !== userId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    if (action === "decline") {
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { status: "DECLINED", buyerSeen: false },
      });
      return NextResponse.json({ ok: true, status: "declined" });
    }

    // Accept: copy the S3 object to buyer's folder and create Model in DB
    const offModel = purchase.offModel;
    const sourceKey = offModel.key;
    const fileName = sourceKey.split("/").pop() || `${crypto.randomUUID()}.glb`;
    const destKey = `models/${purchase.buyerId}/${fileName}`;

    // Copy object in S3
    await s3.send(
      new CopyObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        CopySource: `${process.env.AWS_S3_BUCKET}/${sourceKey}`,
        Key: destKey,
      })
    );

    // Create model record for buyer
    await prisma.model.create({
      data: {
        userId: purchase.buyerId,
        key: destKey,
      },
    });

    // Update purchase status
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: "ACCEPTED", buyerSeen: false },
    });

    return NextResponse.json({ ok: true, status: "accepted", destKey });
  } catch (err) {
    console.error("PURCHASE RESPOND ERROR:", err);
    return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 });
  }
}