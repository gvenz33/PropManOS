-- Site admin role + subscriber email on profiles

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'tenant', 'admin'));

alter table public.profiles add column if not exists email text;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when coalesce(new.raw_user_meta_data->>'role', 'tenant') = 'owner' then 'owner'
      else 'tenant'
    end,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');

create policy profiles_admin_select on public.profiles
for select using (public.is_site_admin());

create policy profiles_admin_update on public.profiles
for update using (public.is_site_admin());
