// lib/usage.ts
import { prisma } from "@/lib/prisma";
import { PlanType } from "./plan";
import { PLANS } from "./plan";

// Aaj ki date string
function todayString() {
  return new Date().toISOString().split("T")[0]; // "2026-04-05"
}

// User ka plan fetch karo
export async function getUserPlan(userId: string): Promise<PlanType> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.status !== "ACTIVE") return "FREE";
  if (subscription.endDate && subscription.endDate < new Date()) return "FREE";

  return subscription.plan as PlanType;
}

// Aaj kitni messages bheji
export async function getTodayUsage(userId: string): Promise<number> {
  const today = todayString();

  const usage = await prisma.dailyUsage.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  return usage?.count ?? 0;
}

// Usage increment karo
export async function incrementUsage(userId: string): Promise<number> {
  const today = todayString();

  const usage = await prisma.dailyUsage.upsert({
    where: { userId_date: { userId, date: today } },
    update: { count: { increment: 1 } },
    create: { userId, date: today, count: 1 },
  });

  return usage.count;
}

// Check — kya user message bhej sakta hai
export async function canSendMessage(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  plan: PlanType;
  remaining: number;
}> {
  const [plan, used] = await Promise.all([
    getUserPlan(userId),
    getTodayUsage(userId),
  ]);

  const limit = PLANS[plan].dailyMessages;
  const allowed = used < limit;
  const remaining = Math.max(0, limit - used);

  return { allowed, used, limit, plan, remaining };
}

// Old daily usage cleanup — cron job ke liye
export async function cleanOldUsage() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const cutoff = sevenDaysAgo.toISOString().split("T")[0];

  await prisma.dailyUsage.deleteMany({
    where: { date: { lt: cutoff } },
  });
}