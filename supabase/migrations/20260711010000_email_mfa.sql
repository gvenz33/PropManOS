-- Optional email-based MFA (second factor after password)

alter table public.profiles
  add column if not exists email_mfa_enabled boolean not null default false;

create table if not exists public.email_mfa_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  code_hash text not null,
  purpose text not null check (purpose in ('login', 'enable', 'disable')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_mfa_challenges_user_id_idx
  on public.email_mfa_challenges (user_id, created_at desc);

create table if not exists public.email_mfa_session_verifications (
  session_id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  verified_at timestamptz not null default now()
);

create index if not exists email_mfa_session_verifications_user_id_idx
  on public.email_mfa_session_verifications (user_id);

alter table public.email_mfa_challenges enable row level security;
alter table public.email_mfa_session_verifications enable row level security;

-- Writes go through the service role from server actions / API routes only
