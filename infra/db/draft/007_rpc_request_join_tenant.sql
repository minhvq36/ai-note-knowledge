/*
1. User must be authenticated.
2. Target tenant must exist.
3. A user who is already a tenant member CANNOT request to join again.
4. At most ONE active (pending) request can exist per (tenant, user).
5. Join request and invite request MUST NOT coexist in pending state.
6. Membership is NEVER created here (approval is a separate RPC).
*/

create or replace function public.request_join_tenant(
    p_tenant_id uuid
)
returns table (
    request_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_request_id uuid;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Ensure tenant exists */
    if not exists (
        select 1
        from tenants t
        where t.id = p_tenant_id
    ) then
        raise exception 'Tenant not found';
    end if;

    /* Prevent request if user is already a member */
    if exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = auth.uid()
    ) then
        raise exception 'User is already a tenant member';
    end if;

    /* If there is a pending JOIN request → idempotent return */
    select tjr.id
    into v_request_id
    from tenant_join_requests tjr
    where tjr.tenant_id = p_tenant_id
      and tjr.user_id = auth.uid()
      and tjr.direction = 'join'
      and tjr.status = 'pending';

    if v_request_id is not null then
        request_id := v_request_id;
        result := 'already_pending';
        return next; -- append to result set to return
        return;
    end if;

    /* If there is a pending INVITE → block with explicit state */
    if exists (
        select 1
        from tenant_join_requests tjr
        where tjr.tenant_id = p_tenant_id
          and tjr.user_id = auth.uid()
          and tjr.direction = 'invite'
          and tjr.status = 'pending'
    ) then
        request_id := null;
        result := 'blocked_by_invite';
        return next; -- append to result set to return
        return;
    end if;

    /* Create new join request */
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
        auth.uid(),
        auth.uid(),
        'join',
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
        metadata,
        created_at
    )
    values (
        p_tenant_id,
        auth.uid(),
        'tenant.join_request.create',
        jsonb_build_object(
            'request_id', v_request_id
        ),
        now()
    );

    request_id := v_request_id;
    result := 'created';
    return next; -- append to result set to return
    return;
end;
$$;
