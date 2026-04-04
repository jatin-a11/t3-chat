// app/api/user/username/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const RESERVED_USERNAMES = [
  "admin", "root", "system", "support", "help", "api",
  "chat", "dm", "group", "friends", "settings", "profile",
  "login", "signup", "register", "logout", "dashboard",
];

// GET — current username dekho
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  return Response.json({ username: user?.username ?? null });
}

// PATCH — username set/change karo
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { username } = body;

  if (!username) {
    return Response.json({ error: "Username required hai" }, { status: 400 });
  }

  const cleaned = username.trim().toLowerCase();

  // Validation
  if (!USERNAME_REGEX.test(cleaned)) {
    return Response.json(
      { error: "Username 3-20 characters ka hona chahiye. Sirf a-z, 0-9 aur _ allowed hai" },
      { status: 400 }
    );
  }

  if (RESERVED_USERNAMES.includes(cleaned)) {
    return Response.json(
      { error: "Yeh username reserved hai, koi aur choose karo" },
      { status: 400 }
    );
  }

  // Current user fetch
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, createdAt: true },
  });

  // Same username
  if (currentUser?.username === cleaned) {
    return Response.json(
      { error: "Yeh already tera username hai" },
      { status: 400 }
    );
  }

  // KEY FIX: Cooldown sirf tab lagao jab user pehle se username set kar chuka ho
  // Naye user ke liye (username null) — cooldown nahi
  const isFirstTimeSetup = !currentUser?.username;

  if (!isFirstTimeSetup) {
    // Cooldown check — username kab set hua tha
    // createdAt se check karo — updatedAt reliable nahi hai abhi
    const accountAgeDays =
      (Date.now() - new Date(currentUser.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);

    // Agar account 30 din se purana nahi toh cooldown
    if (accountAgeDays < 30) {
      const daysLeft = Math.ceil(30 - accountAgeDays);
      return Response.json(
        {
          error: `Username ${daysLeft} din baad change kar sakte ho`,
          daysLeft,
        },
        { status: 429 }
      );
    }
  }

  // Unique check
  const existing = await prisma.user.findUnique({
    where: { username: cleaned },
    select: { id: true },
  });

  if (existing && existing.id !== session.user.id) {
    return Response.json(
      { error: "Yeh username already kisi aur ne le rakha hai" },
      { status: 409 }
    );
  }

  // Update karo
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { username: cleaned },
    select: { username: true },
  });

  return Response.json({
    success: true,
    username: updated.username,
    message: isFirstTimeSetup
      ? "Username set ho gaya! Welcome to T3 Chat "
      : "Username successfully update ho gaya!",
  });
}