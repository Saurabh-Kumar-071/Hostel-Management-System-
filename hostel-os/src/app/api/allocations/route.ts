import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Allocation, Room, Student } from "@/models";
import { requireAuth } from "@/lib/security/rbac";
import { RoomAllocationSchema } from "@/lib/validation/schemas";
import { logAuditEvent } from "@/lib/security/audit";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, ["admin", "warden"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostelId");
    const status = searchParams.get("status") || "active";

    const query: Record<string, unknown> = { status };
    if (hostelId) query.hostelId = hostelId;

    if (auth.user.role === "warden" && auth.user.hostelId) {
      query.hostelId = auth.user.hostelId;
    }

    const allocations = await Allocation.find(query)
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email phone image" },
      })
      .populate("roomId")
      .populate("hostelId")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: allocations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch allocations";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, ["admin"]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const parsed = RoomAllocationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message },
        { status: 400 }
      );
    }

    await connectDB();
    const { studentId, roomId, academicYear, semester, remarks } = parsed.data;

    // 1. Verify student exists and has NO active allocation
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
    }

    const existingAllocation = await Allocation.findOne({ studentId, status: "active" });
    if (existingAllocation) {
      return NextResponse.json(
        {
          success: false,
          error: "Student already has an active room allocation. Please vacate or transfer first.",
        },
        { status: 409 }
      );
    }

    // 2. Verify room capacity against live count
    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
    }

    if (room.status !== "available") {
      return NextResponse.json(
        { success: false, error: `Room status is '${room.status}' and cannot accept allocations` },
        { status: 400 }
      );
    }

    const liveOccupancy = await Allocation.countDocuments({ roomId, status: "active" });
    if (liveOccupancy >= room.capacity) {
      return NextResponse.json(
        {
          success: false,
          error: `Room ${room.roomNumber} is at maximum capacity (${room.capacity}/${room.capacity})`,
        },
        { status: 400 }
      );
    }

    // 3. Create allocation
    const allocation = await Allocation.create({
      studentId: student._id,
      userId: student.userId,
      hostelId: room.hostelId,
      buildingId: room.buildingId,
      floorId: room.floorId,
      roomId: room._id,
      allocatedBy: auth.user.id,
      allocationDate: new Date(),
      status: "active",
      academicYear,
      semester,
      remarks,
    });

    // 4. Update student document references
    student.hostelId = room.hostelId;
    student.roomId = room._id;
    student.allocationId = allocation._id;
    student.joiningDate = new Date();
    await student.save();

    // 5. Update cached room occupancy count
    room.currentOccupancy = liveOccupancy + 1;
    if (room.currentOccupancy >= room.capacity) {
      room.status = "occupied";
    }
    await room.save();

    await logAuditEvent({
      userId: auth.user.id,
      action: "ALLOCATE_ROOM",
      resource: "allocations",
      resourceId: allocation._id.toString(),
      details: { studentId, roomId: room.roomNumber, hostelId: room.hostelId },
    });

    return NextResponse.json({ success: true, data: allocation }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to allocate room";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

