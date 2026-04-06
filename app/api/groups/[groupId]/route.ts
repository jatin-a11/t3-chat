// app/api/groups/[groupId]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ groupId: string }> };

// GET — group details fetch karo
export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const myId = session.user.id;

  // Member hai ya nahi check
  const member = await withRetry(() =>
    prisma.groupMember.findUnique({
      where: { userId_groupChatId: { userId: myId, groupChatId: groupId } },
    })
  );

  if (!member) {
    return Response.json({ error: "Group ka member nahi ho" }, { status: 403 });
  }

  const group = await withRetry(() =>
    prisma.groupChat.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true, name: true, username: true,
                image: true, isOnline: true, lastSeen: true,
              },
            },
          },
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        },
        _count: { select: { messages: true, members: true } },
      },
    })
  );

  if (!group) {
    return Response.json({ error: "Group nahi mila" }, { status: 404 });
  }

  return Response.json({ group, myRole: member.role });
}

// PATCH — group update karo (sirf ADMIN)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const myId = session.user.id;

  // Admin check
  const member = await withRetry(() =>
    prisma.groupMember.findUnique({
      where: { userId_groupChatId: { userId: myId, groupChatId: groupId } },
    })
  );

  if (!member || member.role !== "ADMIN") {
    return Response.json(
      { error: "Sirf Admin group update kar sakta hai" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { name, avatar } = body;

  if (name && name.length > 50) {
    return Response.json(
      { error: "Group name max 50 characters ka hona chahiye" },
      { status: 400 }
    );
  }

  const updated = await withRetry(() =>
    prisma.groupChat.update({
      where: { id: groupId },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(avatar !== undefined && { avatar }),
      },
      select: { id: true, name: true, avatar: true },
    })
  );

  return Response.json({ success: true, group: updated });
}

// DELETE — group delete karo (sirf ADMIN/Creator)
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const myId = session.user.id;

  // Sirf creator delete kar sakta hai
  const group = await withRetry(() =>
    prisma.groupChat.findUnique({
      where: { id: groupId },
      select: { createdById: true },
    })
  );

  if (!group) {
    return Response.json({ error: "Group nahi mila" }, { status: 404 });
  }

  if (group.createdById !== myId) {
    return Response.json(
      { error: "Sirf group creator delete kar sakta hai" },
      { status: 403 }
    );
  }

  // Group delete — cascade se messages aur members bhi delete ho jayenge
  await withRetry(() =>
    prisma.groupChat.delete({ where: { id: groupId } })
  );

  return Response.json({ success: true });
}