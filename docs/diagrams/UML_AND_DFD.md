# UML Diagrams & Data Flow Diagrams (DFD)
## HostelOS – System Architecture Diagrams

---

### 1. Use Case Diagram

```mermaid
flowchart LR
    Student((Student))
    Warden((Warden))
    Admin((Administrator))
    Maint((Maintenance Staff))
    Acct((Accountant))

    subgraph HostelOS Platform
        UC1[Submit Leave Application]
        UC2[Download QR Gate Pass]
        UC3[File Maintenance Complaint]
        UC4[View Mess Menu & Feedback]
        UC5[Chat with Hostel AI Assistant]
        UC6[Approve / Reject Leave]
        UC7[Assign Complaints to Staff]
        UC8[Broadcast Hostel Notices]
        UC9[Manage Hostels, Floors & Rooms]
        UC10[Smart Room Allocation Engine]
        UC11[Update Maintenance Task Status]
        UC12[Manage Fee Invoices & Payments]
        UC13[View Audit Logs & Analytics]
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5

    Warden --> UC6
    Warden --> UC7
    Warden --> UC8
    Warden --> UC5

    Admin --> UC9
    Admin --> UC10
    Admin --> UC8
    Admin --> UC13
    Admin --> UC5

    Maint --> UC11

    Acct --> UC12
```

---

### 2. High-Level Class Diagram

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String email
        +String password
        +String name
        +Role role
        +UserStatus status
        +comparePassword(candidate) Boolean
    }

    class Student {
        +ObjectId userId
        +String enrollmentNumber
        +String department
        +Number semester
        +ObjectId hostelId
        +ObjectId roomId
    }

    class Hostel {
        +String name
        +String code
        +String type
        +Number totalCapacity
        +ObjectId wardenId
    }

    class Room {
        +ObjectId hostelId
        +String roomNumber
        +RoomType type
        +Number capacity
        +Number currentOccupancy
        +RoomStatus status
        +Number monthlyRentPaise
    }

    class Allocation {
        +ObjectId studentId
        +ObjectId roomId
        +AllocationStatus status
        +Date allocationDate
    }

    class LeaveRequest {
        +ObjectId studentId
        +String leaveType
        +Date departureDateTime
        +Date expectedReturnDateTime
        +LeaveStatus status
    }

    class Complaint {
        +String ticketId
        +ObjectId studentId
        +ObjectId roomId
        +ComplaintCategory category
        +ComplaintPriority priority
        +ComplaintStatus status
        +ObjectId assignedTo
    }

    class Invoice {
        +String invoiceNumber
        +ObjectId studentId
        +Number totalPaise
        +Number paidPaise
        +PaymentStatus status
    }

    User <|-- Student
    Hostel "1" *-- "*" Room
    Room "1" o-- "*" Allocation
    Student "1" -- "0..1" Allocation
    Student "1" -- "*" LeaveRequest
    Student "1" -- "*" Complaint
    Student "1" -- "*" Invoice
```

---

### 3. Sequence Diagram: Leave Request & QR Gate Pass

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant UI as Next.js Client
    participant API as /api/leaves
    participant DB as MongoDB Atlas
    actor Warden

    Student->>UI: Submit Leave Form (Reason, Dates)
    UI->>API: POST /api/leaves (Bearer Token)
    API->>API: Validate Zod Schema & Check Conflicts
    API->>DB: Insert LeaveRequest (status: 'pending')
    DB-->>API: Saved Document
    API-->>UI: 201 Created (Success Notification)

    Warden->>UI: View Pending Requests
    UI->>API: GET /api/leaves?status=pending
    API->>DB: Query LeaveRequests for Warden's Hostel
    DB-->>API: List of Applications
    API-->>UI: Display Table

    Warden->>UI: Click 'Approve'
    UI->>API: PATCH /api/leaves/:id/approve
    API->>DB: Update Leave status = 'approved'
    API->>DB: Generate GatePass with signed QR Code
    DB-->>API: GatePass Generated
    API-->>UI: Approval Confirmed

    Student->>UI: View Approved Leaves
    UI->>API: GET /api/gate-passes/:id
    API-->>UI: Return QR Data & Pass Details
    UI-->>Student: Display Digital Gate Pass
```

