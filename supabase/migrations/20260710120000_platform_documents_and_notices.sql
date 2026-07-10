-- Platform documents (admin → landlord) and landlord notice metadata

alter table public.documents add column if not exists source text not null default 'owner'
  check (source in ('owner', 'platform'));

alter table public.documents add column if not exists notice_type text
  check (notice_type is null or notice_type in ('3_day', '30_day', '60_day'));

alter table public.documents add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists documents_source_idx on public.documents (source);
create index if not exists documents_notice_type_idx on public.documents (notice_type);

create table if not exists public.platform_document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  shared_by uuid not null references public.profiles (id) on delete cascade,
  message text,
  shared_at timestamptz not null default now(),
  unique (document_id, owner_id)
);

create index if not exists platform_document_shares_owner_idx
  on public.platform_document_shares (owner_id);

alter table public.platform_document_shares enable row level security;

create policy platform_document_shares_admin_all on public.platform_document_shares
for all
using (public.is_site_admin())
with check (public.is_site_admin());

create policy platform_document_shares_owner_select on public.platform_document_shares
for select
using (owner_id = auth.uid());

create policy documents_admin_all on public.documents
for all
using (public.is_site_admin())
with check (public.is_site_admin());

create policy documents_owner_platform_select on public.documents
for select
using (
  source = 'platform'
  and exists (
    select 1
    from public.platform_document_shares s
    where s.document_id = documents.id
      and s.owner_id = auth.uid()
  )
);

-- Landlords can read shared platform files in storage
drop policy if exists propmanos_storage_platform_share_select on storage.objects;
create policy propmanos_storage_platform_share_select on storage.objects
for select
using (
  bucket_id = 'propmanos'
  and exists (
    select 1
    from public.documents d
    join public.platform_document_shares s on s.document_id = d.id
    where d.storage_path = name
      and d.source = 'platform'
      and s.owner_id = auth.uid()
  )
);

-- Site admins can manage platform storage paths
drop policy if exists propmanos_storage_admin_platform on storage.objects;
create policy propmanos_storage_admin_platform on storage.objects
for all
using (
  bucket_id = 'propmanos'
  and public.is_site_admin()
  and name like 'platform/%'
)
with check (
  bucket_id = 'propmanos'
  and public.is_site_admin()
  and name like 'platform/%'
);
