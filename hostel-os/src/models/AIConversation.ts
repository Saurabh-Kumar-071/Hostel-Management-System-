import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMessage {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

export interface IAIConversation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  context: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AIConversationSchema = new Schema<IAIConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New Conversation" },
    messages: [MessageSchema],
    context: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AIConversation: Model<IAIConversation> =
  mongoose.models.AIConversation ??
  mongoose.model<IAIConversation>("AIConversation", AIConversationSchema);

