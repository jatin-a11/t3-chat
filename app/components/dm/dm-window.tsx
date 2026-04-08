"use client";
import { useState, useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";

type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

type Friend = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
};

function getDMChannel(id1: string, id2: string) {
  return `private-dm-${[id1, id2].sort().join("-")}`;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function TickIcon({ status }: { status: string }) {
  if (status === "READ") {
    return (
      <svg width="16" height="10" viewBox="0 0 18 12" fill="none">
        <path d="M1 6L5 10L11 1" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 6L11 10L17 1" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (status === "DELIVERED") {
    return (
      <svg width="16" height="10" viewBox="0 0 18 12" fill="none">
        <path d="M1 6L5 10L11 1" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 6L11 10L17 1" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M1 6L5 10L11 1" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function DMWindow({
  friend,
  currentUserId,
  initialMessages,
}: {
  friend: Friend;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [friendOnline, setFriendOnline] = useState(friend.isOnline);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSentRef = useRef(false);

  // Pusher
  useEffect(() => {
    const client = getPusherClient();
    const dmChannel = client.subscribe(getDMChannel(currentUserId, friend.id));
    const userChannel = client.subscribe(`private-user-${currentUserId}`);

    dmChannel.bind("new-message", (msg: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Auto read
      if (msg.senderId === friend.id) {
        fetch("/api/dm/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderId: friend.id }),
        });
      }
    });

    dmChannel.bind("messages-read", ({ readBy }: { readBy: string }) => {
      if (readBy === friend.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === currentUserId ? { ...m, status: "READ" } : m
          )
        );
      }
    });

    dmChannel.bind("typing", ({ userId }: { userId: string }) => {
      if (userId === friend.id) {
        setIsTyping(true);
        if (typingTimerRef.current !== null) {
          clearTimeout(typingTimerRef.current);
        }
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    userChannel.bind("presence-update", (data: any) => {
      if (data.userId === friend.id) setFriendOnline(data.isOnline);
    });

    return () => {
      dmChannel.unbind_all();
      userChannel.unbind_all();
      client.unsubscribe(getDMChannel(currentUserId, friend.id));
      client.unsubscribe(`private-user-${currentUserId}`);
    };
  }, [friend.id, currentUserId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Send
  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      content,
      senderId: currentUserId,
      receiverId: friend.id,
      status: "SENT",
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: null, username: null, image: null },
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/dm/${friend.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";

    // Typing indicator — throttle
    if (!typingSentRef.current) {
      typingSentRef.current = true;
      fetch("/api/dm/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: friend.id }),
      });
      setTimeout(() => { typingSentRef.current = false; }, 2000);
    }
  };

  const friendInitials = friend.name
    ? friend.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", background: "#0d0d0f",
      flex: 1, minWidth: 0, overflow: "hidden",
    }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "12px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "#111113", flexShrink: 0,
      }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          {friend.image ? (
            <img src={friend.image} alt="" style={{
              width: "40px", height: "40px", borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.1)",
            }} />
          ) : (
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: "15px", fontWeight: "600",
            }}>
              {friendInitials}
            </div>
          )}
          <div style={{
            position: "absolute", bottom: "1px", right: "1px",
            width: "10px", height: "10px", borderRadius: "50%",
            background: friendOnline ? "#22c55e" : "#52525b",
            border: "2px solid #111113",
          }} />
        </div>

        <div>
          <p style={{ fontSize: "15px", fontWeight: "600", color: "rgba(255,255,255,0.92)", margin: 0 }}>
            {friend.name || friend.username}
          </p>
          <p style={{ fontSize: "12px", color: friendOnline ? "#22c55e" : "rgba(255,255,255,0.3)", margin: 0 }}>
            {friendOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "20px",
        display: "flex", flexDirection: "column", gap: "6px",
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "12px", color: "rgba(255,255,255,0.2)",
          }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "24px", fontWeight: "700", color: "white",
            }}>
              {friendInitials}
            </div>
            <p style={{ fontSize: "14px" }}>
              {friend.name || friend.username} ko message karo
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.senderId === currentUserId;
          const prevMsg = messages[i - 1];
          const nextMsg = messages[i + 1];
          const isFirst = !prevMsg || prevMsg.senderId !== msg.senderId;
          const isLast = !nextMsg || nextMsg.senderId !== msg.senderId;

          return (
            <div key={msg.id} style={{
              display: "flex",
              justifyContent: isMine ? "flex-end" : "flex-start",
              alignItems: "flex-end",
              gap: "8px",
              marginBottom: isLast ? "4px" : "1px",
            }}>
              {/* Avatar — only for friend's last message */}
              {!isMine && (
                <div style={{ width: "30px", flexShrink: 0 }}>
                  {isLast && (
                    friend.image ? (
                      <img src={friend.image} alt="" style={{
                        width: "30px", height: "30px", borderRadius: "50%",
                      }} />
                    ) : (
                      <div style={{
                        width: "30px", height: "30px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontSize: "11px", fontWeight: "600",
                      }}>
                        {friendInitials}
                      </div>
                    )
                  )}
                </div>
              )}

              <div style={{
                maxWidth: "65%",
                display: "flex",
                flexDirection: "column",
                alignItems: isMine ? "flex-end" : "flex-start",
              }}>
                {/* Bubble */}
                <div style={{
                  padding: "9px 14px",
                  borderRadius: isMine
                    ? `${isFirst ? "18px" : "18px"} ${isFirst ? "4px" : "18px"} ${isLast ? "4px" : "18px"} 18px`
                    : `${isFirst ? "4px" : "18px"} 18px 18px ${isLast ? "4px" : "18px"}`,
                  background: isMine
                    ? "linear-gradient(135deg, #6366f1, #7c3aed)"
                    : "rgba(255,255,255,0.09)",
                  color: "white",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  wordBreak: "break-word" as const,
                  opacity: msg.id.startsWith("temp-") ? 0.6 : 1,
                  transition: "opacity 0.2s",
                }}>
                  {msg.content}
                </div>

                {/* Time + Tick — only last message */}
                {isLast && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "4px",
                    flexDirection: isMine ? "row" : "row-reverse",
                  }}>
                    {isMine && <TickIcon status={msg.status} />}
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.22)" }}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing */}
        {isTyping && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <div style={{ width: "30px" }} />
            <div style={{
              padding: "10px 14px",
              background: "rgba(255,255,255,0.09)",
              borderRadius: "4px 18px 18px 4px",
              display: "flex", gap: "4px", alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.4)",
                  animation: `bounce 1.2s ease ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 16px 16px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: "10px",
          padding: "10px 14px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "14px",
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`${friend.name || friend.username} ko message karo...`}
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none",
              outline: "none", color: "rgba(255,255,255,0.88)",
              fontSize: "14px", resize: "none", fontFamily: "inherit",
              lineHeight: "1.5", minHeight: "24px", maxHeight: "120px", padding: 0,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: input.trim() && !sending ? "#6366f1" : "rgba(255,255,255,0.07)",
              border: "none",
              cursor: input.trim() && !sending ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
            }}
          >
            {sending ? (
              <div style={{
                width: "14px", height: "14px", borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                animation: "spin 0.6s linear infinite",
              }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            )}
          </button>
        </div>
        <p style={{
          textAlign: "center", fontSize: "11px",
          color: "rgba(255,255,255,0.15)", marginTop: "6px",
        }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}