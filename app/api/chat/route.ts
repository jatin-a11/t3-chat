import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createGroq } from "@ai-sdk/groq"
import { streamText} from "ai"

export const maxDuration = 30 ;

export async function POST(req:Request){

  // 1. Auth Check
  const session = await getServerSession(authOptions)

  if(!session?.user?.id){
    return Response.json({error:"login kro phle"},{status:401})
  }

  // 2. Body Parse Karo
  const {messages, conversationId, model = "llama-3.3-70b-versatile"} = await req.json()

  // 3. Security - conversation user ki hai?
  const conversation = await prisma.conversation.findFirst({
    where:{
      id: conversationId,
      userId: session.user.id
    }
  })

  if(!conversation){
    return Response.json({error:"Conversation nhi milli"},{status:404})
  }

  // 4. User ka message save kro

  const lastMessage = messages[messages.length-1]

  await prisma.message.create({
    data:{
      role:"user",
      content: lastMessage.content,
      conversationId
    }
  })

  // 5. Groq setup
  const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY!
  })

  // 6. Stream karo 
  const result = streamText({
    model:groq(model),
    messages,
    system:"You are a helpful assistant",

    onFinish:async({text})=>{
      // AI ka response save kro

      await prisma.message.create({
        data:{
          role: "assistant",
          content: text,
          conversationId
        }
      })

      // Title set kro -- phli baar
      if(messages.length ===1){
        await prisma.conversation.update({
          where:{id:conversationId},
          data:{
            title:lastMessage.content.slice(0,50),
            updatedAt:new Date()
          }
        })
      }else{
        await prisma.conversation.update({
          where:{id:conversationId},
          data:{updatedAt: new Date()}
        })
      }
    }
  })

  // 7. Stream response bhejo

  return result.toTextStreamResponse()


}