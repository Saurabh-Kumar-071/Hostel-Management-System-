import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Notification } from "@/models";
import { requireAuth } from "@/lib/security/rbac";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const notifications = await Notification.find({ userId: auth.user.id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId: auth.user.id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch notifications";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const { notificationId } = body;

    if (notificationId) {
      await Notification.updateOne(
        { _id: notificationId, userId: auth.user.id },
        { isRead: true, readAt: new Date() }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { userId: auth.user.id, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    }

    return NextResponse.json({ success: true, message: "Notifications updated" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update notifications";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

