"use client"
import { useRouter, usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState } from "react"
import { ConversationItem } from "./coversation-item"

type Conversation ={
  id:string;
  title:string;
  model:string;
  pinned:boolean;
  updatedAt:Date
}

type User = {
  id?: string;
  name?: string | null ;
  email?: string | null;
  image?: string | null;
}

export function Sidebar({
  conversations,
  user,
}:{conversations:Conversation[];
  user: User;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false)

  // Nayi conversation bano
  const handleNewChat = async ()=>{
    setLoading(true);
    try {
      const res = await fetch("/api/conversations",{
        method:"post",
        headers:{"Content-type":"application/json"},
        body: JSON.stringify({model:"llma-3.3-70b-versatitle"})
      })

      const data = await res.json()

      if(data.success){
        router.push(`/chat/${data.data.id}`)
        router.refresh(); // Sidebar refresh
      }
      
    } catch (error) {
      console.error("Error:", error)
    }finally{
      setLoading(false)
    }
  }

  // Pinned aur normal alag karo
  const pinned = conversations.filter((c)=>c.pinned)
  const normal = conversations.filter((c)=>!c.pinned)

  // Initials banao user ke liye
  const initials = user.name
  ? user.name.split(" ").map((n)=>n[0]).join("").toUpperCase().slice(0,2)
  : "U"

  return (
    <div className="w-60 flex-shrink-0 flex flex-col h-screen bg-zinc-900 border-r border-zinc-800">

      {/* New Chat Button */}
      <div className="p-3 border-b border-zinc-800">
        <button
        onClick={handleNewChat}
        disabled={loading}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm transition-colors disabled:opacity-50">
          <svg width ="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {loading ? "ban raha hai..": "New Chat"}
        </button>
      </div>

       {/* Conversations List */}
       <div className="flex-1 overflow-y-auto p-2 space-y-1">


        {/* Pinned */}
        {pinned.length > 0 && (
          <>
          <div className="px-2 py-1 text-xs font-medium text-zinc-500 uppercase tracking-winder">
            Pinned
          </div>
          {pinned.map((conv)=>(
            <ConversationItem
            key={conv.id}
            conversation={conv}
            isActive={pathname === `/chat/${conv.id}`}
            />
          ))}
          <div className="border-t border-zinc-800 my-1" />
          </>
        )}

          {/* Normal */}
          {normal.length > 0 && (
            <>
            <div className="px-2 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Chats
            </div>
            {normal.map((conv)=>(
              <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={pathname === `/chat/${conv.id}`}
               />
            ))}
            </>
          )}

           {/* Empty state */}
           {conversations.length === 0 && (
            <div className="text-center text-zinc-500 text-sm py-8">
              Koi Chat nhi -- New Chat karo!
              </div>
           )}
       </div>

       {/* user Section */}
       <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
          {/* Avatar */}
          {user.image ? (
            <img
            src = {user.image}
            alt= {user.name || "User"}
            className="w-7 h-7 rounded-full flex-shrink-0"
            />
          ):(
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
              {initials}
              </div>
          )}


          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">
              {user.name || user.email}
            </p>
          </div>


          {/* Logout */}
          <button
          onClick={()=>signOut({callbackUrl:"/login"})}
          className="text-zinc-500 hover:text-white transition-color"
          title="Logout"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d= "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points= "16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
       </div>
    </div>
  )
}

