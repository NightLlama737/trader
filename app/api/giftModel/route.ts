import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { receiverId, modelKey, message } = await req.json();
    if (!receiverId || !modelKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the model
    const model = await prisma.model.findFirst({
      where: { key: modelKey, userId },
    });
    if (!model) return NextResponse.json({ error: "Model not found or not yours" }, { status: 404 });

    const gift = await prisma.modelGift.create({
      data: {
        senderId: userId,
        receiverId,
        modelId: model.id,
        message: message || null,
        seen: false,
      },
    });

    return NextResponse.json({ gift });
  } catch (err) {
    console.error("GIFT ERROR:", err);
    return NextResponse.json({ error: "Failed to send gift" }, { status: 500 });
  }
}