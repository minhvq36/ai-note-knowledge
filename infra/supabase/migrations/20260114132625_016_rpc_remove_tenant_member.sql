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
