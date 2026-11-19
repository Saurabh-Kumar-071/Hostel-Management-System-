import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { ComplaintStatus, ComplaintCategory, ComplaintPriority } from "@/types";

export interface IComplaint extends Document {
  _id: mongoose.Types.ObjectId;
  ticketId: string;
  studentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  category: ComplaintCategory;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  attachments: string[];
  assignedTo?: mongoose.Types.ObjectId;
  assignedAt?: Date;
  resolvedAt?: Date;
  resolutionDescription?: string;
  resolutionImages: string[];
  closedAt?: Date;
  studentFeedback?: {
    rating: number;
    comment: string;
    submittedAt: Date;
  };
  aiClassification?: {
    suggestedCategory: string;
    suggestedPriority: string;
    summary: string;
    department: string;
    isUrgent: boolean;
    confidence: number;
    processedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    category: {
      type: String,
      enum: ["electrical", "plumbing", "internet", "cleaning", "furniture", "security", "other"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, minlength: 20 },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "assigned", "in_progress", "resolved", "closed", "reopened"],
      default: "open",
      index: true,
    },
    attachments: [{ type: String }],
    assignedTo: { type: Schema.Types.ObjectId, ref: "Staff" },
    assignedAt: { type: Date },
    resolvedAt: { type: Date },
    resolutionDescription: { type: String },
    resolutionImages: [{ type: String }],
    closedAt: { type: Date },
    studentFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      submittedAt: { type: Date },
    },
    aiClassification: {
      suggestedCategory: { type: String },
      suggestedPriority: { type: String },
      summary: { type: String },
      department: { type: String },
      isUrgent: { type: Boolean },
      confidence: { type: Number },
      processedAt: { type: Date },
    },
  },
  { timestamps: true }
);

ComplaintSchema.index({ hostelId: 1, status: 1 });
ComplaintSchema.index({ assignedTo: 1, status: 1 });
ComplaintSchema.index({ createdAt: -1 });

export const Complaint: Model<IComplaint> =
  mongoose.models.Complaint ?? mongoose.model<IComplaint>("Complaint", ComplaintSchema);

