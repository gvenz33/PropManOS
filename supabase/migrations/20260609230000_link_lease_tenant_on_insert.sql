-- Link existing tenant accounts when a landlord creates a lease

create or replace function public.link_lease_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_tenant_id uuid;
begin
  if new.tenant_id is not null then
    return new;
  end if;

  select p.id
  into matched_tenant_id
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'tenant'
    and lower(coalesce(p.email, u.email)) = lower(new.tenant_email)
  limit 1;

  if matched_tenant_id is not null then
    new.tenant_id := matched_tenant_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_lease_tenant_link on public.leases;
create trigger on_lease_tenant_link
  before insert on public.leases
  for each row execute function public.link_lease_tenant();
