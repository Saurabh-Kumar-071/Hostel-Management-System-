import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User, Student, Staff } from "@/models";
import { RegisterSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { logAuditEvent } from "@/lib/security/audit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const { allowed } = checkRateLimit(`register:${ip}`, 10, 60);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many registration attempts. Please wait." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    await connectDB();
    const { email, password, name, role, phone } = parsed.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate 6 digit OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // In local development or academic demo, activate immediately unless strict verification is on
    const isAutoVerified = process.env.NODE_ENV !== "production";

    const newUser = new User({
      email,
      password,
      name,
      role,
      phone,
      status: isAutoVerified ? "active" : "pending_verification",
      emailVerified: isAutoVerified,
      emailVerificationOtp: otp,
      emailVerificationOtpExpiry: otpExpiry,
    });

    await newUser.save();

    // Create linked role-specific entity
    if (role === "student") {
      await Student.create({
        userId: newUser._id,
        enrollmentNumber: parsed.data.enrollmentNumber || `ENR-${Date.now().toString().slice(-6)}`,
        department: parsed.data.department || "Computer Science",
        semester: parsed.data.semester || 1,
        year: parsed.data.year || 1,
        course: parsed.data.course || "B.Tech",
        gender: parsed.data.gender || "male",
        dateOfBirth: new Date("2002-01-01"),
        address: {
          street: "Campus Road",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110001",
          country: "India",
        },
        guardian: {
          name: "Parent/Guardian",
          relation: "Father",
          phone: phone || "9876543210",
        },
        emergencyContact: {
          name: "Emergency Contact",
          relation: "Guardian",
          phone: phone || "9876543210",
        },
        status: "active",
      });
    } else {
      await Staff.create({
        userId: newUser._id,
        employeeId: `EMP-${Date.now().toString().slice(-6)}`,
        role,
        department: "Hostel Administration",
        designation: role.toUpperCase(),
        phone: phone || "9876543210",
        joiningDate: new Date(),
        status: "active",
      });
    }

    await logAuditEvent({
      userId: newUser._id.toString(),
      action: "USER_REGISTER",
      resource: "users",
      resourceId: newUser._id.toString(),
      details: { email, role },
    });

    return NextResponse.json(
      {
        success: true,
        message: isAutoVerified
          ? "Account registered successfully and activated."
          : `Registration successful. An OTP has been generated: ${otp}`,
        data: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          demoOtp: isAutoVerified ? undefined : otp,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

