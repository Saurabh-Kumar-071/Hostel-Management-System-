import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/security/rbac";
import { connectDB } from "@/lib/db/connect";
import { Student } from "@/models";
import QRCode from "qrcode";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, ["student", "warden", "admin"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const user = auth.user;

    // Student identity details
    let studentDetails = {
      name: user.name,
      enrollmentNumber: "ENR-2024-8842",
      department: "Computer Science and Engineering",
      hostelName: "Aryabhatta Hall of Residence",
      roomNumber: "101",
      curfewTime: "10:00 PM",
      emergencyContact: "+91 98220 02200",
      academicYear: "2024-2026",
    };

    try {
      await connectDB();
      const student = await Student.findOne({ userId: user.id }).populate("hostelId roomId");
      if (student) {
        studentDetails = {
          name: user.name,
          enrollmentNumber: student.enrollmentNumber || studentDetails.enrollmentNumber,
          department: student.department || studentDetails.department,
          hostelName: (student.hostelId as unknown as { name: string })?.name || studentDetails.hostelName,
          roomNumber: (student.roomId as unknown as { roomNumber: string })?.roomNumber || studentDetails.roomNumber,
          curfewTime: "10:00 PM",
          emergencyContact: student.guardian?.phone || studentDetails.emergencyContact,
          academicYear: `${student.year || 2}nd Year (${student.course || "B.Tech"})`,
        };
      }
    } catch {
      // Use standard resident details if DB is offline
    }

    // Generate cryptographic security signature
    const secretKey = process.env.AUTH_SECRET || "hostelos-permanent-security-key-2026";
    const dataString = `${studentDetails.enrollmentNumber}|${studentDetails.name}|${studentDetails.hostelName}|${studentDetails.roomNumber}`;
    const securitySignature = crypto
      .createHmac("sha256", secretKey)
      .update(dataString)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();

    const qrPayload = JSON.stringify({
      passType: "PERMANENT_HOSTEL_OUTPASS",
      rollNo: studentDetails.enrollmentNumber,
      name: studentDetails.name,
      hostel: studentDetails.hostelName,
      room: studentDetails.roomNumber,
      dept: studentDetails.department,
      curfew: studentDetails.curfewTime,
      sig: securitySignature,
      issuedBy: "Hostel Administration & Security Division",
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 320,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        studentDetails,
        securitySignature,
        qrCode: qrCodeDataUrl,
        qrPayload,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate permanent QR pass";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

