import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IFeedback extends Document {
  _id: mongoose.Types.ObjectId;
  type: "mess" | "hostel" | "maintenance" | "general";
  studentId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  referenceId?: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  isAnonymous: boolean;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    type: {
      type: String,
      enum: ["mess", "hostel", "maintenance", "general"],
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    referenceId: { type: Schema.Types.ObjectId },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, minlength: 5 },
    isAnonymous: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Feedback: Model<IFeedback> =
  mongoose.models.Feedback ?? mongoose.model<IFeedback>("Feedback", FeedbackSchema);

