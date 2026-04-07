// app/api/dm/typing/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

// POST — typing start/stop signal bhejo
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { receiverId, isTyping } = body;

  if (!receiverId || typeof isTyping !== "boolean") {
    return Response.json(
      { error: "receiverId aur isTyping required hai" },
      { status: 400 }
    );
  }

  const myId = session.user.id;

  // Receiver ke channel mein typing event bhejo
  await pusherServer.trigger(
    `private-user-${receiverId}`,
    "typing",
    {
      senderId: myId,
      isTyping,
    }
  );

  return Response.json({ success: true });
}