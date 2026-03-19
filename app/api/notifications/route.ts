import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const notifications: {
      id: string;
      type: string;
      data: unknown;
      createdAt: Date;
    }[] = [];

    // 1. Friend requests received (pending)
    const friendRequests = await prisma.friend.findMany({
      where: { addresseeId: userId, status: "PENDING" },
      include: { requester: { select: { id: true, nickname: true } } },
      orderBy: { createdAt: "desc" },
    });

    for (const f of friendRequests) {
      notifications.push({
        id: `friend-${f.id}`,
        type: "friend_request",
        data: {
          requester: { id: f.requester.id, nickname: f.requester.nickname },
        },
        createdAt: f.createdAt,
      });
    }

    // 2. Model gifts received (unseen)
    const modelGifts = await prisma.modelGift.findMany({
      where: { receiverId: userId, seen: false },
      include: {
        sender: { select: { id: true, nickname: true } },
        model: { select: { id: true, key: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const g of modelGifts) {
      notifications.push({
        id: `gift-${g.id}`,
        type: "model_gift",
        data: {
          sender: { id: g.sender.id, nickname: g.sender.nickname },
          model: { id: g.model.id, key: g.model.key },
          message: g.message,
        },
        createdAt: g.createdAt,
      });
    }

    // 3. Purchase requests where I am the seller (pending)
    let purchaseRequests: unknown[] = [];
    let myPurchaseUpdates: unknown[] = [];
    try {
      const pr = await (prisma as unknown as {
        purchase: {
          findMany: (args: unknown) => Promise<{
            id: string;
            status: string;
            buyerSeen: boolean;
            createdAt: Date;
            buyer: { id: string; nickname: string };
            seller: { id: string; nickname: string };
            offModel: { id: string; name: string; key: string; price: number };
          }[]>;
        };
      }).purchase.findMany({
        where: { sellerId: userId, status: "PENDING" },
        include: {
          buyer: { select: { id: true, nickname: true } },
          offModel: { select: { id: true, name: true, key: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      purchaseRequests = pr;

      // 4. My purchases as buyer that were accepted/declined and I haven't seen
      const mpu = await (prisma as unknown as {
        purchase: {
          findMany: (args: unknown) => Promise<{
            id: string;
            status: string;
            buyerSeen: boolean;
            createdAt: Date;
            buyer: { id: string; nickname: string };
            seller: { id: string; nickname: string };
            offModel: { id: string; name: string; key: string; price: number };
          }[]>;
        };
      }).purchase.findMany({
        where: {
          buyerId: userId,
          status: { in: ["ACCEPTED", "DECLINED"] },
          buyerSeen: false,
        },
        include: {
          seller: { select: { id: true, nickname: true } },
          offModel: { select: { id: true, name: true, key: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      myPurchaseUpdates = mpu;
    } catch {
      // Purchase table may not exist yet — silently skip
    }

    for (const p of purchaseRequests as {
      id: string; status: string; createdAt: Date;
      buyer: { id: string; nickname: string };
      offModel: { id: string; name: string; key: string; price: number };
    }[]) {
      notifications.push({
        id: `purchase-${p.id}`,
        type: "purchase_request",
        data: {
          buyer: p.buyer,
          offModel: p.offModel,
        },
        createdAt: p.createdAt,
      });
    }

    for (const p of myPurchaseUpdates as {
      id: string; status: string; createdAt: Date;
      seller: { id: string; nickname: string };
      offModel: { id: string; name: string; key: string };
    }[]) {
      notifications.push({
        id: `purchase-update-${p.id}`,
        type: "purchase_update",
        data: {
          status: p.status,
          seller: p.seller,
          offModel: p.offModel,
        },
        createdAt: p.createdAt,
      });
    }

    // Sort all by date descending
    notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ notifications, count: notifications.length });
  } catch (err) {
    console.error("NOTIFICATIONS ERROR:", err);
    return NextResponse.json({ notifications: [], count: 0 });
  }
}