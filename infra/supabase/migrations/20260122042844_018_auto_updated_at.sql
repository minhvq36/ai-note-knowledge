/*
Shared trigger function to auto-update updated_at.
Used by multiple tables.
*/
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

/*
Auto update updated_at for tenants table.
*/
drop trigger if exists trg_tenants_updated_at on public.tenants;

create trigger trg_tenants_updated_at
before update on public.tenants
for each row
execute function public.touch_updated_at();

/*
Auto update updated_at for notes table.
*/
drop trigger if exists trg_notes_updated_at on public.notes;

create trigger trg_notes_updated_at
before update on public.notes
for each row
execute function public.touch_updated_at();
