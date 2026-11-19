import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { MessMenu, Feedback, Student } from "@/models";
import { requireAuth } from "@/lib/security/rbac";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostelId") || auth.user.hostelId;

    const query: Record<string, unknown> = {};
    if (hostelId) query.hostelId = hostelId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const menus = await MessMenu.find({
      ...query,
      date: { $gte: today },
    })
      .sort({ date: 1 })
      .limit(7);

    const recentFeedback = await Feedback.find({ type: "mess" })
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        menus,
        recentFeedback,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch mess details";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["student"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const { rating, comment, isAnonymous } = body;

    if (!rating || !comment) {
      return NextResponse.json(
        { success: false, error: "Rating and comment are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const student = await Student.findOne({ userId: auth.user.id });
    if (!student || !student.hostelId) {
      return NextResponse.json(
        { success: false, error: "You must be assigned to a hostel to submit mess feedback" },
        { status: 400 }
      );
    }

    const feedback = await Feedback.create({
      type: "mess",
      studentId: student._id,
      hostelId: student.hostelId,
      rating: Number(rating),
      comment,
      isAnonymous: Boolean(isAnonymous),
    });

    return NextResponse.json({ success: true, data: feedback }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record feedback";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

