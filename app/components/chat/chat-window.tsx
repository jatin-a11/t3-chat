"use client";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";


type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatWindow({
  conversationId,
  initialMessages,
  model,
  title,
  userName,
}: {
  conversationId: string;
  initialMessages: Message[];
  model: string;
  title: string;
  userName: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    error,
    setInput,
  } = useChat({
    api: "/api/chat",
    body: { conversationId, model },
    initialMessages: initialMessages as any,
    streamProtocol: "text",
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      document.getElementById("chat-submit")?.click();
    }, 50);
  };

  return (
    <div
      className="flex flex-col"
      style={{ height: "100vh", background: "#0d0d0d" }}
    >
      {/* Header — sirf messages hone pe */}
      {messages.length > 0 && (
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(13,13,13,0.9)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px rgba(34,197,94,0.6)",
              }}
            />
            <h1
              className="truncate"
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "rgba(255,255,255,0.8)",
                maxWidth: "400px",
              }}
            >
              {title === "New Chat" ? "Untitled Chat" : title}
            </h1>
          </div>
          <span
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "3px 10px",
              borderRadius: "100px",
            }}
          >
            {model}
          </span>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty state — perfectly centered */
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            
          </div>
        ) : (
          /* Messages */
          <div style={{ padding: "32px 16px 16px" }}>
            <div
              style={{
                maxWidth: "720px",
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                gap: "28px",
              }}
            >
            
                    Kuch gadbad ho gayi — dobara try karo
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        )}
      
      {/* Input box */}
      <div
        className="flex-shrink-0"
        style={{
          padding: "12px 16px 20px",
          background: "#0d0d0d",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
         
          <p
            style={{
              textAlign: "center",
              fontSize: "11px",
              color: "rgba(255,255,255,0.15)",
              marginTop: "8px",
            }}
          >
            AI mistakes ho sakti hain — important info verify karo
          </p>
        </div>
      </div>
    