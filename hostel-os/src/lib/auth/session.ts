import { cookies } from "next/headers";
import { verifyJWT, signJWT } from "./jwt";
import type { SessionUser } from "@/types";

export const AUTH_COOKIE_NAME = "hostelos_session";

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload) return null;

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      image: payload.image,
      hostelId: payload.hostelId,
      studentId: payload.studentId,
      staffId: payload.staffId,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser): Promise<string> {
  const token = await signJWT(user);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return token;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

