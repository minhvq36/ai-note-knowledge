/*TO TEST*/
/*TO CONSIDER IF RETURN STRUCTURE RESULT*/

create or replace function public.create_tenant(
    p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_tenant_id uuid;
begin
    /* Ensure caller is authenticated */
    if (select auth.uid()) is null then
        raise exception 'Unauthenticated';
    end if;

    /* Basic validation */
    if p_name is null or length(trim(p_name)) = 0 then
        raise exception 'Tenant name must not be empty';
    end if;

    /* Create tenant */
    insert into tenants (
        id,
        name,
        created_at
    )
    values (
        gen_random_uuid(),
        trim(p_name),
        now()
    )
    returning id
    into v_tenant_id;

    /* Insert first owner */
    insert into tenant_members (
        tenant_id,
        user_id,
        role,
        created_at
    )
    values (
        v_tenant_id,
        (select auth.uid()),
        'owner',
        now()
    );

    /* Audit log */
    insert into audit_logs (
        tenant_id,
        actor_id,
        action,
        metadata,
        created_at
    )
    values (
        v_tenant_id,
        (select auth.uid()),
        'tenant.create',
        jsonb_build_object(
            'tenant_name', p_name
        ),
        now()
    );

    return v_tenant_id;
end;
$$;
