import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Invoice, FeeStructure, Student } from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { generateTicketId } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    if (auth.user.role === "student") {
      query.studentId = auth.user.studentId;
    }

    const invoices = await Invoice.find(query)
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email phone image" },
      })
      .populate("hostelId feeStructureId")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch invoices";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["accountant", "admin"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const { studentId, feeStructureId } = body;

    if (!studentId || !feeStructureId) {
      return NextResponse.json(
        { success: false, error: "studentId and feeStructureId are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const student = await Student.findById(studentId);
    if (!student || !student.hostelId) {
      return NextResponse.json(
        { success: false, error: "Student must have an assigned hostel" },
        { status: 400 }
      );
    }

    const feeStruct = await FeeStructure.findById(feeStructureId);
    if (!feeStruct) {
      return NextResponse.json({ success: false, error: "Fee structure not found" }, { status: 404 });
    }

    const lineItems = [
      { description: "Hostel Lodging Fee", amountPaise: feeStruct.hostelFeePaise },
      { description: "Dining & Mess Fee", amountPaise: feeStruct.messFeePaise },
    ];
    if (feeStruct.securityDepositPaise > 0) {
      lineItems.push({
        description: "Refundable Security Deposit",
        amountPaise: feeStruct.securityDepositPaise,
      });
    }
    for (const item of feeStruct.otherCharges) {
      lineItems.push({ description: item.name, amountPaise: item.amountPaise });
    }

    const invoiceNumber = generateTicketId("INV");

    const invoice = await Invoice.create({
      invoiceNumber,
      studentId: student._id,
      hostelId: student.hostelId,
      feeStructureId: feeStruct._id,
      academicYear: feeStruct.academicYear,
      semester: feeStruct.semester,
      lineItems,
      subtotalPaise: feeStruct.totalFeePaise,
      discountPaise: 0,
      lateFinesPaise: 0,
      totalPaise: feeStruct.totalFeePaise,
      paidPaise: 0,
      balancePaise: feeStruct.totalFeePaise,
      dueDate: feeStruct.dueDate,
      status: "pending",
      generatedBy: auth.user.id,
    });

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create invoice";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

