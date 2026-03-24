import Link from "next/link";

export default function Hero() {
  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-grid" />

        <div className="badge fade-up">
          <div className="badge-dot" />
          Groq powered — lightning fast AI
        </div>

        <h1 className="fade-up">
          Chat with AI.<br />
          <span className="gradient-text">Talk to friends.</span><br />
          All in one place.
        </h1>

        <p className="fade-up">
          T3 Chat combines powerful AI conversations with real-time messaging.
          One platform for everything — no switching tabs.
        </p>

        <div className="hero-cta fade-up">
          <Link href="/register" className="btn-hero btn-hero-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            Start for free
          </Link>
          <Link href="#features" className="btn-hero btn-hero-secondary">
            See how it works
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num">100ms</div>
            <div className="stat-label">Avg response time</div>
          </div>
          <div className="divider" />
          <div className="stat">
            <div className="stat-num">4+</div>
            <div className="stat-label">AI models</div>
          </div>
          <div className="divider" />
          <div className="stat">
            <div className="stat-num">Free</div>
            <div className="stat-label">To get started</div>
          </div>
          <div className="divider" />
          <div className="stat">
            <div className="stat-num">Real-time</div>
            <div className="stat-label">Friend messaging</div>
          </div>
        </div>
      </section>

      {/* Chat Preview */}
      <div className="preview-section">
        <div className="preview-container">
          <div className="preview-bar">
            <div className="preview-dot" style={{ background: "#ef4444" }} />
            <div className="preview-dot" style={{ background: "#f59e0b" }} />
            <div className="preview-dot" style={{ background: "#22c55e" }} />
            <div className="preview-bar-title">T3 Chat — AI Assistant</div>
          </div>
          <div className="preview-body">
            <div className="preview-sidebar">
              <div className="preview-sidebar-label">CHATS</div>
              <div className="preview-sidebar-item active">React kya hai?</div>
              <div className="preview-sidebar-item">TypeScript help</div>
              <div className="preview-sidebar-item">Prisma setup</div>
              <hr className="preview-sidebar-divider" />
              <div className="preview-sidebar-label">FRIENDS</div>
              <div className="preview-sidebar-item">Priya Singh</div>
              <div className="preview-sidebar-item">Dev Squad</div>
            </div>
            <div className="preview-chat">
              <div className="preview-msg user">
                <div
                  className="preview-avatar"
                  style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}
                >
                  R
                </div>
                <div className="preview-bubble">
                  React kya hota hai? Samjhao simple mein.
                </div>
              </div>
              <div className="preview-msg ai">
                <div
                  className="preview-avatar"
                  style={{
                    background: "rgba(34,197,94,0.15)",
                    color: "#22c55e",
                    fontSize: "9px",
                  }}
                >
                  AI
                </div>
                <div className="preview-bubble">
                  React ek JavaScript library hai jo UI banane ke liye use hoti
                  hai. Facebook ne banaya tha. Components, hooks aur state — yeh
                  teen main concepts hain...
                </div>
              </div>
              <div className="preview-msg user">
                <div
                  className="preview-avatar"
                  style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}
                >
                  R
                </div>
                <div className="preview-bubble">Hooks samjhao thoda?</div>
              </div>
              <div className="preview-msg ai">
                <div
                  className="preview-avatar"
                  style={{
                    background: "rgba(34,197,94,0.15)",
                    color: "#22c55e",
                    fontSize: "9px",
                  }}
                >
                  AI
                </div>
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}