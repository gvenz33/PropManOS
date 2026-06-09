-- Landlord-managed tenant contact info on leases

alter table public.leases add column if not exists tenant_name text;
alter table public.leases add column if not exists tenant_phone text;

-- Re-link tenant when email changes on update
create or replace function public.link_lease_tenant_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_tenant_id uuid;
begin
  if new.tenant_email is distinct from old.tenant_email or new.tenant_id is null then
    select p.id
    into matched_tenant_id
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.role = 'tenant'
      and lower(coalesce(p.email, u.email)) = lower(new.tenant_email)
    limit 1;

    new.tenant_id := matched_tenant_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_lease_tenant_link_update on public.leases;
create trigger on_lease_tenant_link_update
  before update on public.leases
  for each row execute function public.link_lease_tenant_on_update();
