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
where status = 'pending';/*TO TEST*/

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    /*
    Sync auth.users to public.users.
    */

    insert into public.users (
        id,
        username,
        email
    )
    values (
        new.id, -- auth.users.id new record that triggered this
        split_part(new.email, '@', 1),
        new.email
    )
    on conflict (id) do nothing; -- in case of retries

    return new;
end;
$$;

/*
Trigger: fires after a new auth user is created
*/
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();
alter table notes enable row level security;
alter table note_shares enable row level security;

-- RLS for notes table
create policy "notes_select_member_owner_or_shared"
on notes
for select
using (
    /* User must be a member of the tenant */
    exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = notes.tenant_id
          and tm.user_id = auth.uid()
    )
    and (
        /* Owner can always read */
        owner_id = auth.uid()
        or
        /* Shared user can read */
        exists (
            select 1
            from note_shares ns
            where ns.note_id = notes.id
              and ns.user_id = auth.uid()
        )
    )
);

create policy "notes_insert_member_as_owner"
on notes
for insert
with check (
    owner_id = auth.uid()
    and exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = notes.tenant_id
          and tm.user_id = auth.uid()
    )
);

create policy "notes_update_owner_or_shared_write"
on notes
for update
using (
    exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = notes.tenant_id
          and tm.user_id = auth.uid()
    )
    and (
        owner_id = auth.uid()
        or exists (
            select 1
            from note_shares ns
            where ns.note_id = notes.id
              and ns.user_id = auth.uid()
              and ns.permission = 'write'
        )
    )
)
with check (
    /* Prevent tenant or owner hijacking */
    tenant_id = (
        select old.tenant_id
        from notes old
        where old.id = notes.id
    ) -- prevent changing tenant_id
    and (
        owner_id is null -- allow orphaned notes when owner is deleted
        or owner_id = (
            select old.owner_id
            from notes old
            where old.id = notes.id -- prevent changing owner_id
        )
    )
);

create policy "notes_delete_owner_only"
on notes
for delete
using (
    owner_id = auth.uid()
    and exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = notes.tenant_id
          and tm.user_id = auth.uid()
    )
);

-- RLS for note_shares table
create policy "note_shares_select_owner_or_shared"
on note_shares
for select
using (
    exists (
        select 1
        from notes n
        join tenant_members tm
          on tm.tenant_id = n.tenant_id
         and tm.user_id = auth.uid() -- member of the tenant
        where n.id = note_shares.note_id
          and (
              n.owner_id = auth.uid() -- owner
              or note_shares.user_id = auth.uid() -- shared user
          )
    )
);

create policy "note_shares_insert_note_owner_only"
on note_shares
for insert
with check (
    exists (
        select 1
        from notes n
        join tenant_members tm
          on tm.tenant_id = n.tenant_id
         and tm.user_id = auth.uid()
        join tenant_members target
          on target.tenant_id = n.tenant_id
         and target.user_id = note_shares.user_id
        where n.id = note_shares.note_id
          and n.owner_id = auth.uid()
    )
);

create policy "note_shares_update_owner_only"
on note_shares
for update
using (
    exists (
        select 1
        from notes n
        where n.id = note_shares.note_id
          and n.owner_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from notes n
        where n.id = note_shares.note_id
          and n.owner_id = auth.uid()
    )
);

create policy "note_shares_delete_owner_only"
on note_shares
for delete
using (
    exists (
        select 1
        from notes n
        where n.id = note_shares.note_id
          and n.owner_id = auth.uid()
    )
);

-- RLS for tenant_members table
alter table tenant_members enable row level security;

-- Allow users to see their own tenant memberships
create policy "tenant_members_select_same_tenant"
on tenant_members
for select
using (
    exists (
        select 1
        from tenant_members self
        where self.tenant_id = tenant_members.tenant_id
          and self.user_id = auth.uid()
    )
);

/* TO TEST */
-- RLS for tenant_join_requests table
alter table tenant_join_requests enable row level security;

-- Allow users to create their own join requests
create policy "tenant_join_request_insert_self"
on tenant_join_requests -- insert on tenant_join_requests table
for insert
with check (
    user_id = auth.uid()
    and initiated_by = auth.uid()
    and direction = 'join' 
    and not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = tenant_join_requests.tenant_id
          and tm.user_id = auth.uid()
    )
);

