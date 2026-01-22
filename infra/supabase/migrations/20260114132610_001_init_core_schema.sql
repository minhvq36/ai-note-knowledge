create table tenants (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table users ( -- bsoring user table synced with auth.users
    id uuid primary key, -- synced from auth.users.id
    email varchar(255) not null,
    created_at timestamptz not null default now()
);

create table tenant_members (
    tenant_id uuid not null references tenants(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade,
    role text not null check (role in ('owner', 'admin', 'member')),
    created_at timestamptz not null default now(),
    primary key (tenant_id, user_id)
);

create table notes (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade, -- note belongs to which tenant
    owner_id uuid references users(id) on delete set null default auth.uid(),
    content text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table note_shares (
    note_id uuid not null references notes(id) on delete cascade,
    user_id uuid not null references users(id) on delete cascade, -- the user who is shared the note
    permission text not null check (permission in ('read', 'write')),
    created_at timestamptz not null default now(),
    primary key (note_id, user_id)
);

/* TO TEST */
create table tenant_join_requests (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenants(id) on delete cascade, -- join what tenant
    user_id uuid not null references users(id) on delete cascade, -- who will join
    initiated_by uuid not null references users(id), -- who request or invite
    direction text not null check (direction in ('join', 'invite')),
    status text not null check (status in ('pending', 'approved', 'rejected', 'cancelled')),
    decided_by uuid references users(id), -- who approved/rejected
    decided_at timestamptz,
    created_at timestamptz not null default now() -- request/invite record created time
);

create unique index uq_tenant_user_active_request -- prevent duplicate active requests
on tenant_join_requests (tenant_id, user_id)
where status = 'pending';

-- Foreign Key Indexes for Performance
CREATE INDEX idx_notes_tenant_id ON public.notes(tenant_id);
CREATE INDEX idx_notes_owner_id ON public.notes(owner_id);
CREATE INDEX idx_tenant_members_user_id ON public.tenant_members(user_id);
CREATE INDEX idx_tenant_join_requests_tenant_id ON public.tenant_join_requests(tenant_id);
CREATE INDEX idx_tenant_join_requests_user_id ON public.tenant_join_requests(user_id);