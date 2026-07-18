-- Collapse to Essential + Pro; add Stripe billing fields

-- Remap legacy plans before tightening the check constraint
update public.profiles
set subscription_plan = case
  when subscription_plan in ('pro', 'enterprise') then 'pro'
  else 'essential'
end
where subscription_plan is distinct from 'essential'
  and subscription_plan is distinct from 'pro';

alter table public.profiles drop constraint if exists profiles_subscription_plan_check;
alter table public.profiles
  add constraint profiles_subscription_plan_check
  check (subscription_plan in ('essential', 'pro'));

alter table public.profiles
  alter column subscription_plan set default 'essential';

alter table public.profiles
  add column if not exists subscription_status text not null default 'inactive'
    check (subscription_status in ('inactive', 'active', 'past_due', 'canceled', 'trialing')),
  add column if not exists billing_interval text
    check (billing_interval is null or billing_interval in ('month', 'year')),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists billing_exempt boolean not null default false;

-- Existing accounts stay usable until they connect Stripe (admin can also exempt)
update public.profiles
set subscription_status = 'active',
    billing_exempt = true
where role = 'owner'
  and coalesce(billing_exempt, false) = false
  and subscription_status = 'inactive';

create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;
