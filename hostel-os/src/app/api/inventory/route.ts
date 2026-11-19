import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Inventory } from "@/models";
import { requireAuth } from "@/lib/security/rbac";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, ["admin", "warden", "maintenance"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostelId") || auth.user.hostelId;
    const category = searchParams.get("category");

    const query: Record<string, unknown> = { isActive: true };
    if (hostelId) query.hostelId = hostelId;
    if (category) query.category = category;

    const items = await Inventory.find(query).populate("hostelId roomId").sort({ name: 1 });

    return NextResponse.json({ success: true, data: items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch inventory";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["admin"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    await connectDB();

    const item = await Inventory.create({
      ...body,
      availableQuantity: body.quantity,
      createdBy: auth.user.id,
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record inventory item";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

