import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"


// Ek conversation + message fetch
export async function GET(req:Request,
  {params}:{params:{id:string}}){
    const session = await getServerSession(authOptions)

    if(!session?.user?.id){
      return Response.json({error:"login kro"}, {status:401})
    }

    const conversation = await prisma.conversation.findFirst({
      where:{
        id: params.id,
        userId: session.user.id
      },
      include:{
        messages:{
          orderBy:{createdAt:"asc"}
        }
      }
    })

    if(!conversation){
      return Response.json({error:"nahi mili"}, {status:404})
    }

    return Response.json(conversation)

}

// Rename ya pin

export async function PATCH(req:Request,
  {params}:{params:{id:string}}
) {
  const session = await getServerSession(authOptions)

  if(!session?.user?.id){
    return Response.json({error:"login kro phle"},{status:401})
  }
  
  const body = await req.json()

  await prisma.conversation.updateMany({
    where:{
      id:params.id,
      userId:session?.user.id
    },
    data:{
      ...(body.title !== undefined && {title: body.title}),
      ...(body.pinned !== undefined && {pinned:body.pinned})
    }
  })
  return Response.json({success:true})
}

// Delete

export async function DELETE(
  req:Request,
{params}:{params:{id:string}}
){
  const session = await getServerSession(authOptions)

  if(!session?.user?.id){
    return Response.json({error:"login kro"}, {status:401})
  }

  await prisma.conversation.deleteMany({
    where:{
      id: params.id,
      userId: session?.user.id
    }
  })

  return Response.json({success:true})
}