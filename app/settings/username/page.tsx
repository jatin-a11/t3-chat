"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UsernameSetupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  // Current username fetch
  useEffect(() => {
    fetch("/api/user/username")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.username) {
          setCurrentUsername(d.user.username);
          setUsername(d.user.username);
        }
      });
  }, []);

  // Live availability check
  useEffect(() => {
    if (username.length < 3 || username === currentUsername) {
      setAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      const res = await fetch(`/api/users/search?q=${username}`);
      const data = await res.json();
      const taken = (data.users || []).some(
        (u: any) => u.username === username.toLowerCase()
      );
      setAvailable(!taken);
      setChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, currentUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/user/username", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error aaya");
      setLoading(false);
      return;
    }

    router.push("/chat");
    router.refresh();
  };

  const isValid = /^[a-zA-Z0-9_]+$/.test(username);
  const isChanged = username !== currentUsername;
  const canSubmit = username.length >= 3 && isValid && available !== false && isChanged;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0d0d0f",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        padding: "40px 36px",
        background: "#111113",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
      }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3"/>
              </svg>
            </div>
            <span style={{ fontSize: "15px", fontWeight: "600", color: "rgba(255,255,255,0.9)" }}>
              T3 Chat
            </span>
          </div>

          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "white", margin: 0, letterSpacing: "-0.02em" }}>
            {currentUsername ? "Username change karo" : "Username choose karo"}
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginTop: "6px" }}>
            {currentUsername
              ? `Abhi: @${currentUsername}`
              : "Log tumhe isse dhundh sakte hain"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Input */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}>
              Username
            </label>

            <div style={{ position: "relative" }}>
              {/* @ prefix */}
              <div style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "15px",
                color: "rgba(255,255,255,0.4)",
                fontWeight: "500",
                pointerEvents: "none",
              }}>
                @
              </div>

              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                  setError("");
                  setAvailable(null);
                }}
                placeholder="jatin123"
                maxLength={20}
                autoFocus
                style={{
                  width: "100%",
                  padding: "13px 44px 13px 30px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${
                    error
                      ? "rgba(239,68,68,0.5)"
                      : available === true
                      ? "rgba(34,197,94,0.5)"
                      : available === false
                      ? "rgba(239,68,68,0.5)"
                      : "rgba(255,255,255,0.1)"
                  }`,
                  borderRadius: "11px",
                  color: "rgba(255,255,255,0.88)",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box" as const,
                  transition: "border-color 0.15s",
                  fontFamily: "inherit",
                }}
              />

              {/* Status indicator */}
              <div style={{
                position: "absolute",
                right: "13px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "12px",
              }}>
                {checking && (
                  <div style={{
                    width: "14px", height: "14px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.1)",
                    borderTopColor: "rgba(255,255,255,0.5)",
                    animation: "spin 0.6s linear infinite",
                  }} />
                )}
                {!checking && available === true && username.length >= 3 && isChanged && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
                {!checking && available === false && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                )}
              </div>
            </div>

            {/* Status text */}
            <div style={{ marginTop: "7px", fontSize: "12px" }}>
              {error && <span style={{ color: "#ef4444" }}>{error}</span>}
              {!error && available === true && isChanged && (
                <span style={{ color: "#22c55e" }}>✓ @{username} available hai</span>
              )}
              {!error && available === false && (
                <span style={{ color: "#ef4444" }}>✗ @{username} already le liya gaya</span>
              )}
              {!error && !available && !checking && (
                <span style={{ color: "rgba(255,255,255,0.25)" }}>
                  3-20 characters · letters, numbers, underscore
                </span>
              )}
              {!error && username === currentUsername && currentUsername && (
                <span style={{ color: "rgba(255,255,255,0.25)" }}>Yeh tumhara current username hai</span>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !canSubmit}
            style={{
              width: "100%",
              padding: "13px",
              background: canSubmit ? "#6366f1" : "rgba(99,102,241,0.3)",
              border: "none",
              borderRadius: "11px",
              color: "white",
              fontSize: "14px",
              fontWeight: "500",
              cursor: canSubmit ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: "14px", height: "14px", borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  animation: "spin 0.6s linear infinite",
                }} />
                Saving...
              </>
            ) : (
              <>
                {currentUsername ? "Update karo" : "Continue karo"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>

          {/* Skip — sirf agar pehle se username hai */}
          {currentUsername && (
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                width: "100%",
                padding: "11px",
                marginTop: "8px",
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.3)",
                fontSize: "13px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          )}
        </form>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}