-- Allow users to see their own join requests
create policy "tenant_join_request_select_self"
on tenant_join_requests
for select
using (
    user_id = auth.uid()
    or initiated_by = auth.uid() -- allow initiators to see requests/invites they made
);

-- Allow tenant owners and admins to see all join requests for their tenants
create policy "tenant_join_request_select_admin"
on tenant_join_requests
for select
using (
    exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = tenant_join_requests.tenant_id
          and tm.user_id = auth.uid()
          and tm.role in ('owner', 'admin')
    )
);

/* TO ADD USERS AND TENANTS POLICIES -> RPC I think*/

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
create or replace function prevent_audit_log_mutation()
returns trigger as $$
begin
    raise exception 'audit_logs are immutable';
end;
$$ language plpgsql;

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
/*TO TEST*/
/*TO CONSIDER IF RETURN STRUCTURE RESULT*/

create or replace function public.create_tenant(
    p_name text
)
returns uuid
language plpgsql
security definer
as $$
declare
    v_tenant_id uuid;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Basic validation */
    if p_name is null or length(trim(p_name)) = 0 then
        raise exception 'Tenant name must not be empty';
    end if;

    /* Create tenant */
    insert into tenants (
        id,
        name,
        created_at
    )
    values (
        gen_random_uuid(),
        trim(p_name),
        now()
    )
    returning id
    into v_tenant_id;

    /* Insert first owner */
    insert into tenant_members (
        tenant_id,
        user_id,
        role,
        created_at
    )
    values (
        v_tenant_id,
        auth.uid(),
        'owner',
        now()
    );

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        v_tenant_id,
        auth.uid(),
        'tenant.create',
        jsonb_build_object(
            'tenant_name', p_name
        ),
        now()
    );

    return v_tenant_id;
end;
$$;
/*
Change the role of a tenant member.

Rules / Cases:
1. Only tenant owners can change roles.
2. The owner can downgrade themselves or another owner.
3. Cannot downgrade the last owner of the tenant.
4. Tenant always has ≥ 1 owner.
5. Audit log is created for the role change.
6. Supports concurrent calls safely (FOR UPDATE lock).
7. Valid roles: 'owner', 'admin', 'member'.
*/

create or replace function public.change_tenant_member_role(
    p_tenant_id uuid,
    p_target_user_id uuid,
    p_new_role text
)
returns void
language plpgsql
security definer
as $$
declare
    v_owner_count int;
begin
    /* Ensure search path */
    execute 'set local search_path = public';

    /* Validate role */
    if p_new_role not in ('owner', 'admin', 'member') then
        raise exception 'Invalid role: %', p_new_role;
    end if;

    /* Caller must be an owner of the tenant */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = auth.uid()
          and tm.role = 'owner'
    ) then
        raise exception 'Only tenant owner can change roles';
    end if;

    /* Target user must be a member of the tenant */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = p_target_user_id
    ) then
        raise exception 'Target user is not a member of the tenant';
    end if;

    /* If downgrading an owner, ensure not last owner */
    if p_new_role <> 'owner' then

        -- Lock all current owners for this tenant to prevent race
        select count(*) 
        into v_owner_count
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.role = 'owner'
        for update; -- lock to prevent race conditions, other transactions must wait

        if v_owner_count = 1 and exists (
            select 1
            from tenant_members tm
            where tm.tenant_id = p_tenant_id
              and tm.user_id = p_target_user_id
              and tm.role = 'owner'
        ) then
            raise exception 'Cannot downgrade the last owner of the tenant';
        end if;

    end if;

    /* Apply role change */
    update tenant_members
    set role = p_new_role
    where tenant_id = p_tenant_id
      and user_id = p_target_user_id;

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        p_tenant_id,
        auth.uid(),
        'tenant.member.change_role',
        jsonb_build_object(
            'target_user_id', p_target_user_id,
            'new_role', p_new_role
        ),
        now()
    );
end;
$$;
/*
1. User must be authenticated.
2. Target tenant must exist.
3. A user who is already a tenant member CANNOT request to join again.
4. At most ONE active (pending) request can exist per (tenant, user).
5. Join request and invite request MUST NOT coexist in pending state.
6. Membership is NEVER created here (approval is a separate RPC).
*/

