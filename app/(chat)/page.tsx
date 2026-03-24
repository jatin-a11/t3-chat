// app/(chat)/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Koi chat open nahi — empty state dikhao
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">
          T3 Chat
        </h2>
        <p className="text-zinc-400 text-sm">
          New Chat karo ya koi conversation select karo
        </p>
      </div>
    </div>
  );
}