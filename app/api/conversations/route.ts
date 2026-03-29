// app/api/conversations/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Login karo pehle" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { model = "llama-3.3-70b-versatile" } = body;

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      model,
      title: "New Chat",
    },
  });

  // Fix: seedha conversation return karo — wrap mat karo
  return Response.json(conversation, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  // Fix: condition ulti thi — !session hone pe unauthorized
  if (!session?.user?.id) {
    return Response.json({ error: "Login karo pehle" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      model: true,
      pinned: true,
      updatedAt: true,
    },
  });

  return Response.json(conversations);
}