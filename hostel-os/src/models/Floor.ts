import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IFloor extends Document {
  _id: mongoose.Types.ObjectId;
  buildingId: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  floorNumber: number;
  name: string;
  description?: string;
  status: "active" | "inactive" | "under_maintenance";
  createdAt: Date;
  updatedAt: Date;
}

const FloorSchema = new Schema<IFloor>(
  {
    buildingId: { type: Schema.Types.ObjectId, ref: "Building", required: true, index: true },
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    floorNumber: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "under_maintenance"],
      default: "active",
    },
  },
  { timestamps: true }
);

FloorSchema.index({ buildingId: 1, floorNumber: 1 }, { unique: true });

export const Floor: Model<IFloor> =
  mongoose.models.Floor ?? mongoose.model<IFloor>("Floor", FloorSchema);

