/* TO TEST */

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
    insert into public.tenants (id, name)
    values (gen_random_uuid(), new.email);

    insert into public.users (
        id,
        tenant_id,
        username,
        email
    )
    values (
        new.id,
        (select id from tenants order by created_at desc limit 1),
        split_part(new.email, '@', 1),
        new.email
    );

    return new;
end;
$$ language plpgsql security definer;

/* Trigger on auth.users */
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();