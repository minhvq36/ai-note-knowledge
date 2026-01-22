alter table notes enable row level security;
alter table note_shares enable row level security;

/*
Check whether the current user can read a note.

Access is granted if:
- User belongs to the tenant AND
- User is:
  - tenant owner
  - tenant admin
  - note owner
  - or shared user
*/
create or replace function public.check_note_access(p_note_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1
        from notes n
        join tenant_members tm
          on tm.tenant_id = n.tenant_id
         and tm.user_id = auth.uid()
        left join note_shares ns
          on ns.note_id = n.id
         and ns.user_id = auth.uid()
        where n.id = p_note_id
          and (
              tm.role in ('owner', 'admin') -- tenant-level privilege
              or n.owner_id = auth.uid()    -- note owner
              or ns.user_id is not null     -- shared user
          )
    );
$$;
-- RLS for notes table
create policy "notes_select"
on notes
for select
using (
    owner_id = (select auth.uid())
    and exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = notes.tenant_id
          and tm.user_id = (select auth.uid())
    )
    or
    check_note_access(id)
);

create policy "notes_insert_member_as_owner"
on notes
for insert
with check (
    owner_id = (select auth.uid())
    and exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = notes.tenant_id
          and tm.user_id = (select auth.uid())
    )
);

create or replace function public.check_note_write_access(p_note_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1
        from notes n
        join tenant_members tm -- must be member of the tenant
          on tm.tenant_id = n.tenant_id
         and tm.user_id = auth.uid()
        left join note_shares ns
          on ns.note_id = n.id
         and ns.user_id = auth.uid()
        where n.id = p_note_id
          and (
                n.owner_id = auth.uid()
                or ns.permission = 'write'
          )
    );
$$;
create policy "notes_update_owner_or_shared_write"
on notes
for update
using (
    check_note_write_access(id)
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
    owner_id = (select auth.uid())
    and exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = notes.tenant_id
          and tm.user_id = (select auth.uid())
    )
); -- TODO: consider allowing tenant admins to delete notes or soft-delete

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
         and tm.user_id = (select auth.uid()) -- member of the tenant
        where n.id = note_shares.note_id
          and (
              n.owner_id = (select auth.uid()) -- owner
              or note_shares.user_id = (select auth.uid()) -- shared user
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
         and tm.user_id = (select auth.uid())
        join tenant_members target
          on target.tenant_id = n.tenant_id
         and target.user_id = note_shares.user_id
        where n.id = note_shares.note_id
          and n.owner_id = (select auth.uid())
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
          and n.owner_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1
        from notes n
        where n.id = note_shares.note_id
          and n.owner_id = (select auth.uid())
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
          and n.owner_id = (select auth.uid())
    )
);

-- RLS for tenant_members table
alter table tenant_members enable row level security;

-- Allow users to see their own tenant memberships
CREATE OR REPLACE FUNCTION auth_user_tenant_ids()
RETURNS TABLE (tenant_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT tenant_id
    FROM tenant_members
    WHERE user_id = (select auth.uid());
$$;
create policy "tenant_members_select_same_tenant"
on tenant_members
for select
using (
    -- User can see their own memberships
    user_id = (select auth.uid()) 
    OR 
    -- User can see memberships of tenants they belong to
    tenant_id IN (
        SELECT tenant_id FROM auth_user_tenant_ids()
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
    user_id = (select auth.uid())
    and initiated_by = (select auth.uid())
    and direction = 'join' 
    and not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = tenant_join_requests.tenant_id
          and tm.user_id = (select auth.uid())
    )
);

-- Allow users to see their own join requests or tenant admins to see requests
create policy "tenant_join_request_select_self_or_tenant_admin"
on tenant_join_requests for select
using (
    user_id = (select auth.uid())
    or initiated_by = (select auth.uid()) -- allow seeing own initiated requests
    or exists (
        select 1 from tenant_members tm 
        where tm.tenant_id = tenant_join_requests.tenant_id 
        and tm.user_id = (select auth.uid()) 
        and tm.role in ('owner', 'admin') -- allow tenant admins to see requests
    )
);

alter table tenants enable row level security;
alter table users enable row level security;

-- allow authenticated users to see other users (for displaying user info in shares, members, etc)
-- TODO: refine this policy if needed to limit exposed user info preventing leak emails or private info
create policy "users_select_all"
on users for select
to authenticated
using (true);

-- allow authenticated users to see tenants
create policy "tenants_select_public"
on tenants for select
to authenticated
using (true);

-- only Owner can update tenant info
create policy "tenants_update_owner_only"
on tenants for update
to authenticated
using (
    exists (
        select 1 from tenant_members tm
        where tm.tenant_id = tenants.id
        and tm.user_id = (select auth.uid())
        and tm.role = 'owner'
    )
)
with check (
    exists (
        select 1 from tenant_members tm
        where tm.tenant_id = tenants.id
        and tm.user_id = (select auth.uid())
        and tm.role = 'owner'
    )
);



