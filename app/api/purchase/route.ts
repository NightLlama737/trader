
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";

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
    console.error(err);
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}

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

    const offModel = purchase.offModel;
    await prisma.model.create({
      data: {
        userId: purchase.buyerId,
        key: offModel.key,
      },
    });
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: "ACCEPTED", buyerSeen: false },
    });
    return NextResponse.json({ ok: true, status: "accepted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 });
  }
}