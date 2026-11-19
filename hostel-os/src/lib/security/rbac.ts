import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth/session";
import type { Role, SessionUser } from "@/types";

export interface AuthContext {
  user: SessionUser;
}

/**
 * Validates request authorization. Checks Bearer token or cookie.
 * Ensures the user exists and possesses one of the allowed roles.
 */
export async function requireAuth(
  req: Request,
  allowedRoles?: Role[]
): Promise<{ user: SessionUser } | { errorResponse: NextResponse }> {
  let token: string | undefined;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // 2. Fall back to Cookie header
  if (!token) {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [k, ...v] = c.split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );
    token = cookies[AUTH_COOKIE_NAME];
  }

  if (!token) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      ),
    };
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or expired session token" },
        { status: 401 }
      ),
    };
  }

  const user: SessionUser = {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    image: payload.image,
    hostelId: payload.hostelId,
    studentId: payload.studentId,
    staffId: payload.staffId,
  };

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Forbidden: User role '${user.role}' lacks permission for this resource`,
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}

