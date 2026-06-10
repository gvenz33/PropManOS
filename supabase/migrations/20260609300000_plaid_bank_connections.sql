-- Plaid bank connections and ACH rent payments

create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  purpose text not null check (purpose in ('payout', 'payment')),
  plaid_item_id text not null,
  plaid_access_token text not null,
  plaid_account_id text not null,
  institution_name text,
  account_name text,
  account_mask text,
  account_subtype text,
  status text not null default 'active' check (status in ('active', 'disconnected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bank_connections_profile_id_idx on public.bank_connections (profile_id);
create unique index if not exists bank_connections_active_unique
  on public.bank_connections (profile_id, purpose)
  where status = 'active';

create table if not exists public.ach_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete restrict,
  tenant_id uuid not null references public.profiles (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  rent_amount_cents integer not null check (rent_amount_cents >= 0),
  late_fee_cents integer not null default 0 check (late_fee_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  total_debit_cents integer not null check (total_debit_cents >= 0),
  plaid_transfer_id text,
  status text not null default 'pending'
    check (status in ('pending', 'posted', 'failed', 'returned')),
  failure_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ach_payments_invoice_id_idx on public.ach_payments (invoice_id);

alter table public.invoices
  add column if not exists platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0);

alter table public.bank_connections enable row level security;
alter table public.ach_payments enable row level security;

create policy bank_connections_self_select on public.bank_connections
for select
using (profile_id = auth.uid());

create policy ach_payments_tenant_select on public.ach_payments
for select
using (tenant_id = auth.uid());

create policy ach_payments_owner_select on public.ach_payments
for select
using (owner_id = auth.uid());

-- Writes happen via service role in API routes only
