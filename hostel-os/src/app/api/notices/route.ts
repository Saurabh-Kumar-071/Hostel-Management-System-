import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Notice } from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { NoticeSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/security/audit";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const query: Record<string, unknown> = { isPublished: true };

    if (auth.user.role === "student" && auth.user.hostelId) {
      query.$or = [
        { targetAudience: { $in: ["all", "students"] } },
        { targetHostelIds: auth.user.hostelId },
      ];
    }

    const notices = await Notice.find(query)
      .populate("createdBy", "name role")
      .sort({ isPinned: -1, publishedAt: -1 });

    return NextResponse.json({ success: true, data: notices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch notices";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["admin", "warden"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const parsed = NoticeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    await connectDB();
    const notice = await Notice.create({
      ...parsed.data,
      publishedAt: new Date(),
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      createdBy: auth.user.id,
      isPublished: true,
    });

    await logAuditEvent({
      userId: auth.user.id,
      action: "PUBLISH_NOTICE",
      resource: "notices",
      resourceId: notice._id.toString(),
      details: { title: notice.title, priority: notice.priority },
    });

    return NextResponse.json({ success: true, data: notice }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to publish notice";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

