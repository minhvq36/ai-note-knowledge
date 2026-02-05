# CONTEXT PROCESS — Multi-Tenant AI Note System (Updated)

## 1. Project Goal
- Build a production-grade Multi-Tenant AI Note & Knowledge System
- Backend-first, DB & RLS driven
- Supabase Postgres + RLS as source of truth
- No model training; LLM API integration later
- Learning-focused full-stack system engineering (infra, CI, backend, frontend)

## 2. High-Level Architecture
Browser / Frontend
→ Backend API (service layer, no raw SQL)
→ Supabase Postgres (RLS + RPC)
→ Optional Redis (cache, rate-limit, future)

Key principle:
- Database enforces **security + invariants**
- Backend orchestrates **business flows only**

## 3. Repository Structure (Locked)

```
ai-note-knowledge/
├─ infra/
│  └─ supabase/
│     ├─ migrations/        # ALL database migrations (single source of truth)
│     ├─ seed.sql
│     └─ config.toml
│
├─ services/
│  ├─ backend/
│  │  ├─ app/
│  │  │  ├─ config.py       # Centralized config via BaseSettings
│  │  │  ├─ db/
│  │  │  │  ├─ client.py    # Supabase client (service role)
│  │  │  │  └─ membership.py
│  │  │  ├─ routers/
│  │  │  ├─ services/
│  │  │  └─ main.py
│  │  ├─ scripts_local/     # Ad-hoc local scripts (gitignored)
│  │  ├─ tests/
│  │  ├─ requirements.txt
│  │  ├─ .env.example
│  │  └─ README.md
│
├─ specs/                   # Business logic, invariants, decisions
├─ shared/                  # Shared contracts, DTOs, constants
└─ README.md
```

Rules:
- ❌ Backend MUST NOT contain database migrations
- ✅ All schema changes live in `infra/supabase/migrations`
- Backend only **consumes** DB via RPC / REST

## 4. Tenant & Role Model (Validated)
- M tenants, N users
- Roles: owner, admin, member
- Invariants:
  - Tenant must always have ≥ 1 owner
  - Only owner can change roles
  - Owner can downgrade self/others except the **last owner**
- Notes belong to tenant, not user
- Notes persist even if user leaves tenant
- `owner_id` may be NULL after user removal
- Soft delete applied to tenants and notes

## 5. Core Tables (Baseline Locked)
- tenants
- users (auth.users mirrored via trigger)
- tenant_members
- notes
- note_shares
- tenant_join_requests
- audit_logs

## 6. RLS & Security Model
- RLS is the primary security boundary
- JWT (access_token) forwarded from client → DB
- RPC functions use `security definer`
- DB enforces:
  - Role permissions
  - Ownership
  - Last-owner invariants
  - Concurrency safety (FOR UPDATE)

## 7. RPC Surface (Baseline Implemented)
- create_tenant
- change_tenant_member_role
- invite_user_to_tenant
- request_join_tenant
- approve_join_request
- reject_join_request
- accept_invite
- decline_invite
- cancel_join_request
- cancel_invite
- remove_tenant_member
- leave_tenant
- delete_tenant
- delete_note
- change_note_share_permission

All complex business logic lives in RPC, not backend.

## 8. Database Workflow (Finalized)

### Local Development
- `cd infra`
- `supabase start`
- `supabase db reset`
- Purpose:
  - Validate migrations
  - Validate RLS & RPC behavior
  - Deterministic local environment

### Cloud (Supabase)
- `cd infra`
- `supabase db push`
- Only applies migrations from `infra/supabase/migrations`
- No direct editing in Dashboard

## 9. Backend Development Decisions (Finalized)
- Python backend with FastAPI
- Async-first (I/O bound workloads)
- uvicorn for dev, gunicorn later for prod
- Supabase SDK used as DB adapter
- Centralized Supabase client (service role)
- User JWT forwarded per request (no auth logic in DB client)
- `.env` used only for local dev; env vars for CI/prod

## 10. Auth & Testing Flow (Validated)
1. Seed users & tenants in Supabase
2. Login via publishable key (client-like script)
3. Obtain access_token (JWT)
4. Forward JWT to backend DB adapter
5. Execute RPC
6. Validate DB state + audit_logs

Ad-hoc scripts:
- Located in `services/backend/scripts_local`
- Used for manual testing only
- Gitignored
- Never imported by backend

## 11. Current Status

- ✅ Schema + RLS locked
- ✅ RPC baseline implemented
- ✅ Supabase client layer finalized
- ✅ Local env (venv, .env) working
- ✅ End-to-end RPC test passed
- ⏭️ Next steps:
  - FastAPI endpoint layer
  - Auth dependency (JWT extraction)
  - Error mapping (DB → HTTP)
