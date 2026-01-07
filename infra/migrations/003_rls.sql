alter table notes enable row level security;
alter table note_shares enable row level security;

-- RLS for notes table
create policy "notes_select_owner_or_shared_same_tenant"
on notes
for select
using (
    tenant_id = (
        select tenant_id
        from users
        where id = auth.uid()
    )
    AND (
        owner_id = auth.uid()
        OR exists (
            select 1
            from note_shares ns
            where ns.note_id = notes.id
              and ns.user_id = auth.uid()
        )
    )
);

create policy "notes_insert_owner_same_tenant"
on notes
for insert
with check (
    owner_id = auth.uid()
    AND tenant_id = (
        select tenant_id
        from users
        where id = auth.uid()
    )
);

create policy "notes_update_owner_or_shared_write_same_tenant"
on notes
for update
using (
    exists (
        select 1
        from users u
        where u.id = auth.uid()
          and u.tenant_id = notes.tenant_id
    )
    and (
        owner_id = auth.uid()
        or exists (
            select 1
            from note_shares ns
            where ns.note_id = notes.id
              and ns.user_id = auth.uid()
              and ns.permission = 'write'
        )
    )
)
with check (
    tenant_id = notes.tenant_id
    and owner_id = (
        select owner_id
        from notes as old
        where old.id = notes.id
    )
);

create policy "notes_delete_owner_only_same_tenant"
on notes
for delete
using (
    owner_id = auth.uid()
    AND tenant_id = (
        select tenant_id
        from users
        where id = auth.uid()
    )
);

-- RLS for note_shares table
create policy "note_shares_select_owner_or_shared"
on note_shares
for select
using (
    -- owner of the note
    exists (
        select 1
        from notes n
        where n.id = note_shares.note_id
          and n.owner_id = auth.uid()
    )
    OR
    -- user who is shared the note
    note_shares.user_id = auth.uid()
);

create policy "note_shares_insert_owner_same_tenant"
on note_shares
for insert
with check (
    exists (
        select 1
        from notes n
        join users owner on owner.id = auth.uid()
        join users target on target.id = note_shares.user_id
        where n.id = note_shares.note_id
          and n.owner_id = auth.uid()
          and n.tenant_id = owner.tenant_id
          and target.tenant_id = owner.tenant_id
    )
);

create policy "note_shares_update_owner_only"
on note_shares
for update
using (
    exists (
        select 1
        from notes n
        where n.id = note_shares.note_id
          and n.owner_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from notes n
        where n.id = note_shares.note_id
          and n.owner_id = auth.uid()
    )
);

create policy "note_shares_delete_owner_only"
on note_shares
for delete
using (
    exists (
        select 1
        from notes n
        where n.id = note_shares.note_id
          and n.owner_id = auth.uid()
    )
);