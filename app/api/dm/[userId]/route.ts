// app/api/dm/[userId]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { pusherServer } from "@/lib/pusher";

type Params = { params: Promise<{ userId: string }> };

function getDMChannel(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `private-dm-${sorted[0]}-${sorted[1]}`;
}

// GET — messages fetch karo
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId: otherUserId } = await params;
  const myId = session.user.id;

  // Friends check
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    },
  });

  if (!friendship) {
    return Response.json({ error: "Pehle dost banao" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const take = 30;

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      sender: {
        select: {
          id: true, name: true,
          username: true, image: true,
        },
      },
    },
  });

  // Unread → READ mark karo
  const unreadIds = messages
    .filter((m) => m.senderId === otherUserId && m.status !== "READ")
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    await prisma.directMessage.updateMany({
      where: { id: { in: unreadIds } },
      data: { status: "READ" },
    });

    // Sender ko blue tick signal
    const channelName = getDMChannel(myId, otherUserId);
    await pusherServer.trigger(
      channelName,
      "messages-read",
      { readBy: myId, messageIds: unreadIds }
    );
  }

  const nextCursor =
    messages.length === take ? messages[messages.length - 1].id : null;

  return Response.json({
    messages: messages.reverse(), // Oldest first
    nextCursor,
  });
}

// POST — message bhejo
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId: receiverId } = await params;
  const myId = session.user.id;

  const body = await req.json().catch(() => ({}));
  const { content } = body;

  if (!content?.trim()) {
    return Response.json(
      { error: "Message empty nahi ho sakta" },
      { status: 400 }
    );
  }

  if (content.length > 4000) {
    return Response.json(
      { error: "Message bahut lamba hai (max 4000 chars)" },
      { status: 400 }
    );
  }

  // Friends check
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: myId, receiverId },
        { senderId: receiverId, receiverId: myId },
      ],
    },
  });

  if (!friendship) {
    return Response.json({ error: "Pehle dost banao" }, { status: 403 });
  }

  // Receiver online check — tick decide karo
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { isOnline: true },
  });

  // Message create karo
  const message = await prisma.directMessage.create({
    data: {
      content: content.trim(),
      senderId: myId,
      receiverId,
      // Online → DELIVERED ✓✓ | Offline → SENT ✓
      status: receiver?.isOnline ? "DELIVERED" : "SENT",
    },
    include: {
      sender: {
        select: {
          id: true, name: true,
          username: true, image: true,
        },
      },
    },
  });

  // DM window ke liye — real-time message
  const channelName = getDMChannel(myId, receiverId);
  await pusherServer.trigger(
    channelName,
    "new-message",
    message
  );

  // Receiver ke sidebar notification
  await pusherServer.trigger(
    `private-user-${receiverId}`,
    "new-dm",
    {
      from: message.sender,
      senderId: myId,           // ← sidebar unread count ke liye
      preview: content.trim().slice(0, 60),
      messageId: message.id,
    }
  );

  return Response.json({ message }, { status: 201 });
}