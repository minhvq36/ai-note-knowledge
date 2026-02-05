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
8. Owner is allowed to downgrade themselves as long as tenant has at least one other owner.
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
    v_target_current_role text;
begin
    /*
    Ensure caller is authenticated.
    */
    if (select auth.uid()) is null then
        raise exception using
            message = 'Unauthenticated',
            detail = 'DB0001';
    end if;

    /*
    Validate role.
    */
    if p_new_role not in ('owner', 'admin', 'member') then
        raise exception using
            message = 'Invalid role: ' || p_new_role,
            detail = 'DB0205';
    end if;

    /*
    Caller must be owner.
    */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = (select auth.uid())
          and tm.role = 'owner'
    ) then
        raise exception using
            message = 'Only tenant owner can change roles',
            detail = 'DB0201';
    end if;

    /*
    Lock target membership row.
    */
    select tm.role
    into v_target_current_role
    from tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = p_target_user_id
    for update;

    if not found then
        raise exception using
            message = 'Target user is not a member of the tenant',
            detail = 'DB0202';
    end if;

    /*
    No-op if role unchanged.
    */
    if v_target_current_role = p_new_role then
        return;
    end if;

    /*
    Last-owner protection.
    */
    if v_target_current_role = 'owner'
       and p_new_role <> 'owner' then

        /*
        Lock all owner rows.
        */
        perform 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.role = 'owner'
        for update;

        select count(*)
        into v_owner_count
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.role = 'owner';

        if v_owner_count = 1 then
            raise exception using
                message = 'Cannot downgrade the last owner of the tenant',
                detail = 'DB0203';
        end if;
    end if;

    /*
    Apply role change.
    */
    update tenant_members tm
    set role = p_new_role
    where tm.tenant_id = p_tenant_id
      and tm.user_id = p_target_user_id;

    /*
    Audit log.
    */
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
            'old_role', v_target_current_role,
            'new_role', p_new_role
        ),
        now()
    );
end;
$$;
