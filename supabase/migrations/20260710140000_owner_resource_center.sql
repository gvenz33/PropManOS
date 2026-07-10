-- Let landlords browse the platform resource catalog and add docs to their library

create policy documents_owner_platform_catalog_select on public.documents
for select
using (
  source = 'platform'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('owner', 'admin')
  )
);

create policy platform_document_shares_owner_insert on public.platform_document_shares
for insert
with check (
  owner_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('owner', 'admin')
  )
  and exists (
    select 1 from public.documents d
    where d.id = document_id and d.source = 'platform'
  )
);

create policy platform_document_shares_owner_delete on public.platform_document_shares
for delete
using (owner_id = auth.uid());

-- Owners can download platform files from the resource center
drop policy if exists propmanos_storage_platform_owner_catalog on storage.objects;
create policy propmanos_storage_platform_owner_catalog on storage.objects
for select
using (
  bucket_id = 'propmanos'
  and name like 'platform/%'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('owner', 'admin')
  )
);
