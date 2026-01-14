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
          and tm.user_id = (select auth.uid())
    )
    and (
        /* Owner can always read */
        owner_id = (select auth.uid())
        or
        /* Shared user can read */
        exists (
            select 1
            from note_shares ns
            where ns.note_id = notes.id
              and ns.user_id = (select auth.uid())
        )
    )
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

create policy "notes_update_owner_or_shared_write"
on notes
for update
using (
    exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = notes.tenant_id
          and tm.user_id = (select auth.uid())
    )
    and (
        owner_id = (select auth.uid())
        or exists (
            select 1
            from note_shares ns
            where ns.note_id = notes.id
              and ns.user_id = (select auth.uid())
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
    owner_id = (select auth.uid())
    and exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = notes.tenant_id
          and tm.user_id = (select auth.uid())
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
create policy "tenant_members_select_same_tenant"
on tenant_members
for select
using (
    exists (
        select 1
        from tenant_members self
        where self.tenant_id = tenant_members.tenant_id
          and self.user_id = (select auth.uid())
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
create policy "users_select_all"
on users for select
to authenticated
using (true);

-- only allow users to update their own account info
create policy "users_update_self_only"
on users for update
to authenticated
using ( (select auth.uid()) = id )
with check ( (select auth.uid()) = id );

-- only allow users to delete their own account
create policy "users_delete_self_only"
on users for delete
to authenticated
using ( (select auth.uid()) = id );

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



