// app/api/payments/webhook/route.ts
// Razorpay webhook — payment events handle karo
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return Response.json({ error: "No signature" }, { status: 400 });
  }

  // Webhook signature verify karo
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case "payment.captured": {
      const payment = event.payload.payment.entity;

      await prisma.payment.updateMany({
        where: { razorpayOrderId: payment.order_id },
        data: {
          status: "PAID",
          razorpayPayId: payment.id,
        },
      });
      break;
    }

    case "payment.failed": {
      const payment = event.payload.payment.entity;

      await prisma.payment.updateMany({
        where: { razorpayOrderId: payment.order_id },
        data: { status: "FAILED" },
      });
      break;
    }

    case "subscription.cancelled": {
      const sub = event.payload.subscription.entity;
      const notes = sub.notes as { userId?: string };

      if (notes?.userId) {
        await prisma.subscription.updateMany({
          where: { userId: notes.userId },
          data: { status: "CANCELLED" },
        });
      }
      break;
    }
  }

  return Response.json({ received: true });
}