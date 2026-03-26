import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createGroq } from "@ai-sdk/groq"
import { streamText } from "ai"


export const maxDuration = 30;

export async function POST(req: Request) {
  // 1. Auth Check
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "login kro phle" }, { status: 401 })
  }

  // 2. Body Parse
  const body = await req.json()
  const messages: any[] = body.messages
  const conversationId: string = body.conversationId
  const model: string = body.model ?? "llama-3.3-70b-versatile"

  // 3. Security
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId: session.user.id
    }
  })
  if (!conversation) {
    return Response.json({ error: "Conversation nhi milli" }, { status: 404 })
  }

  // 4. User message save
  const lastMessage = messages[messages.length - 1]
  const lastContent = typeof lastMessage.content === "string"
    ? lastMessage.content
    : JSON.stringify(lastMessage.content)

  await prisma.message.create({
    data: {
      role: "user",
      content: lastContent,
      conversationId
    }
  })

  // 5. Groq setup
  const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY!
  })

  // 6. Stream
  const result = await streamText({
    model: groq(model),
    messages,
    system: "You are a helpful assistant",
    onFinish: async ({ text }) => {
      await prisma.message.create({
        data: {
          role: "assistant",
          content: text,
          conversationId
        }
      })

      if (messages.length === 1) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            title: lastContent.slice(0, 50),
            updatedAt: new Date()
          }
        })
      } else {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
        })
      }
    }
  })

  // 7. Response
  return result.toTextStreamResponse()
}