create or replace function public.request_join_tenant(
    p_tenant_id uuid
)
returns table (
    request_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_request_id uuid;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Ensure tenant exists */
    if not exists (
        select 1
        from tenants t
        where t.id = p_tenant_id
    ) then
        raise exception 'Tenant not found';
    end if;

    /* Prevent request if user is already a member */
    if exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = auth.uid()
    ) then
        raise exception 'User is already a tenant member';
    end if;

    /* If there is a pending JOIN request → idempotent return */
    select tjr.id
    into v_request_id
    from tenant_join_requests tjr
    where tjr.tenant_id = p_tenant_id
      and tjr.user_id = auth.uid()
      and tjr.direction = 'join'
      and tjr.status = 'pending';

    if v_request_id is not null then
        request_id := v_request_id;
        result := 'already_pending';
        return next; -- append to result set to return
        return;
    end if;

    /* If there is a pending INVITE → block with explicit state */
    if exists (
        select 1
        from tenant_join_requests tjr
        where tjr.tenant_id = p_tenant_id
          and tjr.user_id = auth.uid()
          and tjr.direction = 'invite'
          and tjr.status = 'pending'
    ) then
        request_id := null;
        result := 'blocked_by_invite';
        return next; -- append to result set to return
        return;
    end if;

    /* Create new join request */
    insert into tenant_join_requests (
        id,
        tenant_id,
        user_id,
        initiated_by,
        direction,
        status,
        created_at
    )
    values (
        gen_random_uuid(),
        p_tenant_id,
        auth.uid(),
        auth.uid(),
        'join',
        'pending',
        now()
    )
    returning id
    into v_request_id;

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        p_tenant_id,
        auth.uid(),
        'tenant.join_request.create',
        jsonb_build_object(
            'request_id', v_request_id
        ),
        now()
    );

    request_id := v_request_id;
    result := 'created';
    return next; -- append to result set to return
    return;
end;
$$;
/*
Invite a user to join a tenant.

Rules:
1. Caller must be authenticated.
2. Caller must be owner or admin of the tenant.
3. Target user must exist.
4. Target user must NOT already be a tenant member.
5. At most ONE active (pending) request may exist per (tenant, user).
6. Join request and invite request MUST NOT coexist in pending state.
7. Membership is NOT created here (approval is a separate RPC).
*/

create or replace function public.invite_user_to_tenant(
    p_tenant_id uuid,
    p_target_user_id uuid
)
returns table (
    request_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_request_id uuid;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Ensure tenant exists */
    if not exists (
        select 1
        from tenants t
        where t.id = p_tenant_id
    ) then
        raise exception 'Tenant not found';
    end if;

    /* Caller must be owner or admin */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = auth.uid()
          and tm.role in ('owner', 'admin')
    ) then
        raise exception 'Permission denied';
    end if;

    /* Target user must exist */
    if not exists (
        select 1
        from users u
        where u.id = p_target_user_id
    ) then
        raise exception 'Target user not found';
    end if;

    /* Prevent inviting an existing member */
    if exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = p_target_user_id
    ) then
        raise exception 'User is already a tenant member';
    end if;

    /* If there is a pending INVITE → idempotent return */
    select tjr.id
    into v_request_id
    from tenant_join_requests tjr
    where tjr.tenant_id = p_tenant_id
      and tjr.user_id = p_target_user_id
      and tjr.direction = 'invite'
      and tjr.status = 'pending';

    if v_request_id is not null then
        request_id := v_request_id;
        result := 'already_invited';
        return next;
        return;
    end if;

    /* If there is a pending JOIN request → block */
    if exists (
        select 1
        from tenant_join_requests tjr
        where tjr.tenant_id = p_tenant_id
          and tjr.user_id = p_target_user_id
          and tjr.direction = 'join'
          and tjr.status = 'pending'
    ) then
        request_id := null;
        result := 'blocked_by_join_request';
        return next;
        return;
    end if;

    /* Create invite request */
    insert into tenant_join_requests (
        id,
        tenant_id,
        user_id,
        initiated_by,
        direction,
        status,
        created_at
    )
    values (
        gen_random_uuid(),
        p_tenant_id,
        p_target_user_id,
        auth.uid(),
        'invite',
        'pending',
        now()
    )
    returning id
    into v_request_id;

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        p_tenant_id,
        auth.uid(),
        'tenant.invite.create',
        jsonb_build_object(
            'request_id', v_request_id,
            'target_user_id', p_target_user_id
        ),
        now()
    );

    request_id := v_request_id;
    result := 'created';
    return next;
    return;
