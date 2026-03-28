"use client";
// components/chat/chat-window.tsx
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageBubble } from "./message-bubble";
import { ThinkingIndicator } from "./thinking-indicator";
import { EmptyState } from "./empty-state";

export function ChatWindow({
  conversationId,
  initialMessages = [],
  model = "llama-3.3-70b-versatile",
  title = "",
  userName,
}: {
  conversationId?: string;
  initialMessages?: any[];
  model?: string;
  title?: string;
  userName: string;
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [convId, setConvId] = useState<string | undefined>(conversationId);
  const [inputValue, setInputValue] = useState("");
  const redirectedRef = useRef(false);
  const convIdRef = useRef<string | undefined>(conversationId);

  // convIdRef sync karo
  useEffect(() => {
    convIdRef.current = convId;
  }, [convId]);

  const { messages, status, stop, append } = useChat({
    api: "/api/chat",
    initialMessages,
    body: {
      model,
      get conversationId() {
        return convIdRef.current;
      },
    },
    onResponse: (response) => {
      const newConvId = response.headers.get("x-conversation-id");
      if (newConvId && !redirectedRef.current) {
        redirectedRef.current = true;
        setConvId(newConvId);
        convIdRef.current = newConvId;

        // Sidebar update
        window.dispatchEvent(
          new CustomEvent("new-conversation", {
            detail: {
              id: newConvId,
              title: "New Chat",
              model,
              pinned: false,
              updatedAt: new Date(),
            },
          })
        );

        // URL update without reload
        router.replace(`/chat/${newConvId}`);
      }
    },
    onFinish: (message) => {
      // Title update sidebar mein
      const cid = convIdRef.current;
      if (cid) {
        const userMsgs = messages.filter((m) => m.role === "user");
        if (userMsgs.length > 0) {
          const firstText = extractText(userMsgs[0]);
          window.dispatchEvent(
            new CustomEvent("update-conversation-title", {
              detail: { id: cid, title: firstText.slice(0, 50) },
            })
          );
        }
      }
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [inputValue]);

  // Auto scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    setInputValue("");
    append({ role: "user", content: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    append({ role: "user", content: prompt });
  };

  const extractText = (message: any): string => {
    if (!message) return "";
    if (typeof message.content === "string") return message.content;
    if (Array.isArray(message.parts)) {
      return message.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text ?? "")
        .join("");
    }
    if (Array.isArray(message.content)) {
      return message.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text ?? "")
        .join("");
    }
    return "";
  };

  const visibleMessages = messages.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0d0d0f", flex: 1, minWidth: 0 }}>

      {/* Header */}
      {visibleMessages.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, background: "rgba(13,13,15,0.9)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: isLoading ? "#f59e0b" : "#22c55e", boxShadow: isLoading ? "0 0 6px rgba(245,158,11,0.6)" : "0 0 6px rgba(34,197,94,0.5)", transition: "all 0.3s ease" }} />
            <span style={{ fontSize: "14px", fontWeight: "500", color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "500px" }}>
              {title && title !== "New Chat" ? title : "Untitled Chat"}
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "3px 10px", borderRadius: "20px" }}>
            {model}
          </span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.07) transparent" }}>
        {visibleMessages.length === 0 ? (
          <div style={{ height: "100%", minHeight: "calc(100vh - 120px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <EmptyState userName={userName} onPromptClick={handlePromptClick} />
          </div>
        ) : (
          <div style={{ padding: "32px 16px 24px" }}>
            <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
              {visibleMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={{
                    id: msg.id,
                    role: msg.role as "user" | "assistant",
                    content: extractText(msg),
                  }}
                />
              ))}
              {isLoading && <ThinkingIndicator />}
              <div ref={bottomRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, padding: "12px 16px 20px", borderTop: visibleMessages.length > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", background: "rgba(13,13,15,0.95)", backdropFilter: "blur(16px)" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div style={{ borderRadius: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              disabled={isLoading}
              style={{ width: "100%", background: "transparent", color: "rgba(255,255,255,0.9)", fontSize: "14px", lineHeight: "1.6", padding: "16px 18px 8px", resize: "none", outline: "none", maxHeight: "160px", minHeight: "52px", display: "block", caretColor: "#818cf8", border: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>Llama 3.3 · 70B</span>
              </div>
              {isLoading ? (
                <button onClick={stop} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                  Stop
                </button>
              ) : (
                <button onClick={handleSend} disabled={!inputValue.trim()} style={{ width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: inputValue.trim() ? "pointer" : "not-allowed", transition: "all 0.2s ease", border: "none", background: inputValue.trim() ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)", boxShadow: inputValue.trim() ? "0 4px 15px rgba(99,102,241,0.4)" : "none", opacity: inputValue.trim() ? 1 : 0.3 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                </button>
              )}
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.12)", marginTop: "10px" }}>
            AI se mistakes ho sakti hain — important info verify karo
          </p>
        </div>
      </div>
    </div>
  );
}