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
set search_path = public
as $$
declare
    v_owner_count int;
begin
    /* Ensure caller is authenticated */
    if (select auth.uid()) is null then
        raise exception 'Unauthenticated';
    end if;

    /* Ensure caller is a member of the tenant */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = (select auth.uid())
    ) then
        raise exception 'You are not a member of this tenant';
    end if;

    /* If caller is owner, ensure not the last owner */
    if exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = (select auth.uid())
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
      and user_id = (select auth.uid());

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
        (select auth.uid()),
        'tenant.member.leave',
        jsonb_build_object(
            'user_id', (select auth.uid())
        ),
        now()
    );

    tenant_id := p_tenant_id;
    user_id := (select auth.uid());
    result := 'left';
    return next;
    return;
end;
$$;