end;
$$;
/*
Approve a join request for a tenant.

Rules / Cases:
1. Caller must be authenticated.
2. Caller must be owner or admin of the tenant.
3. Target join request must exist.
4. Only pending join requests can be approved.
5. Direction MUST be 'join'; invite requests cannot be approved here.
6. Membership is created only after approval.
7. Audit log is created for the approval action.
8. Duplicate approvals or non-pending requests raise an error.
*/

create or replace function public.approve_join_request(
    p_request_id uuid
)
returns table (
    request_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_request tenant_join_requests%rowtype;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Fetch the join request */
    select *
    into v_request
    from tenant_join_requests
    where id = p_request_id;

    if not found then
        raise exception 'Join request not found';
    end if;

    /* Ensure request is a JOIN request */
    if v_request.direction <> 'join' then
        raise exception 'Cannot approve invite request';
    end if;

    /* Ensure request is pending */
    if v_request.status <> 'pending' then
        raise exception 'Only pending requests can be approved';
    end if;

    /* Ensure caller is owner/admin of the tenant */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = v_request.tenant_id
          and tm.user_id = auth.uid()
          and tm.role in ('owner', 'admin')
    ) then
        raise exception 'Permission denied';
    end if;

    /* Approve the request */
    update tenant_join_requests
    set status = 'approved',
        decided_by = auth.uid(),
        decided_at = now()
    where id = p_request_id;

    /* Create tenant membership */
    insert into tenant_members (
        tenant_id,
        user_id,
        role,
        created_at
    )
    values (
        v_request.tenant_id,
        v_request.user_id,
        'member', /* default role */
        now()
    )
    on conflict do nothing; -- in case membership exists

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        v_request.tenant_id,
        auth.uid(),
        'tenant.join_request.approve',
        jsonb_build_object(
            'request_id', p_request_id,
            'user_id', v_request.user_id
        ),
        now()
    );

    request_id := p_request_id;
    result := 'approved';
    return next;
    return;
end;
$$;
/*
Reject a join request for a tenant.

Rules / Cases:
1. Caller must be authenticated.
2. Caller must be owner or admin of the tenant.
3. Target join request must exist.
4. Only pending join requests can be rejected.
5. Direction MUST be 'join'; invite requests cannot be rejected here.
6. Membership is NOT created.
7. Audit log is created for the rejection action.
8. Duplicate rejects or non-pending requests raise an error.
*/

create or replace function public.reject_join_request(
    p_request_id uuid
)
returns table (
    request_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_request tenant_join_requests%rowtype;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Fetch the join request */
    select *
    into v_request
    from tenant_join_requests
    where id = p_request_id;

    if not found then
        raise exception 'Join request not found';
    end if;

    /* Ensure request is a JOIN request */
    if v_request.direction <> 'join' then
        raise exception 'Cannot reject invite request';
    end if;

    /* Ensure request is pending */
    if v_request.status <> 'pending' then
        raise exception 'Only pending requests can be rejected';
    end if;

    /* Ensure caller is owner/admin of the tenant */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = v_request.tenant_id
          and tm.user_id = auth.uid()
          and tm.role in ('owner', 'admin')
    ) then
        raise exception 'Permission denied';
    end if;

    /* Reject the request */
    update tenant_join_requests
    set status = 'rejected',
        decided_by = auth.uid(),
        decided_at = now()
    where id = p_request_id;

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        v_request.tenant_id,
        auth.uid(),
        'tenant.join_request.reject',
        jsonb_build_object(
            'request_id', p_request_id,
            'user_id', v_request.user_id
        ),
        now()
    );

    request_id := p_request_id;
    result := 'rejected';
    return next;
    return;
