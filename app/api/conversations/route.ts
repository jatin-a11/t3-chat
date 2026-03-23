import {getServerSession} from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req:Request) {
  const session = await getServerSession(authOptions)

  if(!session?.user?.id){
    return Response.json({
      error:"login kro phle"
    },{status:401})
  }

  const {model = "llma-3.3-70b-versatile"} = await req.json()

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      model,
      title:"New Chat"
    },
  })
  
  return Response.json({conversation}, {status:201})
  
}

export async function GET(req:Request){

  const session = await getServerSession(authOptions)

  if(session?.user?.id){
    return Response.json({error:"login kro phle"},{status:401})
  }

  const conversations = await prisma.conversation.findMany({
    where:{userId:session?.user.id},
    orderBy:[
      {pinned:"desc"},
      {updatedAt:"desc"}
    ],
    select:{
      id:true,
      title:true,
      model:true,
      pinned:true,
      updatedAt:true,
      _count:{
        select:{message:true}
      }

    }
  })

  return Response.json(conversations)
}