const features = [
  {
    iconBg: "rgba(99,102,241,0.12)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8">
        <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
        <path d="M12 2a10 10 0 0 1 10 10" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: "AI Chat — Groq powered",
    desc: "Llama, Mixtral aur baaki models ke saath baat karo। Token by token streaming — bilkul ChatGPT jaisa feel।",
  },
  {
    iconBg: "rgba(34,197,94,0.1)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Real-time Messaging",
    desc: "Dosto ke saath real-time chat karo। Typing indicator, read receipts, online status — sab kuch।",
  },
  {
    iconBg: "rgba(251,146,60,0.1)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Group Chats",
    desc: "Friends ka group banao। AI ko bhi group mein add karo — @AI mention karo aur jawab milega।",
  },
  {
    iconBg: "rgba(168,85,247,0.1)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    title: "Multi-model Support",
    desc: "Har conversation mein alag model choose karo। Speed chahiye toh Llama, depth chahiye toh GPT-4।",
  },
  {
    iconBg: "rgba(236,72,153,0.1)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Secure & Private",
    desc: "Google aur GitHub OAuth। JWT tokens। Tera data sirf tera — koi third-party sharing nahi।",
  },
  {
    iconBg: "rgba(20,184,166,0.1)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="1.8">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Background AI Jobs",
    desc: "Chat summary, PDF export, daily digest — Inngest se background mein chalta hai, user wait nahi karta।",
  },
];

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="section-label">Features</div>
      <h2 className="section-title">Sab kuch ek jagah</h2>
      <p className="section-sub">
        AI chat se lekar dost ke saath baat karna — T3 Chat mein sab hai।
      </p>

      <div className="features-grid">
        {features.map((f, i) => (
          <div className="feature-card" key={i}>
            <div className="feature-icon" style={{ background: f.iconBg }}>
              {f.icon}
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}