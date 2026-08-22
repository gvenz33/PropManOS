-- Require email MFA for tenant accounts as well as landlords and admins.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_role text;
begin
  signup_role := case
    when coalesce(new.raw_user_meta_data->>'role', 'tenant') = 'owner' then 'owner'
    else 'tenant'
  end;

  insert into public.profiles (id, full_name, role, email, email_mfa_enabled)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    signup_role,
    new.email,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

update public.profiles
set email_mfa_enabled = true
where email_mfa_enabled = false;
