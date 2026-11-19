# Role-Based Access Control (RBAC) Specification
## HostelOS Security & Authorization Engine

---

### 1. Role Hierarchy & Descriptions

HostelOS enforces strict server-side authorization. Under no circumstance is a client-submitted role or user ID trusted.

| Role | Scope | Description |
|---|---|---|
| **Admin** | System-Wide | Complete administrative authority over all campuses, hostels, staff, students, and global configurations. |
| **Warden** | Assigned Hostel | Operational authority restricted to students, rooms, complaints, leaves, and staff within their assigned hostel. |
| **Accountant** | Financial Domain | Read and write access to fee structures, invoices, payment verifications, and financial reporting across all hostels. |
| **Maintenance** | Work Orders | Read and update authority restricted strictly to complaint tickets assigned to their user ID or department. No student data access. |
| **Student** | Self Profile | Read and write authority strictly restricted to their own allocations, complaints, leaves, and payment dues. |

---

### 2. Comprehensive Resource Permission Matrix

| Resource / Action | Admin | Warden | Accountant | Maintenance | Student |
|---|---|---|---|---|---|
| **Hostel: Create/Edit/Delete** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Hostel: View Details** | ✅ | ✅ (Own) | ✅ (All) | ❌ | ✅ (Assigned) |
| **Room: Create/Edit** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Room: Allocate / Vacate** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Room: View Occupancy** | ✅ | ✅ (Own Hostel) | ✅ | ❌ | ✅ (Own Room) |
| **Leave: Submit Application** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Leave: Approve / Reject** | ✅ | ✅ (Own Hostel) | ❌ | ❌ | ❌ |
| **Gate Pass: Scan / Verify** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Complaint: File New** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Complaint: Assign Staff** | ✅ | ✅ (Own Hostel) | ❌ | ❌ | ❌ |
| **Complaint: Update Work Order**| ✅ | ✅ | ❌ | ✅ (Assigned) | ❌ |
| **Complaint: Close / Feedback** | ✅ | ✅ | ❌ | ❌ | ✅ (Own) |
| **Fee Structure: Configure** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Payment: Verify & Settle** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Payment: View Ledger** | ✅ | ❌ | ✅ | ❌ | ✅ (Own) |
| **Notice: Publish / Pin** | ✅ | ✅ (Own Hostel) | ❌ | ❌ | ❌ |
| **AI Assistant: Chat** | ✅ (Global) | ✅ (Hostel) | ❌ | ❌ | ✅ (Self) |
| **Audit Logs: Review** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### 3. Server Authorization Utility Design

Every Next.js API Route Handler utilizes a unified wrapper:

```typescript
export async function requireAuth(
  req: Request, 
  allowedRoles?: Role[]
): Promise<SessionUser>
```

If unauthorized:
- `401 Unauthorized` for missing/expired session tokens.
- `403 Forbidden` for insufficient role privileges.
- Audit entry automatically logged on sensitive access violations.

