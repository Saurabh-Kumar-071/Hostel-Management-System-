import type { SessionUser } from "@/types";

const AUTH_SECRET = process.env.AUTH_SECRET || "hostel-os-development-secret-key-min-32-chars-long";

// Convert string secret to CryptoKey
async function getSigningKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64UrlEncode(data: Uint8Array | string): string {
  const binary = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let str = "";
  for (let i = 0; i < binary.length; i++) {
    str += String.fromCharCode(binary[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface JWTPayload extends SessionUser {
  exp: number;
  iat: number;
}

export async function signJWT(
  payload: Omit<JWTPayload, "exp" | "iat">,
  expiresInSeconds = 7 * 24 * 60 * 60 // 7 days
): Promise<string> {
  const key = await getSigningKey();
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

  const signature = await crypto.subtle.sign("HMAC", key, data);
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const key = await getSigningKey();
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlDecode(sigB64);

    const isValid = await crypto.subtle.verify("HMAC", key, signature as unknown as BufferSource, data);
    if (!isValid) return null;

    const payloadText = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(payloadText) as JWTPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

