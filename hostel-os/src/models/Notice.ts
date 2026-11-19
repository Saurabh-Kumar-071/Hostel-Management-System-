import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface INotice extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: "general" | "emergency" | "maintenance" | "event" | "fee" | "academic";
  priority: "low" | "normal" | "high" | "urgent";
  targetAudience: "all" | "students" | "staff" | "hostel_specific";
  targetHostelIds: mongoose.Types.ObjectId[];
  attachments: string[];
  publishedAt: Date;
  expiresAt?: Date;
  isPublished: boolean;
  isPinned: boolean;
  createdBy: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["general", "emergency", "maintenance", "event", "fee", "academic"],
      default: "general",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    targetAudience: {
      type: String,
      enum: ["all", "students", "staff", "hostel_specific"],
      default: "all",
    },
    targetHostelIds: [{ type: Schema.Types.ObjectId, ref: "Hostel" }],
    attachments: [{ type: String }],
    publishedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    isPublished: { type: Boolean, default: true, index: true },
    isPinned: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

NoticeSchema.index({ isPublished: 1, publishedAt: -1 });
NoticeSchema.index({ expiresAt: 1 }, { sparse: true });

export const Notice: Model<INotice> =
  mongoose.models.Notice ?? mongoose.model<INotice>("Notice", NoticeSchema);

