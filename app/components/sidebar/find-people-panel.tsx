"use client";
// components/sidebar/find-people-panel.tsx
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type SearchUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isOnline: boolean;
  friendshipId: string | null;
  relationStatus: "none" | "pending_sent" | "pending_received" | "friends";
};

export function FindPeoplePanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 2) { setUsers([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.replace("@", ""))}`);
        const data = await res.json();
        setUsers(data.users ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleAction = async (user: SearchUser) => {
    const status = localStatus[user.id] ?? user.relationStatus;

    if (status === "friends") {
      router.push(`/dm/${user.id}`);
      onClose();
      return;
    }

    if (status === "pending_received" && user.friendshipId) {
      setActionLoading(user.id);
      try {
        await fetch("/api/friends/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendshipId: user.friendshipId, action: "accept" }),
        });
        setLocalStatus((p) => ({ ...p, [user.id]: "friends" }));
      } catch (e) { console.error(e); }
      finally { setActionLoading(null); }
      return;
    }

    if (status === "none") {
      setActionLoading(user.id);
      try {
        const res = await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverId: user.id }),
        });
        if (res.ok) setLocalStatus((p) => ({ ...p, [user.id]: "pending_sent" }));
      } catch (e) { console.error(e); }
      finally { setActionLoading(null); }
    }
  };

  const getBtn = (user: SearchUser): { label: string; color: string; bg: string; border: string; disabled: boolean } => {
    const status = localStatus[user.id] ?? user.relationStatus;
    if (status === "friends") return { label: "Message", color: "#818cf8", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", disabled: false };
    if (status === "pending_sent") return { label: "Pending", color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", disabled: true };
    if (status === "pending_received") return { label: "Accept", color: "white", bg: "#22c55e", border: "transparent", disabled: false };
    return { label: "Add", color: "white", bg: "#6366f1", border: "transparent", disabled: false };
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        top: "0",
        left: "268px",
        width: "340px",
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "white" }}>Find People</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: "2px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="@username se search karo..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.85)", fontSize: "13px", fontFamily: "inherit" }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setUsers([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex", padding: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div style={{ maxHeight: "380px", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.07) transparent" }}>
        {loading && (
          <div style={{ padding: "28px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "13px" }}>Searching...</div>
        )}

        {!loading && query.length < 2 && (
          <div style={{ padding: "28px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px", margin: 0 }}>@username type karo</p>
          </div>
        )}

        {!loading && query.length >= 2 && users.length === 0 && (
          <div style={{ padding: "28px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "13px", margin: 0 }}>"{query}" nahi mila</p>
          </div>
        )}

        <div style={{ padding: "8px" }}>
          {users.map((user) => {
            const btn = getBtn(user);
            const isLoading = actionLoading === user.id;
            return (
              <div
                key={user.id}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 10px", borderRadius: "10px", marginBottom: "4px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "600", overflow: "hidden" }}>
                    {user.image
                      ? <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (user.name?.[0] ?? user.username?.[0] ?? "U").toUpperCase()}
                  </div>
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: "9px", height: "9px", borderRadius: "50%", background: user.isOnline ? "#22c55e" : "#52525b", border: "1.5px solid #18181b" }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,0.88)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    @{user.username}
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: "1px 0 0" }}>
                    {user.name ?? ""}
                  </p>
                </div>

                {/* Action */}
                <button
                  onClick={() => !btn.disabled && !isLoading && handleAction(user)}
                  disabled={btn.disabled || isLoading}
                  style={{
                    padding: "6px 14px",
                    background: btn.bg,
                    border: `1px solid ${btn.border}`,
                    borderRadius: "8px",
                    color: btn.color,
                    fontSize: "12px",
                    fontWeight: "500",
                    cursor: btn.disabled || isLoading ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    opacity: isLoading ? 0.6 : 1,
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}
                >
                  {isLoading ? "..." : btn.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}