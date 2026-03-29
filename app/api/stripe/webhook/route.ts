

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/S3";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.CheckoutSession;
    const purchaseId = session.metadata?.purchaseId;

    if (!purchaseId) {
      console.error("No purchaseId in session metadata");
      return NextResponse.json({ error: "No purchaseId" }, { status: 400 });
    }

    try {
      const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        include: { offModel: true },
      });

      if (!purchase || purchase.status === "ACCEPTED") {
        // Idempotent - already processed
        return NextResponse.json({ ok: true });
      }

      const sourceKey = purchase.offModel.key;
      const fileName = sourceKey.split("/").pop() || `${crypto.randomUUID()}.glb`;
      const destKey = `models/${purchase.buyerId}/${crypto.randomUUID()}-${fileName}`;

      // Zkopíruj soubor v S3 pro kupce
      await s3.send(
        new CopyObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          CopySource: `${process.env.AWS_S3_BUCKET}/${sourceKey}`,
          Key: destKey,
        })
      );

      // Vytvoř záznam modelu pro kupce
      await prisma.model.create({
        data: {
          userId: purchase.buyerId,
          key: destKey,
        },
      });

      // Aktualizuj purchase jako zaplacený a přijatý
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: "ACCEPTED",
          buyerSeen: false,
          paidAt: new Date(),
        },
      });

      console.log(`Purchase ${purchaseId} completed via Stripe, model copied to ${destKey}`);
    } catch (err) {
      console.error("Error processing completed payment:", err);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.CheckoutSession;
    const purchaseId = session.metadata?.purchaseId;

    if (purchaseId) {
      // Zruš purchase pokud vypršel
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { status: "DECLINED", buyerSeen: false },
      }).catch(() => {});
    }
  }

  return NextResponse.json({ received: true });
}

// Důležité: Stripe webhook potřebuje raw body, ne parsed JSON
export const config = {
  api: {
    bodyParser: false,
  },
};