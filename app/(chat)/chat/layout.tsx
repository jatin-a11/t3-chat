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

  // Lightweight query — sirf zaroori fields, connection pool pe kam load
  let conversations: {
    id: string;
    title: string;
    model: string;
    pinned: boolean;
    updatedAt: Date;
  }[] = [];

  try {
    conversations = await prisma.conversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        model: true,
        pinned: true,
        updatedAt: true,
      },
    });
  } catch (err) {
    console.error("[ChatLayout] DB fetch failed:", err);
    // DB down ho toh bhi app crash na kare — empty sidebar dikhao
    conversations = [];
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
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
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