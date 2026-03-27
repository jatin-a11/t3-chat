"use client";
import { useRef, useEffect } from "react";

export function InputBox({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
}: {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) onSubmit(e as any);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        transition: "border-color 0.2s ease",
      }}
    >
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        rows={1}
        disabled={isLoading}
        style={{
          width: "100%",
          background: "transparent",
          color: "rgba(255,255,255,0.9)",
          fontSize: "14px",
          lineHeight: "1.6",
          padding: "16px 60px 16px 18px",
          resize: "none",
          outline: "none",
          maxHeight: "160px",
          minHeight: "56px",
          display: "block",
          caretColor: "#818cf8",
        }}
      />

      {/* Bottom bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px 12px",
        }}
      >
        {/* Left — model indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 6px rgba(34,197,94,0.5)",
            }}
          />
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>
            Llama 3.3 · 70B
          </span>
        </div>

        {/* Right — action button */}
        {isLoading ? (
          <button
            onClick={onStop}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
            </svg>
            Stop
          </button>
        ) : (
          <button
            id="chat-submit"
            onClick={(e) => onSubmit(e as any)}
            disabled={!input.trim()}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              background: input.trim()
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "rgba(255,255,255,0.05)",
              border: "none",
              boxShadow: input.trim()
                ? "0 4px 15px rgba(99,102,241,0.4)"
                : "none",
              opacity: input.trim() ? 1 : 0.3,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}