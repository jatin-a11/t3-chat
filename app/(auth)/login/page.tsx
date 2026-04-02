"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Paste this in app/(auth)/login/page.tsx ───

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

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

    router.push("/chat");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          display: flex;
          min-height: 100vh;
          background: #080809;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── LEFT PANEL ── */
        .left-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 48px;
          background: #0d0d0f;
          border-right: 1px solid rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
        }

        /* grid bg */
        .left-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* glow */
        .left-panel::after {
          content: '';
          position: absolute;
          top: 30%;
          left: 20%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%);
          pointer-events: none;
        }

        .left-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        .left-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 24px rgba(99,102,241,0.4);
        }

        .left-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: rgba(255,255,255,0.92);
          letter-spacing: -0.02em;
        }

        .left-content {
          position: relative;
          z-index: 1;
        }

        .left-heading {
          font-family: 'Syne', sans-serif;
          font-size: clamp(32px, 3.5vw, 48px);
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.1;
          margin-bottom: 16px;
        }

        .left-heading span {
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .left-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.38);
          line-height: 1.7;
          max-width: 360px;
          font-weight: 300;
        }

        /* feature pills */
        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 40px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .feature-dot {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-text {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          font-weight: 400;
        }

        .left-footer {
          font-size: 12px;
          color: rgba(255,255,255,0.18);
          position: relative;
          z-index: 1;
        }

        /* ── RIGHT PANEL ── */
        .right-panel {
          width: 460px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
          background: #080809;
        }

        .form-wrapper {
          width: 100%;
          max-width: 360px;
          animation: fadeUp 0.5s ease forwards;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-title {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: rgba(255,255,255,0.92);
          letter-spacing: -0.03em;
          margin-bottom: 6px;
        }

        .form-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          margin-bottom: 28px;
          font-weight: 400;
        }

        /* error */
        .error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          color: rgba(239,68,68,0.9);
          font-size: 13px;
          margin-bottom: 16px;
        }

        /* field */
        .field {
          margin-bottom: 14px;
        }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          margin-bottom: 7px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .field-wrap {
          position: relative;
        }

        .field-input {
          width: 100%;
          padding: 12px 40px 12px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: rgba(255,255,255,0.88);
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }

        .field-input::placeholder {
          color: rgba(255,255,255,0.18);
        }

        .field-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.04);
        }

        .field-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.2);
          cursor: pointer;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          padding: 2px;
        }

        .field-icon:hover {
          color: rgba(255,255,255,0.5);
        }

        /* submit */
        .btn-submit {
          width: 100%;
          padding: 13px;
          background: #6366f1;
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.18s;
          margin-top: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.01em;
        }

        .btn-submit:hover:not(:disabled) {
          background: #5558e8;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99,102,241,0.35);
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        .divider-text {
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }

        /* oauth */
        .oauth-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .btn-oauth {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-oauth:hover:not(:disabled) {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.9);
        }

        .btn-oauth:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* bottom text */
        .bottom-text {
          text-align: center;
          font-size: 13px;
          color: rgba(255,255,255,0.25);
          margin-top: 22px;
        }

        .bottom-link {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }

        .bottom-link:hover {
          color: #818cf8;
        }

        /* spinner */
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .left-panel { display: none; }
          .right-panel { width: 100%; padding: 32px 24px; }
        }
      `}</style>

      <div className="login-root">

        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <div className="left-logo">
            <div className="left-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
              </svg>
            </div>
            <span className="left-logo-text">T3 Chat</span>
          </div>

          <div className="left-content">
            <h1 className="left-heading">
              AI se baat karo.<br/>
              <span>Friends se connect</span><br/>
              karo.
            </h1>
            <p className="left-sub">
              Ek platform — powerful AI chat aur real-time messaging dono. Koi switching nahi.
            </p>

            <div className="feature-list">
              {[
                {
                  color: "rgba(99,102,241,0.15)",
                  stroke: "#818cf8",
                  icon: <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>,
                  text: "Groq powered AI — blazing fast responses",
                },
                {
                  color: "rgba(34,197,94,0.1)",
                  stroke: "#22c55e",
                  icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
                  text: "Real-time messaging with read receipts",
                },
                {
                  color: "rgba(251,191,36,0.1)",
                  stroke: "#fbbf24",
                  icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></>,
                  text: "Group chats with @AI mention support",
                },
              ].map((f, i) => (
                <div className="feature-item" key={i}>
                  <div className="feature-dot" style={{ background: f.color }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={f.stroke} strokeWidth="1.8">
                      {f.icon}
                    </svg>
                  </div>
                  <span className="feature-text">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="left-footer">
            © 2026 T3 Chat · Privacy · Terms
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="form-wrapper">
            <h2 className="form-title">Welcome back</h2>
            <p className="form-subtitle">Apne account mein login karo</p>

            {/* Error */}
            {error && (
              <div className="error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="field">
                <label className="field-label">Email</label>
                <div className="field-wrap">
                  <input
                    type="email"
                    className="field-input"
                    placeholder="rahul@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <span className="field-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                </div>
              </div>

              {/* Password */}
              <div className="field">
                <label className="field-label">Password</label>
                <div className="field-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="field-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="field-icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <><div className="spinner" /> Login ho raha hai...</>
                ) : (
                  <>
                    Login karo
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">ya continue karo</span>
              <div className="divider-line" />
            </div>

            {/* OAuth */}
            <div className="oauth-grid">
              <button
                className="btn-oauth"
                disabled={!!oauthLoading}
                onClick={() => {
                  setOauthLoading("google");
                  signIn("google", { callbackUrl: "/chat" });
                }}
              >
                {oauthLoading === "google" ? (
                  <div className="spinner" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Google
              </button>

              <button
                className="btn-oauth"
                disabled={!!oauthLoading}
                onClick={() => {
                  setOauthLoading("github");
                  signIn("github", { callbackUrl: "/chat" });
                }}
              >
                {oauthLoading === "github" ? (
                  <div className="spinner" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                )}
                GitHub
              </button>
            </div>

            {/* Register link */}
            <p className="bottom-text">
              Account nahi hai?{" "}
              <Link href="/register" className="bottom-link">
                Register karo
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}