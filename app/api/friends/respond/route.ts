// app/api/friends/respond/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — accept / reject / block / unfriend
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { friendshipId, action } = body;

  if (!friendshipId || !action) {
    return Response.json(
      { error: "friendshipId aur action required hai" },
      { status: 400 }
    );
  }

  const validActions = ["accept", "reject", "block", "unfriend"];
  if (!validActions.includes(action)) {
    return Response.json(
      { error: `Invalid action. Valid: ${validActions.join(", ")}` },
      { status: 400 }
    );
  }

  const myId = session.user.id;

  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
    include: {
      sender: { select: { id: true, name: true, username: true } },
      receiver: { select: { id: true, name: true, username: true } },
    },
  });

  if (!friendship) {
    return Response.json({ error: "Friendship nahi mili" }, { status: 404 });
  }

  // Authorization check
  const isSender = friendship.senderId === myId;
  const isReceiver = friendship.receiverId === myId;

  if (!isSender && !isReceiver) {
    return Response.json({ error: "Authorized nahi ho" }, { status: 403 });
  }

  const me = await prisma.user.findUnique({
    where: { id: myId },
    select: { name: true, username: true },
  });

  // ── ACCEPT ──
  if (action === "accept") {
    if (!isReceiver || friendship.status !== "PENDING") {
      return Response.json(
        { error: "Sirf receiver accept kar sakta hai" },
        { status: 403 }
      );
    }

    await prisma.$transaction([
      prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: "ACCEPTED" },
      }),
      // Sender ko notify karo
      prisma.notification.create({
        data: {
          userId: friendship.senderId,
          type: "FRIEND_ACCEPTED",
          message: `${me?.name ?? me?.username ?? "Kisi"} ne friend request accept ki`,
          data: JSON.stringify({ friendshipId, userId: myId }),
        },
      }),
      // Purani FRIEND_REQUEST notification delete karo
      prisma.notification.deleteMany({
        where: {
          userId: myId,
          type: "FRIEND_REQUEST",
          data: { contains: friendship.senderId },
        },
      }),
    ]);

    return Response.json({ success: true, status: "ACCEPTED" });
  }

  // ── REJECT ──
  if (action === "reject") {
    if (!isReceiver || friendship.status !== "PENDING") {
      return Response.json(
        { error: "Sirf receiver reject kar sakta hai" },
        { status: 403 }
      );
    }

    await prisma.$transaction([
      prisma.friendship.delete({ where: { id: friendshipId } }),
      prisma.notification.deleteMany({
        where: {
          userId: myId,
          type: "FRIEND_REQUEST",
          data: { contains: friendship.senderId },
        },
      }),
    ]);

    return Response.json({ success: true, status: "REJECTED" });
  }

  // ── BLOCK ──
  if (action === "block") {
    // Koi bhi block kar sakta hai — sender ya receiver
    const blockedUserId = isSender ? friendship.receiverId : friendship.senderId;

    const operations: any[] = [
      // Block create karo
      prisma.block.upsert({
        where: {
          blockerId_blockedId: { blockerId: myId, blockedId: blockedUserId },
        },
        create: { blockerId: myId, blockedId: blockedUserId },
        update: {},
      }),
      // Notifications cleanup
      prisma.notification.deleteMany({
        where: {
          userId: myId,
          data: { contains: blockedUserId },
        },
      }),
    ];

    // Agar friendship exist karti hai toh delete karo
    if (friendship.status !== "BLOCKED") {
      operations.push(
        prisma.friendship.delete({ where: { id: friendshipId } })
      );
    }

    await prisma.$transaction(operations);

    return Response.json({ success: true, status: "BLOCKED" });
  }

  // ── UNFRIEND ──
  if (action === "unfriend") {
    if (friendship.status !== "ACCEPTED") {
      return Response.json(
        { error: "Sirf friends ko unfriend kar sakte ho" },
        { status: 400 }
      );
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });

    return Response.json({ success: true, status: "UNFRIENDED" });
  }
}