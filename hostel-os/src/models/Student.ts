import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { Gender } from "@/types";

export interface IStudent extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  enrollmentNumber: string;
  department: string;
  semester: number;
  year: number;
  course: string;
  gender: Gender;
  dateOfBirth: Date;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  guardian: {
    name: string;
    relation: string;
    phone: string;
    email?: string;
  };
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  documents: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
  hostelId?: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  allocationId?: mongoose.Types.ObjectId;
  joiningDate?: Date;
  status: "active" | "inactive" | "graduated" | "transferred";
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    enrollmentNumber: { type: String, required: true, unique: true, trim: true, index: true },
    department: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 10 },
    year: { type: Number, required: true },
    course: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    dateOfBirth: { type: Date, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    guardian: {
      name: { type: String, required: true },
      relation: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
    },
    emergencyContact: {
      name: { type: String, required: true },
      relation: { type: String, required: true },
      phone: { type: String, required: true },
    },
    documents: [
      {
        type: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", index: true },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", index: true },
    allocationId: { type: Schema.Types.ObjectId, ref: "Allocation" },
    joiningDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "inactive", "graduated", "transferred"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

export const Student: Model<IStudent> =
  mongoose.models.Student ?? mongoose.model<IStudent>("Student", StudentSchema);

