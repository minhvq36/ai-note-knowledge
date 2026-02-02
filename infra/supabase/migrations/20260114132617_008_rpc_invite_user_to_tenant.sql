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
set search_path = public
as $$
declare
    v_request_id uuid;
begin
    /* Ensure caller is authenticated */
    if (select auth.uid()) is null then
        raise exception 'Unauthenticated';
    end if;

    /* Ensure tenant exists */
    perform 1
    from tenants t
    where t.id = p_tenant_id
        and t.deleted_at is null
    for update;

    if not found then
        raise exception 'Tenant not found or deleted';
    end if;

    /* Caller must be owner or admin */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = (select auth.uid())
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
        (select auth.uid()),
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
        target_type,
        target_id,
        metadata,
        created_at
    )
    values (
        p_tenant_id,
        (select auth.uid()),
        'tenant.invite.create',
        'tenant_join_request',
        v_request_id,
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
