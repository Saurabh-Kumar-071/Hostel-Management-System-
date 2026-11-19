import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { InventoryCategory } from "@/types";

export interface IInventory extends Document {
  _id: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  name: string;
  category: InventoryCategory;
  description?: string;
  quantity: number;
  availableQuantity: number;
  unit: string;
  purchaseDate?: Date;
  purchasePricePaise?: number;
  vendor?: string;
  warrantyExpiry?: Date;
  condition: "good" | "fair" | "poor" | "damaged" | "disposed";
  assetTag?: string;
  images: string[];
  maintenanceRecords: Array<{
    date: Date;
    description: string;
    cost: number;
    performedBy: string;
  }>;
  damageRecords: Array<{
    date: Date;
    description: string;
    reportedBy: mongoose.Types.ObjectId;
    images: string[];
  }>;
  minimumStock: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["furniture", "electrical", "plumbing", "bedding", "cleaning", "sports", "kitchen", "other"],
      required: true,
      index: true,
    },
    description: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    availableQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "piece" },
    purchaseDate: { type: Date },
    purchasePricePaise: { type: Number },
    vendor: { type: String },
    warrantyExpiry: { type: Date },
    condition: {
      type: String,
      enum: ["good", "fair", "poor", "damaged", "disposed"],
      default: "good",
    },
    assetTag: { type: String, sparse: true },
    images: [{ type: String }],
    maintenanceRecords: [
      {
        date: { type: Date, required: true },
        description: { type: String, required: true },
        cost: { type: Number, default: 0 },
        performedBy: { type: String },
      },
    ],
    damageRecords: [
      {
        date: { type: Date, required: true },
        description: { type: String, required: true },
        reportedBy: { type: Schema.Types.ObjectId, ref: "User" },
        images: [{ type: String }],
      },
    ],
    minimumStock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Inventory: Model<IInventory> =
  mongoose.models.Inventory ?? mongoose.model<IInventory>("Inventory", InventorySchema);

