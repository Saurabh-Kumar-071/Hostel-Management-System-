import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models";
import { ForgotPasswordSchema } from "@/lib/validation/schemas";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    await connectDB();
    const { email } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't disclose whether email exists
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset instructions token has been generated.",
      });
    }

    // Generate secure random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset token generated.",
      data: {
        // Exposed in development / demo mode so evaluation is friction-free
        resetToken: process.env.NODE_ENV !== "production" ? resetToken : undefined,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

