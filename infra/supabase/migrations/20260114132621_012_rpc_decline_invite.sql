/*
Decline an invite to join a tenant.

Rules / Cases:
1. Caller must be authenticated.
2. Target invite request must exist.
3. Only pending invite requests can be declined.
4. Direction MUST be 'invite'; join requests cannot be declined here.
5. Only the invited user can decline the invite.
6. Membership is NOT created.
7. Audit log is created for the decline action.
8. Duplicate declines or non-pending invites raise an error.
*/

create or replace function public.decline_invite(
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
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Fetch the invite request */
    select *
    into v_request
    from tenant_join_requests
    where id = p_request_id;

    if not found then
        raise exception 'Invite request not found';
    end if;

    /* Ensure request is an INVITE request */
    if v_request.direction <> 'invite' then
        raise exception 'Cannot decline join request';
    end if;

    /* Ensure request is pending */
    if v_request.status <> 'pending' then
        raise exception 'Only pending invites can be declined';
    end if;

    /* Ensure caller is the invited user */
    if v_request.user_id <> auth.uid() then
        raise exception 'Permission denied: only invited user can decline';
    end if;

    /* Decline the invite */
    update tenant_join_requests
    set status = 'rejected',
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
        'tenant.invite.decline',
        jsonb_build_object(
            'request_id', p_request_id,
            'user_id', v_request.user_id
        ),
        now()
    );

    request_id := p_request_id;
    result := 'declined';
    return next;
    return;
end;
$$;
