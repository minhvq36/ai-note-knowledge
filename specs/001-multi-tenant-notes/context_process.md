<!--
IMPORTANT RULES

1. Keep this file under 1000 lines
2. Prefer rewriting over appending
3. This file is the shared context between reasoning AI and coding agents
4. Update after major architectural changes
5. Keep information concise and factual
-->

# CONTEXT PROCESS

Last Updated: 2026-02-24 (CORS Fix + Redis Planning)
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

Future Infra

* Redis (rate limit + selective cache)
* CI/CD
* Observability

---

# 3. High Level Architecture

Browser
→ Frontend SPA
→ Backend API (FastAPI)
→ Supabase Postgres (RLS + RPC)

(Planned addition)
→ Redis (rate limit + cache layer)

Principles

* Database enforces security and invariants
* Backend orchestrates flows only
* Backend does NOT duplicate DB rules
* Frontend manages UI + local state
* Prefer re-fetch over optimistic update (for now)

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
      contracts/
      db/
      errors/
      routers/
      main.py

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

Rules

* Router: `src/core/router`
* Global state: `src/core/state`
* API client: `src/api`
* Components: `src/components`
* Pages compose components only
* UI variants use modifier classes

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

---

# 10. Latest Implemented Tasks

**2026-02-24 - CORS Configuration Fix**

* Fixed CORS_ORIGINS env parsing
* Backend restarted successfully
* Branch: v0.6.1-middleware-messagebroker

---

# 11. Known Problems / Tech Debt

* Router re-renders entire page
* No centralized data cache
* No normalization layer
* No optimistic updates
* Limited observability

---

# 12. Current Focus & Next Tasks

Current Focus

* Improve workspace UX consistency
* Reduce UI friction
* Prepare Redis integration (rate limit + selective cache)

Rate Limit Checklist

1. Add Redis to docker-compose
2. Create Redis connection module
3. Implement middleware (Fixed window)
4. Protect login endpoint
5. Add user-based limit
6. Add tenant-based limit
7. Return HTTP 429 consistently
8. Redis failure must not break API

Cache Checklist

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

* Redis (rate limit + cache)
* Docker
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
