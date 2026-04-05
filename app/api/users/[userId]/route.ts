// app/api/users/[userId]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  const user = await withRetry(() =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        isOnline: true,
        lastSeen: true,
      },
    })
  );

  if (!user) {
    return Response.json({ error: "User nahi mila" }, { status: 404 });
  }

  return Response.json({ user });
}