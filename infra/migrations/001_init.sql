create table tenants (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    created_at timestamptz not null default now()
);

create table users (
    id uuid primary key, -- synced from auth.users.id
    username varchar(255) not null,
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
    owner_id uuid references users(id) on delete set null,
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
