// app/api/payments/create-order/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plan";
import Razorpay from "razorpay";
import { z } from "zod";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const schema = z.object({
  plan: z.enum(["PRO", "ENTERPRISE"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return Response.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { plan } = result.data;
  const planInfo = PLANS[plan];

  try {
    // Razorpay order create karo
    const order = await razorpay.orders.create({
      amount: planInfo.price,
      currency: "INR",
      receipt: `t3chat_${session.user.id}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        plan,
      },
    });

    // DB mein save karo
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: planInfo.price,
        plan,
        status: "CREATED",
        razorpayOrderId: order.id,
      },
    });

    return Response.json({
      success: true,
      data: {
        orderId: order.id,
        amount: planInfo.price,
        currency: "INR",
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        plan,
        planName: planInfo.name,
      },
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return Response.json({ error: "Payment init failed" }, { status: 500 });
  }
}