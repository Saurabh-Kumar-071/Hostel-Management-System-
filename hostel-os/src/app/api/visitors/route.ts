import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Visitor, Student } from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { VisitorSchema } from "@/lib/validation/schemas";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const query: Record<string, unknown> = {};

    if (auth.user.role === "student") {
      query.studentId = auth.user.studentId;
    } else if (auth.user.role === "warden" && auth.user.hostelId) {
      query.hostelId = auth.user.hostelId;
    }

    const visitors = await Visitor.find(query)
      .populate("studentId")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: visitors });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch visitors";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["student", "warden", "admin"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const parsed = VisitorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    await connectDB();
    const student = await Student.findById(parsed.data.studentId);
    if (!student || !student.hostelId) {
      return NextResponse.json(
        { success: false, error: "Student must have a valid hostel" },
        { status: 400 }
      );
    }

    const visitor = await Visitor.create({
      ...parsed.data,
      hostelId: student.hostelId,
      expectedCheckIn: new Date(parsed.data.expectedCheckIn),
      expectedCheckOut: new Date(parsed.data.expectedCheckOut),
      status: ["admin", "warden"].includes(auth.user.role) ? "approved" : "pending",
      approvedBy: ["admin", "warden"].includes(auth.user.role) ? auth.user.id : undefined,
      approvedAt: ["admin", "warden"].includes(auth.user.role) ? new Date() : undefined,
    });

    return NextResponse.json({ success: true, data: visitor }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to register visitor";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

