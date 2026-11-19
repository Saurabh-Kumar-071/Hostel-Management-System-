import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { LeaveStatus } from "@/types";

export interface ILeaveRequest extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  leaveType: "regular" | "emergency" | "medical" | "vacation";
  reason: string;
  destination: string;
  departureDateTime: Date;
  expectedReturnDateTime: Date;
  actualReturnDateTime?: Date;
  status: LeaveStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  gatePassId?: mongoose.Types.ObjectId;
  parentContactedAt?: Date;
  isEmergency: boolean;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    leaveType: {
      type: String,
      enum: ["regular", "emergency", "medical", "vacation"],
      required: true,
    },
    reason: { type: String, required: true, minlength: 10 },
    destination: { type: String, required: true },
    departureDateTime: { type: Date, required: true },
    expectedReturnDateTime: { type: Date, required: true },
    actualReturnDateTime: { type: Date },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    gatePassId: { type: Schema.Types.ObjectId, ref: "GatePass" },
    parentContactedAt: { type: Date },
    isEmergency: { type: Boolean, default: false },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

LeaveRequestSchema.index({ studentId: 1, status: 1 });
LeaveRequestSchema.index({ hostelId: 1, status: 1 });
LeaveRequestSchema.index({ departureDateTime: 1 });

export const LeaveRequest: Model<ILeaveRequest> =
  mongoose.models.LeaveRequest ??
  mongoose.model<ILeaveRequest>("LeaveRequest", LeaveRequestSchema);

