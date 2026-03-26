// middleware.ts  ← root mein hona chahiye (app ke bahar)
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = req.nextUrl;

  // ===== PUBLIC ROUTES =====
  // Landing page — sabke liye
  if (pathname === "/") {
    return NextResponse.next();
  }

  // ===== AUTH ROUTES =====
  // Login/Register — agar already logged in hai → /chat
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      return NextResponse.redirect(new URL("/chat", req.url));
    }
    return NextResponse.next();
  }

  // ===== PROTECTED ROUTES =====
  // /chat/* — login nahi toh /login
  if (pathname.startsWith("/chat")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Middleware kin routes pe chalega
export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/chat",
    "/chat/(.*)",
  ],
};
