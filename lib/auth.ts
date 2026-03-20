import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import {prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface User {
    id: string;
  }
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Google login
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // GitHub login
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),

    // Email + Password login
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

        // DB mein user dhundho
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // User nahi mila
        if (!user || !user.password) {
          throw new Error("Email ya password galat hai");
        }

        // Password check karo
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Email ya password galat hai");
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

  // JWT — DB session nahi
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    // Google/GitHub login pe hum khud DB mein save karenge
    async signIn({ user, account }) {
      // Credentials — seedha allow
      if (account?.provider === "credentials") {
        return true;
      }

      // Google ya GitHub
      if (!user.email) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        // Naya user — DB mein save karo
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            image: user.image,
            provider: account?.provider ?? "google",
          },
        });
      }

      return true;
    },

    // JWT mein user id daalo
    async jwt({ token, user }) {
      if (user) {
        // DB se latest user fetch karo
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
        });

        if (dbUser) {
          token.id = dbUser.id;
        }
      }
      return token;
    },

    // Session mein id aaye
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};