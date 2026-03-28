import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

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

    const model = await prisma.model.findFirst({
      where: { key: modelKey, userId },
    });

    if (!model) {
      return NextResponse.json({ error: "Model not found or not yours" }, { status: 404 });
    }

    // 🔥 vytvoř nový key
    const parts = model.key.split("/");
    parts[1] = receiverId;
    const newKey = parts.join("/");

    return NextResponse.json({
      newKey,
      oldKey: model.key,
      message,
    });

  } catch (err) {
    console.error("GIFT ERROR:", err);
    return NextResponse.json({ error: "Failed to prepare gift" }, { status: 500 });
  }
}