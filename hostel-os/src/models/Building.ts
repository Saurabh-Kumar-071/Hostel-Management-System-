import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IBuilding extends Document {
  _id: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  totalFloors: number;
  description?: string;
  status: "active" | "inactive" | "under_maintenance";
  createdAt: Date;
  updatedAt: Date;
}

const BuildingSchema = new Schema<IBuilding>(
  {
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    totalFloors: { type: Number, required: true, min: 1 },
    description: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "under_maintenance"],
      default: "active",
    },
  },
  { timestamps: true }
);

BuildingSchema.index({ hostelId: 1, code: 1 }, { unique: true });

export const Building: Model<IBuilding> =
  mongoose.models.Building ?? mongoose.model<IBuilding>("Building", BuildingSchema);

