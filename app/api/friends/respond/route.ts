import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { friendId, action } = await req.json();
    if (!friendId || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const friendRequest = await prisma.friend.findUnique({ where: { id: friendId } });
    if (!friendRequest || friendRequest.addresseeId !== userId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    if (action === "decline") {
      await prisma.friend.delete({ where: { id: friendId } });
      return NextResponse.json({ ok: true, status: "declined" });
    }

    const updated = await prisma.friend.update({
      where: { id: friendId },
      data: { status: "ACCEPTED" },
    });

    return NextResponse.json({ ok: true, friend: updated });
  } catch (err) {
    console.error("FRIEND RESPOND ERROR:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}