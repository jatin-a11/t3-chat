// app/api/usage/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canSendMessage } from "@/lib/usage";
import { PLANS } from "@/lib/plan";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await canSendMessage(session.user.id);
  const planInfo = PLANS[status.plan];

  return Response.json({
    success: true,
    data: {
      plan: status.plan,
      planName: planInfo.name,
      used: status.used,
      limit: status.limit,
      remaining: status.remaining,
      allowed: status.allowed,
      percentage: Math.round((status.used / status.limit) * 100),
      resetAt: "midnight IST",
    },
  });
}