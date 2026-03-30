// app/(chat)/chat/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatWindow } from "@/app/components/chat/chat-window";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  // No DB call — fresh empty chat
  return (
    <ChatWindow
      userName={session.user.name || session.user.email || "User"}
    />
  );
}