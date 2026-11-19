import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protected route patterns
  const protectedPaths: Record<string, string[]> = {
    "/student": ["student", "admin"],
    "/warden": ["warden", "admin"],
    "/admin": ["admin"],
    "/maintenance": ["maintenance", "admin"],
    "/accountant": ["accountant", "admin"],
  };

  const matchedPrefix = Object.keys(protectedPaths).find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (matchedPrefix) {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }

    const allowedRoles = protectedPaths[matchedPrefix];
    if (!allowedRoles.includes(payload.role)) {
      // Role mismatch -> redirect to appropriate landing dashboard
      const roleHomeMap: Record<string, string> = {
        student: "/student",
        warden: "/warden",
        admin: "/admin",
        maintenance: "/maintenance",
        accountant: "/accountant",
      };
      return NextResponse.redirect(new URL(roleHomeMap[payload.role] || "/login", req.url));
    }
  }

  return NextResponse.next();
}

// Backward compatibility alias for middleware convention
export const middleware = proxy;
export default proxy;

export const config = {
  matcher: [
    "/student/:path*",
    "/warden/:path*",
    "/admin/:path*",
    "/maintenance/:path*",
    "/accountant/:path*",
  ],
};
