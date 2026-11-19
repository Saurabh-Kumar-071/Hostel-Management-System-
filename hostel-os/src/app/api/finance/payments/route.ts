import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Payment, Invoice, Notification } from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { RecordPaymentSchema } from "@/lib/validation/schemas";
import { generateTicketId } from "@/lib/utils";
import { logAuditEvent } from "@/lib/security/audit";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const query: Record<string, unknown> = {};
    if (auth.user.role === "student") {
      query.studentId = auth.user.studentId;
    }

    const payments = await Payment.find(query)
      .populate("invoiceId")
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email phone" },
      })
      .sort({ paymentDate: -1 });

    return NextResponse.json({ success: true, data: payments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch payments";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["accountant", "admin", "student"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const parsed = RecordPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    await connectDB();
    const { invoiceId, amountPaise, paymentMethod, transactionId, notes } = parsed.data;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { success: false, error: "This invoice is already fully paid" },
        { status: 400 }
      );
    }

    if (amountPaise > invoice.balancePaise) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment amount (${amountPaise / 100}) exceeds remaining balance (${invoice.balancePaise / 100})`,
        },
        { status: 400 }
      );
    }

    const paymentReference = generateTicketId("PAY");

    // Verified immediately if recorded by accountant/admin; pending if self-recorded by student
    const isVerified = ["accountant", "admin"].includes(auth.user.role);

    const payment = await Payment.create({
      paymentReference,
      invoiceId: invoice._id,
      studentId: invoice.studentId,
      amountPaise,
      paymentMethod,
      transactionId: transactionId || `TXN-${Date.now()}`,
      paymentDate: new Date(),
      status: isVerified ? "completed" : "pending",
      verifiedBy: isVerified ? auth.user.id : undefined,
      verifiedAt: isVerified ? new Date() : undefined,
      notes,
    });

    if (isVerified) {
      invoice.paidPaise += amountPaise;
      invoice.balancePaise -= amountPaise;
      if (invoice.balancePaise <= 0) {
        invoice.status = "paid";
      } else {
        invoice.status = "partially_paid";
      }
      await invoice.save();

      // Trigger notification
      await Notification.create({
        userId: auth.user.id,
        type: "fee_reminder",
        title: "Payment Receipt Confirmed",
        message: `Payment of ₹${(amountPaise / 100).toFixed(2)} received for Invoice ${invoice.invoiceNumber}. Ref: ${paymentReference}`,
        referenceId: payment._id,
        referenceModel: "Payment",
        actionUrl: "/student/fees",
      });
    }

    await logAuditEvent({
      userId: auth.user.id,
      action: "PROCESS_PAYMENT",
      resource: "payments",
      resourceId: payment._id.toString(),
      details: { paymentReference, amountPaise, invoiceNumber: invoice.invoiceNumber },
    });

    return NextResponse.json(
      {
        success: true,
        message: isVerified ? "Payment verified and receipt generated" : "Payment submitted for accountant verification",
        data: payment,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record payment";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

