/*
Soft-delete a note (owner-only).

Rules:
1. Caller must be authenticated.
2. Note must exist and not already soft-deleted.
3. Tenant must be active.
4. Only the note owner can soft-delete.
5. Soft-delete the note (set deleted_at, deleted_by).
6. note_shares are automatically hidden via RLS.
7. Audit log is created.
8. Row-level lock to prevent race conditions.
*/

create or replace function public.delete_note(
    p_note_id uuid
)
returns table (
    note_id uuid,
    result text
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_tenant_id uuid;
    v_owner_id uuid;
begin
    -- Ensure caller is authenticated
    if (select auth.uid()) is null then
        raise exception 'Unauthenticated';
    end if;

    -- Lock the note row for update to avoid race condition
    select n.tenant_id, n.owner_id
    into v_tenant_id, v_owner_id
    from notes n
    join tenants t
      on t.id = n.tenant_id
    where n.id = p_note_id
      and n.deleted_at is null -- only active notes
      and t.deleted_at is null -- only active tenants
    for update;

    if not found then
        raise exception 'Note not found, already deleted, or tenant inactive';
    end if;

    -- Check permission: only owner can delete
    if auth.uid() <> v_owner_id then
        raise exception 'Access denied: only owner can delete this note';
    end if;

    -- Soft-delete the note
    update notes
    set deleted_at = now(),
        deleted_by = auth.uid(),
        updated_at = now()
    where id = p_note_id
      and deleted_at is null;

    -- Insert audit log
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
        v_tenant_id,
        auth.uid(),
        'note.delete',
        'note',
        p_note_id,
        jsonb_build_object(
            'deleted_by', auth.uid(),
            'note_id', p_note_id,
            'tenant_id', v_tenant_id
        ),
        now()
    );

    note_id := p_note_id;
    result := 'deleted';
    return next;
    return;
end;
$$;
