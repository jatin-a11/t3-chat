"use client";
// components/sidebar/settings-panel.tsx
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
};

type Section = "main" | "profile" | "username" | "blocked" | "friends" | "privacy" | "about";

export function SettingsPanel({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [section, setSection] = useState<Section>("main");

  // Username edit
  const [newUsername, setNewUsername] = useState(user.username ?? "");
  const [usernameMsg, setUsernameMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Blocked users
  const [blocked, setBlocked] = useState<any[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  // Friends list
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (section === "blocked") fetchBlocked();
    if (section === "friends") fetchFriends();
  }, [section]);

  const fetchBlocked = async () => {
    setBlockedLoading(true);
    try {
      const res = await fetch("/api/user/blocked");
      if (res.ok) { const d = await res.json(); setBlocked(d.blocked ?? []); }
    } catch (e) { console.error(e); }
    finally { setBlockedLoading(false); }
  };

  const fetchFriends = async () => {
    setFriendsLoading(true);
    try {
      const res = await fetch("/api/friends");
      if (res.ok) { const d = await res.json(); setFriends(d.data ?? []); }
    } catch (e) { console.error(e); }
    finally { setFriendsLoading(false); }
  };

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) return;
    setUsernameLoading(true);
    setUsernameMsg(null);
    try {
      const res = await fetch("/api/user/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok) setUsernameMsg({ text: data.message ?? "Username update ho gaya!", ok: true });
      else setUsernameMsg({ text: data.error ?? "Kuch gadbad ho gayi", ok: false });
    } catch (e) {
      setUsernameMsg({ text: "Network error", ok: false });
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    try {
      await fetch("/api/user/blocked", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId }),
      });
      setBlocked((prev) => prev.filter((b) => b.id !== blockedId));
    } catch (e) { console.error(e); }
  };

  const handleUnfriend = async (friendshipId: string) => {
    try {
      await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action: "unfriend" }),
      });
      setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
    } catch (e) { console.error(e); }
  };

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        bottom: "60px",
        left: "268px",
        width: "340px",
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        zIndex: 100,
        overflow: "hidden",
        maxHeight: "520px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── MAIN MENU ── */}
      {section === "main" && (
        <>
          {/* User card */}
          <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "16px", fontWeight: "600", overflow: "hidden", flexShrink: 0 }}>
              {user.image ? <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.9)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name ?? user.email}</p>
              <p style={{ fontSize: "12px", color: "#818cf8", margin: "2px 0 0" }}>@{user.username ?? "username set nahi"}</p>
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: "8px", overflowY: "auto" }}>
            {[
              { icon: "👤", label: "Profile", sub: "Avatar, naam", action: () => setSection("profile") },
              { icon: "✏️", label: "Username change", sub: `@${user.username ?? "set nahi"}`, action: () => setSection("username") },
              { icon: "👥", label: "Friends", sub: "Sab friends dekho", action: () => setSection("friends") },
              { icon: "🚫", label: "Blocked users", sub: "Block list manage karo", action: () => setSection("blocked") },
              { icon: "🔒", label: "Privacy", sub: "Visibility settings", action: () => setSection("privacy") },
              { icon: "ℹ️", label: "About", sub: "T3 Chat v1.0", action: () => setSection("about") },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "transparent", border: "none", borderRadius: "10px", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ fontSize: "18px", width: "24px", textAlign: "center" }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,0.85)", margin: 0 }}>{item.label}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: "1px 0 0" }}>{item.sub}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}

            {/* Divider */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "8px 4px" }} />

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "transparent", border: "none", borderRadius: "10px", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: "18px", width: "24px", textAlign: "center" }}>🚪</span>
              <p style={{ fontSize: "13px", fontWeight: "500", color: "rgba(239,68,68,0.8)", margin: 0 }}>Logout</p>
            </button>
          </div>
        </>
      )}

      {/* ── PROFILE ── */}
      {section === "profile" && (
        <SubSection title="Profile" onBack={() => setSection("main")}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", gap: "12px" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "24px", fontWeight: "600", overflow: "hidden" }}>
              {user.image ? <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "16px", fontWeight: "600", color: "white", margin: 0 }}>{user.name}</p>
              <p style={{ fontSize: "13px", color: "#818cf8", margin: "4px 0" }}>@{user.username}</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: 0 }}>{user.email}</p>
            </div>
            <div style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Account</p>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: 0 }}>Google / GitHub se login hone pe profile automatically set hoti hai</p>
            </div>
          </div>
        </SubSection>
      )}

      {/* ── USERNAME ── */}
      {section === "username" && (
        <SubSection title="Username change" onBack={() => setSection("main")}>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", margin: 0 }}>
              3-20 characters, sirf a-z, 0-9, _ allowed. 30 din mein ek baar change kar sakte ho.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>@</span>
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="username"
                maxLength={20}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.9)", fontSize: "14px", fontFamily: "inherit" }}
              />
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>{newUsername.length}/20</span>
            </div>
            {usernameMsg && (
              <p style={{ fontSize: "12px", color: usernameMsg.ok ? "#22c55e" : "#ef4444", margin: 0 }}>{usernameMsg.text}</p>
            )}
            <button
              onClick={handleUsernameChange}
              disabled={usernameLoading || newUsername.length < 3}
              style={{ padding: "10px", background: newUsername.length >= 3 ? "#6366f1" : "rgba(255,255,255,0.06)", border: "none", borderRadius: "10px", color: "white", fontSize: "13px", fontWeight: "600", cursor: newUsername.length >= 3 ? "pointer" : "not-allowed", opacity: usernameLoading ? 0.6 : 1, transition: "all 0.15s", fontFamily: "inherit" }}
            >
              {usernameLoading ? "Saving..." : "Save karo"}
            </button>
          </div>
        </SubSection>
      )}

      {/* ── FRIENDS ── */}
      {section === "friends" && (
        <SubSection title="Friends" onBack={() => setSection("main")}>
          <div style={{ overflowY: "auto", maxHeight: "360px" }}>
            {friendsLoading && <div style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "13px" }}>Loading...</div>}
            {!friendsLoading && friends.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "13px" }}>Koi friend nahi abhi</div>
            )}
            {friends.map((f) => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", fontWeight: "600", overflow: "hidden" }}>
                    {f.image ? <img src={f.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (f.name?.[0] ?? "U").toUpperCase()}
                  </div>
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: "8px", height: "8px", borderRadius: "50%", background: f.isOnline ? "#22c55e" : "#52525b", border: "1.5px solid #18181b" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,0.85)", margin: 0 }}>{f.name ?? f.username}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: "1px 0 0" }}>@{f.username}</p>
                </div>
                <button
                  onClick={() => handleUnfriend(f.friendshipId)}
                  style={{ padding: "5px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "7px", color: "rgba(239,68,68,0.7)", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Unfriend
                </button>
              </div>
            ))}
          </div>
        </SubSection>
      )}

      {/* ── BLOCKED ── */}
      {section === "blocked" && (
        <SubSection title="Blocked users" onBack={() => setSection("main")}>
          <div style={{ overflowY: "auto", maxHeight: "360px" }}>
            {blockedLoading && <div style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "13px" }}>Loading...</div>}
            {!blockedLoading && blocked.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "13px" }}>Koi blocked user nahi</div>
            )}
            {blocked.map((b) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: "13px", fontWeight: "600" }}>
                  {(b.name?.[0] ?? b.username?.[0] ?? "U").toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,0.6)", margin: 0 }}>{b.name ?? b.username}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", margin: "1px 0 0" }}>@{b.username}</p>
                </div>
                <button
                  onClick={() => handleUnblock(b.id)}
                  style={{ padding: "5px 10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "7px", color: "rgba(255,255,255,0.5)", fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </SubSection>
      )}

      {/* ── PRIVACY ── */}
      {section === "privacy" && (
        <SubSection title="Privacy" onBack={() => setSection("main")}>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "Online status dikhao", sub: "Friends ko pata chalega tum online ho" },
              { label: "Last seen dikhao", sub: "Friends dekh sakenge aakhri baar kab online the" },
              { label: "Read receipts", sub: "Blue ticks dikhao jab message read karo" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,0.8)", margin: 0 }}>{item.label}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>{item.sub}</p>
                </div>
                <div style={{ width: "36px", height: "20px", borderRadius: "10px", background: "#6366f1", position: "relative", cursor: "pointer", flexShrink: 0 }}>
                  <div style={{ position: "absolute", right: "3px", top: "3px", width: "14px", height: "14px", borderRadius: "50%", background: "white" }} />
                </div>
              </div>
            ))}
          </div>
        </SubSection>
      )}

      {/* ── ABOUT ── */}
      {section === "about" && (
        <SubSection title="About" onBack={() => setSection("main")}>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: "700", color: "white", margin: 0 }}>T3 Chat</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: "4px 0" }}>Version 1.0.0</p>
            </div>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "🤖 AI Chat", desc: "Llama 3.3 70B powered" },
                { label: "👥 Friends", desc: "Real-time messaging" },
                { label: "🔒 Privacy", desc: "End-to-end secure" },
              ].map((f) => (
                <div key={f.label} style={{ display: "flex", gap: "10px", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                  <span style={{ fontSize: "14px" }}>{f.label.split(" ")[0]}</span>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: "500", color: "rgba(255,255,255,0.7)", margin: 0 }}>{f.label.split(" ").slice(1).join(" ")}</p>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: 0 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", margin: 0 }}>Made with ❤️ by Jatin Arya</p>
          </div>
        </SubSection>
      )}
    </div>
  );
}

// Sub section wrapper
function SubSection({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", padding: "2px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "white" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}