end;
$$;
/*
Accept an invite to join a tenant.

Rules / Cases:
1. Caller must be authenticated.
2. Target invite request must exist.
3. Only pending invite requests can be accepted.
4. Direction MUST be 'invite'; join requests cannot be accepted here.
5. Only the invited user can accept the invite.
6. Membership is created only after acceptance.
7. Audit log is created for the acceptance action.
8. Duplicate acceptances or non-pending invites raise an error.
*/

create or replace function public.accept_invite(
    p_request_id uuid
)
returns table (
    request_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_request tenant_join_requests%rowtype;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Fetch the invite request */
    select *
    into v_request
    from tenant_join_requests
    where id = p_request_id;

    if not found then
        raise exception 'Invite request not found';
    end if;

    /* Ensure request is an INVITE request */
    if v_request.direction <> 'invite' then
        raise exception 'Cannot accept join request';
    end if;

    /* Ensure request is pending */
    if v_request.status <> 'pending' then
        raise exception 'Only pending invites can be accepted';
    end if;

    /* Ensure caller is the invited user */
    if v_request.user_id <> auth.uid() then
        raise exception 'Permission denied: only invited user can accept';
    end if;

    /* Accept the invite */
    update tenant_join_requests
    set status = 'approved',
        decided_by = auth.uid(),
        decided_at = now()
    where id = p_request_id;

    /* Create tenant membership */
    insert into tenant_members (
        tenant_id,
        user_id,
        role,
        created_at
    )
    values (
        v_request.tenant_id,
        v_request.user_id,
        'member', /* default role */
        now()
    )
    on conflict do nothing; -- in case membership exists

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        v_request.tenant_id,
        auth.uid(),
        'tenant.invite.accept',
        jsonb_build_object(
            'request_id', p_request_id,
            'user_id', v_request.user_id
        ),
        now()
    );

    request_id := p_request_id;
    result := 'accepted';
    return next;
    return;
end;
$$;
/*
Decline an invite to join a tenant.

Rules / Cases:
1. Caller must be authenticated.
2. Target invite request must exist.
3. Only pending invite requests can be declined.
4. Direction MUST be 'invite'; join requests cannot be declined here.
5. Only the invited user can decline the invite.
6. Membership is NOT created.
7. Audit log is created for the decline action.
8. Duplicate declines or non-pending invites raise an error.
*/

create or replace function public.decline_invite(
    p_request_id uuid
)
returns table (
    request_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_request tenant_join_requests%rowtype;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Fetch the invite request */
    select *
    into v_request
    from tenant_join_requests
    where id = p_request_id;

    if not found then
        raise exception 'Invite request not found';
    end if;

    /* Ensure request is an INVITE request */
    if v_request.direction <> 'invite' then
        raise exception 'Cannot decline join request';
    end if;

    /* Ensure request is pending */
    if v_request.status <> 'pending' then
        raise exception 'Only pending invites can be declined';
    end if;

    /* Ensure caller is the invited user */
    if v_request.user_id <> auth.uid() then
        raise exception 'Permission denied: only invited user can decline';
    end if;

    /* Decline the invite */
    update tenant_join_requests
    set status = 'rejected',
        decided_by = auth.uid(),
        decided_at = now()
    where id = p_request_id;

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        v_request.tenant_id,
        auth.uid(),
        'tenant.invite.decline',
        jsonb_build_object(
            'request_id', p_request_id,
            'user_id', v_request.user_id
        ),
        now()
    );

    request_id := p_request_id;
    result := 'declined';
    return next;
    return;
end;
$$;
/*
Cancel a pending join request for a tenant.

Rules / Cases:
1. Caller must be authenticated.
2. Target join request must exist.
3. Only pending join requests can be cancelled.
4. Direction MUST be 'join'; invite requests cannot be cancelled here.
5. Only the user who created the join request can cancel it.
6. Membership is NOT created.
7. Audit log is created for the cancellation action.
8. Duplicate cancellations or non-pending requests raise an error.
*/

