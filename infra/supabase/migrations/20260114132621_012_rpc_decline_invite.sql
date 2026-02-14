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
    if (select auth.uid()) is null then
        raise exception using
            message = 'Unauthenticated',
            detail = 'DB0001';
    end if;

    /* Fetch the invite request */
    select *
    into v_request
    from tenant_join_requests
    where id = p_request_id;

    if not found then
        raise exception using
            message = 'Invite request not found',
            detail = 'DB0301';
    end if;

    /* Ensure request is an INVITE request */
    if v_request.direction <> 'invite' then
        raise exception using
            message = 'Cannot decline join request',
            detail = 'DB0303';
    end if;

    /* Ensure request is pending */
    if v_request.status <> 'pending' then
        raise exception using
            message = 'Only pending invites can be declined',
            detail = 'DB0304';
    end if;

    /* Ensure caller is the invited user */
    if v_request.user_id <> (select auth.uid()) then
        raise exception using
            message = 'Permission denied: only invited user can decline',
            detail = 'DB0305';
    end if;

    /* Decline the invite */
    update tenant_join_requests
    set status = 'rejected',
        decided_by = (select auth.uid()),
        decided_at = now()
    where id = p_request_id;

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
        'tenant.invite.decline',
        'tenant_join_request',
        p_request_id,
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
