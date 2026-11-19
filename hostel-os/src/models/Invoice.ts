import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { PaymentStatus } from "@/types";

export interface IInvoice extends Document {
  _id: mongoose.Types.ObjectId;
  invoiceNumber: string;
  studentId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  feeStructureId: mongoose.Types.ObjectId;
  academicYear: string;
  semester: number;
  lineItems: Array<{
    description: string;
    amountPaise: number;
  }>;
  subtotalPaise: number;
  discountPaise: number;
  lateFinesPaise: number;
  totalPaise: number;
  paidPaise: number;
  balancePaise: number;
  dueDate: Date;
  status: PaymentStatus;
  generatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    feeStructureId: { type: Schema.Types.ObjectId, ref: "FeeStructure", required: true },
    academicYear: { type: String, required: true },
    semester: { type: Number, required: true },
    lineItems: [
      {
        description: { type: String, required: true },
        amountPaise: { type: Number, required: true },
      },
    ],
    subtotalPaise: { type: Number, required: true },
    discountPaise: { type: Number, default: 0 },
    lateFinesPaise: { type: Number, default: 0 },
    totalPaise: { type: Number, required: true },
    paidPaise: { type: Number, default: 0 },
    balancePaise: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "partially_paid", "waived"],
      default: "pending",
      index: true,
    },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice ?? mongoose.model<IInvoice>("Invoice", InvoiceSchema);