create or replace function public.cancel_join_request(
    p_request_id uuid
)
returns table (
    request_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_request tenant_join_requests%rowtype;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Fetch the join request */
    select *
    into v_request
    from tenant_join_requests
    where id = p_request_id;

    if not found then
        raise exception 'Join request not found';
    end if;

    /* Ensure request is a JOIN request */
    if v_request.direction <> 'join' then
        raise exception 'Cannot cancel invite request';
    end if;

    /* Ensure request is pending */
    if v_request.status <> 'pending' then
        raise exception 'Only pending requests can be cancelled';
    end if;

    /* Ensure caller is the user who created the request */
    if v_request.initiated_by <> auth.uid() then
        raise exception 'Permission denied: only requester can cancel';
    end if;

    /* Cancel the request */
    update tenant_join_requests
    set status = 'cancelled',
        decided_by = auth.uid(),
        decided_at = now()
    where id = p_request_id;

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        v_request.tenant_id,
        auth.uid(),
        'tenant.join_request.cancel',
        jsonb_build_object(
            'request_id', p_request_id,
            'user_id', v_request.user_id
        ),
        now()
    );

    request_id := p_request_id;
    result := 'cancelled';
    return next;
    return;
end;
$$;
/*
Cancel a pending invite to join a tenant.

Rules / Cases:
1. Caller must be authenticated.
2. Caller must be owner or admin of the tenant.
3. Target invite request must exist.
4. Only pending invite requests can be cancelled.
5. Direction MUST be 'invite'; join requests cannot be cancelled here.
6. Any owner or admin of the tenant can cancel the invite.
7. Membership is NOT created.
8. Audit log is created for the cancellation action.
9. Duplicate cancellations or non-pending invites raise an error.
*/

create or replace function public.cancel_invite(
    p_request_id uuid
)
returns table (
    request_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_request tenant_join_requests%rowtype;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Fetch the invite request */
    select *
    into v_request
    from tenant_join_requests
    where id = p_request_id;

    if not found then
        raise exception 'Invite request not found';
    end if;

    /* Ensure request is an INVITE request */
    if v_request.direction <> 'invite' then
        raise exception 'Cannot cancel join request';
    end if;

    /* Ensure request is pending */
    if v_request.status <> 'pending' then
        raise exception 'Only pending invites can be cancelled';
    end if;

    /* Ensure caller is owner or admin of the tenant */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = v_request.tenant_id
          and tm.user_id = auth.uid()
          and tm.role in ('owner', 'admin')
    ) then
        raise exception 'Permission denied: only tenant owner/admin can cancel';
    end if;

    /* Cancel the invite */
    update tenant_join_requests
    set status = 'cancelled',
        decided_by = auth.uid(),
        decided_at = now()
    where id = p_request_id;

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        v_request.tenant_id,
        auth.uid(),
        'tenant.invite.cancel',
        jsonb_build_object(
            'request_id', p_request_id,
            'target_user_id', v_request.user_id
        ),
        now()
    );

    request_id := p_request_id;
    result := 'cancelled';
    return next;
    return;
end;
$$;
/*
Leave a tenant (self leave).

Rules / Cases:
1. Caller must be authenticated.
2. Caller must be a member of the tenant.
3. Tenant must always have ≥ 1 owner.
4. If caller is the last owner, cannot leave.
5. Membership is removed.
6. Audit log is created for leave action.
7. Atomic transaction to prevent race conditions.
*/

create or replace function public.leave_tenant(
    p_tenant_id uuid
)
returns table (
    tenant_id uuid,
    user_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_owner_count int;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Ensure caller is a member of the tenant */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = auth.uid()
    ) then
        raise exception 'You are not a member of this tenant';
    end if;

    /* If caller is owner, ensure not the last owner */
    if exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = auth.uid()
          and tm.role = 'owner'
    ) then
        select count(*)
        into v_owner_count
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.role = 'owner'
        for update; -- lock owner rows to prevent race

        if v_owner_count = 1 then
            raise exception 'Cannot leave tenant as the last owner';
        end if;
    end if;

    /* Remove membership */
    delete from tenant_members
    where tenant_id = p_tenant_id
      and user_id = auth.uid();

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        p_tenant_id,
        auth.uid(),
        'tenant.member.leave',
        jsonb_build_object(
            'user_id', auth.uid()
        ),
        now()
    );

    tenant_id := p_tenant_id;
    user_id := auth.uid();
    result := 'left';
    return next;
    return;
