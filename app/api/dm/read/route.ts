// app/api/dm/read/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

// PATCH — messages read mark karo (blue tick)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { senderId } = body;

  if (!senderId) {
    return Response.json({ error: "senderId required" }, { status: 400 });
  }

  const myId = session.user.id;

  // Sirf unread messages update karo
  const updated = await prisma.directMessage.updateMany({
    where: {
      senderId,
      receiverId: myId,
      status: { not: "READ" },
    },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });

  // Pusher se sender ko blue tick signal bhejo
  if (updated.count > 0) {
    await pusherServer.trigger(
      `private-user-${senderId}`,
      "messages-read",
      {
        readBy: myId,
        count: updated.count,
        readAt: new Date().toISOString(),
      }
    );
  }

  return Response.json({ success: true, count: updated.count });
}