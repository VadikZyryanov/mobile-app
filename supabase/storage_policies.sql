-- =========================================================
-- Storage buckets + policies — apply via Supabase Studio SQL editor
-- AFTER creating buckets manually in Studio → Storage UI:
--   1. exercise-media  (private, 50MB, image/gif video/mp4)
--   2. workout-covers  (public,  5MB,  image/jpeg image/png image/webp)
--   3. program-covers  (public,  5MB,  image/jpeg image/png image/webp)
--   4. blog-media      (public,  5MB,  image/jpeg image/png image/webp)
-- =========================================================

create policy "storage_admin_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('exercise-media', 'workout-covers', 'program-covers', 'blog-media')
    and public.is_admin()
  );

create policy "storage_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('exercise-media', 'workout-covers', 'program-covers', 'blog-media')
    and public.is_admin()
  )
  with check (public.is_admin());

create policy "storage_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('exercise-media', 'workout-covers', 'program-covers', 'blog-media')
    and public.is_admin()
  );
