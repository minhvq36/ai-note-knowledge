<!--
IMPORTANT RULES

1. Keep this file under 1000 lines
2. Prefer rewriting over appending
3. This file is the shared context between reasoning AI and coding agents
4. Update after major architectural changes
5. Keep information concise and factual
-->

# CONTEXT PROCESS

Last Updated: 2026-02-23 (Enterprise Layout Pattern - Flex Structure Refactor)
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
      services/
        auth.ts (with signUp method)
        me.ts
        tenant.ts (with create method)
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
      router.ts (with SIGNUP route)
      state.ts (with setActiveTenantId method)
    pages/
      login.ts
      signup.ts
      dashboard.ts
      workspace/
        index.ts
        notesSection.ts
    pages/
      login.ts
      signup.ts
      dashboard.ts
      workspace/
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
* Alert/notification component
* Modal component
* Spinner component
* NoteService (listByTenant, create, update, delete)
* Note data contracts
* NoteCard component (v0 with actions support)
* NotesSection component

Working features

* Login page
* Signup page
* Dashboard (tenant switcher + create tenant)
* Workspace page (with sidebar navigation)

Not implemented

* Notes list UI component
* Create/edit note UI
* Delete note UI
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

# 10. Compress 1-3 Latest Implemented Tasks (Agent Coding Part)

Backend

* Full RPC surface implemented
* HTTP endpoints validated
* Security verified with negative tests

Frontend

* Router working (with /signup route)
* State store working (with setActiveTenantId method)
* Auth session restore
* Dashboard tenant selection + create workspace
* Workspace base layout
* **Auth Flows (Signup)**
  - SignupPage: email + password + confirm password form
  - AuthService.signUp() method integrated with Supabase
  - Form validation: password match, min 6 chars
  - Error handling with Alert notifications
  - Success: redirect to login
  - LoginPage links to /signup route
* **Alert/Notification Component**
  - Reusable Alert component with types: error, success, warning, info
  - Dismissible alerts (click × closes)
  - Animations: slideUp 200ms
  - Used in Login, Signup, and Dialog forms
* **Create Tenant Flow (COMPLETE)**
  - TenantService.create(name) - POST /tenants
  - Dashboard "Create Workspace" button
  - Modal-based form (reusable Modal component)
  - CreateTenantDialog component for form UI
  - Form validation: name not empty
  - State management: store.setActiveTenantId(tenant_id)
  - Workspace page fetches full tenant details
  - Error handling: show alert, user can retry
  - Success: navigate to /workspace
* **Modal Component (REFACTORED)**
  - Reusable Modal wrapper: takes { title, content, footer, onClose }
  - Close button with SVG icon
  - Support dismiss on overlay click
  - Support Escape key to close
  - Accessibility: role=dialog, aria-modal
  - CSS: backdrop-filter blur, proper centering
  - Animation: fadeIn overlay + slideUp content
  - Max-width 480px, responsive to 90% on mobile
* **NoteService Implementation (NEW)**
  - NoteService.listByTenant(tenantId) - GET /tenants/{tenantId}/notes
  - NoteService.create(tenantId, payload) - POST /tenants/{tenantId}/notes
  - NoteService.update(noteId, payload) - PATCH /notes/{noteId}
  - NoteService.delete(noteId) - DELETE /notes/{noteId}
  - Note contracts defined: Note, CreateNoteRequest/Response, UpdateNoteRequest/Response, DeleteNoteResponse, ListTenantNotesResponse
  - Follows TenantService pattern (returns ApiResponse<T>)
  - Ready for integration with NotesSection component
