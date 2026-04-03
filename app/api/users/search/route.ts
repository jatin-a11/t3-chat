// app/api/users/search/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim().toLowerCase();

  // Minimum 2 characters chahiye
  if (!query || query.length < 2) {
    return Response.json({ users: [] });
  }

  // Max 50 characters allowed
  if (query.length > 50) {
    return Response.json(
      { error: "Search query bahut lamba hai" },
      { status: 400 }
    );
  }

  const myId = session.user.id;

  // ── Blocked users fetch ──
  // Jin users ne mujhe block kiya ya maine unhe — dono side se
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ blockerId: myId }, { blockedId: myId }],
    },
    select: { blockerId: true, blockedId: true },
  });

  const blockedIds = new Set(
    blocks.map((b) => (b.blockerId === myId ? b.blockedId : b.blockerId))
  );

  // ── User search ──
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: myId } },                         // Khud nahi
        { id: { notIn: Array.from(blockedIds) } },     // Blocked nahi
        { username: { not: null } },                   // Username hona chahiye
        {
          OR: [
            // @ ke saath ya bina — username search
            {
              username: {
                contains: query.startsWith("@") ? query.slice(1) : query,
                mode: "insensitive",
              },
            },
            // Name se bhi search
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      isOnline: true,
      lastSeen: true,
    },
    take: 10,
    orderBy: [
      // Online users pehle
      { isOnline: "desc" },
      { username: "asc" },
    ],
  });

  if (users.length === 0) {
    return Response.json({ users: [] });
  }

  // ── Friendship status fetch ──
  const userIds = users.map((u) => u.id);

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { senderId: myId, receiverId: { in: userIds } },
        { receiverId: myId, senderId: { in: userIds } },
      ],
    },
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      status: true,
    },
  });

  // ── Result build karo ──
  const result = users.map((user) => {
    const friendship = friendships.find(
      (f) =>
        (f.senderId === myId && f.receiverId === user.id) ||
        (f.receiverId === myId && f.senderId === user.id)
    );

    // Relation status determine karo
    type RelationStatus =
      | "none"           // Koi relation nahi — "Add Friend" button
      | "pending_sent"   // Maine request bheji — "Pending / Cancel"
      | "pending_received" // Unhone bheji — "Accept / Reject"
      | "friends";       // Dono friends hain — "Message"

    let relationStatus: RelationStatus = "none";

    if (friendship) {
      if (friendship.status === "ACCEPTED") {
        relationStatus = "friends";
      } else if (friendship.status === "PENDING") {
        relationStatus =
          friendship.senderId === myId
            ? "pending_sent"
            : "pending_received";
      }
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      friendshipId: friendship?.id ?? null,
      relationStatus,
    };
  });

  return Response.json({ users: result });
}