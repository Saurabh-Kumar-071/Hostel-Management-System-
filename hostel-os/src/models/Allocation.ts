import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { AllocationStatus } from "@/types";

export interface IAllocation extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  buildingId: mongoose.Types.ObjectId;
  floorId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  allocatedBy: mongoose.Types.ObjectId;
  allocationDate: Date;
  vacatingDate?: Date;
  expectedVacatingDate?: Date;
  status: AllocationStatus;
  academicYear: string;
  semester: number;
  remarks?: string;
  transferredFrom?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AllocationSchema = new Schema<IAllocation>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    buildingId: { type: Schema.Types.ObjectId, ref: "Building", required: true },
    floorId: { type: Schema.Types.ObjectId, ref: "Floor", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    allocatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    allocationDate: { type: Date, required: true, default: Date.now },
    vacatingDate: { type: Date },
    expectedVacatingDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "vacated", "transferred"],
      default: "active",
      index: true,
    },
    academicYear: { type: String, required: true },
    semester: { type: Number, required: true },
    remarks: { type: String },
    transferredFrom: { type: Schema.Types.ObjectId, ref: "Allocation" },
  },
  { timestamps: true }
);

// A student can only have one active allocation at a time
AllocationSchema.index(
  { studentId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  }
);

export const Allocation: Model<IAllocation> =
  mongoose.models.Allocation ?? mongoose.model<IAllocation>("Allocation", AllocationSchema);

