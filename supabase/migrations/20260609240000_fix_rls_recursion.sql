-- Break circular RLS between units ↔ leases (and related tables)

create or replace function public.is_property_owner(property_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.properties p
    where p.id = property_uuid
      and p.owner_id = (select auth.uid())
  );
$$;

create or replace function public.is_unit_owner(unit_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.units u
    join public.properties p on p.id = u.property_id
    where u.id = unit_uuid
      and p.owner_id = (select auth.uid())
  );
$$;

create or replace function public.is_lease_owner(lease_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leases l
    join public.units u on u.id = l.unit_id
    join public.properties p on p.id = u.property_id
    where l.id = lease_uuid
      and p.owner_id = (select auth.uid())
  );
$$;

create or replace function public.tenant_leased_unit(unit_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leases l
    where l.unit_id = unit_uuid
      and l.tenant_id = (select auth.uid())
      and l.status = 'active'
  );
$$;

create or replace function public.is_lease_tenant(lease_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leases l
    where l.id = lease_uuid
      and l.tenant_id = (select auth.uid())
  );
$$;

create or replace function public.owner_manages_tenant_profile(profile_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leases l
    join public.units u on u.id = l.unit_id
    join public.properties p on p.id = u.property_id
    where l.tenant_id = profile_uuid
      and p.owner_id = (select auth.uid())
  );
$$;

drop policy if exists units_owner_via_property on public.units;
create policy units_owner_via_property on public.units
for all
using (public.is_property_owner(property_id))
with check (public.is_property_owner(property_id));

drop policy if exists units_tenant_read on public.units;
create policy units_tenant_read on public.units
for select
using (public.tenant_leased_unit(id));

drop policy if exists leases_owner_all on public.leases;
create policy leases_owner_all on public.leases
for all
using (public.is_unit_owner(unit_id))
with check (public.is_unit_owner(unit_id));

drop policy if exists leases_tenant_read on public.leases;
create policy leases_tenant_read on public.leases
for select
using (tenant_id = (select auth.uid()));

drop policy if exists invoices_owner_via_lease on public.invoices;
create policy invoices_owner_via_lease on public.invoices
for all
using (public.is_lease_owner(lease_id))
with check (public.is_lease_owner(lease_id));

drop policy if exists invoices_tenant_read on public.invoices;
create policy invoices_tenant_read on public.invoices
for select
using (public.is_lease_tenant(lease_id));

drop policy if exists documents_tenant_select on public.documents;
create policy documents_tenant_select on public.documents
for select
using (lease_id is not null and public.is_lease_tenant(lease_id));

drop policy if exists notification_owner on public.notification_log;
create policy notification_owner on public.notification_log
for select
using (lease_id is not null and public.is_lease_owner(lease_id));

drop policy if exists profiles_select_tenants_for_owner on public.profiles;
create policy profiles_select_tenants_for_owner on public.profiles
for select
using (public.owner_manages_tenant_profile(id));
