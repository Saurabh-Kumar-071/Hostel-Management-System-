import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/security/rbac";
import { connectDB } from "@/lib/db/connect";
import { User, Student, Staff } from "@/models";

export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const sessionUser = authResult.user;

  try {
    await connectDB();
    const user = await User.findById(sessionUser.id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found in database" }, { status: 404 });
    }

    let profile = null;
    if (user.role === "student") {
      profile = await Student.findOne({ userId: user._id }).populate("hostelId roomId");
    } else {
      profile = await Staff.findOne({ userId: user._id }).populate("hostelId");
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          phone: user.phone,
          image: user.image,
        },
        profile,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load user profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
