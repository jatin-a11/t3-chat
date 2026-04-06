import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id")!;
    const channel = params.get("channel_name")!;

    const isAllowed =
      channel === `private-user-${session.user.id}` ||
      channel.startsWith("private-dm-") ||
      channel.startsWith("private-group-");

    if (!isAllowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const auth = pusherServer.authorizeChannel(socketId, channel);
    return Response.json(auth);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}