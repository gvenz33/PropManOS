-- Subscription plan and per-user feature overrides for admin management

alter table public.profiles add column if not exists subscription_plan text not null default 'free'
  check (subscription_plan in ('free', 'starter', 'pro', 'enterprise'));

alter table public.profiles add column if not exists feature_flags jsonb not null default '{}'::jsonb;
