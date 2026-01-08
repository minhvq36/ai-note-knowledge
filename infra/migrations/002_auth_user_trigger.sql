/*TO TEST*/

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    /*
    Sync auth.users to public.users.
    */

    insert into public.users (
        id,
        username,
        email
    )
    values (
        new.id,
        split_part(new.email, '@', 1),
        new.email
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

/*
Trigger: fires after a new auth user is created
*/
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();
