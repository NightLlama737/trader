import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { type, id } = await req.json();

    if (type === "gift") {
      await prisma.modelGift.updateMany({
        where: { id, receiverId: userId },
        data: { seen: true },
      });
    } else if (type === "purchase_update") {
      await prisma.purchase.updateMany({
        where: { id, buyerId: userId },
        data: { buyerSeen: true },
      }).catch(() => {});
    } else if (type === "sale_confirmation") {
      await prisma.purchase.updateMany({
        where: { id, sellerId: userId },
        data: { sellerSeen: true },
      }).catch(() => {});
    } else if (type === "friend_removed") {
      // id here is the Notification record id (without "notif-" prefix)
      await (prisma as any).notification.updateMany({
        where: { id, userId },
        data: { seen: true },
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("MARK SEEN ERROR:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}