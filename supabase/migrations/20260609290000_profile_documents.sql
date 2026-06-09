-- Unit and tenant profile documents: restore tenant read access for lease files

create index if not exists documents_unit_id_idx on public.documents (unit_id);

drop policy if exists documents_tenant_select on public.documents;
create policy documents_tenant_select on public.documents
for select
using (lease_id is not null and public.is_lease_tenant(lease_id));