* **NotesSection Component (NEW)**
  - Full notes CRUD UI component
  - Fetches notes on mount: NoteService.listByTenant(tenantId)
  - Renders:
    - Loading state while fetching
    - Error alert if fetch fails
    - Grid of note cards (250px min-width, auto-fill)
    - Each card shows pseudo-title (first 40 chars), preview content, creation date
    - Edit and Delete buttons on hover
    - Empty state: "No notes yet. Create your first note!"
  - Create Note:
    - "+ New Note" button opens modal with textarea
    - Modal validates content not empty
    - On save: POST to NoteService.create(), re-fetches list on success
  - Edit Note:
    - Edit button opens modal with prefilled content
    - Supports multi-line content (textarea)
    - On update: PATCH to NoteService.update(), re-fetches list on success
  - Delete Note:
    - Delete button shows confirmation modal
    - On confirm: DELETE to NoteService.delete(), re-fetches list on success
  - Local state: notes[], loading, error, editingNoteId
  - No global state pollution (store.activeTenantId used only for fetch)
  - Integrated into workspace page: replaces inline notes section
* **NoteCard Component (v0 Integration)**
  - Reusable card component for displaying individual notes
  - Extends v0 interface with actions support:
    - title: Pseudo-title from note content (first 40 chars)
    - body: Full note content (clamped to 2 lines in UI)
    - date: Creation date formatted as locale date string
    - actions: Array of {label, onClick, className}
  - Renders:
    - Title section
    - Body with 2-line text clamp (-webkit-line-clamp)
    - Meta section (date displayed)
    - Actions buttons (Edit, Delete) with custom styling
  - Accessibility: role="button", tabindex="0", keyboard support (Enter/Space)
  - Styling: hover effects, action button variants (edit/delete with color hints)
  - Used by NotesSection to render each note in grid layout
- **Updated Workspace Page**
  - Imports and uses createNotesSection component
  - Passes store.activeTenantId to component
  - Cleaner architecture: workspace page focuses on layout, NotesSection handles notes logic
* **SWR Pattern (Stale-While-Revalidate) Implementation**
  - Problem: After create/edit/delete, list was cleared → loading → new list rendered = FLICKER
  - Solution: Keep old data while revalidating in background (enterprise pattern)
  - State changes:
    - `loading: boolean` → `isInitialLoading: boolean` + `isFetching: boolean`
    - Initial load: set isInitialLoading=true, show loading state
    - Revalidation: set isFetching=true, KEEP old data, DON'T clear list
  - Render logic:
    - Initial load (no data): "Loading notes..."
    - Revalidation (has data): render notes + show small "Syncing..." spinner at bottom
    - Error during revalidation: show error banner above notes (keeps data visible)
    - Empty state: "No notes yet. Create your first note!"
  - Benefits:
    - No flicker on create/edit/delete operations
    - Instant UI feedback (old data stays visible)
    - Background sync with "Syncing..." indicator
    - Better UX for slower networks
* **Spinner Component (New UI Component)**
  - Reusable loading indicator component
  - Supports 3 sizes: sm, md, lg
  - Optional label parameter for text (e.g., "Syncing...")
  - CSS classes: `.spinner`, `.spinner--sm`, `.spinner--md`, `.spinner--lg`
  - Uses spin animation (0.8s linear infinite)
  - Used by NotesSection for revalidation indicator during SWR pattern
  - Cleaner than inline HTML creation
* **Enterprise Layout Pattern (Flex Structure Refactor)**
  - Problem: Content wasn't filling available space, scrolling was janky
  - Solution: Proper flex layout with height constraints
  - Key principles:
    - Use `flex: 1` to fill available space
    - Use `min-height: 0` to allow children to shrink below content size
    - Use `overflow-y: auto` for independent scrolling
  - Layout hierarchy:
    - `.page-workspace`: `flex` container (sidebar + main)
    - `.workspace-main`: `flex: 1`, column layout
    - `.workspace-content`: `flex: 1`, column layout, `min-height: 0`
    - `#notesSection`: `flex: 1`, column layout, `min-height: 0`
    - `.notes-content`: `flex: 1`, `overflow-y: auto` (scrollable container)
  - NotesSection styling:
    - Header (buttons): `flex-shrink: 0` (stays at top)
    - Content container: `flex: 1`, `overflow-y: auto` (scrolls independently)
    - Cards: `width: 100%`, `max-width: 720px` (centered column layout)
    - List: `flex-direction: column`, `align-items: center` (centered stack)
  - `.hidden` utility class added for section visibility toggling
  - Result: Proper scrolling, no layout jumps, clean responsive design

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
