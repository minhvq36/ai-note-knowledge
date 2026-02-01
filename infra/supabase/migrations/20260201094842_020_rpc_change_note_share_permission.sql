/*
Change note share permission (revoke + grant).

Rules:
- Caller must be authenticated
- Note must exist and active
- Caller must be note owner
- Target user must be tenant member
- Owner cannot share note to himself
- Permission must be valid
- Operation is atomic
- Audit log is written
*/

create or replace function public.change_note_share_permission(
    p_note_id uuid,
    p_target_user_id uuid,
    p_new_permission text -- 'read' | 'write'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    /* Ensure authenticated */
    if auth.uid() is null then
        raise exception 'Unauthenticated';
    end if;

    /* Prevent self-sharing */
    if p_target_user_id = auth.uid() then
        raise exception 'Owner cannot share note to himself';
    end if;

    /* Validate permission */
    if p_new_permission not in ('read','write') then
        raise exception 'Invalid permission';
    end if;

    /* Lock note row */
    perform 1
    from notes n
    join tenants t
    on t.id = n.tenant_id
    and t.deleted_at is null
    where n.id = p_note_id
    and n.deleted_at is null
    for update;

    if not found then
        raise exception 'Note not found or deleted';
    end if;

    /* Ensure caller is note owner */
    if not exists (
        select 1
        from notes
        where id = p_note_id
          and owner_id = auth.uid()
    ) then
        raise exception 'Only note owner can change sharing permission';
    end if;

    /* Ensure target is tenant member */
    if not exists (
        select 1
        from notes n
        join tenant_members tm
          on tm.tenant_id = n.tenant_id
         and tm.user_id = p_target_user_id
        where n.id = p_note_id
    ) then
        raise exception 'Target user is not tenant member';
    end if;

    /* Revoke old share (if any) */
    delete from note_shares
    where note_id = p_note_id
      and user_id = p_target_user_id;

    /* Grant new share */
    insert into note_shares (
        note_id,
        user_id,
        permission,
        created_at
    )
    values (
        p_note_id,
        p_target_user_id,
        p_new_permission,
        now()
    );

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
    select
        n.tenant_id,
        auth.uid(),
        'note.share.change',
        'note_share',
        p_note_id,
        jsonb_build_object(
            'target_user_id', p_target_user_id,
            'permission', p_new_permission
        ),
        now()
    from notes n
    where n.id = p_note_id;

end;
$$;
