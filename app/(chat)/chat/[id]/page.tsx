// app/(chat)/chat/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChatWindow } from "@/app/components/chat/chat-window";

export default async function ChatIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  // Try-catch — DB timeout pe crash mat karo, empty chat dikhao
  let initialMessages: { id: string; role: "user" | "assistant"; content: string }[] = [];
  let title = "";

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: session.user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) {
      redirect("/chat");
    }

    title = conversation.title ?? "";

    // Sirf user/assistant messages lo — type safe
    initialMessages = conversation.messages
      .filter(
        (m): m is typeof m & { role: "user" | "assistant" } =>
          m.role === "user" || m.role === "assistant"
      )
      .map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }));
  } catch (err) {
    console.error("[ChatIdPage] DB error:", err);
    // DB down hai — blank chat dikhao, crash mat karo
    // User refresh karke retry kar sakta hai
  }

  return (
    <ChatWindow
      conversationId={id}
      initialMessages={initialMessages}
      title={title}
      userName={session.user.name || session.user.email || "User"}
    />
  );
}