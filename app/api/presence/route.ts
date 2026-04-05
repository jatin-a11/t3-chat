import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Body parse karo — validate karo
    let status = "online";
    try {
      const body = await req.json();
      status = body?.status || "online";
    } catch {
      // Body parse nahi hua — default online
      status = "online";
    }

    const isOnline = status === "online";

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isOnline,
        lastSeen: new Date(),
      },
    });

    // Friends fetch karo
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
    });

    const friendIds = friendships.map((f) =>
      f.senderId === session.user.id ? f.receiverId : f.senderId
    );

    // Friends ko broadcast karo
    if (friendIds.length > 0) {
      await Promise.all(
        friendIds.map((id) =>
          pusherServer.trigger(
            `private-user-${id}`,
            "presence-update",
            {
              userId: session.user.id,
              isOnline,
              lastSeen: new Date(),
            }
          )
        )
      );
    }

    return Response.json({ success: true, isOnline });

  } catch (error) {
    console.error("Presence error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}