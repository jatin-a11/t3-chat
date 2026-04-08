"use client";
import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  content: string;
  senderId: string;
  status: "SENT" | "DELIVERED" | "READ";
  createdAt: string;
  sender: { id: string; name: string | null; username: string | null; image: string | null };
};

type Friend = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isOnline: boolean;
  lastSeen: string | null;
};

export default function DMPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [friend, setFriend] = useState<Friend | null>(null);
  const [myId, setMyId] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/dm/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      } else if (res.status === 403) {
        setError("Pehle dost banao phir message karo");
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        if (!session?.user?.id) { router.push("/login"); return; }
        setMyId(session.user.id);

        const friendRes = await fetch(`/api/users/${userId}`);
        if (friendRes.ok) {
          const data = await friendRes.json();
          setFriend(data.user);
        }

        await fetchMessages();
      } catch (e) {
        setError("Kuch gadbad ho gayi");
      } finally {
        setLoading(false);
      }
    };

    init();

    pollingRef.current = setInterval(fetchMessages, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/dm/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.find((m) => m.id === data.message.id) ? prev : [...prev, data.message]
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderTicks = (msg: Message) => {
    if (msg.senderId !== myId) return null;
    const color = msg.status === "READ" ? "#60a5fa" : "rgba(255,255,255,0.35)";
    return <span style={{ color, fontSize: "11px" }}>{msg.status === "SENT" ? "✓" : "✓✓"}</span>;
  };

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0d0f", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
      Loading...
    </div>
  );

  if (error) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d0d0f", gap: "12px" }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>{error}</p>
      <button onClick={() => router.push("/chat")} style={{ padding: "8px 20px", background: "#6366f1", border: "none", borderRadius: "8px", color: "white", fontSize: "13px", cursor: "pointer" }}>
        Wapas jao
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0d0d0f", flex: 1, minWidth: 0 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(13,13,15,0.9)", backdropFilter: "blur(10px)", flexShrink: 0 }}>
        <button onClick={() => router.push("/chat")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", padding: "4px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ position: "relative" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "600", overflow: "hidden" }}>
            {friend?.image ? <img src={friend.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : friend?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div style={{ position: "absolute", bottom: 0, right: 0, width: "9px", height: "9px", borderRadius: "50%", background: friend?.isOnline ? "#22c55e" : "#52525b", border: "1.5px solid #0d0d0f" }} />
        </div>
        <div>
          <p style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.9)", margin: 0 }}>{friend?.name ?? friend?.username ?? "User"}</p>
          <p style={{ fontSize: "11px", color: friend?.isOnline ? "#22c55e" : "rgba(255,255,255,0.3)", margin: 0 }}>
            {friend?.isOnline ? "Online" : friend?.lastSeen ? `Last seen ${getTimeAgo(friend.lastSeen)}` : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.07) transparent" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "4px" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>
              {friend?.name ?? friend?.username} ko pehla message bhejo!
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.senderId === myId;
            const prevMsg = messages[i - 1];
            const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: "8px", marginBottom: "2px" }}>
                {!isMe && (
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: showAvatar ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: "600", flexShrink: 0, overflow: "hidden" }}>
                    {showAvatar && (friend?.image ? <img src={friend.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : friend?.name?.[0]?.toUpperCase() ?? "U")}
                  </div>
                )}
                <div style={{ maxWidth: "70%" }}>
                  <div style={{ padding: "10px 14px", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isMe ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.07)", color: isMe ? "white" : "rgba(255,255,255,0.88)", fontSize: "14px", lineHeight: "1.55", wordBreak: "break-word", boxShadow: isMe ? "0 2px 12px rgba(99,102,241,0.25)" : "none" }}>
                    {msg.content}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: isMe ? "flex-end" : "flex-start", marginTop: "3px", padding: "0 4px" }}>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>{formatTime(msg.createdAt)}</span>
                    {renderTicks(msg)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, padding: "12px 16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(13,13,15,0.95)" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "16px", padding: "10px 14px" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${friend?.name ?? "User"} ko message karo...`}
              rows={1}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.9)", fontSize: "14px", resize: "none", lineHeight: "1.5", fontFamily: "inherit", caretColor: "#818cf8", maxHeight: "120px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              style={{ width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: input.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)", cursor: input.trim() ? "pointer" : "not-allowed", opacity: input.trim() ? 1 : 0.3, flexShrink: 0, transition: "all 0.2s" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.1)", marginTop: "8px" }}>Enter to send • Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}