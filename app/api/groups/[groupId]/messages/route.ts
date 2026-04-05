// app/api/groups/[groupId]/messages/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ groupId: string }> };

// GET — group messages fetch karo
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const myId = session.user.id;

  // Member hai ya nahi
  const member = await prisma.groupMember.findUnique({
    where: { userId_groupChatId: { userId: myId, groupChatId: groupId } },
  });

  if (!member) {
    return Response.json({ error: "Group ka member nahi ho" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const take = 30;

  const messages = await prisma.groupMessage.findMany({
    where: { groupChatId: groupId },
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

  const nextCursor =
    messages.length === take ? messages[messages.length - 1].id : null;

  return Response.json({
    messages: messages.reverse(),
    nextCursor,
  });
}

// POST — group message bhejo
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const myId = session.user.id;

  // Member hai ya nahi
  const member = await prisma.groupMember.findUnique({
    where: { userId_groupChatId: { userId: myId, groupChatId: groupId } },
  });

  if (!member) {
    return Response.json({ error: "Group ka member nahi ho" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { content } = body;

  if (!content?.trim()) {
    return Response.json({ error: "Message empty nahi ho sakta" }, { status: 400 });
  }

  if (content.length > 4000) {
    return Response.json(
      { error: "Message bahut lamba hai (max 4000 chars)" },
      { status: 400 }
    );
  }

  const [message] = await prisma.$transaction([
    prisma.groupMessage.create({
      data: {
        content: content.trim(),
        senderId: myId,
        groupChatId: groupId,
      },
      include: {
        sender: {
          select: {
            id: true, name: true,
            username: true, image: true,
          },
        },
      },
    }),
    // Group updatedAt refresh karo
    prisma.groupChat.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
    }),
  ]);

  // Pusher — group channel mein push karo
  await pusherServer.trigger(
    `private-group-${groupId}`,
    "new-message",
    message
  );

  return Response.json({ message }, { status: 201 });
}