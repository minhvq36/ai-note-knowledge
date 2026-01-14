/*
Cancel a pending invite to join a tenant.

Rules / Cases:
1. Caller must be authenticated.
2. Caller must be owner or admin of the tenant.
3. Target invite request must exist.
4. Only pending invite requests can be cancelled.
5. Direction MUST be 'invite'; join requests cannot be cancelled here.
6. Any owner or admin of the tenant can cancel the invite.
7. Membership is NOT created.
8. Audit log is created for the cancellation action.
9. Duplicate cancellations or non-pending invites raise an error.
*/

create or replace function public.cancel_invite(
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
        raise exception 'Cannot cancel join request';
    end if;

    /* Ensure request is pending */
    if v_request.status <> 'pending' then
        raise exception 'Only pending invites can be cancelled';
    end if;

    /* Ensure caller is owner or admin of the tenant */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = v_request.tenant_id
          and tm.user_id = auth.uid()
          and tm.role in ('owner', 'admin')
    ) then
        raise exception 'Permission denied: only tenant owner/admin can cancel';
    end if;

    /* Cancel the invite */
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
        'tenant.invite.cancel',
        jsonb_build_object(
            'request_id', p_request_id,
            'target_user_id', v_request.user_id
        ),
        now()
    );

    request_id := p_request_id;
    result := 'cancelled';
    return next;
    return;
end;
$$;
