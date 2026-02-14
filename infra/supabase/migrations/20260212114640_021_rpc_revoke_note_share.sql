/*
Revoke note share access.

Rules:
- Caller must be authenticated
- Note must exist and active
- Caller must be note owner
- Caller must be tenant member
- Operation is atomic
- Audit log is written
*/

create or replace function public.revoke_note_share(
    p_note_id uuid,
    p_target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    /* Ensure authenticated */
    if auth.uid() is null then
        raise exception using
            message = 'Unauthenticated',
            detail = 'DB0001';
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
        raise exception using
            message = 'Note not found or deleted',
            detail = 'DB0505';
    end if;

    /* Ensure caller is note owner */
    if not exists (
        select 1
        from notes
        where id = p_note_id
          and owner_id = auth.uid()
    ) then
        raise exception using
            message = 'Only note owner can revoke share',
            detail = 'DB0504';
    end if;

    /* Ensure sharer (caller) is tenant member */
    if not exists (
        select 1
        from notes n
        join tenant_members tm
          on tm.tenant_id = n.tenant_id
         and tm.user_id = auth.uid()
        where n.id = p_note_id
    ) then
        raise exception using
            message = 'Caller is not a member of the tenant',
            detail = 'DB0506';
    end if;

    /* Revoke share */
    delete from note_shares
    where note_id = p_note_id
      and user_id = p_target_user_id;

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
        'note.share.revoke',
        'note_share',
        p_note_id,
        jsonb_build_object(
            'target_user_id', p_target_user_id
        ),
        now()
    from notes n
    where n.id = p_note_id;

end;
$$;
