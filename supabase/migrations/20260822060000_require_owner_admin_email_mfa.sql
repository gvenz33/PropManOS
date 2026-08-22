-- Require email MFA for landlord and admin accounts at the profile level.

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
    signup_role in ('owner', 'admin')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

update public.profiles
set email_mfa_enabled = true
where role in ('owner', 'admin')
  and email_mfa_enabled = false;
