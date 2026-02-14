```
20260214_context_process.md
```

# CONTEXT PROCESS — Multi-Tenant AI Note System (Backend Endpoints Fully Validated)

---

## 1. Project Goal

* Build a production-grade Multi-Tenant AI Note & Knowledge System
* Backend-first, DB & RLS driven
* Supabase Postgres + RLS as source of truth
* No model training; LLM API integration later
* Learning-focused full-stack system engineering (infra, CI, backend, frontend)

---

## 2. High-Level Architecture

Browser / Frontend
→ Backend API (FastAPI, thin adapter)
→ Supabase Postgres (RLS + RPC)
→ Optional Redis (future: cache, rate-limit)

Core architectural philosophy:

* Database enforces **security + invariants**
* Backend orchestrates **flows**, not rules
* Backend never re-implements domain logic already enforced by DB
* All critical write logic resides in RPC

---

## 3. Repository Structure (Backend — Stable)

```
ai-note-knowledge/
├─ infra/
│  └─ supabase/
│     ├─ migrations/
│     ├─ seed.sql
│     └─ config.toml
│
├─ services/
│  ├─ backend/
│  │  ├─ app/
│  │  │  ├─ config.py
│  │  │  ├─ auth/
│  │  │  │  └─ deps.py
│  │  │  ├─ contracts/
│  │  │  ├─ db/
│  │  │  │  └─ ...adapters.py
│  │  │  ├─ errors/
│  │  │  │  ├─ db.py
│  │  │  │  └─ http.py
│  │  │  ├─ routers/
│  │  │  │  ├─ tenants.py
│  │  │  │  ├─ members.py
│  │  │  │  └─ notes.py
│  │  │  └─ main.py
│  │  ├─ scripts_local/
│  │  │  ├─ test_api_change_member_role.py
│  │  │  ├─ test_api_tenant_crud.py
│  │  │  └─ additional_e2e_tests.py
│  │  ├─ requirements.txt
│  │  └─ README.md
│
├─ specs/
└─ README.md
```

Locked rules:

* ❌ Backend MUST NOT contain migrations
* ✅ All schema & RPC live in `infra/supabase/migrations`
* Backend strictly consumes DB via RPC

---

## 4. Tenant & Role Model (Validated in Production-like Conditions)

Multi-tenant model:

* M tenants, N users
* Roles: owner, admin, member

DB-enforced invariants:

* Tenant must always have ≥ 1 owner
* Only owner can change roles
* Owner cannot remove or downgrade the last owner
* Concurrency safety enforced via `FOR UPDATE`

Backend assumes DB invariants are absolute.

---

## 5. Core Tables (Locked Baseline)

* tenants
* users (mirrored from auth.users)
* tenant_members
* tenant_join_requests
* notes
* note_shares
* audit_logs

Schema + RLS considered stable.

---

## 6. Security & RLS Model (Validated)

* RLS is the primary security boundary
* JWT forwarded client → backend → PostgREST
* Backend does NOT decode JWT
* RPC functions use `SECURITY DEFINER`
* DB enforces:

  * `auth.uid()` authentication
  * Role permissions
  * Ownership invariants
  * Last-owner safety
  * Concurrency correctness

Security boundary verified through E2E negative test cases.

---

## 7. RPC Surface (Current State)

### Tenant & Membership (Exposed & Tested)

* create_tenant
* delete_tenant
* change_tenant_member_role
* remove_tenant_member
* leave_tenant

### Join / Invite (Implemented, HTTP partially exposed)

* request_join_tenant
* approve_join_request
* reject_join_request
* cancel_join_request
* invite_user_to_tenant
* accept_invite
* decline_invite
* cancel_invite

### Notes (Write-side partially validated)

* create_note
* delete_note
* change_note_share_permission

All business logic lives strictly in RPC.

---

## 8. Backend HTTP Layer (Fully Stabilized)

### Auth Dependency

* Extracts `Authorization: Bearer <token>`
* Validates header format only
* Raises 401 on malformed or missing header
* No JWT decode logic

