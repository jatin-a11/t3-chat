"use client";
import { useEffect, useState, useRef } from "react";

type FriendRequest = {
  id: string;
  type: "friend_request";
  title: string;
  subtitle: string;
  time: string;
  requestId: string;
  image: string | null;
};

type DMNotif = {
  id: string;
  type: "new_dm";
  title: string;
  subtitle: string;
  time: string;
  fromId: string;
  image: string | null;
};

type Notif = FriendRequest | DMNotif;

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "abhi";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationPanel({
  onClose,
  onFriendAccepted,
}: {
  onClose: () => void;
  onFriendAccepted: () => void;
}) {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAll();

    // Outside click close
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Friend requests + DM unread — parallel fetch
      const [reqRes, dmRes] = await Promise.all([
        fetch("/api/friends?type=requests"),
        fetch("/api/notifications"),
      ]);

      const reqData = await reqRes.json();
      const dmData = await dmRes.json();

      const friendNotifs: FriendRequest[] = (reqData.data || []).map((r: any) => ({
        id: r.id,
        type: "friend_request" as const,
        title: r.sender.name || r.sender.username || "Someone",
        subtitle: "Friend request bheja",
        time: r.createdAt,
        requestId: r.id,
        image: r.sender.image,
      }));

      const dmNotifs: DMNotif[] = (dmData.data || []).map((d: any) => ({
        id: d.id,
        type: "new_dm" as const,
        title: d.title,
        subtitle: d.subtitle,
        time: d.time,
        fromId: d.fromId,
        image: d.image,
      }));

      // Sort by time — latest pehle
      const all = [...friendNotifs, ...dmNotifs].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );

      setNotifications(all);
    } catch (e) {
      console.error("Notification fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: string, action: "accept" | "reject") => {
    setActing(requestId);
    try {
      await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      setNotifications((prev) =>
        prev.filter((n) => n.type !== "friend_request" || n.requestId !== requestId)
      );
      if (action === "accept") onFriendAccepted();
    } finally {
      setActing(null);
    }
  };

  const markAllRead = () => setNotifications([]);

  const totalCount = notifications.length;

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        top: "0",
        left: "268px",
        width: "340px",
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        zIndex: 200,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "white" }}>
            Notifications
          </span>
          {totalCount > 0 && (
            <div style={{
              minWidth: "18px", height: "18px",
              borderRadius: "9px", background: "#ef4444",
              color: "white", fontSize: "10px", fontWeight: "700",
              display: "flex", alignItems: "center",
              justifyContent: "center", padding: "0 5px",
            }}>
              {totalCount}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {totalCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: "none", border: "none",
                cursor: "pointer", color: "#6366f1",
                fontSize: "12px", fontWeight: "500",
              }}
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none",
              cursor: "pointer", color: "rgba(255,255,255,0.35)",
              display: "flex", padding: "2px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxHeight: "480px", overflowY: "auto" }}>
        {loading && (
          <div style={{
            padding: "32px", textAlign: "center",
            color: "rgba(255,255,255,0.25)", fontSize: "13px",
          }}>
            Loading...
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div style={{
            padding: "48px 24px", textAlign: "center",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "10px",
          }}>
            <div style={{ fontSize: "32px" }}>🔔</div>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "13px", margin: 0 }}>
              Koi notification nahi
            </p>
          </div>
        )}

        {!loading && notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              transition: "background 0.12s",
              cursor: notif.type === "new_dm" ? "pointer" : "default",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div style={{ display: "flex", gap: "11px", alignItems: "flex-start" }}>
              {/* Avatar */}
              <div style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: notif.type === "friend_request"
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "linear-gradient(135deg, #059669, #10b981)",
                display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0,
                overflow: "hidden", position: "relative",
              }}>
                {notif.image ? (
                  <img
                    src={notif.image}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "white", fontSize: "14px", fontWeight: "600" }}>
                    {notif.title[0]?.toUpperCase()}
                  </span>
                )}

                {/* Type icon badge */}
                <div style={{
                  position: "absolute", bottom: "-1px", right: "-1px",
                  width: "14px", height: "14px", borderRadius: "50%",
                  background: notif.type === "friend_request" ? "#6366f1" : "#059669",
                  border: "2px solid #18181b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {notif.type === "friend_request" ? (
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M19 8v6M16 11h6"/>
                    </svg>
                  ) : (
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="white">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <p style={{
                    fontSize: "13px", fontWeight: "600",
                    color: "rgba(255,255,255,0.9)", margin: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {notif.title}
                  </p>
                  <span style={{
                    fontSize: "10px", color: "rgba(255,255,255,0.28)",
                    flexShrink: 0, whiteSpace: "nowrap",
                  }}>
                    {timeAgo(notif.time)}
                  </span>
                </div>

                <p style={{
                  fontSize: "12px", color: "rgba(255,255,255,0.4)",
                  margin: "2px 0 0",
                }}>
                  {notif.subtitle}
                </p>

                {/* Friend request buttons */}
                {notif.type === "friend_request" && (
                  <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                    <button
                      onClick={() => handleRespond(notif.requestId, "accept")}
                      disabled={acting === notif.requestId}
                      style={{
                        flex: 1, padding: "6px 0",
                        background: "#6366f1", border: "none",
                        borderRadius: "8px", color: "white",
                        fontSize: "12px", fontWeight: "600",
                        cursor: acting === notif.requestId ? "not-allowed" : "pointer",
                        opacity: acting === notif.requestId ? 0.6 : 1,
                        transition: "all 0.15s",
                      }}
                    >
                      {acting === notif.requestId ? "..." : "Accept"}
                    </button>
                    <button
                      onClick={() => handleRespond(notif.requestId, "reject")}
                      disabled={acting === notif.requestId}
                      style={{
                        flex: 1, padding: "6px 0",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "12px", fontWeight: "500",
                        cursor: acting === notif.requestId ? "not-allowed" : "pointer",
                        opacity: acting === notif.requestId ? 0.6 : 1,
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}

                {/* DM notification — unread count */}
                {notif.type === "new_dm" && (
                  <div style={{
                    marginTop: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: "6px",
                    padding: "3px 8px",
                  }}>
                    <div style={{
                      width: "6px", height: "6px",
                      borderRadius: "50%", background: "#6366f1",
                    }} />
                    <span style={{ fontSize: "11px", color: "#818cf8" }}>
                      New message
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}