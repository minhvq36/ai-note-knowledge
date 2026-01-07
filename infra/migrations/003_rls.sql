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

-- Allow only owners and admins to insert new tenant members
create policy "tenant_members_insert_owner_admin"
on tenant_members
for insert
with check (
    exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = tenant_members.tenant_id
          and tm.user_id = auth.uid()
          and tm.role in ('owner', 'admin')
    )
);

create policy "tenant_members_delete_self_or_owner"
on tenant_members
for delete
using (
    user_id = auth.uid()
    or exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = tenant_members.tenant_id
          and tm.user_id = auth.uid()
          and tm.role = 'owner'
    )
);

/* TO TEST */
-- RLS for tenant_join_requests table
alter table tenant_join_requests enable row level security;

-- Allow users to create their own join requests
create policy "tenant_join_request_insert_self"
on tenant_join_requests
for insert
with check (
    user_id = auth.uid()
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

-- Allow tenant owners and admins to update join request status
create policy "tenant_join_request_update_admin"
on tenant_join_requests
for update
using (
    exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = tenant_join_requests.tenant_id
          and tm.user_id = auth.uid()
          and tm.role in ('owner', 'admin')
    )
)
with check (
    status in ('approved', 'rejected')
);

