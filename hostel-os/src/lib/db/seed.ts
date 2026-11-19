import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  User,
  Student,
  Staff,
  Hostel,
  Building,
  Floor,
  Room,
  Allocation,
  LeaveRequest,
  Complaint,
  FeeStructure,
  Invoice,
  MessMenu,
  Notice,
  KnowledgeDocument,
} from "../../models";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hostel-os";

export async function runSeed() {
  console.log("🌱 Starting HostelOS Seed Pipeline...");
  await mongoose.connect(MONGODB_URI);

  console.log("Cleaning previous seed collections...");
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Staff.deleteMany({}),
    Hostel.deleteMany({}),
    Building.deleteMany({}),
    Floor.deleteMany({}),
    Room.deleteMany({}),
    Allocation.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Complaint.deleteMany({}),
    FeeStructure.deleteMany({}),
    Invoice.deleteMany({}),
    MessMenu.deleteMany({}),
    Notice.deleteMany({}),
    KnowledgeDocument.deleteMany({}),
  ]);

  const salt = await bcrypt.genSalt(10);
  const commonPassword = await bcrypt.hash("Password@123", salt);

  // 1. Create Hostels
  const boysHostel = await Hostel.create({
    name: "Aryabhatta Hall of Residence",
    code: "ABH",
    type: "boys",
    address: "North Campus, Engineering Block A",
    description: "Modern smart residential facility equipped with high-speed WiFi and library lounge.",
    totalCapacity: 120,
    facilities: ["High-speed WiFi", "Gymnasium", "Reading Room", "Cafeteria", "Laundry"],
    rules: ["Night curfew at 10:00 PM", "No loud music post 11:00 PM"],
    contactPhone: "+91 98765 43210",
    status: "active",
  });

  const girlsHostel = await Hostel.create({
    name: "Gargi Hall of Residence",
    code: "GHR",
    type: "girls",
    address: "South Campus, Academic Square",
    description: "Contemporary residential campus with 24/7 security and biometric gates.",
    totalCapacity: 100,
    facilities: ["High-speed WiFi", "Yoga Hall", "Study Lounge", "Badminton Court"],
    rules: ["Night curfew at 10:00 PM", "Visitor registration mandatory"],
    contactPhone: "+91 98765 43211",
    status: "active",
  });

  // 2. Create Building & Floors
  const bldgA = await Building.create({
    hostelId: boysHostel._id,
    name: "Block Alpha",
    code: "BA",
    totalFloors: 3,
  });

  const floor1 = await Floor.create({
    buildingId: bldgA._id,
    hostelId: boysHostel._id,
    floorNumber: 1,
    name: "First Floor",
  });

  // 3. Create Sample Rooms
  const room101 = await Room.create({
    hostelId: boysHostel._id,
    buildingId: bldgA._id,
    floorId: floor1._id,
    roomNumber: "101",
    type: "double",
    capacity: 2,
    currentOccupancy: 1,
    status: "available",
    amenities: ["AC", "Attached Washroom", "Balcony", "Study Desk"],
    monthlyRentPaise: 1200000, // ₹12,000.00
  });

  const room102 = await Room.create({
    hostelId: boysHostel._id,
    buildingId: bldgA._id,
    floorId: floor1._id,
    roomNumber: "102",
    type: "single",
    capacity: 1,
    currentOccupancy: 0,
    status: "available",
    amenities: ["AC", "Study Desk", "Single Bed"],
    monthlyRentPaise: 1800000, // ₹18,000.00
  });

  // 4. Create Users for all 5 roles
  const adminUser = await User.create({
    email: "admin@hostelos.edu",
    password: commonPassword,
    name: "Dr. Vikram Seth",
    role: "admin",
    status: "active",
    emailVerified: true,
    phone: "9811001100",
  });

  const wardenUser = await User.create({
    email: "warden@hostelos.edu",
    password: commonPassword,
    name: "Prof. Rajesh Sharma",
    role: "warden",
    status: "active",
    emailVerified: true,
    phone: "9811001101",
  });

  const wardenStaff = await Staff.create({
    userId: wardenUser._id,
    employeeId: "EMP-WRD-01",
    role: "warden",
    department: "Student Affairs",
    designation: "Chief Warden",
    hostelId: boysHostel._id,
    phone: "9811001101",
    joiningDate: new Date("2021-06-01"),
  });

  // Link warden to hostel
  boysHostel.wardenId = wardenStaff._id as unknown as typeof boysHostel.wardenId;
  await boysHostel.save();

  const maintenanceUser = await User.create({
    email: "maintenance@hostelos.edu",
    password: commonPassword,
    name: "Suresh Kumar",
    role: "maintenance",
    status: "active",
    emailVerified: true,
    phone: "9811001102",
  });

  const maintenanceStaff = await Staff.create({
    userId: maintenanceUser._id,
    employeeId: "EMP-MNT-01",
    role: "maintenance",
    department: "Electrical Maintenance",
    designation: "Lead Electrician",
    phone: "9811001102",
    joiningDate: new Date("2022-01-15"),
  });

  const accountantUser = await User.create({
    email: "accountant@hostelos.edu",
    password: commonPassword,
    name: "Ananya Deshmukh",
    role: "accountant",
    status: "active",
    emailVerified: true,
    phone: "9811001103",
  });

  await Staff.create({
    userId: accountantUser._id,
    employeeId: "EMP-ACC-01",
    role: "accountant",
    department: "Finance & Accounts",
    designation: "Senior Hostel Bursar",
    phone: "9811001103",
    joiningDate: new Date("2020-03-10"),
  });

  const studentUser = await User.create({
    email: "student@hostelos.edu",
    password: commonPassword,
    name: "Aarav Patel",
    role: "student",
    status: "active",
    emailVerified: true,
    phone: "9811001104",
  });

  const studentDoc = await Student.create({
    userId: studentUser._id,
    enrollmentNumber: "ENR-2024-8842",
    department: "Computer Science and Engineering",
    semester: 4,
    year: 2,
    course: "B.Tech CSE",
    gender: "male",
    dateOfBirth: new Date("2003-05-14"),
    address: {
      street: "24 Park Avenue",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110025",
      country: "India",
    },
    guardian: {
      name: "Sanjay Patel",
      relation: "Father",
      phone: "9822002200",
      email: "sanjay.patel@example.com",
    },
    emergencyContact: {
      name: "Sanjay Patel",
      relation: "Father",
      phone: "9822002200",
    },
    hostelId: boysHostel._id,
    roomId: room101._id,
    status: "active",
  });

  // 5. Create Allocation for Student
  const studentAllocation = await Allocation.create({
    studentId: studentDoc._id,
    userId: studentUser._id,
    hostelId: boysHostel._id,
    buildingId: bldgA._id,
    floorId: floor1._id,
    roomId: room101._id,
    allocatedBy: adminUser._id,
    allocationDate: new Date("2024-08-01"),
    status: "active",
    academicYear: "2024-2025",
    semester: 4,
  });

  studentDoc.allocationId = studentAllocation._id;
  await studentDoc.save();

  // 6. Create Fee Structure & Invoice
  const feeStruct = await FeeStructure.create({
    hostelId: boysHostel._id,
    name: "Spring Semester 2026 Regular",
    academicYear: "2025-2026",
    semester: 4,
    roomType: "double",
    hostelFeePaise: 4800000, // ₹48,000.00
    messFeePaise: 2400000,   // ₹24,000.00
    securityDepositPaise: 500000, // ₹5,000.00
    totalFeePaise: 7700000,  // ₹77,000.00
    dueDate: new Date("2026-11-30"),
    createdBy: accountantUser._id,
  });

  await Invoice.create({
    invoiceNumber: "INV-2026-0001",
    studentId: studentDoc._id,
    hostelId: boysHostel._id,
    feeStructureId: feeStruct._id,
    academicYear: "2025-2026",
    semester: 4,
    lineItems: [
      { description: "Room Rent (Double Occupancy)", amountPaise: 4800000 },
      { description: "Dining & Mess Dues", amountPaise: 2400000 },
      { description: "Security Caution Deposit", amountPaise: 500000 },
    ],
    subtotalPaise: 7700000,
    totalPaise: 7700000,
    paidPaise: 5000000,
    balancePaise: 2700000, // ₹27,000.00 remaining
    dueDate: new Date("2026-11-30"),
    status: "partially_paid",
    generatedBy: accountantUser._id,
  });

  // 7. Create Sample Complaint
  await Complaint.create({
    ticketId: "TKT-2026-0042",
    studentId: studentDoc._id,
    userId: studentUser._id,
    hostelId: boysHostel._id,
    roomId: room101._id,
    category: "electrical",
    title: "Air conditioning cooling unit tripping breaker",
    description: "The ceiling fan and AC power switch trip the main miniature circuit breaker repeatedly after 10 minutes of use.",
    priority: "urgent",
    status: "assigned",
    assignedTo: maintenanceStaff._id,
    assignedAt: new Date(),
    aiClassification: {
      suggestedCategory: "electrical",
      suggestedPriority: "urgent",
      summary: "Tripping circuit breaker on AC cooling unit",
      department: "Electrical Maintenance",
      isUrgent: true,
      confidence: 0.94,
      processedAt: new Date(),
    },
  });

  // 8. Create Mess Menu
  await MessMenu.create({
    hostelId: boysHostel._id,
    date: new Date(),
    dayOfWeek: "Friday",
    meals: {
      breakfast: { items: ["Masala Dosa", "Sambar", "Coconut Chutney", "Boiled Eggs", "Coffee/Tea"], timing: "7:30 AM - 9:00 AM" },
      lunch: { items: ["Paneer Butter Masala", "Dal Makhani", "Jeera Rice", "Butter Roti", "Gulab Jamun"], timing: "12:30 PM - 2:30 PM" },
      snacks: { items: ["Samosa with Mint Dip", "Masala Chai", "Biscuits"], timing: "5:00 PM - 6:00 PM" },
      dinner: { items: ["Special Chicken Dum Biryani / Veg Pulao", "Raita", "Salad", "Custard"], timing: "7:30 PM - 9:30 PM" },
    },
    createdBy: wardenUser._id,
  });

  // 9. Create Notices
  await Notice.create({
    title: "Diwali Semester Break & Quiet Hours Advisory",
    content: "Residents applying for the festive break are requested to submit outpass forms before 5:00 PM Thursday. Digital QR gate passes will be verified at the main security post.",
    type: "general",
    priority: "normal",
    targetAudience: "all",
    isPinned: true,
    isPublished: true,
    createdBy: wardenUser._id,
  });

  // 10. Create Knowledge Documents (for RAG)
  await KnowledgeDocument.create([
    {
      title: "Hostel Curfew & Entry Rules",
      content: "All resident students must return to the hostel premises by 10:00 PM. Gate closure occurs promptly at 10:15 PM. Late entries require prior permission from the Warden.",
      category: "rule",
      tags: ["curfew", "entry", "security"],
      isActive: true,
      uploadedBy: adminUser._id,
    },
    {
      title: "Maintenance & Emergency Contacts",
      content: "In case of electrical sparks, water leakage, or security emergencies, contact the 24/7 Security Desk at Ext 4001 or dial +91 98765 43210. Tickets submitted via the HostelOS app with 'urgent' status trigger immediate alerts.",
      category: "guide",
      tags: ["emergency", "maintenance", "contacts"],
      isActive: true,
      uploadedBy: adminUser._id,
    },
  ]);

  console.log("✅ Seed Pipeline Complete! Sample accounts created:");
  console.log("--------------------------------------------------");
  console.log("Admin:       admin@hostelos.edu       / Password@123");
  console.log("Warden:      warden@hostelos.edu      / Password@123");
  console.log("Student:     student@hostelos.edu     / Password@123");
  console.log("Maintenance: maintenance@hostelos.edu / Password@123");
  console.log("Accountant:  accountant@hostelos.edu  / Password@123");
  console.log("--------------------------------------------------");

  await mongoose.disconnect();
}

// Allow direct CLI execution: tsx src/lib/db/seed.ts
if (require.main === module) {
  runSeed().catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
}

