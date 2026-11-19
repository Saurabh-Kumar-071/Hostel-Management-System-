import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMessMenu extends Document {
  _id: mongoose.Types.ObjectId;
  hostelId: mongoose.Types.ObjectId;
  date: Date;
  dayOfWeek: string;
  meals: {
    breakfast: {
      items: string[];
      timing: string;
    };
    lunch: {
      items: string[];
      timing: string;
    };
    snacks: {
      items: string[];
      timing: string;
    };
    dinner: {
      items: string[];
      timing: string;
    };
  };
  specialNote?: string;
  isHoliday: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MessMenuSchema = new Schema<IMessMenu>(
  {
    hostelId: { type: Schema.Types.ObjectId, ref: "Hostel", required: true, index: true },
    date: { type: Date, required: true, index: true },
    dayOfWeek: { type: String, required: true },
    meals: {
      breakfast: {
        items: [{ type: String }],
        timing: { type: String, default: "7:30 AM - 9:00 AM" },
      },
      lunch: {
        items: [{ type: String }],
        timing: { type: String, default: "12:30 PM - 2:30 PM" },
      },
      snacks: {
        items: [{ type: String }],
        timing: { type: String, default: "5:00 PM - 6:00 PM" },
      },
      dinner: {
        items: [{ type: String }],
        timing: { type: String, default: "7:30 PM - 9:30 PM" },
      },
    },
    specialNote: { type: String },
    isHoliday: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

MessMenuSchema.index({ hostelId: 1, date: 1 }, { unique: true });

export const MessMenu: Model<IMessMenu> =
  mongoose.models.MessMenu ?? mongoose.model<IMessMenu>("MessMenu", MessMenuSchema);

