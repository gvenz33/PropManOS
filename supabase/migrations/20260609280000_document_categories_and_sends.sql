-- Landlord-only document categories and outbound form send log

alter table public.documents
  add column if not exists category text not null default 'internal'
    check (category in ('internal', 'rental_form'));

create index if not exists documents_category_idx on public.documents (category);

create table if not exists public.document_sends (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  recipient_name text,
  recipient_email text,
  recipient_phone text,
  channel text not null check (channel in ('email', 'sms')),
  message text,
  sent_at timestamptz not null default now()
);

alter table public.document_sends enable row level security;

create policy document_sends_owner_all on public.document_sends
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Landlord documents are internal; tenants no longer see uploads in the portal
drop policy if exists documents_tenant_select on public.documents;
create policy documents_tenant_select on public.documents
for select
using (false);
