// app/(chat)/chat/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/app/components/sidebar";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  // User + username fetch karo
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  // Username nahi hai toh setup pe bhejo
  if (!user?.username || user.username.trim() === "") {
    redirect("/settings/username");
  }

  // Conversations + Friends parallel fetch karo
  let conversations: {
    id: string;
    title: string;
    model: string;
    pinned: boolean;
    updatedAt: Date;
  }[] = [];

  let friends: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    isOnline: boolean;
    lastSeen: Date | null;
  }[] = [];

  let notifCount = 0;

  try {
    const [convs, friendships, unreadNotifs] = await Promise.all([
      // Conversations
      prisma.conversation.findMany({
        where: { userId: session.user.id },
        orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          model: true,
          pinned: true,
          updatedAt: true,
        },
      }),

      // Friends
      prisma.friendship.findMany({
        where: {
          status: "ACCEPTED",
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id },
          ],
        },
        include: {
          sender: {
            select: {
              id: true, name: true, username: true,
              image: true, isOnline: true, lastSeen: true,
            },
          },
          receiver: {
            select: {
              id: true, name: true, username: true,
              image: true, isOnline: true, lastSeen: true,
            },
          },
        },
      }),

      // Unread notifications count
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
    ]);

    conversations = convs;
    notifCount = unreadNotifs;

    // Friends list — dono side se nikalo
    friends = friendships.map((f) =>
      f.senderId === session.user.id ? f.receiver : f.sender
    );
  } catch (err) {
    console.error("[ChatLayout] DB error:", err);
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#0d0d0f",
      }}
    >
      <Sidebar
        conversations={conversations}
        friends={friends}
        notifCount={notifCount}
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          username: user.username,  // ← KEY FIX: username pass karo
        }}
      />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </main>
    </div>
  );
}