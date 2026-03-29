

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { purchaseId } = await req.json();
    if (!purchaseId) return NextResponse.json({ error: "Missing purchaseId" }, { status: 400 });

    // Načti purchase s daty
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        offModel: true,
        seller: { select: { id: true, nickname: true, bankAccount: true } },
        buyer: { select: { id: true, nickname: true, email: true } },
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    if (purchase.buyerId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (purchase.status !== "PENDING") {
      return NextResponse.json({ error: "Purchase is not in PENDING state" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const priceInCents = Math.round(purchase.offModel.price * 100);

    // Vytvoř Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: priceInCents,
            product_data: {
              name: purchase.offModel.name,
              description: purchase.offModel.description || `3D Model od ${purchase.seller.nickname}`,
              metadata: {
                modelKey: purchase.offModel.key,
                sellerId: purchase.seller.id,
                sellerNickname: purchase.seller.nickname,
              },
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        purchaseId: purchase.id,
        buyerId: purchase.buyerId,
        sellerId: purchase.sellerId,
        offModelId: purchase.offModelId,
      },
      customer_email: purchase.buyer.email,
      success_url: `${appUrl}/dashboard/purchaseSuccess?purchaseId=${purchase.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/offModelViewPage?key=${encodeURIComponent(purchase.offModel.key)}&purchase_cancelled=true`,
      payment_intent_data: {
        description: `Platba za 3D model: ${purchase.offModel.name} od ${purchase.seller.nickname}`,
        // Pokud prodejce má Stripe účet, lze přidat transfer_data pro automatické rozdělení platby.
        // Pro trial/simulaci pouze přijmeme platbu bez přeposílání.
        metadata: {
          purchaseId: purchase.id,
          sellerBankAccount: purchase.seller.bankAccount || "not_set",
        },
      },
    });

    // Uložit session ID do purchase
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ sessionUrl: session.url, sessionId: session.id });
  } catch (err) {
    console.error("STRIPE CHECKOUT ERROR:", err);
    return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
  }
}