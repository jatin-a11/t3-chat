import { getServerSession} from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Sidebar } from "../components/sidebar"



export default async function ChatLayout({
  children,
}:{
  children: React.ReactNode;
}){
  // Login check
  const session = await getServerSession(authOptions)

  if(!session?.user?.id){
    redirect("/login")
  }

  // Conversations fetch karo - sidebar ke liye
  const conversations = await prisma.conversation.findMany({
    where:{
      userId:session.user.id
    },
    orderBy:[
      { pinned: "desc" },
      { updatedAt: "desc"}
    ],
    select:{
      id:true,
      title:true,
      model:true,
      pinned:true,
      updatedAt:true
    }
  })
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar - fixed width */} 
      <Sidebar
      conversations ={conversations}
      user = {session.user}
      />

      // Chat area - flexible 
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  )

}
