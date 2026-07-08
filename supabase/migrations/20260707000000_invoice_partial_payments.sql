-- Partial payments + emailed invoices
-- Track how much has been collected against each invoice and allow a
-- "partial" status so owners can apply partial or whole rent payments.

alter table public.invoices
  add column if not exists amount_paid_cents integer not null default 0 check (amount_paid_cents >= 0);

alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices
  add constraint invoices_status_check check (status in ('open', 'paid', 'late', 'partial'));
