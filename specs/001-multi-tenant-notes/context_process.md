<!--
IMPORTANT RULES

1. Keep this file under 1000 lines
2. Prefer rewriting over appending
3. This file is the shared context between reasoning AI and coding agents
4. Update after major architectural changes
5. Keep information concise and factual
-->

# CONTEXT PROCESS

Last Updated: 2026-03-03 (RateLimiter Refactor - Service Layer Introduced)
Project Stage: Development

---

# 1. Project Overview

Multi‑Tenant AI Note & Knowledge System.

Goals:

* Production‑grade architecture
* Learn full‑stack system engineering
* Strong security via database
* Clean frontend architecture

Core ideas:

* Multi‑tenant isolation
* Database enforced permissions (RLS first)
* Thin backend adapter
* Simple predictable frontend
* Avoid premature optimization (no central cache yet)

---

# 2. Tech Stack

Frontend

* Vanilla TypeScript
* Manual DOM rendering
* Vite
* No framework / no virtual DOM

Backend

* FastAPI

Database

* Supabase Postgres
* Row Level Security (RLS)
* RPC driven domain logic

Infra (In Progress)

* Redis (rate limit layer)

Future Infra

* Selective cache via Redis
* CI/CD
* Observability

---

# 3. High Level Architecture

Browser
→ Frontend SPA
→ Backend API (FastAPI)
→ Supabase Postgres (RLS + RPC)

(Added 2026-03-03)
→ Redis
→ TokenBucket (engine)
→ RateLimiter (service layer)

Principles

* Database enforces security and invariants
* Backend orchestrates flows only
* Backend does NOT duplicate DB rules
* Frontend manages UI + local state
* Prefer re-fetch over optimistic update (for now)
* Redis is performance layer only
* Service layer abstracts infrastructure

---

# 4. Repository Structure

```
ai-note-knowledge/

infra/
  supabase/
    migrations/
    seed.sql

services/
  backend/
    app/
      auth/
        deps.py
      cache/
        helper.py
      contracts/
        member.py
        note.py
        request.py
        tenant.py
      core/
        dependencies.py
        network.py
        rate_limit.py
        redis.py
      db/
        client.py
        membership_requests.py
        membership.py
        notes.py
        shares.py
        tenants.py
      errors/
        db.py
        http.py
      http/
        response.py
      middleware/
        rate_limit.py
      routers/
        me.py
        members.py
        notes.py
        requests.py
        tenants.py
      main.py
    tests/
      contract/
      integration/

frontend/
  src/
    api/
      services/
        auth.ts
        me.ts
        tenant.ts
        note.ts
        request.ts
    components/
      ui/
        button.ts
        input.ts
        alert.ts
        modal.ts
        spinner.ts
      tenant/
        createTenantDialog.ts
        tenantCard.ts
      note/
        noteCard.ts
    core/
      router.ts
      state.ts
    pages/
      login.ts
      signup.ts
      dashboard.ts
      workspace/
        index.ts
        notesSection.ts
    styles.css
```

Rate Limit Modules (New)

* core/rate_limit.py

  * TokenBucket (Redis engine)
  * RateLimiter (service abstraction)
* core/dependencies.py

  * get_limiter()
* routers rate_limit dependency factory

Rules

* Router depends on RateLimiter only
* TokenBucket must NEVER be used directly in routers
* app.state stores limiter (not bucket)

---

# 5. Backend Status

Backend is functionally complete and stable.

Completed

* Tenant management
* Membership workflows
* Notes CRUD
* Sharing system
* Full RLS security
* RPC based domain logic
* HTTP layer stabilization
* E2E tests passing

Rate Limit Refactor (2026-03-03)

* Introduced TokenBucket (Redis atomic Lua logic)
* Introduced RateLimiter service layer
* Removed direct bucket dependency from middleware
* Replaced get_bucket() with get_limiter()
* app.state.bucket → app.state.limiter
* Middleware now delegates to RateLimiter.check()

Important rule

* Backend MUST NOT contain migrations
* All schema lives in `infra/supabase/migrations`

---

# 6. Frontend Status

Frontend baseline architecture completed.

Implemented

* Router system
* Global state (activeTenantId)
* Auth session restore
* Reusable UI components
* Full notes CRUD flow

State Strategy

* Local component state only
* Global store holds activeTenantId
* Re-fetch after mutation
* No optimistic update
* No central cache

---

# 7. Data Model Summary

Core entities

* tenants
* users
* tenant_members
* tenant_join_requests
* notes
* note_shares
* audit_logs

Important invariants

* Tenant must always have at least one owner
* Only owner can change roles
* Last owner cannot be removed
* RLS guarantees tenant isolation

---

# 8. API Surface (Stable)

User (Me)
GET    /me/tenants
GET    /me/invites/pending
GET    /me/requests
GET    /me/notes/shared

Tenant CRUD
POST   /tenants
GET    /tenants
DELETE /tenants/{tenant_id}

Tenant Members
POST   /tenants/{tenant_id}/members/{user_id}/role
DELETE /tenants/{tenant_id}/members/{user_id}

Join Requests
POST   /tenants/{tenant_id}/requests/join
POST   /requests/{request_id}/approve
POST   /requests/{request_id}/reject
POST   /requests/{request_id}/cancel

Invites
POST   /tenants/{tenant_id}/invites
POST   /requests/{request_id}/accept
POST   /requests/{request_id}/decline
POST   /requests/{request_id}/revoke

Tenant Notes
POST   /tenants/{tenant_id}/notes
GET    /tenants/{tenant_id}/notes

Notes (Global)
GET    /notes
GET    /notes/{note_id}
PATCH  /notes/{note_id}
DELETE /notes/{note_id}

Note Shares
POST   /notes/{note_id}/shares
GET    /notes/{note_id}/shares
DELETE /notes/{note_id}/shares/{target_user_id}

---

# 9. Architecture Decisions

Database owns business rules

Re-fetch over optimistic update

SWR adopted

Vanilla frontend before React

Service layer for infrastructure abstraction (RateLimiter)

---

# 10. Latest Implemented Tasks

**2026-03-03 - Rate Limiter Refactor (Service Layer Architecture)**

* TokenBucket isolated as low-level engine
* RateLimiter introduced as abstraction layer
* Dependency updated to get_limiter()
* Middleware no longer aware of TokenBucket
* Clean layered architecture achieved

---

# 11. Known Problems / Tech Debt

* Router re-renders entire page
* No centralized data cache
* No normalization layer
* No optimistic updates
* Limited observability
* Rate limit metrics not yet implemented

---

# 12. Current Focus & Next Tasks

Current Focus

* Finalize Redis bootstrap in main.py
* Protect login endpoint
* Add user-based limit
* Add tenant-based limit
* Ensure Redis failure does NOT break API

Cache (Next Phase)

1. Identify safe cache endpoints (dashboard / aggregation only)
2. Implement cache-aside helper
3. Add TTL (30–60s)
4. DEL cache on write endpoints
5. Do NOT cache transactional data
6. Add hit/miss logging
7. Measure latency before/after

---

# 13. Long Term Roadmap

System Engineering

* Observability
* Performance profiling
* Production deployment

Infrastructure

* Redis selective cache
* Docker hardening
* CI/CD

Frontend Evolution

* Potential React migration
* Possible central cache introduction

---

# 14. Working Principles

* Database is the source of truth
* Redis is performance layer only
* No duplicated domain logic
* Security enforced at data layer
* Stability over cleverness
* Refactor when architecture pressure appears
* Abstract infrastructure behind services
