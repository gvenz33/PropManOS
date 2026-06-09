-- PropManOS primary storage bucket
insert into storage.buckets (id, name, public)
values ('propmanos', 'PropManOS', false)
on conflict (id) do update set name = excluded.name, public = excluded.public;

create policy propmanos_storage_owner_insert on storage.objects for insert
with check (
  bucket_id = 'propmanos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy propmanos_storage_owner_select on storage.objects for select
using (
  bucket_id = 'propmanos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.documents d
      join public.leases l on l.id = d.lease_id
      where d.storage_path = name and l.tenant_id = auth.uid()
    )
  )
);

create policy propmanos_storage_owner_update on storage.objects for update
using (bucket_id = 'propmanos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy propmanos_storage_owner_delete on storage.objects for delete
using (bucket_id = 'propmanos' and (storage.foldername(name))[1] = auth.uid()::text);
