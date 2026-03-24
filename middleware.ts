import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// IMPORTANT: "export default" hona zaroori hai
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") || 
                       req.nextUrl.pathname.startsWith("/register");

    // Agar user logged in hai aur login page par ja raha hai -> Home pe bhejo
    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return null;
    }

    // Agar user logged in nahi hai aur private page par hai -> NextAuth khud login pe bhej dega
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Agar token hai toh user authorized hai
        return !!token;
      },
    },
    // Login page ka path batana zaroori hai
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // Kin paths par middleware chalana hai
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};