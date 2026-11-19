import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Complaint, ComplaintHistory, Student } from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { ComplaintSchema } from "@/lib/validation/schemas";
import { generateTicketId } from "@/lib/utils";
import { classifyComplaint } from "@/lib/ai/classifier";
import { logAuditEvent } from "@/lib/security/audit";
import { mockStore, type MockComplaint } from "@/lib/db/mock-store";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    try {
      await connectDB();
      const query: Record<string, unknown> = {};
      if (status) query.status = status;
      if (category) query.category = category;

      if (auth.user.role === "student") {
        query.userId = auth.user.id;
      } else if (auth.user.role === "warden" && auth.user.hostelId) {
        query.hostelId = auth.user.hostelId;
      } else if (auth.user.role === "maintenance") {
        query.$or = [{ assignedTo: auth.user.staffId }, { status: "open" }];
      }

      const complaints = await Complaint.find(query)
        .populate({
          path: "studentId",
          populate: { path: "userId", select: "name email phone image" },
        })
        .populate("assignedTo")
        .populate("roomId")
        .sort({ createdAt: -1 });

      if (complaints.length > 0) {
        return NextResponse.json({ success: true, data: complaints });
      }
    } catch {
      // Fall through to mockStore
    }

    // In-memory demo fallback
    let demoList = mockStore.complaints;
    if (status) demoList = demoList.filter((c) => c.status === status);
    if (category) demoList = demoList.filter((c) => c.category === category);
    if (auth.user.role === "student") {
      demoList = demoList.filter((c) => c.userId === auth.user.id);
    }

    return NextResponse.json({ success: true, data: demoList });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch complaints";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["student"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const parsed = ComplaintSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    // Run AI classification
    const aiResult = await classifyComplaint(parsed.data.title, parsed.data.description);
    const ticketId = generateTicketId("TKT");

    try {
      await connectDB();
      const student = await Student.findOne({ userId: auth.user.id });
      if (student && student.hostelId && student.roomId) {
        const complaint = await Complaint.create({
          ticketId,
          studentId: student._id,
          userId: auth.user.id,
          hostelId: student.hostelId,
          roomId: student.roomId,
          category: parsed.data.category,
          title: parsed.data.title,
          description: parsed.data.description,
          priority: aiResult.isUrgent ? "urgent" : parsed.data.priority,
          status: "open",
          attachments: parsed.data.attachments,
          aiClassification: {
            ...aiResult,
            processedAt: new Date(),
          },
        });

        return NextResponse.json(
          {
            success: true,
            message: `Complaint registered with Ticket ID ${ticketId}`,
            data: complaint,
          },
          { status: 201 }
        );
      }
    } catch {
      // Fall through to demo store
    }

    // Demo Mode Complaint creation
    const newDemoComplaint: MockComplaint = {
      _id: `cmp_${Date.now()}`,
      ticketId,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      priority: aiResult.isUrgent ? "urgent" : parsed.data.priority,
      status: "open",
      userId: auth.user.id,
      studentId: {
        _id: auth.user.studentId || "student_aarav_01",
        userId: { name: auth.user.name },
      },
      roomId: { roomNumber: "101" },
      aiClassification: {
        department: aiResult.department,
        isUrgent: aiResult.isUrgent,
        confidence: aiResult.confidence,
      },
      createdAt: new Date().toISOString(),
    };

    mockStore.complaints.unshift(newDemoComplaint);

    return NextResponse.json(
      {
        success: true,
        message: `Complaint registered with Ticket ID ${ticketId}`,
        data: newDemoComplaint,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit complaint";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
