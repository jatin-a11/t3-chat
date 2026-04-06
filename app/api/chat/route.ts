// app/api/chat/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages, conversationId, model = "llama-3.3-70b-versatile" } = body;

    let convId = conversationId;

    if (!convId) {
      const newConv = await withRetry(() =>
        prisma.conversation.create({
          data: { userId: session.user.id, model, title: "New Chat" },
        })
      );
      convId = newConv.id;
    } else {
      const conv = await withRetry(() =>
        prisma.conversation.findFirst({
          where: { id: convId, userId: session.user.id },
        })
      );
      if (!conv) return Response.json({ error: "Not found" }, { status: 404 });
    }

    const lastMessage = messages[messages.length - 1];
    const lastContent =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    await withRetry(() =>
      prisma.message.create({
        data: { role: "user", content: lastContent, conversationId: convId },
      })
    );

    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });

    const aiMessages = messages.map((m: any) => ({
      role: m.role as "user" | "assistant" | "system",
      content:
        typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }));

    const result = await streamText({
      model: groq(model),
      messages: aiMessages,
      system: "You are a helpful assistant. Answer clearly and concisely.",
      onFinish: async ({ text }) => {
        try {
          await withRetry(() =>
            prisma.message.create({
              data: {
                role: "assistant",
                content: text,
                conversationId: convId,
              },
            })
          );
          await withRetry(() =>
            prisma.conversation.update({
              where: { id: convId },
              data: {
                ...(messages.length === 1 && {
                  title: lastContent.slice(0, 50),
                }),
                updatedAt: new Date(),
              },
            })
          );
        } catch (err) {
          console.error("[onFinish] DB error:", err);
        }
      },
    });

    return result.toTextStreamResponse({
      headers: { "x-conversation-id": convId },
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}