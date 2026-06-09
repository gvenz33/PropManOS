-- Zelle / Cash App handles on units + tenant notification preferences

alter table public.units add column if not exists zelle_handle text;
alter table public.units add column if not exists cashapp_handle text;
alter table public.units add column if not exists payment_instructions text;

alter table public.profiles add column if not exists notify_email boolean not null default true;
alter table public.profiles add column if not exists notify_sms boolean not null default true;