---

### 4. Component Diagram

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client (Next.js 16 App Router)"]
        UI_Components["shadcn/ui & Tailwind Primitives"]
        Dashboards["Role Dashboards (Student, Warden, Admin, Maint, Acct)"]
        StateHooks["React Hook Form, SWR / Fetch Hooks"]
    end

    subgraph ServerLayer["Backend API & Server Handlers"]
        Middleware["Auth & RBAC Middleware"]
        AuthHandler["Auth.js / Custom JWT Engine"]
        RouteHandlers["REST Route Handlers (/api/*)"]
        AIService["AI Orchestration Layer (OpenAI GPT-4o / RAG)"]
        Services["Business Services (Allocation, Invoicing, Ticketing)"]
    end

    subgraph DataLayer["Storage & External Providers"]
        MongoAtlas[("MongoDB Atlas Primary DB")]
        Cloudinary["Cloudinary CDN (Images & Documents)"]
        SMTP["Nodemailer (SMTP Server)"]
    end

    ClientLayer -->|HTTPS / JSON| Middleware
    Middleware --> RouteHandlers
    RouteHandlers --> AuthHandler
    RouteHandlers --> Services
    Services --> AIService
    Services --> MongoAtlas
    Services --> Cloudinary
    Services --> SMTP
```

---

### 5. Level 0 Data Flow Diagram (Context Diagram)

```mermaid
flowchart TD
    Student[Student]
    Warden[Warden]
    Admin[Administrator]
    System((HostelOS Core))
    Maint[Maintenance Staff]
    Acct[Accountant]

    Student -->|Leave Request, Complaints, Feedback| System
    System -->|Allocations, Gate Passes, Invoices| Student

    Warden -->|Approvals, Task Assignments, Notices| System
    System -->|Hostel Roster, Leave Alerts, Maintenance Stats| Warden

    Admin -->|Configurations, Policies, Approvals| System
    System -->|System Analytics, Audit Logs| Admin

    Maint -->|Resolution Updates, Work Logs| System
    System -->|Assigned Work Orders| Maint

    Acct -->|Payment Records, Fee Structures| System
    System -->|Outstanding Reports, Dues Summaries| Acct
```

---

### 6. Level 1 Data Flow Diagram

```mermaid
flowchart TD
    subgraph Users
        U1[Students]
        U2[Staff / Warden / Admin]
    end

    subgraph Processes
        P1["1.0 Authentication & RBAC"]
        P2["2.0 Room Allocation Engine"]
        P3["3.0 Leave & Gate Pass Processing"]
        P4["4.0 Maintenance Ticketing & AI Categorization"]
        P5["5.0 Financial Accounting & Invoicing"]
    end

    subgraph DataStores
        D1[("Users & Profiles")]
        D2[("Rooms & Allocations")]
        D3[("Leaves & Gate Passes")]
        D4[("Complaints & Work Orders")]
        D5[("Invoices & Payments")]
    end

    U1 -->|Credentials| P1
    U2 -->|Credentials| P1
    P1 <-->|Read / Write| D1

    P1 -->|Authenticated Session| P2
    P2 <-->|Check Capacity & Allocate| D2

    U1 -->|Submit Leave Application| P3
    U2 -->|Review & Approve Leave| P3
    P3 <-->|Record Status & Issue Pass| D3

    U1 -->|File Complaint| P4
    P4 <-->|Store Ticket & Track Status| D4

    U2 -->|Record Fee Structures & Verify| P5
    U1 -->|Submit Payment| P5
    P5 <-->|Generate Invoice & Receipt| D5
```

