"use client";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { ConversationItem } from "./coversation-item";
import { FriendItem } from "./friend-item";
import { NotificationPanel } from "./notification-panel";
import { FindPeoplePanel } from "./find-people-panel";
import { SettingsPanel } from "./settings-panel";
import { getPusherClient } from "@/lib/pusher-client";

type Conversation = {
  id: string;
  title: string;
  model: string;
  pinned: boolean;
  updatedAt: Date;
};

type Friend = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
  unreadCount?: number;
};

type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
};

export function Sidebar({
  conversations: initialConversations,
  friends: initialFriends = [],
  user,
  notifCount: initialNotifCount = 0,
}: {
  conversations: Conversation[];
  friends?: Friend[];
  user: User;
  notifCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [conversations, setConversations] = useState<Conversation[]>(
    initialConversations ?? []
  );
  const [friends, setFriends] = useState<Friend[]>(initialFriends ?? []);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifCount, setNotifCount] = useState(initialNotifCount ?? 0);
  const [showNotif, setShowNotif] = useState(false);
  const [showFindPeople, setShowFindPeople] = useState(false);
  const [showSettings, setShowSettings] = useState(false); // ← NEW

  // Pusher
  useEffect(() => {
    if (!user?.id) return;

    const client = getPusherClient();
    const channel = client.subscribe(`private-user-${user.id}`);

    channel.bind("friend-request", () => {
      setNotifCount((prev) => prev + 1);
    });

    channel.bind("friend-accepted", () => {
      setNotifCount((prev) => prev + 1);
      fetchFriends();
    });

    channel.bind("new-dm", (data: any) => {
      setNotifCount((prev) => prev + 1);
      setFriends((prev) =>
        prev.map((f) =>
          f.id === data.senderId
            ? { ...f, unreadCount: (f.unreadCount || 0) + 1 }
            : f
        )
      );
    });

    channel.bind("presence-update", (data: any) => {
      setFriends((prev) =>
        prev.map((f) =>
          f.id === data.userId
            ? { ...f, isOnline: data.isOnline, lastSeen: data.lastSeen }
            : f
        )
      );
    });

    return () => {
      channel.unbind_all();
      client.unsubscribe(`private-user-${user.id!}`);
    };
  }, [user?.id]);

  // Online status
  useEffect(() => {
    fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "online" }),
    }).catch(console.error);

    const handleOffline = () => {
      navigator.sendBeacon(
        "/api/presence",
        JSON.stringify({ status: "offline" })
      );
    };

    window.addEventListener("beforeunload", handleOffline);
    return () => window.removeEventListener("beforeunload", handleOffline);
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      if (data.success) setFriends(data.data ?? []);
    } catch (e) {
      console.error("fetchFriends error:", e);
    }
  };

  const handleNewChat = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile" }),
      });
      const data = await res.json();
      const newChat = data?.data || data;
      if (newChat?.id) {
        setConversations((prev) => [newChat, ...prev]);
        router.push(`/chat/${newChat.id}`);
      }
    } catch (e) {
      console.error("handleNewChat error:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredConvs = (conversations ?? []).filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filteredConvs.filter((c) => c.pinned);
  const normal = filteredConvs.filter((c) => !c.pinned);

  const totalUnread = (friends ?? []).reduce(
    (a, f) => a + (f.unreadCount || 0),
    0
  );

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const S = styles;

  // Close all panels helper
  const closeAll = () => {
    setShowNotif(false);
    setShowFindPeople(false);
    setShowSettings(false);
  };

  return (
    <div style={S.root}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.logoRow}>
          <div style={S.logoIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
          </div>
          <span style={S.logoText}>T3 Chat</span>

          <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
            {/* Bell */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setShowNotif(!showNotif);
                  setShowFindPeople(false);
                  setShowSettings(false);
                }}
                style={S.iconBtn}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={showNotif ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)"}
                  strokeWidth="1.8">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {notifCount > 0 && (
                  <div style={S.badge}>
                    {notifCount > 9 ? "9+" : notifCount}
                  </div>
                )}
              </button>

              {showNotif && (
                <NotificationPanel
                  onClose={() => setShowNotif(false)}
                  onFriendAccepted={fetchFriends}
                />
              )}
            </div>

            {/* Collapse */}
            <button
              style={S.iconBtn}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 3v18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={S.searchWrap}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            style={S.searchInput}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0, display: "flex" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* New chat */}
        <button
          onClick={handleNewChat}
          disabled={loading}
          style={S.newChatBtn}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
          }
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          {loading ? "Creating..." : "New chat"}
        </button>
      </div>

      {/* ── Scroll area ── */}
      <div style={S.scrollArea}>

        <div style={S.sectionLabel}>AI CHATS</div>

        {pinned.map((c) => (
          <ConversationItem
            key={c.id}
            conversation={c}
            isActive={pathname === `/chat/${c.id}`}
            onDelete={(id) =>
              setConversations((p) => p.filter((x) => x.id !== id))
            }
            onPin={(id, val) =>
              setConversations((p) =>
                p.map((x) => (x.id === id ? { ...x, pinned: val } : x))
              )
            }
          />
        ))}

        {normal.map((c) => (
          <ConversationItem
            key={c.id}
            conversation={c}
            isActive={pathname === `/chat/${c.id}`}
            onDelete={(id) =>
              setConversations((p) => p.filter((x) => x.id !== id))
            }
            onPin={(id, val) =>
              setConversations((p) =>
                p.map((x) => (x.id === id ? { ...x, pinned: val } : x))
              )
            }
          />
        ))}

        {filteredConvs.length === 0 && (
          <div style={S.empty}>Koi chat nahi</div>
        )}

        {/* Friends */}
        {(friends ?? []).length > 0 && (
          <>
            <div style={{
              ...S.sectionLabel,
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span>FRIENDS</span>
              {totalUnread > 0 && (
                <div style={{
                  minWidth: "18px", height: "18px", borderRadius: "9px",
                  background: "#6366f1", color: "white", fontSize: "10px",
                  fontWeight: "700", display: "flex", alignItems: "center",
                  justifyContent: "center", padding: "0 5px",
                }}>
                  {totalUnread > 9 ? "9+" : totalUnread}
                </div>
              )}
            </div>

            {friends.map((f) => (
              <FriendItem
                key={f.id}
                friend={f}
                isActive={pathname === `/dm/${f.id}`}
                onClearUnread={(id) =>
                  setFriends((p) =>
                    p.map((x) => x.id === id ? { ...x, unreadCount: 0 } : x)
                  )
                }
              />
            ))}
          </>
        )}
      </div>

      {/* ── Find People — fixed ── */}
      <div style={S.findPeopleWrap}>
        <button
          onClick={() => {
            setShowFindPeople(!showFindPeople);
            setShowNotif(false);
            setShowSettings(false);
          }}
          style={{
            ...S.findPeopleBtn,
            background: showFindPeople ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)",
            borderColor: showFindPeople ? "rgba(99,102,241,0.5)" : "rgba(99,102,241,0.2)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")
          }
          onMouseLeave={(e) => {
            if (!showFindPeople)
              e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <span>Find people</span>
        </button>
      </div>

      {/* ── User section ── */}
      <div style={S.userSection}>
        <div
          style={{
            ...S.userRow,
            background: showSettings ? "rgba(255,255,255,0.05)" : "transparent",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
          }
          onMouseLeave={(e) => {
            e.currentTarget.style.background = showSettings
              ? "rgba(255,255,255,0.05)"
              : "transparent";
          }}
        >
          {user?.image ? (
            <img src={user.image} alt="User" style={S.avatar} />
          ) : (
            <div style={S.avatarFallback}>{initials}</div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={S.userName}>{user?.name || user?.email || "User"}</p>
            <p style={{ ...S.userEmail, color: "rgba(255,255,255,0.35)" }}>
              {user?.username ? `@${user.username}` : "Username set karo"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
            {/* Settings — opens SettingsPanel */}
            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setShowNotif(false);
                setShowFindPeople(false);
              }}
              title="Settings"
              style={{
                ...S.iconBtnSm,
                color: showSettings ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
                background: showSettings ? "rgba(255,255,255,0.08)" : "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                if (!showSettings) {
                  e.currentTarget.style.color = "rgba(255,255,255,0.25)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Logout"
              style={S.iconBtnSm}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(239,68,68,0.8)";
                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.25)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Panels ── */}
      {showFindPeople && (
        <FindPeoplePanel onClose={() => setShowFindPeople(false)} />
      )}
      {showSettings && (
        <SettingsPanel
          user={user}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

const styles = {
  root: {
    width: "260px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    background: "#111113",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    position: "relative" as const,
    overflow: "visible" as const,
  },
  header: {
    padding: "14px 12px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    flexShrink: 0,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },
  logoIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "9px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 0 16px rgba(99,102,241,0.3)",
  },
  logoText: {
    fontSize: "16px",
    fontWeight: "700" as const,
    color: "rgba(255,255,255,0.92)",
    letterSpacing: "-0.02em",
  },
  iconBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
    transition: "background 0.15s",
    color: "rgba(255,255,255,0.6)",
  },
  iconBtnSm: {
    width: "28px",
    height: "28px",
    borderRadius: "7px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.25)",
    transition: "all 0.15s",
    flexShrink: 0,
  },
  badge: {
    position: "absolute" as const,
    top: "-4px",
    right: "-4px",
    minWidth: "16px",
    height: "16px",
    borderRadius: "8px",
    background: "#ef4444",
    color: "white",
    fontSize: "9px",
    fontWeight: "700" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "9px",
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "rgba(255,255,255,0.75)",
    fontSize: "13px",
    fontFamily: "inherit",
  },
  newChatBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "9px",
    color: "rgba(255,255,255,0.6)",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
    width: "100%",
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    padding: "10px 8px",
    scrollbarWidth: "thin" as const,
    scrollbarColor: "rgba(255,255,255,0.08) transparent",
  },
  sectionLabel: {
    padding: "4px 8px 6px",
    fontSize: "10px",
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.22)",
    letterSpacing: "0.08em",
  },
  empty: {
    padding: "20px",
    textAlign: "center" as const,
    fontSize: "12px",
    color: "rgba(255,255,255,0.2)",
  },
  findPeopleWrap: {
    padding: "8px 10px",
    borderTop: "1px solid rgba(255,255,255,0.04)",
    flexShrink: 0,
  },
  findPeopleBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "10px 12px",
    background: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: "10px",
    color: "#818cf8",
    fontSize: "13px",
    fontWeight: "500" as const,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  },
  userSection: {
    padding: "8px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    flexShrink: 0,
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 10px",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    flexShrink: 0,
    border: "1.5px solid rgba(255,255,255,0.1)",
  },
  avatarFallback: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "12px",
    fontWeight: "600" as const,
    flexShrink: 0,
  },
  userName: {
    fontSize: "13px",
    fontWeight: "500" as const,
    color: "rgba(255,255,255,0.85)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    margin: 0,
  },
  userEmail: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.28)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    marginTop: "1px",
    margin: 0,
  },
};