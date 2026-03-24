// components/sidebar/conversation-item.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Conversation = {
  id: string;
  title: string;
  model: string;
  pinned: boolean;
};

export function ConversationItem({
  conversation,
  isActive,
}: {
  conversation: Conversation;
  isActive: boolean;
}) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete karna hai?")) return;

    await fetch(`/api/conversations/${conversation.id}`, {
      method: "DELETE",
    });

    router.push("/");
    router.refresh();
  };

  const handlePin = async () => {
    await fetch(`/api/conversations/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !conversation.pinned }),
    });

    router.refresh();
    setShowMenu(false);
  };

  return (
    <div className="relative group">
      <button
        onClick={() => router.push(`/chat/${conversation.id}`)}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
          isActive
            ? "bg-zinc-700 text-white"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
        }`}
      >
        {/* Pin icon */}
        {conversation.pinned && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-zinc-400">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        )}

        {/* Title */}
        <span className="truncate flex-1">{conversation.title}</span>

        {/* Menu button — hover pe dikhega */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-zinc-600 rounded"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="12" cy="19" r="1.5"/>
          </svg>
        </span>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-8 z-20 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={handlePin}
              className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              {conversation.pinned ? "Unpin karo" : "Pin karo"}
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 transition-colors"
            >
              Delete karo
            </button>
          </div>
        </>
      )}
    </div>
  );
}