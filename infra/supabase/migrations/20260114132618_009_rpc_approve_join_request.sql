/*
Approve a join request for a tenant.

Rules / Cases:
1. Caller must be authenticated.
2. Caller must be owner or admin of the tenant.
3. Target join request must exist.
4. Only pending join requests can be approved.
5. Direction MUST be 'join'; invite requests cannot be approved here.
6. Membership is created only after approval.
7. Audit log is created for the approval action.
8. Duplicate approvals or non-pending requests raise an error.
*/

create or replace function public.approve_join_request(
    p_request_id uuid
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
    v_request tenant_join_requests%rowtype;
begin
    /* Ensure caller is authenticated */
    if (select auth.uid()) is null then
        raise exception using
            message = 'Unauthenticated',
            detail = 'DB0001';
    end if;

    /* Fetch the join request */
    select *
    into v_request
    from tenant_join_requests
    where id = p_request_id;

    if not found then
        raise exception using
            message = 'Join request not found',
            detail = 'DB0301';
    end if;

    /* Ensure request is a JOIN request */
    if v_request.direction <> 'join' then
        raise exception using
            message = 'Cannot approve invite request',
            detail = 'DB0302';
    end if;

    /* Ensure request is pending */
    if v_request.status <> 'pending' then
        raise exception using
            message = 'Only pending requests can be approved',
            detail = 'DB0304';
    end if;

    /* Ensure caller is owner/admin of the tenant */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = v_request.tenant_id
          and tm.user_id = (select auth.uid())
          and tm.role in ('owner', 'admin')
    ) then
        raise exception using
            message = 'Permission denied',
            detail = 'DB0311';
    end if;

    /* Approve the request */
    update tenant_join_requests
    set status = 'approved',
        decided_by = (select auth.uid()),
        decided_at = now()
    where id = p_request_id;

    /* Create tenant membership */
    insert into tenant_members (
        tenant_id,
        user_id,
        role,
        created_at
    )
    values (
        v_request.tenant_id,
        v_request.user_id,
        'member', /* default role */
        now()
    )
    on conflict do nothing; -- in case membership exists

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
        v_request.tenant_id,
        (select auth.uid()),
        'tenant.join_request.approve',
        'tenant_join_request',
        p_request_id,
        jsonb_build_object(
            'request_id', p_request_id,
            'user_id', v_request.user_id
        ),
        now()
    );

    request_id := p_request_id;
    result := 'approved';
    return next;
    return;
end;
$$;
