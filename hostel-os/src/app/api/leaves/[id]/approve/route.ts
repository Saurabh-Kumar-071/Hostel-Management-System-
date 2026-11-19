import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { LeaveRequest, GatePass, Notification } from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { mockStore } from "@/lib/db/mock-store";
import QRCode from "qrcode";
import crypto from "crypto";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req, ["warden", "admin"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { action, rejectionReason } = body; // action: 'approve' | 'reject'

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    try {
      await connectDB();
      const leave = await LeaveRequest.findById(id).populate("studentId");
      if (leave) {
        if (leave.status !== "pending") {
          return NextResponse.json(
            { success: false, error: `Leave request is already ${leave.status}` },
            { status: 400 }
          );
        }

        if (action === "reject") {
          leave.status = "rejected";
          leave.reviewedBy = auth.user.id as unknown as typeof leave.reviewedBy;
          leave.reviewedAt = new Date();
          leave.rejectionReason = rejectionReason || "Not approved by warden";
          await leave.save();

          return NextResponse.json({ success: true, message: "Leave rejected", data: leave });
        }

        // Generate QR Gate Pass
        const passNumber = `GP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
        const qrPayload = JSON.stringify({
          passNumber,
          studentId: leave.studentId._id,
          leaveId: leave._id,
          destination: leave.destination,
          validFrom: leave.departureDateTime,
          validUntil: leave.expectedReturnDateTime,
          issuedAt: new Date().toISOString(),
        });

        const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
          errorCorrectionLevel: "H",
          margin: 2,
          width: 300,
        });

        const gatePass = await GatePass.create({
          leaveRequestId: leave._id,
          studentId: leave.studentId._id,
          passNumber,
          qrCode: qrCodeDataUrl,
          qrData: qrPayload,
          issuedBy: auth.user.id,
          issuedAt: new Date(),
          validFrom: leave.departureDateTime,
          validUntil: leave.expectedReturnDateTime,
          status: "issued",
        });

        leave.status = "approved";
        leave.reviewedBy = auth.user.id as unknown as typeof leave.reviewedBy;
        leave.reviewedAt = new Date();
        leave.gatePassId = gatePass._id;
        await leave.save();

        return NextResponse.json({
          success: true,
          message: "Leave approved and Gate Pass issued",
          data: { leave, gatePass },
        });
      }
    } catch {
      // Fall through to in-memory demo store
    }

    // Demo Mode Handler
    const demoLeave = mockStore.leaves.find((l) => l._id === id);
    if (!demoLeave) {
      return NextResponse.json({ success: false, error: "Leave request not found" }, { status: 404 });
    }

    if (action === "reject") {
      demoLeave.status = "rejected";
      return NextResponse.json({ success: true, message: "Leave rejected", data: demoLeave });
    }

    // Generate Demo QR Gate Pass
    const passNumber = `GP-${Date.now().toString(36).toUpperCase()}-DEMO`;
    const qrPayload = JSON.stringify({
      passNumber,
      destination: demoLeave.destination,
      departure: demoLeave.departureDateTime,
      validUntil: demoLeave.expectedReturnDateTime,
      studentName: demoLeave.studentId.userId.name,
      verifiedBy: "Chief Warden",
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 300,
    });

    demoLeave.status = "approved";
    demoLeave.gatePassId = {
      _id: `gp_${Date.now()}`,
      passNumber,
      qrCode: qrCodeDataUrl,
      status: "issued",
    };

    return NextResponse.json({
      success: true,
      message: "Leave approved and Gate Pass issued (Demo)",
      data: { leave: demoLeave, gatePass: demoLeave.gatePassId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to review leave";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
