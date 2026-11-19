import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import {
  Student,
  Hostel,
  Room,
  Allocation,
  Complaint,
  LeaveRequest,
  Invoice,
  Payment,
  Notice,
  MessMenu,
} from "@/models";
import { requireAuth } from "@/lib/security/rbac";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if ("errorResponse" in auth) return auth.errorResponse;

    await connectDB();
    const role = auth.user.role;

    // ─── 1. Admin Analytics ──────────────────────────────────────────────────
    if (role === "admin") {
      const [
        totalStudents,
        totalHostels,
        totalRooms,
        activeAllocations,
        pendingComplaints,
        resolvedComplaints,
        financialStats,
        hostels,
      ] = await Promise.all([
        Student.countDocuments({ status: "active" }),
        Hostel.countDocuments({ status: "active" }),
        Room.countDocuments(),
        Allocation.countDocuments({ status: "active" }),
        Complaint.countDocuments({ status: { $in: ["open", "assigned", "in_progress"] } }),
        Complaint.countDocuments({ status: { $in: ["resolved", "closed"] } }),
        Invoice.aggregate([
          {
            $group: {
              _id: null,
              totalInvoiced: { $sum: "$totalPaise" },
              totalCollected: { $sum: "$paidPaise" },
              totalOutstanding: { $sum: "$balancePaise" },
            },
          },
        ]),
        Hostel.find({ status: "active" }).select("name code totalCapacity").lean(),
      ]);

      const fin = financialStats[0] || {
        totalInvoiced: 0,
        totalCollected: 0,
        totalOutstanding: 0,
      };

      // Calculate total bed capacity across all rooms
      const capacityAgg = await Room.aggregate([
        { $group: { _id: null, totalBedCapacity: { $sum: "$capacity" } } },
      ]);
      const totalBedCapacity = capacityAgg[0]?.totalBedCapacity || 1;
      const occupancyPercentage = Math.round((activeAllocations / totalBedCapacity) * 100);

      // Monthly complaints aggregation (last 6 months)
      const monthlyComplaints = await Complaint.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 6 },
      ]);

      // Category breakdown
      const categoryBreakdown = await Complaint.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]);

      return NextResponse.json({
        success: true,
        data: {
          role: "admin",
          metrics: {
            totalStudents,
            totalHostels,
            totalRooms,
            activeAllocations,
            availableSlots: Math.max(0, totalBedCapacity - activeAllocations),
            occupancyPercentage,
            pendingComplaints,
            resolvedComplaints,
            totalCollectedPaise: fin.totalCollected,
            totalOutstandingPaise: fin.totalOutstanding,
          },
          charts: {
            monthlyComplaints: monthlyComplaints.map((m) => ({ month: m._id, complaints: m.count })),
            categoryBreakdown: categoryBreakdown.map((c) => ({ category: c._id, count: c.count })),
            hostels,
          },
        },
      });
    }

    // ─── 2. Warden Analytics ─────────────────────────────────────────────────
    if (role === "warden") {
      const hostelId = auth.user.hostelId;
      const hostelQuery = hostelId ? { hostelId } : {};

      const [
        studentsInHostel,
        pendingLeaves,
        activeLeaves,
        openComplaints,
        resolvedComplaints,
        recentComplaints,
      ] = await Promise.all([
        Student.countDocuments({ ...hostelQuery, status: "active" }),
        LeaveRequest.countDocuments({ ...hostelQuery, status: "pending" }),
        LeaveRequest.countDocuments({ ...hostelQuery, status: "approved" }),
        Complaint.countDocuments({ ...hostelQuery, status: { $in: ["open", "assigned", "in_progress"] } }),
        Complaint.countDocuments({ ...hostelQuery, status: "resolved" }),
        Complaint.find(hostelQuery).sort({ createdAt: -1 }).limit(5).populate("studentId"),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          role: "warden",
          metrics: {
            studentsInHostel,
            pendingLeaves,
            activeLeaves,
            openComplaints,
            resolvedComplaints,
          },
          recentComplaints,
        },
      });
    }

    // ─── 3. Student Analytics ────────────────────────────────────────────────
    if (role === "student") {
      const student = await Student.findOne({ userId: auth.user.id })
        .populate("hostelId roomId")
        .lean();

      const [complaintsCount, activeLeavesCount, invoiceData, todayMenu] = await Promise.all([
        Complaint.countDocuments({ userId: auth.user.id }),
        LeaveRequest.countDocuments({ userId: auth.user.id, status: { $in: ["pending", "approved"] } }),
        Invoice.aggregate([
          { $match: { studentId: student?._id } },
          {
            $group: {
              _id: null,
              totalInvoiced: { $sum: "$totalPaise" },
              totalPaid: { $sum: "$paidPaise" },
              totalBalance: { $sum: "$balancePaise" },
            },
          },
        ]),
        student?.hostelId
          ? MessMenu.findOne({
              hostelId: student.hostelId._id,
              date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            })
          : null,
      ]);

      const fin = invoiceData[0] || { totalInvoiced: 0, totalPaid: 0, totalBalance: 0 };

      return NextResponse.json({
        success: true,
        data: {
          role: "student",
          profile: student,
          metrics: {
            complaintsCount,
            activeLeavesCount,
            totalBalancePaise: fin.totalBalance,
            totalPaidPaise: fin.totalPaid,
          },
          todayMenu,
        },
      });
    }

    // ─── 4. Maintenance Analytics ───────────────────────────────────────────
    if (role === "maintenance") {
      const staffId = auth.user.staffId;
      const [assignedTasks, inProgressTasks, completedTasks] = await Promise.all([
        Complaint.countDocuments({ assignedTo: staffId, status: "assigned" }),
        Complaint.countDocuments({ assignedTo: staffId, status: "in_progress" }),
        Complaint.countDocuments({ assignedTo: staffId, status: { $in: ["resolved", "closed"] } }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          role: "maintenance",
          metrics: {
            assignedTasks,
            inProgressTasks,
            completedTasks,
          },
        },
      });
    }

    // ─── 5. Accountant Analytics ─────────────────────────────────────────────
    if (role === "accountant") {
      const [pendingInvoices, paidInvoices, totals] = await Promise.all([
        Invoice.countDocuments({ status: { $in: ["pending", "partially_paid"] } }),
        Invoice.countDocuments({ status: "paid" }),
        Invoice.aggregate([
          {
            $group: {
              _id: null,
              totalBilled: { $sum: "$totalPaise" },
              totalCollected: { $sum: "$paidPaise" },
              totalDues: { $sum: "$balancePaise" },
            },
          },
        ]),
      ]);

      const fin = totals[0] || { totalBilled: 0, totalCollected: 0, totalDues: 0 };

      return NextResponse.json({
        success: true,
        data: {
          role: "accountant",
          metrics: {
            pendingInvoices,
            paidInvoices,
            totalBilledPaise: fin.totalBilled,
            totalCollectedPaise: fin.totalCollected,
            totalDuesPaise: fin.totalDues,
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch analytics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

