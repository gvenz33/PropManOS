-- Property-scoped documents and tenant document types

alter table public.documents
  add column if not exists property_id uuid references public.properties (id) on delete cascade;

alter table public.documents
  drop constraint if exists documents_kind_check;

alter table public.documents
  add constraint documents_kind_check
  check (kind in (
    'lease',
    'rental_application',
    'rental_agreement',
    'notice',
    'receipt',
    'other'
  ));

create index if not exists documents_property_id_idx on public.documents (property_id);
create index if not exists documents_lease_id_idx on public.documents (lease_id);
