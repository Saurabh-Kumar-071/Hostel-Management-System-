import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Hostel } from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { HostelSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/security/audit";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    // Wardens only see their assigned hostel unless admin
    if (auth.user.role === "warden" && auth.user.hostelId) {
      query._id = auth.user.hostelId;
    }

    const hostels = await Hostel.find(query).populate("wardenId").sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: hostels,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch hostels";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["admin"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const parsed = HostelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    await connectDB();
    const existing = await Hostel.findOne({ code: parsed.data.code });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Hostel code '${parsed.data.code}' is already registered` },
        { status: 409 }
      );
    }

    const hostel = await Hostel.create(parsed.data);

    await logAuditEvent({
      userId: auth.user.id,
      action: "CREATE_HOSTEL",
      resource: "hostels",
      resourceId: hostel._id.toString(),
      details: { name: hostel.name, code: hostel.code },
    });

    return NextResponse.json({ success: true, data: hostel }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create hostel";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

