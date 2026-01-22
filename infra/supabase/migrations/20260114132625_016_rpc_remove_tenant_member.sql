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
set search_path = public
as $$
declare
    v_owner_count int;
    v_caller_role text;
    v_target_role text;
begin
    /*
    Ensure caller is authenticated.
    auth.uid() must exist in session.
    */
    if (select auth.uid()) is null then
        raise exception 'Unauthenticated';
    end if;

    /*
    Fetch caller role within tenant.
    */
    select tm.role
    into v_caller_role
    from tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = (select auth.uid());

    if v_caller_role is null then
        raise exception 'Caller is not a member of this tenant';
    end if;

    /*
    Only owner or admin can remove members.
    */
    if v_caller_role not in ('owner', 'admin') then
        raise exception 'Only tenant owner/admin can remove members';
    end if;

    /*
    Fetch target role and lock membership row
    to prevent concurrent remove / role change.
    */
    select tm.role
    into v_target_role
    from tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = p_target_user_id
    for update;

    if v_target_role is null then
        raise exception 'Target user is not a member of this tenant';
    end if;

    /*
    Role-based removal rules.
    Admin cannot remove owner or admin.
    */
    if v_caller_role = 'admin' then
        if v_target_role in ('owner', 'admin') then
            raise exception 'Admin cannot remove owner or admin';
        end if;
    end if;

    /*
    Last-owner protection.
    Lock owner rows to avoid race conditions.
    */
    if v_target_role = 'owner' then
        select count(*)
        into v_owner_count
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.role = 'owner'
        for update;

        if v_owner_count = 1 then
            raise exception 'Cannot remove the last owner of the tenant';
        end if;
    end if;

    /*
    Remove membership.
    */
    delete from tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = p_target_user_id;

    /*
    Write audit log.
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
        'tenant.member.remove',
        'user',
        p_target_user_id,
        jsonb_build_object(
            'removed_user_id', p_target_user_id,
            'caller_role', v_caller_role,
            'target_role', v_target_role
        ),
        now()
    );

    /*
    Return result.
    */
    tenant_id := p_tenant_id;
    removed_user_id := p_target_user_id;
    result := 'removed';

    return next;
    return;
end;
$$;
