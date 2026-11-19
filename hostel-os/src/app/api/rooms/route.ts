import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Room, Allocation } from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { RoomSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/security/audit";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostelId");
    const floorId = searchParams.get("floorId");
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (hostelId) query.hostelId = hostelId;
    if (floorId) query.floorId = floorId;
    if (status) query.status = status;

    const rooms = await Room.find(query)
      .populate("hostelId buildingId floorId")
      .sort({ roomNumber: 1 })
      .lean();

    // Dynamically calculate occupancy from active allocations
    const roomIds = rooms.map((r) => r._id);
    const activeAllocations = await Allocation.aggregate([
      { $match: { roomId: { $in: roomIds }, status: "active" } },
      { $group: { _id: "$roomId", count: { $sum: 1 } } },
    ]);

    const occupancyMap = new Map<string, number>();
    for (const item of activeAllocations) {
      occupancyMap.set(item._id.toString(), item.count);
    }

    const roomsWithDynamicOccupancy = rooms.map((room) => {
      const liveOccupancy = occupancyMap.get(room._id.toString()) || 0;
      const isAvailable = room.status === "available" && liveOccupancy < room.capacity;
      return {
        ...room,
        currentOccupancy: liveOccupancy,
        availableSlots: Math.max(0, room.capacity - liveOccupancy),
        isAvailable,
      };
    });

    return NextResponse.json({
      success: true,
      data: roomsWithDynamicOccupancy,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch rooms";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["admin"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const parsed = RoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    await connectDB();
    const existing = await Room.findOne({
      hostelId: parsed.data.hostelId,
      roomNumber: parsed.data.roomNumber,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Room ${parsed.data.roomNumber} already exists in this hostel` },
        { status: 409 }
      );
    }

    const room = await Room.create({
      ...parsed.data,
      currentOccupancy: 0,
    });

    await logAuditEvent({
      userId: auth.user.id,
      action: "CREATE_ROOM",
      resource: "rooms",
      resourceId: room._id.toString(),
      details: { roomNumber: room.roomNumber, capacity: room.capacity },
    });

    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create room";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

