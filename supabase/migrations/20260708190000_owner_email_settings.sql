-- Per-owner outbound email preferences (Resend API key stays in env)

alter table public.profiles add column if not exists email_sender_name text;
alter table public.profiles add column if not exists email_from_address text;
alter table public.profiles add column if not exists email_reply_to text;
alter table public.profiles add column if not exists email_signature text;
