import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IVisitor extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  visitorName: string;
  relation: string;
  phone: string;
  address?: string;
  idProofType: string;
  idProofNumber: string;
  idProofImage?: string;
  purpose: string;
  numberOfVisitors: number;
  expectedCheckIn: Date;
  expectedCheckOut: Date;
  actualCheckIn?: Date;
  actualCheckOut?: Date;
  status: "pending" | "approved" | "rejected" | "checked_in" | "checked_out" | "overstayed";
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  hostSignature?: string;
  securityNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitorSchema = new Schema<IVisitor>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    visitorName: { type: String, required: true, trim: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    idProofType: { type: String, required: true },
    idProofNumber: { type: String, required: true },
    idProofImage: { type: String },
    purpose: { type: String, required: true },
    numberOfVisitors: { type: Number, default: 1, min: 1 },
    expectedCheckIn: { type: Date, required: true },
    expectedCheckOut: { type: Date, required: true },
    actualCheckIn: { type: Date },
    actualCheckOut: { type: Date },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "checked_in", "checked_out", "overstayed"],
      default: "pending",
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    hostSignature: { type: String },
    securityNotes: { type: String },
  },
  { timestamps: true }
);

export const Visitor: Model<IVisitor> =
  mongoose.models.Visitor ?? mongoose.model<IVisitor>("Visitor", VisitorSchema);

