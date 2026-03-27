"use client";
import { useState } from "react";

const SUGGESTIONS = [
  {
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    label: "Create",
    color: "#f472b6",
    activeBg: "rgba(244,114,182,0.1)",
    activeBorder: "rgba(244,114,182,0.35)",
    prompts: [
      "Write a short story about a robot discovering emotions",
      "Help me outline a sci-fi novel set in 2150",
      "Create a character profile for a complex villain",
    ],
  },
  {
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    label: "Explore",
    color: "#60a5fa",
    activeBg: "rgba(96,165,250,0.1)",
    activeBorder: "rgba(96,165,250,0.35)",
    prompts: [
      "What are the most fascinating unsolved mysteries in science?",
      "Explain quantum entanglement in simple terms",
      "What will cities look like in 2050?",
    ],
  },
  {
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    label: "Code",
    color: "#34d399",
    activeBg: "rgba(52,211,153,0.1)",
    activeBorder: "rgba(52,211,153,0.35)",
    prompts: [
      "Build a REST API with Node.js and Express",
      "Explain the difference between SQL and NoSQL databases",
      "How do I implement JWT authentication?",
    ],
  },
  {
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    label: "Learn",
    color: "#fbbf24",
    activeBg: "rgba(251,191,36,0.1)",
    activeBorder: "rgba(251,191,36,0.35)",
    prompts: [
      "Teach me the basics of machine learning",
      "How does the stock market actually work?",
      "Explain blockchain in simple words",
    ],
  },
];

export function EmptyState({
  userName,
  onPromptClick,
}: {
  userName: string;
  onPromptClick: (prompt: string) => void;
}) {
  const firstName = userName?.split(" ")[0]?.trim() || "there";
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: "580px",
        padding: "0 24px",
        animation: "fadeUp 0.4s ease forwards",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .prompt-card { transition: all 0.18s ease; }
        .prompt-card:hover {
          background: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,255,255,0.12) !important;
          color: rgba(255,255,255,0.85) !important;
          transform: translateX(3px);
        }
        .prompt-card:hover .p-arrow { opacity: 0.6; transform: translateX(3px); }
        .p-arrow { opacity: 0.15; transition: all 0.18s ease; flex-shrink: 0; }
        .tab-btn { transition: all 0.18s ease; }
        .tab-btn:hover { opacity: 0.85; }
      `}</style>

      {/* Greeting */}
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "clamp(26px, 3vw, 38px)",
            fontWeight: "700",
            letterSpacing: "-0.03em",
            lineHeight: "1.2",
            color: "rgba(255,255,255,0.95)",
            marginBottom: "8px",
          }}
        >
          How can I help you,{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #818cf8, #c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {firstName}
          </span>
          ?
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)" }}>
          Choose a category or type your own message below
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {SUGGESTIONS.map((cat, i) => (
          <button
            key={cat.label}
            onClick={() => setActiveTab(i)}
            className="tab-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 15px",
              borderRadius: "100px",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              background: activeTab === i ? cat.activeBg : "transparent",
              border: `1px solid ${activeTab === i ? cat.activeBorder : "rgba(255,255,255,0.08)"}`,
              color: activeTab === i ? cat.color : "rgba(255,255,255,0.3)",
              transform: activeTab === i ? "scale(1.04)" : "scale(1)",
            }}
          >
            <span style={{ color: activeTab === i ? cat.color : "rgba(255,255,255,0.2)", display: "flex" }}>
              {cat.icon}
            </span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Prompt cards */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
        {SUGGESTIONS[activeTab].prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
            className="prompt-card"
            style={{
              width: "100%",
              textAlign: "left",
              padding: "14px 18px",
              borderRadius: "12px",
              fontSize: "13px",
              cursor: "pointer",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{prompt}</span>
            <svg
              className="p-arrow"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ marginLeft: "10px" }}
            >
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}