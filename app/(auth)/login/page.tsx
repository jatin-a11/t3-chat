// app/(auth)/login/page.tsx
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ya password galat hai");
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-800 bg-zinc-900">

        <h1 className="text-2xl font-semibold text-white text-center mb-2">
          T3 Chat
        </h1>
        <p className="text-zinc-400 text-sm text-center mb-8">
          Login karo apne account mein
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-zinc-400 mb-1.5 block">Email</label>
            <input
              type="email"
              placeholder="rahul@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-1.5 block">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-white text-zinc-900 font-medium text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {loading ? "Login ho raha hai..." : "Login karo"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-xs text-zinc-500">ya</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Google */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full py-2.5 rounded-lg border border-zinc-700 text-white text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 mb-3"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google se login karo
        </button>

        {/* GitHub */}
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="w-full py-2.5 rounded-lg border border-zinc-700 text-white text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub se login karo
        </button>

        {/* Register link */}
        <p className="text-center text-sm text-zinc-500 mt-6">
          Account nahi hai?{" "}
          <Link href="/register" className="text-white hover:underline">
            Register karo
          </Link>
        </p>
      </div>
    </div>
  );
}