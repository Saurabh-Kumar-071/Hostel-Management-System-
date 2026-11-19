import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Complaint, ComplaintHistory, Notification } from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { ComplaintStatusUpdateSchema } from "@/lib/validation/schemas";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, ["admin", "warden", "maintenance", "student"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { id } = await params;
    const body = await req.json();
    const parsed = ComplaintStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    await connectDB();
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return NextResponse.json({ success: false, error: "Complaint not found" }, { status: 404 });
    }

    // Role restrictions on transitions
    if (auth.user.role === "maintenance") {
      // Maintenance can only update to in_progress or resolved
      if (!["in_progress", "resolved"].includes(parsed.data.status)) {
        return NextResponse.json(
          { success: false, error: "Maintenance staff can only mark tickets as in_progress or resolved" },
          { status: 403 }
        );
      }
    } else if (auth.user.role === "student") {
      // Student can only close or reopen their own complaint
      if (complaint.userId.toString() !== auth.user.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
      }
      if (!["closed", "reopened"].includes(parsed.data.status)) {
        return NextResponse.json(
          { success: false, error: "Students may only close or reopen tickets" },
          { status: 403 }
        );
      }
    }

    const previousStatus = complaint.status;
    complaint.status = parsed.data.status;

    if (parsed.data.assignedTo && ["admin", "warden"].includes(auth.user.role)) {
      complaint.assignedTo = new mongoose.Types.ObjectId(parsed.data.assignedTo) as unknown as typeof complaint.assignedTo;
      complaint.assignedAt = new Date();
      if (complaint.status === "open") {
        complaint.status = "assigned";
      }
    }

    if (parsed.data.status === "resolved") {
      complaint.resolvedAt = new Date();
      complaint.resolutionDescription = parsed.data.resolutionDescription;
      if (parsed.data.resolutionImages) {
        complaint.resolutionImages = parsed.data.resolutionImages;
      }
    } else if (parsed.data.status === "closed") {
      complaint.closedAt = new Date();
    }

    await complaint.save();

    // Log immutable history
    await ComplaintHistory.create({
      complaintId: complaint._id,
      changedBy: auth.user.id,
      fromStatus: previousStatus,
      toStatus: complaint.status,
      note: parsed.data.note || `Status transitioned from ${previousStatus} to ${complaint.status}`,
    });

    // Notify student
    await Notification.create({
      userId: complaint.userId,
      type: "complaint_update",
      title: `Complaint ${complaint.ticketId} Updated`,
      message: `Your ticket "${complaint.title}" is now: ${complaint.status.toUpperCase()}`,
      referenceId: complaint._id,
      referenceModel: "Complaint",
      actionUrl: "/student/complaints",
    });

    return NextResponse.json({
      success: true,
      message: `Ticket updated to ${complaint.status}`,
      data: complaint,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update complaint";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

