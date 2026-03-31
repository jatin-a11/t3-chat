"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: copied ? "#22c55e" : "rgba(255,255,255,0.4)",
        fontSize: "12px",
        fontWeight: "500",
        padding: "2px 6px",
        borderRadius: "4px",
        transition: "color 0.15s",
        fontFamily: "inherit",
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "0 4px",
          animation: "msgIn 0.2s ease",
        }}
      >
        <style>{`
          @keyframes msgIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div
          style={{
            maxWidth: "72%",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: "20px 20px 4px 20px",
            fontSize: "14px",
            lineHeight: "1.65",
            fontWeight: "400",
            boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            letterSpacing: "0.01em",
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        animation: "msgIn 0.2s ease",
      }}
    >
      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ai-prose p { color: rgba(255,255,255,0.85); font-size: 14px; line-height: 1.75; margin-bottom: 12px; }
        .ai-prose p:last-child { margin-bottom: 0; }
        .ai-prose ul, .ai-prose ol { color: rgba(255,255,255,0.82); font-size: 14px; line-height: 1.7; margin-bottom: 12px; padding-left: 20px; }
        .ai-prose li { margin-bottom: 4px; }
        .ai-prose h1, .ai-prose h2, .ai-prose h3 { color: rgba(255,255,255,0.95); font-weight: 600; margin-bottom: 8px; margin-top: 16px; }
        .ai-prose h1 { font-size: 18px; }
        .ai-prose h2 { font-size: 16px; }
        .ai-prose h3 { font-size: 14px; }
        .ai-prose strong { color: rgba(255,255,255,0.95); font-weight: 600; }
        .ai-prose a { color: #818cf8; text-decoration: underline; }
        .ai-prose blockquote { border-left: 2px solid rgba(99,102,241,0.5); padding-left: 12px; color: rgba(255,255,255,0.55); font-style: italic; margin: 8px 0; }
        .ai-prose code { background: rgba(255,255,255,0.08); color: #a5b4fc; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'Fira Code', monospace; }
        .ai-prose table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
        .ai-prose th { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); padding: 8px 12px; border: 1px solid rgba(255,255,255,0.08); text-align: left; font-weight: 500; }
        .ai-prose td { padding: 8px 12px; border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }
        .ai-prose tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
      `}</style>

      {/* AI Avatar */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "2px",
          boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
        </svg>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ai-prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";
                const code = String(children).replace(/\n$/, "");

                if (!inline && language) {
                  return (
                    <div
                      style={{
                        margin: "12px 0",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 14px",
                          background: "rgba(255,255,255,0.05)",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: "500", letterSpacing: "0.05em" }}>
                          {language.toUpperCase()}
                        </span>
                        <CopyButton text={code} />
                      </div>
                      <SyntaxHighlighter
                        language={language}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          padding: "16px",
                          background: "rgba(0,0,0,0.4)",
                          fontSize: "13px",
                          lineHeight: "1.6",
                        }}
                        showLineNumbers
                      >
                        {code}
                      </SyntaxHighlighter>
                    </div>
                  );
                }

                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ children }) => <p>{children}</p>,
              ul: ({ children }) => <ul>{children}</ul>,
              ol: ({ children }) => <ol>{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              h1: ({ children }) => <h1>{children}</h1>,
              h2: ({ children }) => <h2>{children}</h2>,
              h3: ({ children }) => <h3>{children}</h3>,
              strong: ({ children }) => <strong>{children}</strong>,
              blockquote: ({ children }) => <blockquote>{children}</blockquote>,
              table: ({ children }) => <table>{children}</table>,
              th: ({ children }) => <th>{children}</th>,
              td: ({ children }) => <td>{children}</td>,
              a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}