# T3 Chat

A full-stack AI-powered chat platform with real-time messaging, built for speed and scale.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)

---

## What is T3 Chat?

T3 Chat combines two things most apps keep separate — powerful AI conversations and real-time messaging with friends. One platform, no switching tabs.

- Talk to AI models powered by Groq (Llama 3.3 70B, Mixtral)
- Message friends in real-time with typing indicators and read receipts
- Create group chats and mention @AI directly in conversations
- Everything streams token by token, exactly like ChatGPT

---

## Features

**AI Chat**
- Streaming responses via Groq API — blazing fast
- Multiple model support (Llama 3.3 70B, Mixtral 8x7B)
- Conversation history with pin and rename
- Markdown rendering with syntax highlighting
- Auto-generated conversation titles

**Real-time Messaging**
- Direct messages between friends
- Typing indicators
- Read receipts with tick system (sent → delivered → read)
- Online presence (green dot, last seen)
- Unread message counts in sidebar

**Friends System**
- Search users by @username
- Send, accept, reject friend requests
- Real-time notifications via Pusher
- Block support

**Group Chats**
- Create groups with multiple members
- Admin controls — add/remove members
- @AI mention to bring AI into any group conversation

**Auth**
- Google OAuth
- GitHub OAuth
- Email + password with bcrypt
- JWT sessions via NextAuth

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6 |
| Auth | NextAuth v4 |
| AI | Groq API + Vercel AI SDK |
| Real-time | Pusher |
| Validation | Zod |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Project Structure

```
t3-chat/
├── app/
│   ├── (auth)/                 # Login, Register pages
│   ├── (chat)/                 # Main app — sidebar layout
│   │   ├── chat/[id]/          # AI conversation page
│   │   └── dm/[userId]/        # Direct message page
│   └── api/                    # All API routes
│       ├── auth/
│       ├── chat/               # AI streaming
│       ├── conversations/      # CRUD
│       ├── dm/                 # Direct messages
│       ├── friends/            # Friend system
│       ├── groups/             # Group chats
│       ├── presence/           # Online status
│       ├── pusher/auth/        # Pusher authentication
│       └── users/search/       # User search
├── components/
│   ├── chat/                   # ChatWindow, MessageBubble, InputBox
│   ├── dm/                     # DMWindow with ticks
│   └── sidebar/                # Sidebar, NotificationPanel, FindPeople
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── prisma.ts               # Prisma client singleton
│   ├── pusher.ts               # Pusher server instance
│   └── pusher-client.ts        # Pusher client (lazy loaded)
└── prisma/
    └── schema.prisma           # Full database schema
```

---

## Database Schema

```
User
├── Conversation (AI chats)
│   └── Message
├── Friendship (friends system)
├── DirectMessage (DMs with tick status)
├── GroupChat
│   ├── GroupMember
│   └── GroupMessage
```

Message status flow:
```
SENT → DELIVERED → READ
 ✓       ✓✓        ✓✓ (blue)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended — free tier)
- Groq API key — [console.groq.com](https://console.groq.com)
- Pusher account — [pusher.com](https://pusher.com)
- Google OAuth credentials
- GitHub OAuth credentials

### Installation

```bash
# Clone the repo
git clone https://github.com/jatin-a11/t3-chat
cd t3-chat

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file in the root:

```env
# Database
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
# Create at console.cloud.google.com
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
# Create at github.com/settings/developers
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"

# Groq AI
# Get at console.groq.com
GROQ_API_KEY="gsk_your-groq-api-key"

# Pusher
# Get at pusher.com/dashboard
PUSHER_APP_ID="your-app-id"
PUSHER_SECRET="your-secret"
NEXT_PUBLIC_PUSHER_KEY="your-key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"
```

### Database Setup

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# View data (optional)
npx prisma studio
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---


## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email/password |
| GET/POST | `/api/auth/[...nextauth]` | OAuth + session |

### AI Chat
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/conversations` | Create conversation |
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/[id]` | Get with messages |
| PATCH | `/api/conversations/[id]` | Rename / pin |
| DELETE | `/api/conversations/[id]` | Delete |
| POST | `/api/chat` | Stream AI response |

### Friends
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/search?q=` | Search by @username |
| POST | `/api/friends` | Send friend request |
| GET | `/api/friends` | Friends list |
| GET | `/api/friends?type=requests` | Pending requests |
| POST | `/api/friends/respond` | Accept / reject |

### Direct Messages
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/dm/[userId]` | Send message |
| GET | `/api/dm/[userId]` | Fetch history |
| POST | `/api/dm/read` | Mark as read |
| POST | `/api/dm/typing` | Typing indicator |

### Groups
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/groups` | Create group |
| GET | `/api/groups` | My groups |
| POST | `/api/groups/[id]/messages` | Send message |
| GET | `/api/groups/[id]/messages` | Fetch messages |
| POST | `/api/groups/[id]/members` | Add member |
| DELETE | `/api/groups/[id]/members` | Remove member |

### System
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/presence` | Update online status |
| POST | `/api/pusher/auth` | Authenticate Pusher channels |
| GET | `/api/notifications` | Get notifications |

---

## Key Design Decisions

**Why Groq over OpenAI?**
Groq's inference speed is 10-20x faster on Llama models. For a chat app where streaming latency matters, this makes the experience feel significantly better.

**Why Pusher over raw WebSockets?**
Next.js serverless functions don't support persistent WebSocket connections. Pusher gives us real-time without managing infrastructure.

**Why no Prisma adapter for NextAuth?**
Using JWT strategy with a manual `signIn` callback gives more control over session data and avoids adapter complexity with OAuth providers.

**Tick system design**
Messages start as `SENT`. When the receiver comes online, status becomes `DELIVERED`. When they open the chat, it becomes `READ` and a Pusher event triggers the blue tick on the sender's screen — exactly like WhatsApp.

---

## Contributing

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

**Commit convention:**
```
feat:     new feature
fix:      bug fix
chore:    config, deps
refactor: code change without feature
docs:     documentation only
```

---

## Roadmap

- [ ] Razorpay payment integration (Pro plan)
- [ ] Inngest background jobs (chat summary, PDF export)
- [ ] Redis rate limiting (Upstash)
- [ ] Mobile app (React Native)
- [ ] Voice messages
- [ ] File attachments

---

## License

MIT — use it however you want.

---

Built by [Jatin Arya](https://github.com/jatin-a11/t3-chat) · Powered by Next.js, Groq, and Pusher