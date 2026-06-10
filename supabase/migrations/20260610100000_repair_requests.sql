create table public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references public.leases (id) on delete cascade,
  tenant_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  location text,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'urgent')),
  status text not null default 'submitted'
    check (status in ('submitted', 'acknowledged', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index repair_requests_lease_id_idx on public.repair_requests (lease_id);
create index repair_requests_tenant_id_idx on public.repair_requests (tenant_id);
create index repair_requests_status_idx on public.repair_requests (status);

alter table public.repair_requests enable row level security;

create policy repair_requests_tenant_select on public.repair_requests
  for select using (
    tenant_id = auth.uid()
    and public.is_lease_tenant(lease_id)
  );

create policy repair_requests_tenant_insert on public.repair_requests
  for insert with check (
    tenant_id = auth.uid()
    and public.is_lease_tenant(lease_id)
  );

create policy repair_requests_owner_all on public.repair_requests
  for all using (public.is_lease_owner(lease_id))
  with check (public.is_lease_owner(lease_id));

create trigger repair_requests_touch_updated_at
before update on public.repair_requests
for each row execute function public.touch_updated_at();
