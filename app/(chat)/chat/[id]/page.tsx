import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ChatWindow } from "@/app/components/chat/chat-window";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) notFound();

  const initialMessages = conversation.messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  // Name properly nikalo
  const userName =
    session.user.name?.trim() ||
    session.user.email?.split("@")[0] ||
    "there";

  return (
    <ChatWindow
      conversationId={conversation.id}
      initialMessages={initialMessages}
      model={conversation.model}
      title={conversation.title}
      userName={userName}
    />
  );
}