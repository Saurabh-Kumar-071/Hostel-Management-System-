import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IKnowledgeDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  category: "policy" | "rule" | "procedure" | "faq" | "guide";
  hostelId?: mongoose.Types.ObjectId;
  tags: string[];
  embedding?: number[];
  isActive: boolean;
  uploadedBy: mongoose.Types.ObjectId;
  sourceFile?: string;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeDocumentSchema = new Schema<IKnowledgeDocument>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ["policy", "rule", "procedure", "faq", "guide"],
      required: true,
      index: true,
    },
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", index: true },
    tags: [{ type: String }],
    embedding: [{ type: Number }],
    isActive: { type: Boolean, default: true, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sourceFile: { type: String },
  },
  { timestamps: true }
);

KnowledgeDocumentSchema.index({ isActive: 1, category: 1 });

export const KnowledgeDocument: Model<IKnowledgeDocument> =
  mongoose.models.KnowledgeDocument ??
  mongoose.model<IKnowledgeDocument>("KnowledgeDocument", KnowledgeDocumentSchema);

