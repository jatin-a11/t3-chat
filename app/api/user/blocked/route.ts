// app/api/user/blocked/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";

// GET — blocked users list
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocks = await withRetry(() =>
    prisma.block.findMany({
      where: { blockerId: session.user.id },
      include: {
        blocked: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  );

  const blocked = blocks.map((b) => b.blocked);
  return Response.json({ blocked });
}

// DELETE — unblock karo
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { blockedId } = body;

  if (!blockedId) {
    return Response.json({ error: "blockedId required" }, { status: 400 });
  }

  await withRetry(() =>
    prisma.block.deleteMany({
      where: { blockerId: session.user.id, blockedId },
    })
  );

  return Response.json({ success: true });
}