/* TO TEST */

/*
1. Only the owner can change roles.
2. The owner can downgrade themselves or another owner.
3. But they cannot downgrade the last owner.
4. Tenant always has ≥ 1 owner.
*/


create or replace function public.change_tenant_member_role(
    p_tenant_id uuid,
    p_target_user_id uuid,
    p_new_role text
)
returns void
language plpgsql
security definer
as $$
declare
    v_owner_count int;
begin
    /* Validate role */
    if p_new_role not in ('owner', 'admin', 'member') then
        raise exception 'Invalid role: %', p_new_role;
    end if;

    /* Caller must be an owner of the tenant */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = auth.uid()
          and tm.role = 'owner'
    ) then
        raise exception 'Only tenant owner can change roles';
    end if;

    /* Target user must be a member of the tenant */
    if not exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = p_target_user_id
    ) then
        raise exception 'Target user is not a member of the tenant';
    end if;

    /* Prevent downgrading the last owner */
    if exists (
        select 1
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.user_id = p_target_user_id
          and tm.role = 'owner'
    )
    and p_new_role <> 'owner' then

        select count(*)
        into v_owner_count
        from tenant_members tm
        where tm.tenant_id = p_tenant_id
          and tm.role = 'owner';

        if v_owner_count = 1 then
            raise exception 'Cannot downgrade the last owner of the tenant';
        end if;
    end if;

    /* Apply role change */
    update tenant_members
    set role = p_new_role
    where tenant_id = p_tenant_id
      and user_id = p_target_user_id;
end;
$$;
