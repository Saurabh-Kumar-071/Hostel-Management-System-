# Database Architecture & Schema Specification
## HostelOS – MongoDB Data Layer

---

### 1. Architectural Principles
1. **Dynamic Room Availability Computation:** Room availability is never maintained via mutable counters. It is computed in real-time by aggregating active records in the `allocations` collection against `Room.capacity`.
2. **Double-Allocation Prevention:** A partial unique index on `Allocation`: `{ studentId: 1, status: 1 }` where `status: "active"` makes it physically impossible for a student to hold two concurrent room allocations.
3. **Paise Financial Arithmetic:** All financial columns (`totalFeePaise`, `paidPaise`, `balancePaise`, `monthlyRentPaise`) are stored as integers in units of Indian Paise (1 INR = 100 Paise), eliminating IEEE 754 floating-point inaccuracies.
4. **Audit Trail Completeness:** Immutable collection `auditLogs` and `complaintHistory` record every administrative mutation and status transition.

---

### 2. Primary Collections (24 Total)

| Collection | Primary Purpose | Key Indexes |
|---|---|---|
| `users` | Auth accounts for all personas | `email (unique)`, `role`, `status` |
| `students` | Student academic & guardian profiles | `userId (unique)`, `enrollmentNumber (unique)`, `hostelId` |
| `staff` | Wardens, Maintenance & Accountants | `userId (unique)`, `employeeId (unique)`, `hostelId` |
| `hostels` | Physical hostel facilities | `code (unique)`, `status` |
| `buildings` | Buildings within a hostel | `{ hostelId, code } (unique)` |
| `floors` | Floors within a building | `{ buildingId, floorNumber } (unique)` |
| `rooms` | Living quarters | `{ hostelId, roomNumber } (unique)`, `{ hostelId, status }` |
| `allocations` | Student-to-room tenancy records | `{ studentId, status: 'active' } (unique)`, `roomId` |
| `leaveRequests` | Outpass & vacation requests | `studentId`, `hostelId`, `status`, `departureDateTime` |
| `gatePasses` | Cryptographic outpass QR passes | `passNumber (unique)`, `studentId`, `status` |
| `complaints` | Maintenance tickets | `ticketId (unique)`, `hostelId`, `assignedTo`, `status` |
| `complaintHistory` | State machine log for complaints | `complaintId`, `createdAt` |
| `feeStructures` | Academic term fee schedules | `hostelId`, `academicYear`, `isActive` |
| `invoices` | Student fee bills | `invoiceNumber (unique)`, `studentId`, `status` |
| `payments` | Financial settlements | `paymentReference (unique)`, `invoiceId`, `studentId` |
| `messMenus` | Daily meal meal schedules | `{ hostelId, date } (unique)` |
| `feedback` | Dining & facility ratings | `studentId`, `hostelId`, `type` |
| `notices` | Bulletin board announcements | `isPublished`, `publishedAt`, `expiresAt` |
| `visitors` | Campus guest log | `studentId`, `hostelId`, `status` |
| `inventory` | Physical asset tracking | `hostelId`, `category`, `isActive` |
| `notifications` | User notification inbox | `{ userId, isRead, createdAt }` |
| `auditLogs` | Immutable security log | `userId`, `action`, `createdAt` |
| `knowledgeDocuments` | RAG policies & handbooks | `category`, `isActive` |
| `aiConversations` | AI chat session histories | `userId`, `isActive` |

---

### 3. ACID Transactions
For operations spanning multiple collections:
- **Room Allocation:** Allocation insertion + Room `currentOccupancy` recalculation + Student profile update.
- **Payment Verification:** Payment status update + Invoice balance update + Notification trigger.
Transactions are executed using `mongoose.startSession()` and `session.withTransaction()`.

