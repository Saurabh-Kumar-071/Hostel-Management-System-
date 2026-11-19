import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  paymentReference: string;
  invoiceId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  amountPaise: number;
  paymentMethod: "cash" | "upi" | "bank_transfer" | "card" | "dd" | "online";
  transactionId?: string;
  paymentDate: Date;
  status: "pending" | "completed" | "failed" | "refunded";
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentReference: { type: String, required: true, unique: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    amountPaise: { type: Number, required: true, min: 1 },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "card", "dd", "online"],
      required: true,
    },
    transactionId: { type: String, sparse: true },
    paymentDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    receiptUrl: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>("Payment", PaymentSchema);

