// lib/prisma.ts
// Neon free tier — 5 min baad suspend hota hai
// Yeh singleton + auto-reconnect handle karta hai

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Auto-reconnect wrapper — Neon suspend se bachne ke liye
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isConnectionError =
        err?.code === "P1001" ||
        err?.code === "P1017" ||
        err?.message?.includes("Can't reach") ||
        err?.message?.includes("Connection refused") ||
        err?.message?.includes("Closed");

      if (isConnectionError && i < retries - 1) {
        console.log(`[Prisma] DB reconnect attempt ${i + 1}...`);
        await new Promise((r) => setTimeout(r, delay * (i + 1)));
        await prisma.$disconnect();
        await prisma.$connect();
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries reached");
}