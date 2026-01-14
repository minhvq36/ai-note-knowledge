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
set search_path = public
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
          and tm.user_id = (select auth.uid())
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
        target_type,
        target_id,
        metadata,
        created_at
    )
    values (
        p_tenant_id,
        (select auth.uid()),
        'tenant.member.change_role',
        'user',
        p_target_user_id,
        jsonb_build_object(
            'target_user_id', p_target_user_id,
            'new_role', p_new_role
        ),
        now()
    );
end;
$$;
