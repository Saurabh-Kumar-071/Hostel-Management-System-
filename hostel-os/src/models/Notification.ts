import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { NotificationType } from "@/types";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: mongoose.Types.ObjectId;
  referenceModel?: string;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "leave_update",
        "complaint_update",
        "room_allocation",
        "fee_reminder",
        "notice",
        "maintenance_assigned",
        "visitor_approval",
        "general",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    referenceModel: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    actionUrl: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);

