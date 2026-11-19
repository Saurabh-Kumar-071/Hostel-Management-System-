import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { Role } from "@/types";

export interface IStaff extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  role: Exclude<Role, "student">;
  department: string;
  designation: string;
  hostelId?: mongoose.Types.ObjectId; // for wardens
  assignedHostels?: mongoose.Types.ObjectId[]; // for maintenance
  phone: string;
  address?: string;
  joiningDate: Date;
  status: "active" | "inactive" | "on_leave";
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    employeeId: { type: String, required: true, unique: true, trim: true },
    role: {
      type: String,
      enum: ["warden", "admin", "maintenance", "accountant"],
      required: true,
      index: true,
    },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", index: true },
    assignedHostels: [{ type: Schema.Types.ObjectId, ref: "Hostel" }],
    phone: { type: String, required: true },
    address: { type: String },
    joiningDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Staff: Model<IStaff> =
  mongoose.models.Staff ?? mongoose.model<IStaff>("Staff", StaffSchema);

