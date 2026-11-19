// ─── Shared Enums & Types ─────────────────────────────────────────────────────

export type Role = "student" | "warden" | "admin" | "maintenance" | "accountant";

export type UserStatus = "active" | "inactive" | "suspended" | "pending_verification";

export type RoomType = "single" | "double" | "triple" | "quad" | "dormitory";

export type RoomStatus = "available" | "occupied" | "under_maintenance" | "reserved";

export type AllocationStatus = "active" | "vacated" | "transferred";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled" | "completed";

export type ComplaintStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "reopened";

export type ComplaintCategory =
  | "electrical"
  | "plumbing"
  | "internet"
  | "cleaning"
  | "furniture"
  | "security"
  | "other";

export type ComplaintPriority = "low" | "medium" | "high" | "urgent";

export type PaymentStatus = "pending" | "paid" | "overdue" | "partially_paid" | "waived";

export type NotificationType =
  | "leave_update"
  | "complaint_update"
  | "room_allocation"
  | "fee_reminder"
  | "notice"
  | "maintenance_assigned"
  | "visitor_approval"
  | "general";

export type InventoryCategory =
  | "furniture"
  | "electrical"
  | "plumbing"
  | "bedding"
  | "cleaning"
  | "sports"
  | "kitchen"
  | "other";

export type Gender = "male" | "female" | "other";

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── Session / Auth Types ─────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  image?: string;
  hostelId?: string; // for wardens
  studentId?: string; // for students
  staffId?: string; // for staff
}

// ─── Dashboard Stat Types ─────────────────────────────────────────────────────

export interface StatCard {
  title: string;
  value: string | number;
  description?: string;
  icon?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
}

