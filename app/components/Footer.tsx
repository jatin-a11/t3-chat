import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" fill="#6366f1" />
          <rect x="13" y="3" width="8" height="8" rx="2" fill="#818cf8" opacity="0.7" />
          <rect x="3" y="13" width="8" height="8" rx="2" fill="#818cf8" opacity="0.7" />
          <rect x="13" y="13" width="8" height="8" rx="2" fill="#6366f1" />
        </svg>
        T3 Chat
      </div>
      <p>© 2026 T3 Chat. Built with Next.js + Groq.</p>
      <div className="footer-links">
        <Link href="#">Privacy</Link>
        <Link href="#">Terms</Link>
        <Link href="#">GitHub</Link>
      </div>
    </footer>
  );
}