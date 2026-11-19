# Software Requirements Specification (SRS)
## HostelOS – AI-Powered Hostel Management System
**Document Version:** 1.0.0  
**Date:** October 2026  
**Status:** Approved & Implemented  

---

### 1. Introduction

#### 1.1 Purpose
The purpose of this document is to specify the complete functional, non-functional, interface, and behavioral requirements for **HostelOS**, an enterprise-grade AI-powered SaaS platform designed to digitize and automate residential student accommodation facilities.

#### 1.2 Scope of the System
HostelOS serves universities, engineering institutes, and commercial residential academies. The system covers:
- Multi-hostel, multi-building, floor-wise, and room-level infrastructure hierarchy.
- Dynamic room capacity tracking and constraint-based room allocations.
- Student lifecycle onboarding, profile tracking, and emergency contacts.
- Digital out-pass / leave application workflow with Warden authorization and QR gate passes.
- SLA-driven maintenance and complaint ticketing with automated AI categorization and prioritization.
- Daily and weekly mess catering management, food ratings, and dietary complaints.
- Financial management: fee structures, recurring invoices, receipt generation, and decimal-safe payment accounting.
- Campus notices, targeted announcements, and real-time notification streams.
- Security visitor registration and gate ingress/egress records.
- Hostel inventory assets, maintenance logs, and damage records.
- Conversational Hostel AI Assistant using RAG (Retrieval-Augmented Generation) and role-scoped database tools.

#### 1.3 Definitions, Acronyms, and Abbreviations
- **HostelOS:** The unified Hostel Operating System.
- **RBAC:** Role-Based Access Control (5 distinct roles: Student, Warden, Admin, Maintenance, Accountant).
- **RAG:** Retrieval-Augmented Generation for institutional policy queries.
- **Paise:** Base unit for INR financial values (1 INR = 100 Paise) preventing floating-point rounding errors.
- **Gate Pass:** Cryptographically signed QR record granting student leave authorization.

---

### 2. Stakeholders & User Roles

| Role | Responsibility |
|---|---|
| **Student** | Access room details, submit leaves, download QR passes, file maintenance complaints, view mess menus, pay fees, talk with AI Assistant. |
| **Warden** | Oversee assigned hostel building, inspect student occupancy, approve/reject leaves, oversee complaints, broadcast hostel notices. |
| **Administrator** | Superuser with complete institutional control: manage hostels, configure rooms, staff provisioning, fee structures, inventory, knowledge documents, audit logs. |
| **Maintenance Staff** | Execute assigned repairs (plumbing, electrical, network), submit status updates, attach resolution photos. |
| **Accountant** | Configure fee schedules, monitor payment settlements, issue receipts, audit fee defaulters. |

---

### 3. Functional Requirements

#### 3.1 Authentication & Security (AUTH-REQ)
- **AUTH-01:** System shall support email and password authentication with bcrypt (cost factor 12) password hashing.
- **AUTH-02:** System shall support 6-digit email OTP verification for registration and password resets.
- **AUTH-03:** System shall enforce account lockout after 5 consecutive failed login attempts.
- **AUTH-04:** Server-side authorization must validate JWT/session credentials and exact role permissions on every API route handler.

#### 3.2 Hostel & Room Management (HOST-REQ)
- **HOST-01:** System shall support hierarchical infrastructure: Hostel -> Building -> Floor -> Room.
- **HOST-02:** Room availability must be dynamically computed from active allocations (`currentOccupancy < capacity`), strictly forbidding hardcoded counters.
- **HOST-03:** Prevent overbooking and double allocation using unique compound indexes on active allocations.

#### 3.3 Leave & Digital Gate Pass (LEAVE-REQ)
- **LEAVE-01:** Students can apply for leave specifying reason, departure date-time, and expected return date-time.
- **LEAVE-02:** Wardens can review, approve, or reject applications with mandatory remarks.
- **LEAVE-03:** Upon approval, a cryptographic QR-coded digital gate pass shall be generated for guard verification.

#### 3.4 Complaints & Maintenance Management (CMP-REQ)
- **CMP-01:** Ticket lifecycle tracking: `open` -> `assigned` -> `in_progress` -> `resolved` -> `closed` (or `reopened`).
- **CMP-02:** Automated AI classification of complaint text into category, priority, department, and urgent keyword detection.
- **CMP-03:** Complete audit trail of state transitions recorded in `complaintHistory`.

#### 3.5 Finance & Decimal-Safe Billing (FIN-REQ)
- **FIN-01:** All monetary amounts must be stored as 64-bit integers in Paise (e.g., ₹1,500.00 = 150000).
- **FIN-02:** Invoices generated against configured `FeeStructure` records with automated itemized breakdowns.
- **FIN-03:** Payment status transitions only after transactional verification.

#### 3.6 AI Assistant & RAG (AI-REQ)
- **AI-01:** Context-aware AI Assistant that answers queries scoped strictly to the requesting user's role and identity.
- **AI-02:** Policy RAG retrieving answers from institutional knowledge documents.
- **AI-03:** Graceful degradation when AI services are unreachable.

---

### 4. Non-Functional Requirements
- **Performance:** Sub-150ms 95th percentile response time for cached database queries.
- **Scalability:** Horizontal scaling of Next.js instances with stateless sessions and connection-pooled MongoDB Atlas.
- **Security:** OWASP Top 10 compliance, CSRF protection, strict input sanitization via Zod, rate-limiting on sensitive endpoints.
- **Reliability:** 99.9% uptime target with transactional multi-document ACID operations for room allocations and payments.

