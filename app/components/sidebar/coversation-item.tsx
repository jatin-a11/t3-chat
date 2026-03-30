"use client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

type Conversation = {
  id: string;
  title: string;
  model: string;
  pinned: boolean;
};

export function ConversationItem({
  conversation,
  isActive,
  onDelete,
  onPin,
}: {
  conversation: Conversation;
  isActive: boolean;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    await fetch(`/api/conversations/${conversation.id}`, { method: "DELETE" });
    onDelete(conversation.id);
    if (isActive) router.push("/chat");
  };

  const handlePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    await fetch(`/api/conversations/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !conversation.pinned }),
    });
    onPin(conversation.id, !conversation.pinned);
  };

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); }}
    >
      <div
        onClick={() => router.push(`/chat/${conversation.id}`)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "7px 10px",
          borderRadius: "8px",
          cursor: "pointer",
          background: isActive
            ? "rgba(255,255,255,0.08)"
            : isHovered
            ? "rgba(255,255,255,0.04)"
            : "transparent",
          transition: "background 0.12s",
          userSelect: "none",
        }}
      >
        {/* Title */}
        <span
          style={{
            flex: 1,
            fontSize: "13px",
            color: isActive
              ? "rgba(255,255,255,0.92)"
              : "rgba(255,255,255,0.6)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: isActive ? "500" : "400",
          }}
        >
          {conversation.title === "New Chat" ? "Untitled" : conversation.title}
        </span>

        {/* Three dots — hover pe dikhe */}
        {(isHovered || showMenu) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            style={{
              background: showMenu
                ? "rgba(255,255,255,0.1)"
                : "transparent",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              padding: "3px 4px",
              borderRadius: "5px",
              flexShrink: 0,
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            }}
            onMouseLeave={(e) => {
              if (!showMenu) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
              }
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="19" cy="12" r="1.5"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            right: "4px",
            top: "36px",
            zIndex: 50,
            background: "#1c1c1f",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            overflow: "hidden",
            minWidth: "160px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <button
            onClick={handlePin}
            style={menuItemStyle}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 17-1.5-1.5L5 21M15 3l6 6M9.5 14.5l5-5"/>
            </svg>
            {conversation.pinned ? "Unpin" : "Pin"}
          </button>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "2px 0" }} />

          <button
            onClick={handleDelete}
            style={{ ...menuItemStyle, color: "rgba(239,68,68,0.85)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(239,68,68,0.85)";
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "9px 14px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "rgba(255,255,255,0.7)",
  fontSize: "13px",
  textAlign: "left",
  transition: "background 0.12s",
};