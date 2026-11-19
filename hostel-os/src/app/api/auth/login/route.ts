import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User, Student, Staff } from "@/models";
import { LoginSchema } from "@/lib/validation/schemas";
import { setSessionCookie } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { logAuditEvent } from "@/lib/security/audit";
import type { SessionUser } from "@/types";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const { allowed } = checkRateLimit(`login:${ip}`, 30, 60);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please wait 1 minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Connect to MongoDB Atlas
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.isLocked()) {
      return NextResponse.json(
        { success: false, error: "Account temporarily locked due to failed attempts. Try later." },
        { status: 403 }
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      }
      await user.save();
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Reset login attempts on successful authentication
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    let studentId: string | undefined;
    let staffId: string | undefined;
    let hostelId: string | undefined;

    if (user.role === "student") {
      const studentDoc = await Student.findOne({ userId: user._id });
      if (studentDoc) {
        studentId = studentDoc._id.toString();
        hostelId = studentDoc.hostelId?.toString();
      }
    } else {
      const staffDoc = await Staff.findOne({ userId: user._id });
      if (staffDoc) {
        staffId = staffDoc._id.toString();
        hostelId = staffDoc.hostelId?.toString();
      }
    }

    const sessionUser: SessionUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
      studentId,
      staffId,
      hostelId,
    };

    const token = await setSessionCookie(sessionUser);

    await logAuditEvent({
      userId: user._id.toString(),
      action: "USER_LOGIN_SUCCESS",
      resource: "users",
      resourceId: user._id.toString(),
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: { user: sessionUser, token },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
