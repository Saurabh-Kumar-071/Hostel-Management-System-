import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IGatePass extends Document {
  _id: mongoose.Types.ObjectId;
  leaveRequestId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  passNumber: string;
  qrCode: string;
  qrData: string;
  issuedBy: mongoose.Types.ObjectId;
  issuedAt: Date;
  validFrom: Date;
  validUntil: Date;
  checkOutAt?: Date;
  checkInAt?: Date;
  status: "issued" | "checked_out" | "checked_in" | "expired" | "revoked";
  createdAt: Date;
  updatedAt: Date;
}

const GatePassSchema = new Schema<IGatePass>(
  {
    leaveRequestId: { type: Schema.Types.ObjectId, ref: "LeaveRequest", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    passNumber: { type: String, required: true, unique: true },
    qrCode: { type: String, required: true },
    qrData: { type: String, required: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    issuedAt: { type: Date, default: Date.now },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    checkOutAt: { type: Date },
    checkInAt: { type: Date },
    status: {
      type: String,
      enum: ["issued", "checked_out", "checked_in", "expired", "revoked"],
      default: "issued",
      index: true,
    },
  },
  { timestamps: true }
);

export const GatePass: Model<IGatePass> =
  mongoose.models.GatePass ?? mongoose.model<IGatePass>("GatePass", GatePassSchema);

