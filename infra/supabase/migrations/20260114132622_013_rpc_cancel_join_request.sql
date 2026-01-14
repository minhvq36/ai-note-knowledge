/*
Cancel a pending join request for a tenant.

Rules / Cases:
1. Caller must be authenticated.
2. Target join request must exist.
3. Only pending join requests can be cancelled.
4. Direction MUST be 'join'; invite requests cannot be cancelled here.
5. Only the user who created the join request can cancel it.
6. Membership is NOT created.
7. Audit log is created for the cancellation action.
8. Duplicate cancellations or non-pending requests raise an error.
*/

create or replace function public.cancel_join_request(
    p_request_id uuid
)
returns table (
    request_id uuid,
    result text
)
language plpgsql
security definer
as $$
declare
    v_request tenant_join_requests%rowtype;
begin
    /* Ensure caller is authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Fetch the join request */
    select *
    into v_request
    from tenant_join_requests
    where id = p_request_id;

    if not found then
        raise exception 'Join request not found';
    end if;

    /* Ensure request is a JOIN request */
    if v_request.direction <> 'join' then
        raise exception 'Cannot cancel invite request';
    end if;

    /* Ensure request is pending */
    if v_request.status <> 'pending' then
        raise exception 'Only pending requests can be cancelled';
    end if;

    /* Ensure caller is the user who created the request */
    if v_request.initiated_by <> auth.uid() then
        raise exception 'Permission denied: only requester can cancel';
    end if;

    /* Cancel the request */
    update tenant_join_requests
    set status = 'cancelled',
        decided_by = auth.uid(),
        decided_at = now()
    where id = p_request_id;

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        v_request.tenant_id,
        auth.uid(),
        'tenant.join_request.cancel',
        jsonb_build_object(
            'request_id', p_request_id,
            'user_id', v_request.user_id
        ),
        now()
    );

    request_id := p_request_id;
    result := 'cancelled';
    return next;
    return;
end;
$$;
