import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

// Username validation rules
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const RESERVED_USERNAMES = [
  "admin", "root", "system", "support", "help", "api",
  "chat", "dm", "group", "friends", "settings", "profile",
  "login", "signup", "register", "logout", "dashboard",
]

// GET - apna current username dekho
export async function GET() {
  const session = await getServerSession(authOptions)
  if(!session?.user?.id){
    return Response.json({error:"Unauthorized"}, {status:401})
  }

  const user = await prisma.user.findUnique({
    where:{id:session.user.id},
    select:{
      username:true,
      updatedAt:true
    }
  })

  return Response.json({username:user?.username})
  
}


// PATCH --- username change kro
export async function PATCH(req:NextRequest){
  const session = await getServerSession(authOptions)
  if(!session?.user?.id){
    return Response.json({error:"Unauthorized"},{status:401})
  }

  const body = await req.json().catch(()=>({}))
  const { username } = body

  //  --Validation--
  if(!username){
    return Response.json({error:"Username required hai"}, {status:400})
  }

  const cleaned = username.trim().toLowerCase()

  if(!USERNAME_REGEX.test(cleaned)){
    return Response.json({
      error:"Username 3-20 characters ka hona chahiye. Sirf a-z, 0-9 aur underscore (_) allowed hai",
    },
    {status:400})
  }

  if(RESERVED_USERNAMES.includes(cleaned)){
    return Response.json({
      error:"Yeah username reserved hai, koi aur choose kro"
    }, {status:400})
  }

  // ----Current user fetch ----
  const currentUser = await prisma.user.findUnique({
    where:{id:session.user.id},
    select:{
      username:true,
      updatedAt:true
    }
  })

  // ----Same username - koi change nhi
  if(currentUser?.username === cleaned){
    return Response.json({
      error:"Yeah already tera username hai"
    },{status:400})
  }

  // ── 30 din ka cooldown check ──
  // Production mein — har 30 din mein ek baar change allowed
  if(currentUser?.updatedAt){
    const daysSinceUpdate =       (Date.now() - new Date(currentUser.updatedAt).getTime()) /
      (1000 * 60 * 60 * 24);

      if(daysSinceUpdate < 30){
        const daysLeft = Math.ceil(30 - daysSinceUpdate)
        return Response.json({
          error:`Username ${daysLeft} din baad change kar sakhte ho`, daysLeft
        },{status:429})
      }
  }

  // ---- Unique Check ---- 
  const existing = await prisma.user.findUnique({
    where:{username:cleaned},
    select:{id:true}
  })

  if(existing && existing.id !== session.user.id){
    return Response.json({
      error:"Yeah username already kisi aur ne le rakha hai"
    }, {status:409})
  }

  // ---- Update ----
  const updated = await prisma.user.update({
    where:{id:session.user.id},
    data:{username:cleaned},
    select:{
      username:true,
      updatedAt:true 
    }
  })

  return Response.json({
    success:true,
    username:updated.username,
    message:"Username successfully update ho gya!"
  })



}