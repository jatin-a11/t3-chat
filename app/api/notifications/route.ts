import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Unread DMs — sender ke hisaab se group karo
  const unreadDMs = await prisma.directMessage.findMany({
    where: {
      receiverId: session.user.id,
      status: { not: "READ" },
    },
    include: {
      sender: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Sender ke hisaab se group karo
  const grouped = new Map<string, typeof unreadDMs[0]>();
  for (const msg of unreadDMs) {
    if (!grouped.has(msg.senderId)) {
      grouped.set(msg.senderId, msg);
    }
  }

  // Count per sender
  const countMap = new Map<string, number>();
  for (const msg of unreadDMs) {
    countMap.set(msg.senderId, (countMap.get(msg.senderId) || 0) + 1);
  }

  const notifications = Array.from(grouped.values()).map((msg) => ({
    id: `dm-${msg.senderId}`,
    type: "new_dm",
    title: msg.sender.name || msg.sender.username || "Someone",
    subtitle: `${countMap.get(msg.senderId)} new message${(countMap.get(msg.senderId) || 0) > 1 ? "s" : ""}`,
    time: msg.createdAt,
    fromId: msg.senderId,
    image: msg.sender.image,
  }));

  return Response.json({ success: true, data: notifications });
}