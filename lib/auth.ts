// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface User {
    id: string;
    username?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string | null;
  }
}

// Username auto-generate karo — name se + random number
function generateUsername(name?: string | null, email?: string | null): string {
  const base = name
    ? name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)
    : email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) ?? "user";
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base}${random}`;
}

// Unique username ensure karo
async function createUniqueUsername(name?: string | null, email?: string | null): Promise<string> {
  let username = generateUsername(name, email);
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (!existing) return username;
    username = generateUsername(name, email);
    attempts++;
  }
  return `user${Date.now()}`;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email aur password chahiye");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) {
          throw new Error("Email ya password galat hai");
        }
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Email ya password galat hai");
        }

        // Agar username nahi hai toh generate karo
        if (!user.username) {
          const username = await createUniqueUsername(user.name, user.email);
          await prisma.user.update({
            where: { id: user.id },
            data: { username },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (!user.email) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        // Naya user — username bhi generate karo
        const username = await createUniqueUsername(user.name, user.email);
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            image: user.image,
            provider: account?.provider ?? "google",
            username,
          },
        });
      } else if (!existingUser.username) {
        // Purana user — username nahi tha, ab add karo
        const username = await createUniqueUsername(existingUser.name, existingUser.email);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { username },
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true, username: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username;
      }
      return session;
    },
  },
};