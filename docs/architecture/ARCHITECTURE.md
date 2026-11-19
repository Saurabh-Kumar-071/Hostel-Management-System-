# System Architecture & Design Overview
## HostelOS – Modular Monolithic Architecture

---

### 1. High-Level Architectural Pattern
HostelOS is structured as a **Modular Monolith** built on **Next.js 16 (App Router)** with **TypeScript strict mode**, **MongoDB Atlas**, and an optional stateless **Python FastAPI microservice** for predictive machine learning.

```
                      ┌───────────────────────────────────────┐
                      │    Client Browser / Mobile Devices     │
                      └──────────────────┬────────────────────┘
                                         │ HTTPS / JSON
                                         ▼
                      ┌───────────────────────────────────────┐
                      │    Next.js Edge / Node.js Runtime     │
                      │ ┌───────────────────────────────────┐ │
                      │ │  Next.js Middleware (RBAC Guard)  │ │
                      │ └─────────────────┬─────────────────┘ │
                      │                   │                   │
                      │    ┌──────────────┴──────────────┐    │
                      │    ▼                             ▼    │
                      │ ┌────────────────┐ ┌────────────────┐ │
                      │ │ Route Handlers │ │ Server Actions │ │
                      │ │   (/api/*)     │ │   & Layouts    │ │
                      │ └────────┬───────┘ └────────────────┘ │
                      │          │                            │
                      │ ┌────────┴──────────────────────────┐ │
                      │ │ Business Services & Repositories  │ │
                      │ │ • AllocationEngine • Billing      │ │
                      │ │ • TicketTriage     • AIProvider   │ │
                      │ └────────┬──────────────────────────┘ │
                      └──────────┼────────────────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  MongoDB Atlas   │  │   Python AI      │  │  External APIs   │
│  (Mongoose ORM,  │  │   FastAPI        │  │  • Cloudinary    │
│  24 Collections) │  │   (Scikit-Learn) │  │  • SMTP Email    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

### 2. Key Subsystems

#### 2.1 Identity & Session Subsystem
- Stateless signed JWTs with HMAC SHA-256 signatures.
- Secure, HTTP-Only, SameSite cookies.
- Brute-force throttling via sliding-window IP rate limiting.
- Server-side role permission verification on every route.

#### 2.2 Dynamic Allocation & Room Engine
- Real-time aggregation of active tenant allocations against room capacities.
- Strict prevention of double allocation through MongoDB partial unique indexes.
- Constraint-optimization allocation recommender based on department and cohort affinity.

#### 2.3 Financial & Decimal-Safe Subsystem
- Eliminates IEEE 754 floating-point errors by storing monetary values as 64-bit integer units in Indian Paise (₹1 = 100 Paise).
- Two-phase payment reconciliation: student submission followed by accountant ledger verification and receipt issuance.

#### 2.4 Multi-Tier AI Subsystem
- **Tier 1 (Zero-Dependency Heuristic):** Fast regex and semantic scoring for emergency keywords, category detection, and urgent flag assignment.
- **Tier 2 (Conversational RAG):** Context-aware LLM provider abstraction querying institutional policies and user-scoped database records.
- **Tier 3 (Predictive Analytics):** Scikit-learn regression model projecting 30-day ticket volumes and equipment failure probabilities.

