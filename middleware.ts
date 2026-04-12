// middleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Public
  if (pathname === "/") return NextResponse.next();

  // Auth routes
  if (pathname === "/login" || pathname === "/register") {
    if (token) return NextResponse.redirect(new URL("/chat", req.url));
    return NextResponse.next();
  }

  // Settings — allow
  if (pathname.startsWith("/settings")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  // Protected
  if (pathname.startsWith("/chat") || pathname.startsWith("/dm")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/chat/(.*)", "/dm/(.*)", "/settings/(.*)"],
};