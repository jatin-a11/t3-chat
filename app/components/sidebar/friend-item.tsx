"use client";
import { useRouter } from "next/navigation";

type Friend = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
  unreadCount?: number;
};

function getLastSeen(lastSeen: Date | null): string {
  if (!lastSeen) return "";
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function FriendItem({
  friend,
  isActive,
  onClearUnread,
}: {
  friend: Friend;
  isActive: boolean;
  onClearUnread: (id: string) => void;
}) {
  const router = useRouter();

  const initials = friend.name
    ? friend.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleClick = () => {
    onClearUnread(friend.id);
    router.push(`/dm/${friend.id}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 10px",
        borderRadius: "9px",
        cursor: "pointer",
        background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
        transition: "background 0.12s",
        marginBottom: "2px",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {/* Avatar + online dot */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        {friend.image ? (
          <img
            src={friend.image}
            alt={friend.name || ""}
            style={{ width: "34px", height: "34px", borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.1)" }}
          />
        ) : (
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {initials}
          </div>
        )}
        {/* Online dot */}
        <div
          style={{
            position: "absolute",
            bottom: "0px",
            right: "0px",
            width: "9px",
            height: "9px",
            borderRadius: "50%",
            background: friend.isOnline ? "#22c55e" : "#52525b",
            border: "1.5px solid #111113",
          }}
        />
      </div>

      {/* Name + status */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: (friend.unreadCount || 0) > 0 ? "600" : "400",
            color: (friend.unreadCount || 0) > 0
              ? "rgba(255,255,255,0.92)"
              : "rgba(255,255,255,0.7)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {friend.name || friend.username || "User"}
        </p>
        <p
          style={{
            fontSize: "11px",
            color: friend.isOnline ? "#22c55e" : "rgba(255,255,255,0.28)",
            margin: 0,
            marginTop: "1px",
          }}
        >
          {friend.isOnline ? "Online" : getLastSeen(friend.lastSeen)}
        </p>
      </div>

      {/* Unread badge */}
      {(friend.unreadCount || 0) > 0 && (
        <div
          style={{
            minWidth: "18px",
            height: "18px",
            borderRadius: "9px",
            background: "#6366f1",
            color: "white",
            fontSize: "10px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 5px",
            flexShrink: 0,
          }}
        >
          {(friend.unreadCount || 0) > 9 ? "9+" : friend.unreadCount}
        </div>
      )}
    </div>
  );
}