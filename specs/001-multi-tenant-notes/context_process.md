# CONTEXT PROCESS — Multi-Tenant AI Note System (HTTP E2E Added)

## 1. Project Goal

* Build a production-grade Multi-Tenant AI Note & Knowledge System
* Backend-first, DB & RLS driven
* Supabase Postgres + RLS as source of truth
* No model training; LLM API integration later
* Learning-focused full-stack system engineering (infra, CI, backend, frontend)

## 2. High-Level Architecture

Browser / Frontend
→ Backend API (FastAPI, thin adapter)
→ Supabase Postgres (RLS + RPC)
→ Optional Redis (future: cache, rate-limit)

Key principle:

* Database enforces **security + invariants**
* Backend orchestrates **business flows only**
* Backend never re-implements domain rules

## 3. Repository Structure (Backend Expanded)

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
│  │  │  │  └─ deps.py            # JWT extraction only (no decoding)
│  │  │  ├─ contracts/
│  │  │  │  └─ member.py         # Pydantic request contracts
│  │  │  ├─ db/
│  │  │  │  ├─ client.py
│  │  │  │  └─ membership.py      # RPC adapters only
│  │  │  ├─ errors/
│  │  │  │  ├─ db.py              # DB error → domain error mapping
│  │  │  │  └─ http.py            # Domain error → HTTPException
│  │  │  ├─ routers/
│  │  │  │  ├─ tenants.py         # Router skeleton
│  │  │  │  └─ members.py         # First real HTTP endpoint
│  │  │  └─ main.py
│  │  ├─ scripts_local/
│  │  │  ├─ auth_login.py
│  │  │  ├─ test_change_tenant_role.py        # Direct RPC test
│  │  │  └─ test_api_change_member_role.py    # Full HTTP → DB E2E test
│  │  ├─ tests/
│  │  ├─ requirements.txt
│  │  └─ README.md
│
├─ specs/
└─ README.md
```

Rules (unchanged):

* ❌ Backend MUST NOT contain database migrations
* ✅ All schema & RPC changes live in `infra/supabase/migrations`
* Backend only **consumes** DB via RPC / REST

## 4. Tenant & Role Model (Validated)

* M tenants, N users
* Roles: owner, admin, member
* Invariants (enforced in DB):

  * Tenant must always have ≥ 1 owner
  * Only owner can change roles
  * Owner can downgrade self/others except the **last owner**

## 5. Core Tables (Baseline Locked)

* tenants
* users (auth.users mirrored via trigger)
* tenant_members
* notes
* note_shares
* tenant_join_requests
* audit_logs

## 6. RLS & Security Model

* RLS is the primary security boundary
* JWT forwarded from client → backend → PostgREST
* Backend does not decode or inspect JWT
* RPC functions use `security definer`
* DB enforces:

  * Authentication via `auth.uid()`
  * Role permissions
  * Ownership
  * Last-owner invariants
  * Concurrency safety (`FOR UPDATE`)

## 7. RPC Surface (Baseline Implemented)

* create_tenant
* change_tenant_member_role
* invite_user_to_tenant
* request_join_tenant
* approve_join_request
* reject_join_request
* accept_invite
* decline_invite
* cancel_join_request
* cancel_invite
* remove_tenant_member
* leave_tenant
* delete_tenant
* delete_note
* change_note_share_permission

All complex business logic lives in RPC, not backend.

## 8. Backend HTTP Layer (New)

### Auth Dependency

* `get_current_access_token`
* Extracts `Authorization: Bearer <token>`
* Raises 401 on missing / invalid format
* Does not decode or validate JWT

### Error Handling

* DB/PostgREST errors mapped to domain errors
* Domain errors mapped to HTTP status codes
* Router layer contains no business logic

### Contracts

* Pydantic models live in `app/contracts`
* Routers consume contracts, never define them

## 9. First HTTP Endpoint (Completed)

```
POST /tenants/{tenant_id}/members/{user_id}/role
```

Flow:
HTTP request
→ FastAPI router
→ auth dependency
→ DB adapter (Supabase RPC)
→ Postgres RPC + RLS
→ domain error mapping
→ HTTP response

## 10. E2E HTTP Tests (Validated)

`scripts_local/test_api_change_member_role.py`

Cases verified:

* Owner changes role → 200
* Member changes role → 403
* Downgrade last owner → 409

Result:

* ✅ Full HTTP → DB → invariant → HTTP loop verified
* ✅ No backend business logic leakage

## 11. Current Status

* ✅ Schema + RLS locked
* ✅ RPC baseline implemented
* ✅ Backend auth dependency implemented
* ✅ Error mapping layer implemented
* ✅ First router + contract implemented
* ✅ Full HTTP E2E test passed

## 12. Next Logical Steps (Not Started)

* Standardize HTTP response envelopes
* Add second endpoint following same pattern
* Introduce integration tests (pytest)
* Optional observability (request_id, structured logs)
