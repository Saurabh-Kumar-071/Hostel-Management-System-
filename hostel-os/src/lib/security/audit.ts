import { connectDB } from "@/lib/db/connect";
import { AuditLog } from "@/models/AuditLog";
import { logger } from "@/lib/utils/logger";
import mongoose from "mongoose";

export interface LogAuditOptions {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status?: "success" | "failure";
}

export async function logAuditEvent(options: LogAuditOptions): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create({
      userId: new mongoose.Types.ObjectId(options.userId),
      action: options.action,
      resource: options.resource,
      resourceId: options.resourceId ? new mongoose.Types.ObjectId(options.resourceId) : undefined,
      details: options.details ?? {},
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      status: options.status ?? "success",
    });
  } catch (error) {
    logger.warn({ error, action: options.action }, "Failed to write audit log entry");
  }
}

