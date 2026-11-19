import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { Gender } from "@/types";

export interface IHostel extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  type: "boys" | "girls" | "mixed";
  address: string;
  description?: string;
  wardenId?: mongoose.Types.ObjectId;
  totalCapacity: number;
  image?: string;
  facilities: string[];
  rules: string[];
  contactPhone: string;
  contactEmail?: string;
  status: "active" | "inactive" | "under_maintenance";
  createdAt: Date;
  updatedAt: Date;
}

const HostelSchema = new Schema<IHostel>(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    type: { type: String, enum: ["boys", "girls", "mixed"], required: true },
    address: { type: String, required: true },
    description: { type: String },
    wardenId: { type: Schema.Types.ObjectId, ref: "Staff", index: true },
    totalCapacity: { type: Number, required: true, min: 1 },
    image: { type: String },
    facilities: [{ type: String }],
    rules: [{ type: String }],
    contactPhone: { type: String, required: true },
    contactEmail: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "under_maintenance"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

export const Hostel: Model<IHostel> =
  mongoose.models.Hostel ?? mongoose.model<IHostel>("Hostel", HostelSchema);

