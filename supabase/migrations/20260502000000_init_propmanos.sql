-- Prop Man OS — initial schema (run in Supabase SQL editor or via CLI)

-- Profiles (1:1 with auth.users). Role drives dashboard routing.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'tenant' check (role in ('owner', 'tenant')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  address_line1 text,
  city text,
  state text,
  postal_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  label text not null,
  rent_amount_cents integer not null check (rent_amount_cents >= 0),
  due_day_of_month smallint not null check (due_day_of_month between 1 and 28),
  late_fee_cents integer not null default 0 check (late_fee_cents >= 0),
  grace_days smallint not null default 0 check (grace_days >= 0),
  bank_connection_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.leases (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  tenant_id uuid references public.profiles (id) on delete set null,
  tenant_email text not null,
  status text not null default 'active' check (status in ('active', 'ended')),
  start_date date not null,
  end_date date,
  rent_amount_cents integer not null check (rent_amount_cents >= 0),
  created_at timestamptz not null default now()
);

create index if not exists leases_tenant_email_lower on public.leases (lower(tenant_email));
create index if not exists leases_tenant_id_idx on public.leases (tenant_id);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.leases (id) on delete cascade,
  period_year smallint not null,
  period_month smallint not null check (period_month between 1 and 12),
  amount_cents integer not null check (amount_cents >= 0),
  due_date date not null,
  status text not null default 'open'
    check (status in ('open', 'paid', 'late')),
  late_fee_cents integer not null default 0 check (late_fee_cents >= 0),
  late_fee_waived boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (lease_id, period_year, period_month)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  lease_id uuid references public.leases (id) on delete set null,
  unit_id uuid references public.units (id) on delete set null,
  storage_path text not null,
  filename text not null,
  kind text not null default 'other'
    check (kind in ('lease', 'notice', 'receipt', 'other')),
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  lease_id uuid references public.leases (id) on delete set null,
  invoice_id uuid references public.invoices (id) on delete set null,
  channel text not null check (channel in ('email', 'sms')),
  template text not null,
  body text not null,
  sent_at timestamptz not null default now()
);

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  contact_id uuid references public.crm_contacts (id) on delete cascade,
  title text not null,
  activity_type text not null default 'note'
    check (activity_type in ('note', 'call', 'email', 'task', 'showing')),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Updated_at touch
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

-- New user → profile (role from signup metadata is copied once; RLS does not use JWT metadata)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when coalesce(new.raw_user_meta_data->>'role', 'tenant') = 'owner' then 'owner'
      else 'tenant'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Link tenant email to leases after signup
create or replace function public.link_tenant_leases()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'tenant' and new.id is not null then
    update public.leases
    set tenant_id = new.id
    where lower(tenant_email) = lower((select email from auth.users where id = new.id))
      and tenant_id is null
      and status = 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_tenant_link on public.profiles;
create trigger on_profile_tenant_link
  after insert on public.profiles
  for each row execute function public.link_tenant_leases();

-- RLS
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.leases enable row level security;
alter table public.invoices enable row level security;
alter table public.documents enable row level security;
alter table public.notification_log enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_activities enable row level security;

-- Profiles
create policy profiles_select_self on public.profiles for select using (auth.uid() = id);
create policy profiles_update_self on public.profiles for update using (auth.uid() = id);

-- Owners see tenants on their leases (for CRM / management)
create policy profiles_select_tenants_for_owner on public.profiles for select
using (
  exists (
    select 1 from public.leases l
    join public.units u on u.id = l.unit_id
    join public.properties p on p.id = u.property_id
    where l.tenant_id = profiles.id and p.owner_id = auth.uid()
  )
);

-- Properties
create policy properties_owner_all on public.properties for all
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Units
create policy units_owner_via_property on public.units for all
using (
  exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
) with check (
  exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
);

create policy units_tenant_read on public.units for select
using (
  exists (
    select 1 from public.leases l
    where l.unit_id = units.id and l.tenant_id = auth.uid() and l.status = 'active'
  )
);

-- Leases
create policy leases_owner_all on public.leases for all
using (
  exists (
    select 1 from public.units u
    join public.properties p on p.id = u.property_id
    where u.id = unit_id and p.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.units u
    join public.properties p on p.id = u.property_id
    where u.id = unit_id and p.owner_id = auth.uid()
  )
);

create policy leases_tenant_read on public.leases for select
using (tenant_id = auth.uid());

-- Invoices
create policy invoices_owner_via_lease on public.invoices for all
using (
  exists (
    select 1 from public.leases l
    join public.units u on u.id = l.unit_id
    join public.properties p on p.id = u.property_id
    where l.id = lease_id and p.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.leases l
    join public.units u on u.id = l.unit_id
    join public.properties p on p.id = u.property_id
    where l.id = lease_id and p.owner_id = auth.uid()
  )
);

create policy invoices_tenant_read on public.invoices for select
using (
  exists (select 1 from public.leases l where l.id = lease_id and l.tenant_id = auth.uid())
);

-- Documents: owner full access; tenant read/upload limited — tenant read if on their lease
create policy documents_owner_all on public.documents for all
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy documents_tenant_select on public.documents for select
using (
  exists (
    select 1 from public.leases l
    where l.id = documents.lease_id and l.tenant_id = auth.uid()
  )
);

-- Notification log: owners see for their properties; tenants see own
create policy notification_owner on public.notification_log for select
using (
  profile_id is not null and exists (
    select 1 from public.leases l
    join public.units u on u.id = l.unit_id
    join public.properties p on p.id = u.property_id
    where l.id = notification_log.lease_id and p.owner_id = auth.uid()
  )
);

create policy notification_self on public.notification_log for select
using (profile_id = auth.uid());

-- Inserts: use service role (cron / Edge Function) — no policy for authenticated users

-- CRM
create policy crm_contacts_owner on public.crm_contacts for all
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy crm_activities_owner on public.crm_activities for all
using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Storage bucket (create in Dashboard → Storage → New bucket "documents", public: false)
-- Policies below assume bucket id = 'documents'

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy documents_storage_owner_insert on storage.objects for insert
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy documents_storage_owner_select on storage.objects for select
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.documents d
      join public.leases l on l.id = d.lease_id
      where d.storage_path = name and l.tenant_id = auth.uid()
    )
  )
);

create policy documents_storage_owner_update on storage.objects for update
using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy documents_storage_owner_delete on storage.objects for delete
using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