### Domain Error Model (Stable)

```python
class DomainError(Exception):
    code = "DOMAIN_ERROR"

class PermissionDenied(DomainError):
    code = "PERMISSION_DENIED"
```

Principles:

* Router layer never invents errors
* Router layer never checks business rules
* Invalid DB results treated as DB-layer failure
* Errors sanitized before HTTP response
* One-directional error propagation

---

## 9. Standard HTTP Response Contract (Locked)

```json
{
  "success": true | false,
  "data": object | null,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Human readable message"
  } | null
}
```

Rules:

* Routers always return `ApiResponse`
* Void RPCs return explicit success confirmation
* No raw DB errors leak to client

---

## 10. HTTP E2E Test Coverage (Expanded & Passing)

### Membership Control

Validated:

* Owner changes role → 200
* Member changes role → 403
* Downgrade last owner → 409
* Non-member attempting role change → 403

### Tenant CRUD

Validated:

* Create tenant → 200
* Delete empty tenant by owner → 200
* Delete by non-owner → 403
* Leave tenant (last owner blocked) → 409

### Observed

* Zero business logic in routers
* DomainError mapping consistent
* Error propagation stable
* No internal leakage in responses

Backend write endpoints considered stable.

---

## 11. Functional Scope — Completed

All planned endpoints across all domains are now implemented and HTTP-exposed:

### Batch 0 — Tenant & Role Management (DONE & VALIDATED)

* create_tenant ✅
* change_member_role ✅
* remove_member ✅
* leave_tenant ✅
* delete_tenant ✅

### Batch 1 — Tenant Query & Admin Operations (DONE)

* list_tenants ✅
* get_tenant_details ✅
* list_tenant_members ✅
* list_join_requests ✅
* list_invites ✅
* list_my_invites ✅
* list_my_join_requests ✅

### Batch 2 — Membership Workflow (DONE)

* request_join_tenant ✅
* approve_join_request ✅
* reject_join_request ✅
* cancel_join_request ✅
* invite_user_to_tenant ✅
* accept_invite ✅
* decline_invite ✅
* revoke_invite ✅

All flows validated with cross-tenant isolation.

### Batch 3 — Notes & Sharing (DONE)

* create_note ✅
* get_note ✅
* list_my_notes ✅
* list_tenant_notes ✅
* update_note ✅
* delete_note ✅
* share_note ✅
* revoke_share ✅
* list_note_shares ✅
* list_shared_with_me ✅

Full lifecycle with RLS-enforced access control validated.

---

## 12. Current System State (Functional Baseline Complete)

### Completed

* ✅ Schema + RLS locked
* ✅ All RPC implementations complete (21 migrations)
* ✅ Domain error model validated
* ✅ HTTP global exception handler stable
* ✅ All endpoints tested E2E (write + read)
* ✅ Security boundary validated through negative testing
* ✅ Router layer responsibility strictly enforced
* ✅ Write-plane production-structured
* ✅ Read-plane fully exposed and RLS-protected
* ✅ Cross-tenant isolation verified

