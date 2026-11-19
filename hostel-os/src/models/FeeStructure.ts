import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IFeeStructure extends Document {
  _id: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  name: string;
  academicYear: string;
  semester: number;
  roomType: string;
  hostelFeePaise: number;
  messFeePaise: number;
  securityDepositPaise: number;
  otherCharges: Array<{
    name: string;
    amountPaise: number;
    isOptional: boolean;
  }>;
  totalFeePaise: number;
  dueDate: Date;
  lateFinePerDayPaise: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeeStructureSchema = new Schema<IFeeStructure>(
  {
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    name: { type: String, required: true },
    academicYear: { type: String, required: true },
    semester: { type: Number, required: true },
    roomType: { type: String, required: true },
    hostelFeePaise: { type: Number, required: true, min: 0 },
    messFeePaise: { type: Number, required: true, min: 0 },
    securityDepositPaise: { type: Number, default: 0 },
    otherCharges: [
      {
        name: { type: String, required: true },
        amountPaise: { type: Number, required: true },
        isOptional: { type: Boolean, default: false },
      },
    ],
    totalFeePaise: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    lateFinePerDayPaise: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const FeeStructure: Model<IFeeStructure> =
  mongoose.models.FeeStructure ??
  mongoose.model<IFeeStructure>("FeeStructure", FeeStructureSchema);

