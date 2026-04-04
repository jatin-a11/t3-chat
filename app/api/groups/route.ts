import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { z } from "zod";

// GET — User ke groups
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await prisma.groupChat.findMany({
      where: {
        members: {
          some: { userId: session.user.id },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true, name: true, username: true,
                image: true, isOnline: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Last message preview
          include: {
            sender: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json({ success: true, data: groups });

  } catch (error) {
    console.error("GET /api/groups error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — Group banao
const createSchema = z.object({
  name: z.string().min(1).max(50),
  memberIds: z.array(z.string()).min(1).max(49),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, memberIds } = result.data;

    // Creator bhi member hoga
    const allMemberIds = [...new Set([...memberIds, session.user.id])];

    const group = await prisma.groupChat.create({
      data: {
        name,
        createdById: session.user.id,
        members: {
          create: allMemberIds.map((userId) => ({
            userId,
            role: userId === session.user.id ? "ADMIN" : "MEMBER",
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true, name: true, username: true, image: true,
              },
            },
          },
        },
      },
    });

    // Saare members ko notify karo
    await Promise.all(
      memberIds.map((id) =>
        pusherServer.trigger(
          `private-user-${id}`,
          "group-added",
          { group }
        )
      )
    );

    return Response.json({ success: true, data: group }, { status: 201 });

  } catch (error) {
    console.error("POST /api/groups error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}