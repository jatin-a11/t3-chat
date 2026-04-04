// app/api/friends/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { NextRequest } from "next/server";

// GET — friends list ya pending requests
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myId = session.user.id;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  // ?type=requests — notification panel ke liye pending requests
  if (type === "requests") {
    const requests = await withRetry(() =>
      prisma.friendship.findMany({
        where: { receiverId: myId, status: "PENDING" },
        include: {
          sender: {
            select: {
              id: true, name: true, username: true,
              image: true, isOnline: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    );

    return Response.json({ data: requests });
  }

  // Default — accepted friends list
  const friendships = await withRetry(() =>
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: myId }, { receiverId: myId }],
      },
      include: {
        sender: {
          select: {
            id: true, name: true, username: true,
            image: true, isOnline: true, lastSeen: true,
          },
        },
        receiver: {
          select: {
            id: true, name: true, username: true,
            image: true, isOnline: true, lastSeen: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })
  );

  const friends = friendships.map((f) => ({
    friendshipId: f.id,
    ...(f.senderId === myId ? f.receiver : f.sender),
  }));

  return Response.json({ success: true, data: friends });
}

// POST — friend request bhejo
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { receiverId } = body;

  if (!receiverId) {
    return Response.json({ error: "receiverId required hai" }, { status: 400 });
  }

  const myId = session.user.id;

  if (myId === receiverId) {
    return Response.json(
      { error: "Khud ko request nahi bhej sakte" },
      { status: 400 }
    );
  }

  // Receiver exist karta hai?
  const receiver = await withRetry(() =>
    prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, username: true },
    })
  );

  if (!receiver) {
    return Response.json({ error: "User nahi mila" }, { status: 404 });
  }

  // Block check
  const block = await withRetry(() =>
    prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: myId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: myId },
        ],
      },
    })
  );

  if (block) {
    return Response.json({ error: "Request nahi bhej sakte" }, { status: 403 });
  }

  // Already exist?
  const existing = await withRetry(() =>
    prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: myId, receiverId },
          { senderId: receiverId, receiverId: myId },
        ],
      },
    })
  );

  if (existing) {
    if (existing.status === "ACCEPTED") {
      return Response.json({ error: "Already friends hain" }, { status: 400 });
    }
    if (existing.status === "PENDING") {
      return Response.json(
        { error: "Request already bheji ja chuki hai" },
        { status: 400 }
      );
    }
  }

  // Sender info
  const sender = await withRetry(() =>
    prisma.user.findUnique({
      where: { id: myId },
      select: { name: true, username: true },
    })
  );

  // Friendship + Notification ek saath
  const [friendship] = await withRetry(() =>
    prisma.$transaction([
      prisma.friendship.create({
        data: { senderId: myId, receiverId, status: "PENDING" },
      }),
      prisma.notification.create({
        data: {
          userId: receiverId,
          type: "FRIEND_REQUEST",
          message: `${sender?.name ?? sender?.username ?? "Kisi"} ne friend request bheji`,
          data: JSON.stringify({ senderId: myId }),
        },
      }),
    ])
  );

  return Response.json({ success: true, friendship }, { status: 201 });
}

// DELETE — request cancel karo
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { friendshipId } = body;
  const myId = session.user.id;

  const friendship = await withRetry(() =>
    prisma.friendship.findFirst({
      where: { id: friendshipId, senderId: myId, status: "PENDING" },
    })
  );

  if (!friendship) {
    return Response.json({ error: "Request nahi mili" }, { status: 404 });
  }

  await withRetry(() =>
    prisma.$transaction([
      prisma.friendship.delete({ where: { id: friendshipId } }),
      prisma.notification.deleteMany({
        where: {
          userId: friendship.receiverId,
          type: "FRIEND_REQUEST",
          data: { contains: myId },
        },
      }),
    ])
  );

  return Response.json({ success: true });
}