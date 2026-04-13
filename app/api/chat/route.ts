
// app/api/chat/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { canSendMessage, incrementUsage } from "@/lib/usage";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Daily limit Check
    const limitCheck = await canSendMessage(session.user.id)

    if (!limitCheck.allowed){
      return Response.json({
        error:"Daily limit reach ho gai",
        code:"LIMIT_EXCEEDED",
        used: limitCheck.used,
        limit: limitCheck.limit,
        plan: limitCheck.plan,
         message:
          limitCheck.plan === "FREE"
            ? `Free plan mein sirf ${limitCheck.limit} messages per day. Pro upgrade karo!`
            : `Aaj ki limit ${limitCheck.limit} messages reach ho gayi.`,
      },{status:429}
    )
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

        // Usage increment karo — pehle message save karo
        await Promise.all([
    prisma.message.create({
      data: { role: "user", content: lastContent, conversationId: convId },
    }),
    incrementUsage(session.user.id), // ← Daily count badha do
  ]);


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