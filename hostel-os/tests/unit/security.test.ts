import { describe, it, expect } from "vitest";
import { signJWT, verifyJWT } from "@/lib/auth/jwt";

describe("JWT & Security Utility", () => {
  it("should successfully sign and verify a session token", async () => {
    const mockUser = {
      id: "usr_12345",
      email: "test@hostelos.edu",
      name: "Test User",
      role: "student" as const,
    };

    const token = await signJWT(mockUser, 3600);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifyJWT(token);
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe(mockUser.email);
    expect(verified?.role).toBe("student");
  });

  it("should reject a tampered token", async () => {
    const mockUser = {
      id: "usr_12345",
      email: "test@hostelos.edu",
      name: "Test User",
      role: "student" as const,
    };

    const token = await signJWT(mockUser, 3600);
    const tampered = token.slice(0, -5) + "abcde";

    const verified = await verifyJWT(tampered);
    expect(verified).toBeNull();
  });
});

