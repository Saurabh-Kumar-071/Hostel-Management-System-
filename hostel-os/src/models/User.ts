import mongoose, { Schema, type Document, type Model } from "mongoose";
import bcrypt from "bcryptjs";
import type { Role, UserStatus } from "@/types";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: Role;
  status: UserStatus;
  image?: string;
  phone?: string;
  emailVerified: boolean;
  emailVerificationOtp?: string;
  emailVerificationOtpExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["student", "warden", "admin", "maintenance", "accountant"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "pending_verification"],
      default: "pending_verification",
      index: true,
    },
    image: { type: String },
    phone: { type: String, trim: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationOtp: { type: String, select: false },
    emailVerificationOtpExpiry: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    lastLoginAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Never leak password in JSON
UserSchema.set("toJSON", {
  transform(_doc, ret) {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.password;
    delete obj.emailVerificationOtp;
    delete obj.emailVerificationOtpExpiry;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpiry;
    return obj;
  },
});

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

