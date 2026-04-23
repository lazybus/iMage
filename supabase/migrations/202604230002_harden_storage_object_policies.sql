update storage.buckets
set public = false
where id = 'image-documents';

drop policy if exists "users can access own storage objects"
on storage.objects;

drop policy if exists "authenticated users can select own storage objects"
on storage.objects;

drop policy if exists "authenticated users can insert own storage objects"
on storage.objects;

drop policy if exists "authenticated users can update own storage objects"
on storage.objects;

drop policy if exists "authenticated users can delete own storage objects"
on storage.objects;

create policy "authenticated users can select own storage objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'image-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "authenticated users can insert own storage objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'image-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "authenticated users can update own storage objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'image-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'image-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "authenticated users can delete own storage objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'image-documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);