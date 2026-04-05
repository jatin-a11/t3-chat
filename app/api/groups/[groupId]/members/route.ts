import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { z } from "zod";

// GET — Group members
export async function GET(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    const members = await prisma.groupMember.findMany({
      where: { groupChatId: groupId },
      include: {
        user: {
          select: {
            id: true, name: true, username: true,
            image: true, isOnline: true, lastSeen: true,
          },
        },
      },
    });

    return Response.json({ success: true, data: members });

  } catch (error) {
    console.error("GET /api/groups/[groupId]/members error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — Member add karo (sirf ADMIN)
const addSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    // Admin check
    const adminMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupChatId: {
          userId: session.user.id,
          groupChatId: groupId,
        },
      },
    });

    if (!adminMember || adminMember.role !== "ADMIN") {
      return Response.json(
        { error: "Sirf admin member add kar sakta hai" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = addSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    const { userId } = result.data;

    // Already member?
    const existing = await prisma.groupMember.findUnique({
      where: {
        userId_groupChatId: { userId, groupChatId: groupId },
      },
    });

    if (existing) {
      return Response.json(
        { error: "Pehle se member hai" },
        { status: 409 }
      );
    }

    const member = await prisma.groupMember.create({
      data: { userId, groupChatId: groupId, role: "MEMBER" },
      include: {
        user: {
          select: {
            id: true, name: true, username: true, image: true,
          },
        },
      },
    });

    // New member ko notify karo
    await pusherServer.trigger(
      `private-user-${userId}`,
      "group-added",
      { groupId }
    );

    // Group mein sabko batao
    await pusherServer.trigger(
      `private-group-${groupId}`,
      "member-added",
      { member }
    );

    return Response.json({ success: true, data: member }, { status: 201 });

  } catch (error) {
    console.error("POST /api/groups/[groupId]/members error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE — Member remove karo (ADMIN ya khud leave karo)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || session.user.id;

    // Agar doosre ko remove kar raha hai — admin hona chahiye
    if (userId !== session.user.id) {
      const adminMember = await prisma.groupMember.findUnique({
        where: {
          userId_groupChatId: {
            userId: session.user.id,
            groupChatId: groupId,
          },
        },
      });

      if (!adminMember || adminMember.role !== "ADMIN") {
        return Response.json(
          { error: "Sirf admin remove kar sakta hai" },
          { status: 403 }
        );
      }
    }

    await prisma.groupMember.delete({
      where: {
        userId_groupChatId: { userId, groupChatId: groupId },
      },
    });

    // Group mein sabko batao
    await pusherServer.trigger(
      `private-group-${groupId}`,
      "member-removed",
      { userId }
    );

    return Response.json({ success: true });

  } catch (error) {
    console.error("DELETE /api/groups/[groupId]/members error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}