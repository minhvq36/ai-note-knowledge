# CONTEXT PROCESS — Multi-Tenant AI Note System (HTTP E2E Stabilized)

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

Key principles:

* Database enforces **security + invariants**
* Backend orchestrates **flows**, not rules
* Backend never re-implements domain logic already enforced by DB

---

## 3. Repository Structure (Backend — Current)

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
│  │  │  │  └─ deps.py              # JWT extraction only (no decode)
│  │  │  ├─ contracts/              # Request / response contracts (Pydantic)
│  │  │  ├─ db/
│  │  │  │  └─ ...adapters.py          # RPC adapters only (string in → string out)
│  │  │  ├─ errors/
│  │  │  │  ├─ db.py                # DB/PostgREST → DomainError
│  │  │  │  └─ http.py              # DomainError → HTTP mapping
│  │  │  ├─ routers/
│  │  │  │  ├─ tenants.py
│  │  │  │  └─ members.py
│  │  │  └─ main.py                 # Global exception handler
│  │  ├─ scripts_local/
│  │  │  ├─ test_api_change_member_role.py
│  │  │  └─ test_api_tenant_crud.py # Full tenant E2E CRUD tests
│  │  ├─ requirements.txt
│  │  └─ README.md
│
├─ specs/
└─ README.md
```

Rules (locked):

* ❌ Backend MUST NOT contain migrations
* ✅ All schema & RPC live in `infra/supabase/migrations`
* Backend **only consumes** DB via RPC / REST

---

## 4. Tenant & Role Model (Validated)

* M tenants, N users
* Roles: owner, admin, member

Invariants (DB enforced):

* Tenant must always have ≥ 1 owner
* Only owner can change roles
* Owner cannot remove or downgrade the **last owner**

Backend assumes invariants always hold.

---

## 5. Core Tables (Baseline Locked)

* tenants
* users (auth.users mirrored)
* tenant_members
* tenant_join_requests
* notes
* note_shares
* audit_logs

---

## 6. Security & RLS Model

* RLS is the primary security boundary
* JWT forwarded client → backend → PostgREST
* Backend does **not** decode JWT
* RPC functions use `SECURITY DEFINER`
* DB enforces:

  * `auth.uid()` authentication
  * Role permissions
  * Ownership & last-owner invariants
  * Concurrency safety (`FOR UPDATE`)

---

## 7. RPC Surface (Baseline)

### Tenant & Membership

* create_tenant
* delete_tenant
* change_tenant_member_role
* remove_tenant_member
* leave_tenant

### Join / Invite (Implemented, not yet exposed via HTTP)

* request_join_tenant
* approve_join_request
* reject_join_request
* cancel_join_request
* invite_user_to_tenant
* accept_invite
* decline_invite
* cancel_invite

### Notes

* delete_note
* change_note_share_permission

All business logic lives in RPC.

---

## 8. Backend HTTP Layer (Stabilized)

### Auth Dependency

* Extracts `Authorization: Bearer <token>`
* Validates header format only
* Raises 401 on missing / malformed header

### Error Model

```python
class DomainError(Exception):
    code = "DOMAIN_ERROR"

class PermissionDenied(DomainError):
    code = "PERMISSION_DENIED"
```

Principles:

* Router layer never invents errors
* Router never checks domain conditions (`if not result.data` is avoided)
* Empty / invalid DB responses are treated as DB errors and mapped centrally
* Error messages returned to client are **sanitized** (no internal leakage)

### Error Flow

HTTP
→ RPC adapter
→ DB error mapping (`errors/db.py`)
→ DomainError
→ HTTP mapping (`errors/http.py`)
→ Global exception handler

---

## 9. HTTP Response Contract (De facto standard)

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

* Routers always return `ApiResponse`
* Even void RPCs return success confirmation

---

## 10. HTTP E2E Tests (Expanded)

### Change Member Role

Verified:

* Owner changes role → 200
* Member changes role → 403
* Downgrade last owner → 409

### Tenant CRUD (New)

`scripts_local/test_api_tenant_crud.py`

Verified end-to-end:

* User creates tenant → 200
* Owner deletes own empty tenant → 200
* Non-owner deletes tenant → 403

Observed:

* No error leakage
* DomainError codes propagated correctly
* Router layer contains zero business logic

---

## 11. Batch Execution Plan (Locked)

### Batch 0 — Core Writes (DONE)

* create_tenant
* change_member_role
* leave_tenant
* delete_tenant

### Batch 1 — Tenant Queries & Admin (NEXT)

* list_tenants
* get_tenant_details
* list_tenant_members
* remove_member

### Batch 2 — Membership Workflow

* request_join_tenant
* approve_join_request
* reject_join_request
* cancel_join_request
* invite_user_to_tenant
* accept_invite
* decline_invite
* cancel_invite
* list_join_requests
* list_invites
* list_my_invites

### Batch 3 — Notes & Sharing

* create_note
* get_note
* list_my_notes
* list_tenant_notes
* update_note
* delete_note
* share_note
* revoke_share
* list_note_shares
* list_shared_with_me

---

## 12. Current Status (Locked)

* ✅ Schema + RLS locked
* ✅ Core RPC implemented
* ✅ Domain error model validated
* ✅ HTTP global exception handler stable
* ✅ Tenant CRUD E2E tests passing
* ✅ Router responsibility boundaries validated

---

## 13. Immediate Next Steps

1. Implement **Batch 1** RPC adapters + routers
2. Add list/query E2E tests
3. Keep routers logic-free
4. Defer service layer until workflow complexity requires it

---

**Decision philosophy applied:**

* DB is the law
* Routers are dumb
* Errors flow in one direction only
* Optimize for long-term maintainability, not speed
