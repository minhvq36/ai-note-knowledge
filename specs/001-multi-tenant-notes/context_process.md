<!--
IMPORTANT RULES

1. Keep this file under 1000 lines
2. Prefer rewriting over appending
3. This file is the shared context between reasoning AI and coding agents
4. Update after major architectural changes
5. Keep information concise and factual
-->

# CONTEXT PROCESS

Last Updated: 2026-02-23 (Alert Component & Form Notifications)
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
* Database enforced permissions
* Thin backend adapter
* Simple predictable frontend

---

# 2. Tech Stack

Frontend

* Vanilla TypeScript
* DOM rendering
* Vite
* No frameworks

Backend

* FastAPI

Database

* Supabase Postgres
* RLS
* RPC driven domain logic

Future Infra

* Redis
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
* Backend orchestrates flows
* Backend does NOT duplicate DB rules
* Frontend responsible for UI and state

---

# 4. Repository Structure (Keep Updated)

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
    components/
      ui/
        button.ts
        input.ts
        alert.ts
    core/
    pages/
      login.ts
      signup.ts
      dashboard.ts
    styles.css
```

Rules

* Router: `src/core/router`
* Global state: `src/core/state`
* API client: `src/api`
* Components: `src/components`
* Pages compose components only

---

# 5. Backend Status

Backend is functionally complete.

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

Frontend architecture baseline completed.

Implemented

* Router system
* Global state
* Auth session restore
* Base UI layout

Working features

* Login page
* Dashboard (tenant switcher)
* Workspace page (in progress improvements)

Not implemented

* Notes UI
* Members management UI
* Settings panel logic

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

POST /tenants
GET /tenants
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

POST /tenants/{tenant_id}/notes
GET /notes/{note_id}
GET /notes
PATCH /notes/{note_id}
DELETE /notes/{note_id}

---

# 9. Architecture Decisions

Database owns business rules

Reason

* Strong consistency
* Security guaranteed
* Simpler backend

Vanilla frontend before React

Reason

* Understand routing
* Understand rendering
* Avoid framework magic

Single repository

Reason

* Simpler development
* Microservices not justified yet

---

# 10. Latest Implemented Tasks (Agent Coding Part)

Backend

* Full RPC surface implemented
* HTTP endpoints validated
* Security verified with negative tests

Frontend

* Router working
* State store working
* Auth session restore
* Dashboard tenant selection
* Workspace base layout
* **Signup flow (REFACTORED v2)**
  - Form: email + password + confirm (NO name field)
  - Alert component created for error notifications
  - Form notifications with animations (slideUp)
  - Error dismissible (click X to close)
  - Validation: password match, min 6 chars
  - Success: signup → redirect /login
  - LoginPage updated to use Alert component (consistent)
  - CSS: alert styles for error, success, warning, info types

---

# 11. Known Problems / Tech Debt

* Router re-renders entire page
* Workspace UI still evolving
* Some state flows can be simplified
* No observability yet

---

# 12. Current Focus & Next Tasks (Reasoning Parter Part)

Current Focus

Improve frontend workspace experience.

Immediate Tasks

1. Improve workspace layout
2. Implement notes list UI
3. Connect workspace with backend APIs
4. Improve tenant switching UX

Near Future

5. Members management UI
6. Settings panel
7. Error handling improvements

Backend Future

* Observability layer
* Performance baseline
* OpenAPI contract
* CI/CD pipeline

---

# 13. Long Term Roadmap

System Engineering

* Observability
* Performance profiling
* Production deployment

Infrastructure

* Redis
* Docker
* CI/CD

Frontend Evolution

* Possible React migration

---

# 14. Working Principles

* Database is the source of truth
* Routers stay simple
* No duplicated domain logic
* Security enforced at data layer
* Stability over speed
* Observability before scale