Tenant Management
POST /tenants (Tạo tenant)
DELETE /tenants/{tenant_id} (Xóa tenant)
POST /tenants/{tenant_id}/members/{user_id}/role (Đổi vai trò thành viên)
DELETE /tenants/{tenant_id}/members/{user_id} (Xóa thành viên)
POST /tenants/{tenant_id}/leave (Rời khỏi tenant)
GET /tenants (Liệt kê các tenant của user)
GET /tenants/{tenant_id} (Chi tiết tenant)
GET /tenants/{tenant_id}/members (Liệt kê thành viên tenant)
Membership Workflow
POST /tenants/{tenant_id}/requests/join (Gửi yêu cầu tham gia tenant)
POST /requests/{request_id}/approve (Duyệt yêu cầu tham gia)
POST /requests/{request_id}/reject (Từ chối yêu cầu tham gia)
POST /requests/{request_id}/cancel (Hủy yêu cầu tham gia)
POST /tenants/{tenant_id}/invites (Mời user vào tenant)
POST /requests/{request_id}/accept (Chấp nhận lời mời)
POST /requests/{request_id}/decline (Từ chối lời mời)
POST /requests/{request_id}/revoke (Hủy lời mời)
GET /tenants/{tenant_id}/requests/join (Liệt kê yêu cầu tham gia)
GET /tenants/{tenant_id}/invites (Liệt kê lời mời của tenant)
GET /me/invites/pending (Liệt kê lời mời đến user)
GET /me/requests (Liệt kê yêu cầu tham gia của user)
Notes & Sharing
POST /tenants/{tenant_id}/notes (Tạo note)
GET /notes/{note_id} (Lấy chi tiết note)
GET /notes (Liệt kê note user sở hữu hoặc được chia sẻ)
GET /tenants/{tenant_id}/notes (Liệt kê note trong tenant)
PATCH /notes/{note_id} (Cập nhật note)
DELETE /notes/{note_id} (Xóa note)
POST /notes/{note_id}/shares (Chia sẻ note)
DELETE /notes/{note_id}/shares/{user_id} (Hủy chia sẻ note)
GET /notes/{note_id}/shares (Liệt kê user được chia sẻ note)
GET /me/notes/shared (Liệt kê note được chia sẻ với user)

### Not Yet Addressed

* ⚠️ Observability (structured logging, request correlation)
* ⚠️ Performance baseline (latency measurement, profiling)
* ⚠️ OpenAPI contract formalization
* ⚠️ CI/CD pipeline
* ⚠️ Frontend integration

**Status:** Functional core is production-ready. Next focus is operational maturity, not feature implementation.

---

## 13. As a Professional System Engineer — What Is the Real Next Step?

You have achieved **functional completeness**.
Now you transition to **operational maturity and production hardening**.

### Phase 1 — Performance & Efficiency Audit (Immediate Priority)

1. Measure latency baseline for all endpoints (p50, p95, p99)
2. Identify N+1 query patterns or inefficient RPC calls
3. Profile hot paths and add indexes as needed
4. Validate pagination efficiency across large datasets
5. Stress test under concurrent load

Goal: Establish performance baseline before frontend load.

---

### Phase 2 — Production Hardening (Critical Next Evolution)

This is the real professional move.

#### 1️⃣ Observability Layer

Introduce:

* Structured logging (JSON logs)
* Request ID correlation
* Error-level logging for DomainError only
* Latency measurement per endpoint

Goal: measurable backend behavior.

---

#### 2️⃣ OpenAPI Contract Freeze

* Validate response schemas
* Remove accidental inconsistencies
* Lock API contract before frontend integration
* Version API (`/v1/` prefix)

Goal: long-term API stability.

---

#### 3️⃣ CI Pipeline

Add:

* Lint (ruff / black)
* Type checking (mypy strict mode)
* Unit tests
* E2E smoke tests
* Migration drift check (supabase diff)

Goal: prevent architectural regression.

---

#### 4️⃣ Security Validation

* JWT spoof simulation
* Cross-tenant access penetration test
* Last-owner race condition stress test
* Verify all RPC use `SECURITY DEFINER` correctly

Goal: security confidence under adversarial scenarios.

---

#### 5️⃣ Performance Baseline

Before frontend:

* Measure:

  * p50 / p95 latency
  * DB round trips
  * RPC execution cost
* Add indexes where needed
* Ensure no sequential scan on critical tables

Goal: prevent scaling surprises later.

---

## 14. Strategic Direction

You are moving from:

> "It works."

to

> "It is safe, observable, measurable, and scalable."

The system is now architecturally correct.
The next evolution is operational excellence.

---

## 15. Decision Philosophy (Reaffirmed)

* DB is the law
* Routers are dumb
* Errors flow in one direction only
* Security is data-layer enforced
* Stability > speed
* Observability before feature expansion

---

**Current maturity level:**
Backend foundation solid.
Ready to transition into production-grade engineering practices.
