alter table notes enable row level security;
alter table note_shares enable row level security;

/*
Check whether the current user can read a note.
*/
create or replace function public.check_note_access(
    p_tenant_id uuid,
    p_owner_id uuid,
    p_note_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    /*
        Access rules:
        1. User MUST be a member of the tenant
        2. AND one of:
           - tenant owner/admin
           - note owner
           - explicitly shared user
    */
    select
        /*
            Precondition: must be tenant member
        */
        exists (
            select 1
            from tenant_members tm
            where tm.tenant_id = p_tenant_id
              and tm.user_id = auth.uid()
        )

        and
        (
            /*
                Note owner (but still must be tenant member)
            */
            p_owner_id = select(auth.uid())
            or
            /*
                Tenant owner/admin
            */
            exists (
                select 1
                from tenant_members tm
                where tm.tenant_id = p_tenant_id
                  and tm.user_id = auth.uid()
                  and tm.role in ('owner', 'admin')
            )
            or
            /*
                Explicitly shared user
            */
            exists (
                select 1
                from note_shares ns
                where ns.note_id = p_note_id
                  and ns.user_id = auth.uid()
            )
        );
$$;

-- RLS for notes table
create policy "notes_select"
on notes
for select
using (
    deleted_at is null
    and check_note_access(tenant_id, owner_id, id)
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

create or replace function public.check_note_write_access(
    p_note_id uuid,
    p_tenant_id uuid,
    p_owner_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from tenant_members tm
        left join note_shares ns 
          on ns.note_id = p_note_id 
          and ns.user_id = auth.uid() -- check if shared user
        join tenants t 
          on t.id = p_tenant_id 
          and t.deleted_at is null -- tenant is active
        where tm.tenant_id = p_tenant_id 
          and tm.user_id = auth.uid() -- check if auth.uid is member of the tenant
          and (
              p_owner_id = auth.uid() -- note owner
              or ns.permission = 'write'
          )
    );
$$;
create policy "notes_update_logic"
on notes
for update
using (
    check_note_write_access(id, tenant_id, owner_id)
    and deleted_at is null -- not allowed to update already deleted notes, TODO: remove for allowing restoring soft-deleted notes
)
with check (
    (
        -- Normal update condition
        deleted_at is null
    )
    or 
    (
        -- Soft-delete condition
        deleted_at is not null 
        and owner_id = (select auth.uid()) -- only owner can soft-delete
        and deleted_by = (select auth.uid())
    )
);
-- TODO: add revoke to prevent changing owner_id or tenant_id on update
-- TODO: consider allowing tenant admins to delete notes or soft-delete

-- RLS for note_shares table
-- CAUTION: make sure notes RLS is defined before note_shares RLS to avoid circular dependency
create policy "note_shares_select_owner_or_shared_or_tenant_admin"
on note_shares
for select
using (
    exists (
        select 1
        from notes n
        join tenant_members tm
          on tm.tenant_id = n.tenant_id
         and tm.user_id = auth.uid()
        where n.id = note_shares.note_id
          and (
              /* Case 1: note owner (sharer) */
              n.owner_id = (select auth.uid())

              /* Case 2: Sharee - can see all shares of notes they have access to */
              or exists (
                  select 1 
                  from note_shares ns_internal 
                  where ns_internal.note_id = n.id 
                    and ns_internal.user_id = auth.uid()
              )

              /* Case 3: tenant admin / tenant owner */
              or tm.role in ('admin', 'owner')
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
        join tenant_members tm on tm.tenant_id = n.tenant_id and tm.user_id = (select auth.uid()) -- the sharer must be member of the tenant
        join tenant_members target on target.tenant_id = n.tenant_id and target.user_id = note_shares.user_id -- the sharee must be member of the tenant
        join tenants t on t.id = n.tenant_id and t.deleted_at is null -- tenant is active
        where n.id = note_shares.note_id
          and n.owner_id = (select auth.uid()) -- only note owner can share
          and n.deleted_at is null -- note is active
          and note_shares.user_id <> n.owner_id -- prevent owner sharing to self
    )
);

create policy "note_shares_delete_owner_only"
on note_shares
for delete
using (
    exists (
        select 1
        from notes n
        join tenant_members tm
          on tm.tenant_id = n.tenant_id
         and tm.user_id = (select auth.uid())
        where n.id = note_shares.note_id
          and n.owner_id = (select auth.uid())
          and n.deleted_at is null
    )
);

-- RLS for tenant_members table
alter table tenant_members enable row level security;

-- Allow users to see their own tenant memberships
CREATE OR REPLACE FUNCTION auth_user_tenant_ids()
RETURNS TABLE (ret_tenant_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    -- Get tenant IDs for active tenants the current user belongs to
    SELECT tm.tenant_id
    FROM public.tenant_members tm
    JOIN public.tenants t ON t.id = tm.tenant_id
    WHERE tm.user_id = auth.uid()
    AND t.deleted_at IS NULL;
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
        SELECT ret_tenant_id FROM auth_user_tenant_ids()
    )
);

/* TO TEST */
-- RLS for tenant_join_requests table
alter table tenant_join_requests enable row level security;

-- Allow users to see their own join requests or tenant admins to see requests
create policy "tenant_join_request_select_self_or_tenant_admin"
on tenant_join_requests for select
using (
    exists (
        select 1 from tenants 
        where id = tenant_join_requests.tenant_id 
        and deleted_at is null
    )
    and (user_id = (select auth.uid())
    or initiated_by = (select auth.uid()) -- allow seeing own initiated requests
    or exists (
        select 1 from tenant_members tm 
        where tm.tenant_id = tenant_join_requests.tenant_id 
        and tm.user_id = (select auth.uid()) 
        and tm.role in ('owner', 'admin') -- allow tenant admins to see requests
    ))
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
using (
    deleted_at is null
);

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
    and deleted_at is null -- prevent updating already deleted tenants
)
with check (
    exists (
        select 1 from tenant_members tm
        where tm.tenant_id = tenants.id
        and tm.user_id = (select auth.uid())
        and tm.role = 'owner'
    )
    and deleted_at is null -- prevent updating already deleted tenants and delete by SQL update
);



