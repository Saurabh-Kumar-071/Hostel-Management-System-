import { z } from "zod";

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  role: z.enum(["student", "warden", "admin", "maintenance", "accountant"]),
  phone: z.string().optional(),
  // Student specific onboarding fields
  enrollmentNumber: z.string().optional(),
  department: z.string().optional(),
  semester: z.number().min(1).max(10).optional(),
  year: z.number().optional(),
  course: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const OtpVerificationSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase")
    .regex(/[0-9]/, "Password must contain number"),
});

// ─── Hostel & Room Schemas ──────────────────────────────────────────────────

export const HostelSchema = z.object({
  name: z.string().min(3, "Hostel name is required").trim(),
  code: z.string().min(2).max(10).toUpperCase().trim(),
  type: z.enum(["boys", "girls", "mixed"]),
  address: z.string().min(5, "Address is required"),
  description: z.string().optional(),
  wardenId: z.string().optional(),
  totalCapacity: z.number().min(1, "Capacity must be at least 1"),
  contactPhone: z.string().min(10, "Valid phone number required"),
  contactEmail: z.string().email().optional(),
  facilities: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
});

export const BuildingSchema = z.object({
  hostelId: z.string().min(1, "Hostel ID is required"),
  name: z.string().min(2).trim(),
  code: z.string().min(1).trim(),
  totalFloors: z.number().min(1),
  description: z.string().optional(),
});

export const FloorSchema = z.object({
  buildingId: z.string().min(1, "Building ID is required"),
  hostelId: z.string().min(1, "Hostel ID is required"),
  floorNumber: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const RoomSchema = z.object({
  hostelId: z.string().min(1, "Hostel ID is required"),
  buildingId: z.string().min(1, "Building ID is required"),
  floorId: z.string().min(1, "Floor ID is required"),
  roomNumber: z.string().min(1).trim(),
  type: z.enum(["single", "double", "triple", "quad", "dormitory"]),
  capacity: z.number().min(1),
  monthlyRentPaise: z.number().min(0),
  amenities: z.array(z.string()).default([]),
  description: z.string().optional(),
});

export const RoomAllocationSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  roomId: z.string().min(1, "Room is required"),
  academicYear: z.string().min(4),
  semester: z.number().min(1).max(10),
  remarks: z.string().optional(),
});

// ─── Leave Application Schema ───────────────────────────────────────────────

export const LeaveRequestSchema = z.object({
  leaveType: z.enum(["regular", "emergency", "medical", "vacation"]),
  reason: z.string().min(10, "Please provide at least 10 characters explaining your leave"),
  destination: z.string().min(3, "Destination is required"),
  departureDateTime: z.string().datetime(),
  expectedReturnDateTime: z.string().datetime(),
  isEmergency: z.boolean().default(false),
  attachments: z.array(z.string()).default([]),
});

// ─── Complaint Ticket Schema ────────────────────────────────────────────────

export const ComplaintSchema = z.object({
  category: z.enum([
    "electrical",
    "plumbing",
    "internet",
    "cleaning",
    "furniture",
    "security",
    "other",
  ]),
  title: z.string().min(5, "Title must be at least 5 characters").trim(),
  description: z.string().min(20, "Detailed description must be at least 20 characters").trim(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  attachments: z.array(z.string()).default([]),
});

export const ComplaintStatusUpdateSchema = z.object({
  status: z.enum(["open", "assigned", "in_progress", "resolved", "closed", "reopened"]),
  assignedTo: z.string().optional(),
  note: z.string().optional(),
  resolutionDescription: z.string().optional(),
  resolutionImages: z.array(z.string()).optional(),
});

// ─── Finance Schemas ────────────────────────────────────────────────────────

export const FeeStructureSchema = z.object({
  hostelId: z.string().min(1),
  name: z.string().min(3),
  academicYear: z.string().min(4),
  semester: z.number().min(1).max(10),
  roomType: z.string().min(1),
  hostelFeePaise: z.number().min(0),
  messFeePaise: z.number().min(0),
  securityDepositPaise: z.number().min(0).default(0),
  otherCharges: z
    .array(
      z.object({
        name: z.string(),
        amountPaise: z.number(),
        isOptional: z.boolean().default(false),
      })
    )
    .default([]),
  dueDate: z.string().datetime(),
  lateFinePerDayPaise: z.number().default(0),
});

export const RecordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amountPaise: z.number().min(1),
  paymentMethod: z.enum(["cash", "upi", "bank_transfer", "card", "dd", "online"]),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Notice Schema ──────────────────────────────────────────────────────────

export const NoticeSchema = z.object({
  title: z.string().min(3).trim(),
  content: z.string().min(10),
  type: z.enum(["general", "emergency", "maintenance", "event", "fee", "academic"]).default("general"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  targetAudience: z.enum(["all", "students", "staff", "hostel_specific"]).default("all"),
  targetHostelIds: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
  isPinned: z.boolean().default(false),
});

// ─── Visitor Schema ─────────────────────────────────────────────────────────

export const VisitorSchema = z.object({
  studentId: z.string().min(1),
  visitorName: z.string().min(2),
  relation: z.string().min(2),
  phone: z.string().min(10),
  idProofType: z.string().min(2),
  idProofNumber: z.string().min(4),
  purpose: z.string().min(5),
  numberOfVisitors: z.number().min(1).default(1),
  expectedCheckIn: z.string().datetime(),
  expectedCheckOut: z.string().datetime(),
});

