<!--
IMPORTANT RULES

1. Keep this file under 1000 lines
2. Prefer rewriting over appending
3. This file is the shared context between reasoning AI and coding agents
4. Update after major architectural changes
5. Keep information concise and factual
-->

# CONTEXT PROCESS

Last Updated: 2026-02-23 (Workspace + Notes CRUD + SWR Stabilized)
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

* Redis (optional)
* CI/CD
* Observability

---

# 3. High Level Architecture

Browser
→ Frontend SPA
→ Backend API (FastAPI)
→ Supabase Postgres (RLS + RPC)

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
* UI variants (size, layout) use modifier classes, not new components

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

* Router system (login, signup, dashboard, workspace)
* Global state (activeTenantId)
* Auth session restore
* Alert component
* Modal component (reusable, variant-ready)
* Spinner component (sm/md/lg)
* Tenant creation flow (modal based)
* Workspace layout (flex refactor)
* NoteService (listByTenant, create, update, delete)
* NoteCard component
* NotesSection component (full CRUD)

Workspace + Notes Behavior

* Fetch notes by tenant
* Create note → POST → revalidate
* Edit note → PATCH → revalidate
* Delete note → DELETE → revalidate
* No optimistic update
* No central cache

State Strategy

* Local component state only
* Global store only holds activeTenantId
* Re-fetch after mutation
* Prefer consistency over cleverness

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

Tenant

POST   /tenants
GET    /tenants
DELETE /tenants/{tenant_id}

Membership

POST /tenants/{tenant_id}/requests/join
POST /requests/{request_id}/approve
POST /requests/{request_id}/reject
POST /requests/{request_id}/cancel
POST /tenants/{tenant_id}/invites
POST /requests/{request_id}/accept
POST /requests/{request_id}/decline
POST /requests/{request_id}/revoke

Notes

POST   /tenants/{tenant_id}/notes
GET    /tenants/{tenant_id}/notes
GET    /notes/{note_id}
PATCH  /notes/{note_id}
DELETE /notes/{note_id}

Notes design decision

* tenantId required only for list + create
* noteId sufficient for update/delete (RLS enforces ownership)

---

# 9. Architecture Decisions

Database owns business rules

Reason

* Strong consistency
* Security guaranteed
* Less duplicated logic

Re-fetch over optimistic update (current phase)

Reason

* No central cache layer
* No normalization layer
* No entity store
* Avoid stale mutation edge cases
* Simpler mental model

SWR (Stale‑While‑Revalidate) adopted

Reason

* Avoid flicker on mutation
* Keep previous data during background fetch
* Enterprise UX pattern

Vanilla frontend before React

Reason

* Understand routing
* Understand rendering
* Avoid framework abstraction early

Modal size via variant classes

Reason

* Size difference is visual concern
* Do not create separate modal components for small/large

---

# 10. Latest Implemented Tasks

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

Immediate Tasks

1. Members management UI
2. Settings panel logic
3. Improve error handling consistency
4. Improve tenant switching UX

Near Future

5. Observability hooks
6. Performance baseline
7. OpenAPI contract export

---

# 13. Long Term Roadmap

System Engineering

* Observability
* Performance profiling
* Production deployment

Infrastructure

* Redis (if justified)
* Docker
* CI/CD

Frontend Evolution

* Potential React migration
* Possible central cache introduction (TanStack Query style pattern)

---

# 14. Working Principles

* Database is the source of truth
* Routers stay simple
* No duplicated domain logic
* Security enforced at data layer
* Stability over cleverness
* UX smoothness without over‑engineering
* Refactor when architecture pressure appears
