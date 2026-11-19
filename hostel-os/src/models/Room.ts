import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { RoomType, RoomStatus } from "@/types";

export interface IRoom extends Document {
  _id: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  buildingId: mongoose.Types.ObjectId;
  floorId: mongoose.Types.ObjectId;
  roomNumber: string;
  type: RoomType;
  capacity: number;
  currentOccupancy: number;
  status: RoomStatus;
  amenities: string[];
  monthlyRentPaise: number; // stored in paise (1/100 rupee)
  description?: string;
  images: string[];
  lastMaintenanceDate?: Date;
  maintenanceNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    buildingId: { type: Schema.Types.ObjectId, ref: "Building", required: true },
    floorId: { type: Schema.Types.ObjectId, ref: "Floor", required: true, index: true },
    roomNumber: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["single", "double", "triple", "quad", "dormitory"],
      required: true,
    },
    capacity: { type: Number, required: true, min: 1 },
    currentOccupancy: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["available", "occupied", "under_maintenance", "reserved"],
      default: "available",
      index: true,
    },
    amenities: [{ type: String }],
    monthlyRentPaise: { type: Number, required: true, min: 0 },
    description: { type: String },
    images: [{ type: String }],
    lastMaintenanceDate: { type: Date },
    maintenanceNotes: { type: String },
  },
  { timestamps: true }
);

RoomSchema.index({ hostelId: 1, roomNumber: 1 }, { unique: true });
RoomSchema.index({ hostelId: 1, status: 1 });
RoomSchema.index({ floorId: 1, status: 1 });

// Virtual: is room available for allocation
RoomSchema.virtual("isAvailable").get(function () {
  return this.status === "available" && this.currentOccupancy < this.capacity;
});

export const Room: Model<IRoom> =
  mongoose.models.Room ?? mongoose.model<IRoom>("Room", RoomSchema);

