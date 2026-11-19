// Shared In-Memory Store for friction-free academic demonstration when local MongoDB daemon is not running

export interface MockLeave {
  _id: string;
  studentId: { _id: string; userId: { name: string; email: string } };
  userId: string;
  hostelId: string;
  leaveType: string;
  destination: string;
  reason: string;
  departureDateTime: string;
  expectedReturnDateTime: string;
  status: "pending" | "approved" | "rejected";
  gatePassId?: {
    _id: string;
    passNumber: string;
    qrCode: string;
    status: string;
  };
}

export interface MockComplaint {
  _id: string;
  ticketId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  userId: string;
  studentId: { _id: string; userId: { name: string } };
  roomId?: { roomNumber: string };
  aiClassification?: {
    department: string;
    isUrgent: boolean;
    confidence: number;
  };
  createdAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __mockStore: {
    leaves: MockLeave[];
    complaints: MockComplaint[];
    allocatedStudents: string[];
  };
}

if (!global.__mockStore) {
  global.__mockStore = {
    leaves: [],
    complaints: [
      {
        _id: "cmp_demo_01",
        ticketId: "TKT-2026-0042",
        title: "Air conditioning cooling unit tripping breaker",
        description: "The ceiling fan and AC power switch trip the main miniature circuit breaker repeatedly after 10 minutes of use.",
        category: "electrical",
        priority: "urgent",
        status: "assigned",
        userId: "demo_student_01",
        studentId: { _id: "student_aarav_01", userId: { name: "Aarav Patel" } },
        roomId: { roomNumber: "101" },
        aiClassification: {
          department: "Electrical Maintenance",
          isUrgent: true,
          confidence: 0.94,
        },
        createdAt: new Date().toISOString(),
      },
    ],
    allocatedStudents: ["student_aarav_01"],
  };
}

export const mockStore = global.__mockStore;