end;
$$;
/*
Remove a tenant member (owner/admin action).

Roles hierarchy: Owner > Admin > Member

Remove rules:
- Member: can leave self, cannot remove anyone
- Admin: can remove member, cannot remove owner, cannot remove admin
- Owner: can remove anyone except last owner, can downgrade roles
- Last owner protection always enforced

Rules / Cases:
1. Caller must be authenticated.
2. Caller must be owner or admin.
3. Target must be a member of the tenant.
4. Role-based restriction enforced (see above hierarchy).
5. Membership is removed.
6. Audit log is created.
7. Atomic transaction to prevent race conditions.
*/

create or replace function public.remove_tenant_member(
    p_tenant_id uuid,
    p_target_user_id uuid
)
returns table (
    tenant_id uuid,
    removed_user_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_owner_count int;
    v_caller_role text;
    v_target_role text;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Fetch caller role */
    select role
    into v_caller_role
    from tenant_members
    where tenant_id = p_tenant_id
      and user_id = auth.uid();

    if v_caller_role is null then
        raise exception 'Caller is not a member of this tenant';
    end if;

    /* Only owner or admin can remove someone */
    if v_caller_role not in ('owner', 'admin') then
        raise exception 'Only tenant owner/admin can remove members';
    end if;

    /* Fetch target role */
    select role
    into v_target_role
    from tenant_members
    where tenant_id = p_tenant_id
      and user_id = p_target_user_id;

    if v_target_role is null then
        raise exception 'Target user is not a member of this tenant';
    end if;

    /* Role-based removal rules */
    if v_caller_role = 'admin' then
        if v_target_role in ('owner', 'admin') then
            raise exception 'Admin cannot remove owner or admin';
        end if;
    end if;

    /* If target is owner, ensure not last owner */
    if v_target_role = 'owner' then
        select count(*) 
        into v_owner_count
        from tenant_members
        where tenant_id = p_tenant_id
          and role = 'owner'
        for update; -- lock owner rows to prevent race

        if v_owner_count = 1 then
            raise exception 'Cannot remove the last owner of the tenant';
        end if;
    end if;

    /* Remove membership */
    delete from tenant_members
    where tenant_id = p_tenant_id
      and user_id = p_target_user_id;

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        p_tenant_id,
        auth.uid(),
        'tenant.member.remove',
        jsonb_build_object(
            'removed_user_id', p_target_user_id,
            'caller_role', v_caller_role,
            'target_role', v_target_role
        ),
        now()
    );

    tenant_id := p_tenant_id;
    removed_user_id := p_target_user_id;
    result := 'removed';
    return next;
    return;
end;
$$;
/*
Delete a tenant (owner-only, last owner must perform).

Rules / Cases:
1. Caller must be authenticated.
2. Tenant must exist.
3. Caller must be an owner of the tenant.
4. Only the last owner can delete the tenant.
5. All tenant-related data is deleted (cascade).
6. Audit log is created.
7. Atomic transaction to prevent race conditions.
*/

create or replace function public.delete_tenant(
    p_tenant_id uuid
)
returns table (
    tenant_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_owner_count int;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Ensure tenant exists */
    if not exists (
        select 1 from tenants t
        where t.id = p_tenant_id
    ) then
        raise exception 'Tenant not found';
    end if;

    /* Ensure caller is an owner */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = auth.uid()
          and tm.role = 'owner'
    ) then
        raise exception 'Only tenant owner can delete tenant';
    end if;

    /* Lock all owner rows and count */
    select count(*)
    into v_owner_count
    from tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.role = 'owner'
    for update; -- prevent race condition

    if v_owner_count > 1 then
        raise exception 'Cannot delete tenant: multiple owners exist, only last owner can delete';
    end if;

    /* Delete tenant row (cascade deletes tenant_members, notes, note_shares, join_requests) */
    delete from tenants
    where id = p_tenant_id;

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        p_tenant_id,
        auth.uid(),
        'tenant.delete',
        jsonb_build_object(
            'deleted_by', auth.uid(),
            'tenant_id', p_tenant_id
        ),
        now()
    );

    tenant_id := p_tenant_id;
    result := 'deleted';
    return next;
    return;
end;
$$;
