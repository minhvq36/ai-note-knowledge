# Implementation Tasks: Multi-tenant Markdown Notes

## Phase 0 — Research & Setup (P0)

1. Verify Supabase free tier compatibility and obtain connection details (Postgres + Auth).  
2. Draft Postgres RLS policies for shared-schema + `tenant_id`.  
3. Design FTS strategy (materialized `tsvector`, triggers or background indexer).  
4. Choose Redis queue pattern (Redis Streams or simple list + worker) and prototype a small worker.
5. Create Docker Compose skeleton: app, worker, redis, dev Postgres (optional local), admin UI.

## Phase 1 — Data Model & Contracts (P1)

1. Define SQL schema (tables: tenants, users, notes, note_versions, tags, note_tags, shares, audit_logs).  
2. Write RLS policies and unit tests that assert tenant isolation for all queries.  
3. Define API contracts (REST or minimal RPC): auth, notes CRUD, share endpoints, search, tags.  
4. Define idempotency contract: which endpoints accept `Idempotency-Key` and expected behavior.

## Phase 1.5 — Dev Environment & Quickstart (P1)

1. Add `docker-compose.yml` with services: `app`, `worker`, `redis`, `db` (or remote Supabase env variables).  
2. Add `Makefile` / scripts for `dev:up`, `dev:down`, `migrate`, `seed`, `worker:start`.

## Phase 2 — Core Implementation (P2)

1. Implement authentication integration (Supabase Auth or local auth) — ensure tokens are not stored in `localStorage` (use HttpOnly cookies).  
2. Implement notes CRUD with tenant enforcement and `note_versions` for auditability.  
3. Implement shares/ACLs with server-side authorization checks.  
4. Implement audit logging: append-only `audit_logs` table; write logger middleware to record `tenant_id`, `user_id`, `request_id`, action.

## Phase 3 — Search, Indexing & Background Work (P2)

1. Add `tsvector` column to `notes` (or materialized index table).  
2. Implement background indexer worker using Redis queue: on note create/update, enqueue index job; worker updates FTS fields.  
3. Add search API that uses Postgres FTS and respects tenant/ACL filters.

## Phase 4 — Reliability, Observability & Security (P3)

1. Add structured JSON logging with `tenant_id`, `request_id`, `user_id`; ensure logs are append-only at source.  
2. Add metrics and basic tracing hooks; instrument search/index latency and queue lengths.  
3. Implement idempotency key storage and dedup logic for critical endpoints.  
4. Add automated tests validating RLS policies, idempotency behavior, and sharing/ACL enforcement.

## Phase 5 — QA & Performance (P3)

1. Run integration tests against Docker Compose stack (or Supabase remote).  
2. Run load tests targeting the API (simulate thousands of concurrent users) and iterate on scaling config (worker count, DB pool, caching).  
3. Verify audit log immutability and retention policy.

## Deliverables

- `docker-compose.yml`, `Makefile` scripts  
- DB migrations and RLS policy SQL  
- `specs/001-multi-tenant-notes/spec.md`, `plan.md`, `tasks.md`  
- Automated tests for RLS, idempotency, ACLs  

## Notes

- Use Redis as a simple, cost-free queue replacement for Kafka/RabbitMQ.  
- Use Postgres FTS to replace OpenSearch; accept eventual consistency for indexing via background jobs.  
- Shared schema must be validated with automated RLS tests and security review before production data migration.
