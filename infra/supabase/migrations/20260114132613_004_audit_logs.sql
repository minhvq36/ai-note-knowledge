-- Audit logs table for tracking actions
create table audit_logs (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade,
    actor_id uuid references users(id) on delete set null,
    action text not null,
    target_type text not null,
    target_id uuid,
    metadata jsonb not null default '{}',
    created_at timestamptz not null default now()
);

/*TO TEST*/
/* Prevent update & delete: audit logs are append-only */
create or replace function public.prevent_audit_log_mutation()
returns trigger 
language plpgsql
set search_path = public
as $$
begin
    raise exception 'audit_logs are immutable';
end;
$$;

/* Block UPDATE */
create trigger audit_logs_no_update
before update on audit_logs
for each row
execute function prevent_audit_log_mutation();

/* Block DELETE */
create trigger audit_logs_no_delete
before delete on audit_logs
for each row
execute function prevent_audit_log_mutation();

/* Optional indexes for query */
create index idx_audit_logs_tenant_time
on audit_logs (tenant_id, created_at desc);

create index idx_audit_logs_action
on audit_logs (action);

alter table audit_logs enable row level security;

CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
