import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// POST /api/friends - send friend request
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { addresseeId } = await req.json();
    if (!addresseeId) return NextResponse.json({ error: "Missing addresseeId" }, { status: 400 });
    if (addresseeId === userId) return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });

    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId },
          { requesterId: addresseeId, addresseeId: userId },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already exists", existingStatus: existing.status },
        { status: 409 }
      );
    }

    const friend = await prisma.friend.create({
      data: { requesterId: userId, addresseeId },
    });

    return NextResponse.json({ friend });
  } catch (err) {
    console.error("FRIEND REQUEST ERROR:", err);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}

// GET /api/friends - list accepted friends + check status with a specific user
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const checkId = searchParams.get("checkId");

    if (checkId) {
      const record = await prisma.friend.findFirst({
        where: {
          OR: [
            { requesterId: userId, addresseeId: checkId },
            { requesterId: checkId, addresseeId: userId },
          ],
        },
      });

      if (!record) return NextResponse.json({ status: "none" });

      const direction = record.requesterId === userId ? "sent" : "received";
      return NextResponse.json({ status: record.status, direction, id: record.id });
    }

    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { requesterId: userId, status: "ACCEPTED" },
          { addresseeId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        requester: { select: { id: true, nickname: true } },
        addressee: { select: { id: true, nickname: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const friendList = friends.map((f) => {
      const friend = f.requesterId === userId ? f.addressee : f.requester;
      return { id: friend.id, nickname: friend.nickname, friendshipId: f.id };
    });

    return NextResponse.json({ friends: friendList });
  } catch (err) {
    console.error("GET FRIENDS ERROR:", err);
    return NextResponse.json({ friends: [] });
  }
}

// DELETE /api/friends - remove friendship (unfriend) + notify the other party
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { friendId } = await req.json();
    if (!friendId) return NextResponse.json({ error: "Missing friendId" }, { status: 400 });

    const record = await prisma.friend.findUnique({
      where: { id: friendId },
      include: {
        requester: { select: { id: true, nickname: true } },
        addressee: { select: { id: true, nickname: true } },
      },
    });

    if (!record || (record.requesterId !== userId && record.addresseeId !== userId)) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    // Determine who is the other party
    const removedBy = record.requesterId === userId ? record.requester : record.addressee;
    const otherUser = record.requesterId === userId ? record.addressee : record.requester;

    await prisma.friend.delete({ where: { id: friendId } });

    // Store unfriend notification for the other user (if the table exists)
    try {
      await (prisma as any).notification.create({
        data: {
          userId: otherUser.id,
          type: "friend_removed",
          data: {
            removedBy: { id: removedBy.id, nickname: removedBy.nickname },
          },
          seen: false,
        },
      });
    } catch {
      // Notification table may not exist yet — silently skip
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE FRIEND ERROR:", err);
    return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 });
  }
}