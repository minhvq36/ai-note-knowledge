/*
Delete a tenant (owner-only, last owner must perform).

Rules / Cases:
1. Caller must be authenticated.
2. Tenant must exist.
3. Caller must be an owner of the tenant.
4. Only the last owner can delete the tenant.
5. All tenant-related data is deleted (cascade).
6. Audit log is created.
7. Atomic transaction to prevent race conditions.
*/

create or replace function public.delete_tenant(
    p_tenant_id uuid
)
returns table (
    tenant_id uuid,
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
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Ensure tenant exists */
    if not exists (
        select 1 from tenants t
        where t.id = p_tenant_id
    ) then
        raise exception 'Tenant not found';
    end if;

    /* Ensure caller is an owner */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = auth.uid()
          and tm.role = 'owner'
    ) then
        raise exception 'Only tenant owner can delete tenant';
    end if;

    /* Lock all owner rows and count */
    select count(*)
    into v_owner_count
    from tenant_members tm
    where tm.tenant_id = p_tenant_id
      and tm.role = 'owner'
    for update; -- prevent race condition

    if v_owner_count > 1 then
        raise exception 'Cannot delete tenant: multiple owners exist, only last owner can delete';
    end if;

    /* Delete tenant row (cascade deletes tenant_members, notes, note_shares, join_requests) */
    delete from tenants
    where id = p_tenant_id;

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
        'tenant.delete',
        jsonb_build_object(
            'deleted_by', auth.uid(),
            'tenant_id', p_tenant_id
        ),
        now()
    );

    tenant_id := p_tenant_id;
    result := 'deleted';
    return next;
    return;
end;
$$;
