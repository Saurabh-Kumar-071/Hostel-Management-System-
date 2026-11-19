# Testing Report & Verification Documentation
## HostelOS – Software Verification & Validation

---

### 1. Test Strategy & Scope
Testing encompasses:
- Unit verification of core business invariants (decimal-safe currency in Paise, JWT cryptography, Zod schema validation).
- Automated AI heuristic triage testing.
- Role-based authorization matrix enforcement.
- Integration tests for room allocation constraints and payment reconciliation.

---

### 2. Unit Test Suite Summary

| Test Suite | Spec File | Verification Objective | Result |
|---|---|---|---|
| **Security & JWT** | `tests/unit/security.test.ts` | Verify HMAC SHA-256 token signing, session claims preservation, and tamper detection. | PASS ✅ |
| **Decimal Arithmetic** | `tests/unit/currency.test.ts` | Verify integer Paise representation preventing floating-point IEEE-754 drift. | PASS ✅ |
| **AI Classifier** | `tests/unit/classifier.test.ts` | Verify natural language triage correctly identifies emergency keywords, maps departments, and elevates priority to urgent. | PASS ✅ |

---

### 3. API Contract Test Cases

#### 3.1 Authentication & Session
- **TC-AUTH-01:** Valid credentials return signed HTTP-only cookie and 200 OK.
- **TC-AUTH-02:** Five consecutive incorrect passwords trigger 15-minute account lock.
- **TC-AUTH-03:** Non-admin role attempting access to `/api/hostels` (POST) receives `403 Forbidden`.

#### 3.2 Allocation & Capacity
- **TC-ALLOC-01:** Attempting to allocate room where `activeAllocations >= capacity` returns `400 Bad Request`.
- **TC-ALLOC-02:** Attempting duplicate active room allocation for same student returns `409 Conflict`.

#### 3.3 Financial Verification
- **TC-FIN-01:** Recording payment exceeding `invoice.balancePaise` returns `400 Bad Request`.
- **TC-FIN-02:** Verified payment transitions invoice from `pending` -> `partially_paid` or `paid`.

