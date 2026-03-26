// components/navbar.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  return (
    <nav className="nav">
      <Link href="/" className="logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" fill="#6366f1" />
          <rect x="13" y="3" width="8" height="8" rx="2" fill="#818cf8" opacity="0.7" />
          <rect x="3" y="13" width="8" height="8" rx="2" fill="#818cf8" opacity="0.7" />
          <rect x="13" y="13" width="8" height="8" rx="2" fill="#6366f1" />
        </svg>
        T3 Chat
      </Link>

      <div className="nav-center">
        <Link href="#features" className="nav-link">Features</Link>
        <Link href="#" className="nav-link">Enterprise</Link>
        <Link href="#pricing" className="nav-link">Pricing</Link>
        <Link href="#" className="nav-link">Docs</Link>
        <Link href="#" className="nav-link">Changelog</Link>
      </div>

      <div className="nav-right">
        {session ? (
          // Logged in hai — Go to Chat dikhao
          <Link href="/chat" className="btn-primary-nav">
            Go to Chat →
          </Link>
        ) : (
          // Logged in nahi — Sign in + Get started
          <>
            <Link href="/login" className="btn-ghost">Sign in</Link>
            <Link href="/register" className="btn-primary-nav">
              Get started free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
