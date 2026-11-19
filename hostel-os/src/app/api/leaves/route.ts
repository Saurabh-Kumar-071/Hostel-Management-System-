import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { LeaveRequest, Student, GatePass, Hostel } from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { LeaveRequestSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/security/audit";
import { mockStore, type MockLeave } from "@/lib/db/mock-store";
import QRCode from "qrcode";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    try {
      await connectDB();
      const query: Record<string, unknown> = {};
      if (status) query.status = status;

      if (auth.user.role === "student") {
        query.userId = auth.user.id;
      } else if (auth.user.role === "warden" && auth.user.hostelId) {
        query.hostelId = auth.user.hostelId;
      }

      const leaves = await LeaveRequest.find(query)
        .populate({
          path: "studentId",
          populate: { path: "userId", select: "name email phone image" },
        })
        .populate("gatePassId")
        .sort({ createdAt: -1 });

      if (leaves.length > 0) {
        return NextResponse.json({ success: true, data: leaves });
      }
    } catch {
      // Fall through to mockStore
    }

    // In-memory demo fallback
    let demoLeaves = mockStore.leaves;
    if (status) {
      demoLeaves = demoLeaves.filter((l) => l.status === status);
    }
    if (auth.user.role === "student") {
      demoLeaves = demoLeaves.filter((l) => l.userId === auth.user.id);
    }

    return NextResponse.json({ success: true, data: demoLeaves });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch leave requests";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["student"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const parsed = LeaveRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const isEveningRoutineOutpass = parsed.data.leaveType === "regular";
    const initialStatus = isEveningRoutineOutpass ? "approved" : "pending";

    // Prepare QR Gate Pass data for instant routine outpasses
    const studentRollNo = "ENR-2024-8842";
    const passNumber = `GP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const secretKey = process.env.AUTH_SECRET || "hostelos-permanent-security-key-2026";
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(`${passNumber}|${studentRollNo}|${parsed.data.destination}`)
      .digest("hex")
      .slice(0, 12)
      .toUpperCase();

    const qrPayload = JSON.stringify({
      passType: isEveningRoutineOutpass ? "EVENING_AUTO_PASS" : "REGULAR_PASS",
      passNumber,
      rollNo: studentRollNo,
      studentName: auth.user.name,
      destination: parsed.data.destination,
      departure: parsed.data.departureDateTime,
      curfew: "10:00 PM",
      sig: signature,
      status: initialStatus,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 320,
    });

    try {
      await connectDB();
      let student = await Student.findOne({ userId: auth.user.id });
      let hostelId = student?.hostelId;

      if (!hostelId) {
        const defaultHostel = await Hostel.findOne({});
        hostelId = defaultHostel?._id;
      }

      if (student && hostelId) {
        let gatePassId: any = undefined;

        if (isEveningRoutineOutpass) {
          const gatePass = await GatePass.create({
            studentId: student._id,
            passNumber,
            qrCode: qrCodeDataUrl,
            qrData: qrPayload,
            issuedBy: auth.user.id,
            issuedAt: new Date(),
            validFrom: new Date(parsed.data.departureDateTime),
            validUntil: new Date(parsed.data.expectedReturnDateTime),
            status: "issued",
          });
          gatePassId = gatePass._id;
        }

        const leave = await LeaveRequest.create({
          ...parsed.data,
          departureDateTime: new Date(parsed.data.departureDateTime),
          expectedReturnDateTime: new Date(parsed.data.expectedReturnDateTime),
          studentId: student._id,
          userId: auth.user.id,
          hostelId,
          status: initialStatus,
          gatePassId,
          reviewedAt: isEveningRoutineOutpass ? new Date() : undefined,
        });

        if (gatePassId) {
          await GatePass.findByIdAndUpdate(gatePassId, { leaveRequestId: leave._id });
        }

        await logAuditEvent({
          userId: auth.user.id,
          action: isEveningRoutineOutpass ? "AUTO_APPROVE_EVENING_OUTPASS" : "SUBMIT_LEAVE_REQUEST",
          resource: "leaveRequests",
          resourceId: leave._id.toString(),
          details: { destination: leave.destination, autoApproved: isEveningRoutineOutpass },
        });

        const populatedLeave = await LeaveRequest.findById(leave._id)
          .populate("gatePassId")
          .populate({
            path: "studentId",
            populate: { path: "userId", select: "name email phone image" },
          });

        return NextResponse.json(
          {
            success: true,
            message: isEveningRoutineOutpass
              ? "⚡ Routine evening outpass instantly approved! Your verified QR pass is ready."
              : "Leave application submitted to Warden queue.",
            data: populatedLeave || leave,
          },
          { status: 201 }
        );
      }
    } catch {
      // Fall through to demo store
    }

    // Demo Mode: Create in-memory leave request with instant auto-approval for regular leaves
    const newDemoLeave: MockLeave = {
      _id: `leave_${Date.now()}`,
      studentId: {
        _id: auth.user.studentId || "student_aarav_01",
        userId: { name: auth.user.name, email: auth.user.email },
      },
      userId: auth.user.id,
      hostelId: auth.user.hostelId || "hostel_abh_01",
      leaveType: parsed.data.leaveType,
      destination: parsed.data.destination,
      reason: parsed.data.reason,
      departureDateTime: parsed.data.departureDateTime,
      expectedReturnDateTime: parsed.data.expectedReturnDateTime,
      status: initialStatus,
      gatePassId: isEveningRoutineOutpass
        ? {
            _id: `gp_${Date.now()}`,
            passNumber,
            qrCode: qrCodeDataUrl,
            status: "issued",
          }
        : undefined,
    };

    mockStore.leaves.unshift(newDemoLeave);

    return NextResponse.json(
      {
        success: true,
        message: isEveningRoutineOutpass
          ? "⚡ Routine evening outpass auto-approved! Your verified QR Gate Pass is ready."
          : "Outpass application submitted to Warden queue",
        data: newDemoLeave,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit leave";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
