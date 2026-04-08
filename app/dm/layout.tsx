// app/dm/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/app/components/sidebar";

export default async function DMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const myId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: myId },
    select: { username: true },
  });

  if (!user?.username) redirect("/settings/username");

  let conversations: any[] = [];
  let friends: any[] = [];
  let notifCount = 0;

  try {
    const [convs, friendships, unread] = await Promise.all([
      prisma.conversation.findMany({
        where: { userId: myId },
        orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        select: { id: true, title: true, model: true, pinned: true, updatedAt: true },
      }),
      prisma.friendship.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: myId }, { receiverId: myId }],
        },
        include: {
          sender: { select: { id: true, name: true, username: true, image: true, isOnline: true, lastSeen: true } },
          receiver: { select: { id: true, name: true, username: true, image: true, isOnline: true, lastSeen: true } },
        },
      }),
      prisma.notification.count({ where: { userId: myId, read: false } }),
    ]);

    conversations = convs;
    friends = friendships.map((f) =>
      f.senderId === myId ? f.receiver : f.sender
    );
    notifCount = unread;
  } catch (err) {
    console.error("[DMLayout] DB error:", err);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0d0d0f" }}>
      <Sidebar
        conversations={conversations}
        friends={friends}
        notifCount={notifCount}
        user={{
          id: myId,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          username: user.username,
        }}
      />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}