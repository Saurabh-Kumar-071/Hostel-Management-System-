import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { FeeStructure } from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { FeeStructureSchema } from "@/lib/validation/schemas";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, ["accountant", "admin", "warden", "student"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostelId");

    const query: Record<string, unknown> = { isActive: true };
    if (hostelId) query.hostelId = hostelId;

    const structures = await FeeStructure.find(query).populate("hostelId").sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: structures });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch fee structures";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["accountant", "admin"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const parsed = FeeStructureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    await connectDB();
    const totalOtherCharges = parsed.data.otherCharges.reduce((acc, c) => acc + c.amountPaise, 0);
    const totalFeePaise =
      parsed.data.hostelFeePaise +
      parsed.data.messFeePaise +
      parsed.data.securityDepositPaise +
      totalOtherCharges;

    const structure = await FeeStructure.create({
      ...parsed.data,
      totalFeePaise,
      dueDate: new Date(parsed.data.dueDate),
      createdBy: auth.user.id,
    });

    return NextResponse.json({ success: true, data: structure }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create fee structure";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

