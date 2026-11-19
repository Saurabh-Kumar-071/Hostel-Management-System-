import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ComplaintStatus } from "@/types";

export interface IComplaintHistory extends Document {
  _id: mongoose.Types.ObjectId;
  complaintId: mongoose.Types.ObjectId;
  changedBy: mongoose.Types.ObjectId;
  fromStatus: ComplaintStatus;
  toStatus: ComplaintStatus;
  note?: string;
  createdAt: Date;
}

const ComplaintHistorySchema = new Schema<IComplaintHistory>(
  {
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
      index: true,
    },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    note: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ComplaintHistory: Model<IComplaintHistory> =
  mongoose.models.ComplaintHistory ??
  mongoose.model<IComplaintHistory>("ComplaintHistory", ComplaintHistorySchema);

