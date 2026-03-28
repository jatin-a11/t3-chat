"use client";
// components/sidebar/index.tsx
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { ConversationItem } from "./coversation-item";

type Conversation = {
  id: string;
  title: string;
  model: string;
  pinned: boolean;
  updatedAt: Date;
};

type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function Sidebar({
  conversations: initialConversations,
  user,
}: {
  conversations: Conversation[];
  user: User;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState(initialConversations);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  // "new-conversation" event — chat-window se aata hai
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Conversation;
      if (detail?.id) {
        setConversations((prev) => {
          if (prev.find((c) => c.id === detail.id)) return prev;
          return [detail, ...prev];
        });
      }
    };
    window.addEventListener("new-conversation", handler);
    return () => window.removeEventListener("new-conversation", handler);
  }, []);

  // "update-conversation-title" event
  useEffect(() => {
    const handler = (e: Event) => {
      const { id, title } = (e as CustomEvent).detail;
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    };
    window.addEventListener("update-conversation-title", handler);
    return () => window.removeEventListener("update-conversation-title", handler);
  }, []);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );
  const pinned = filtered.filter((c) => c.pinned);
  const normal = filtered.filter((c) => !c.pinned);

  const handleNewChat = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile" }),
      });

      // Fix: API ab seedha conversation object return karta hai
      const newChat = await res.json();

      if (newChat?.id) {
        const newConv: Conversation = {
          id: newChat.id,
          title: newChat.title || "New Chat",
          model: newChat.model || "llama-3.3-70b-versatile",
          pinned: false,
          updatedAt: new Date(),
        };

        // Sidebar mein turant add karo
        setConversations((prev) => [newConv, ...prev]);

        // Chat window mein open karo
        router.push(`/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error("New chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  const initials = user.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  if (collapsed) {
    return (
      <div style={{ width: "56px", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", height: "100vh", background: "#111113", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "14px 0", gap: "8px" }}>
        <button onClick={() => setCollapsed(false)} title="Open sidebar" style={iconBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
        </button>
        <button onClick={handleNewChat} title="New Chat" style={iconBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <div style={{ marginTop: "auto" }}>
          {user.image ? (
            <img src={user.image} alt="User" style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.1)" }} />
          ) : (
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: "600" }}>{initials}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "260px", flexShrink: 0, display: "flex", flexDirection: "column", height: "100vh", background: "#111113", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Header */}
      <div style={{ padding: "14px 12px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px", marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
            </div>
            <span style={{ fontSize: "16px", fontWeight: "600", color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}>T3 Chat</span>
          </div>
          <button onClick={() => setCollapsed(true)} style={{ width: "30px", height: "30px", borderRadius: "8px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.25)", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.25)"; }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
          </button>
        </div>

        {/* New Chat Button */}
        <button onClick={handleNewChat} disabled={loading}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", borderRadius: "9px", background: "transparent", border: "none", color: "rgba(255,255,255,0.75)", fontSize: "13px", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s", textAlign: "left", opacity: loading ? 0.6 : 1 }}
          onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.95)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}>
          {loading ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          {loading ? "Creating..." : "New chat"}
        </button>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", borderRadius: "9px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats..." style={{ background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.7)", fontSize: "13px", width: "100%" }} />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0, display: "flex" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Conversations */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.07) transparent" }}>
        {pinned.length > 0 && (
          <>
            <div style={sectionLabel}>Pinned</div>
            {pinned.map((conv) => (
              <ConversationItem key={conv.id} conversation={conv} isActive={pathname === `/chat/${conv.id}`}
                onDelete={(id) => setConversations((prev) => prev.filter((c) => c.id !== id))}
                onPin={(id, pinned) => setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned } : c)))}
              />
            ))}
            <div style={{ margin: "6px 4px", borderTop: "1px solid rgba(255,255,255,0.05)" }} />
          </>
        )}

        {normal.length > 0 && (
          <>
            <div style={sectionLabel}>Recents</div>
            {normal.map((conv) => (
              <ConversationItem key={conv.id} conversation={conv} isActive={pathname === `/chat/${conv.id}`}
                onDelete={(id) => setConversations((prev) => prev.filter((c) => c.id !== id))}
                onPin={(id, pinned) => setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned } : c)))}
              />
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "12px" }}>
            {search ? `"${search}" nahi mila` : "Koi chat nahi — New chat karo"}
          </div>
        )}
      </div>

      {/* User */}
      <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "10px", cursor: "pointer", transition: "background 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          {user.image ? (
            <img src={user.image} alt="User" style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.1)" }} />
          ) : (
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", fontWeight: "600", flexShrink: 0 }}>{initials}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{user.name || user.email}</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)", marginTop: "1px", margin: 0 }}>Free plan</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} title="Logout"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", padding: "4px", borderRadius: "6px", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.2)"; e.currentTarget.style.background = "transparent"; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  padding: "8px 10px 4px",
  fontSize: "11px",
  fontWeight: "500",
  color: "rgba(255,255,255,0.22)",
  letterSpacing: "0.02em",
};

const iconBtnStyle: React.CSSProperties = {
  width: "36px", height: "36px", borderRadius: "10px",
  background: "transparent", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "rgba(255,255,255,0.35)", transition: "all 0.15s",
};