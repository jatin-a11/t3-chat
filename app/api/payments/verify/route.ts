// app/api/payments/verify/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  plan: z.enum(["PRO", "ENTERPRISE"]),
});

function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan,
  } = result.data;

  // Signature verify karo — tampering check
  const isValid = verifySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    return Response.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // Payment verify hone ke baad — subscription activate karo
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // 1 month

  await prisma.$transaction([
    // Payment update karo
    prisma.payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        status: "PAID",
        razorpayPayId: razorpay_payment_id,
      },
    }),

    // Subscription create/update karo
    prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan,
        status: "ACTIVE",
        startDate: new Date(),
        endDate,
      },
      create: {
        userId: session.user.id,
        plan,
        status: "ACTIVE",
        startDate: new Date(),
        endDate,
      },
    }),
  ]);

  return Response.json({
    success: true,
    message: `${plan} plan activate ho gaya!`,
    endDate,
  });
}