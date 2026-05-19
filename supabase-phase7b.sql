-- ============================================================
-- PHASE 7b — Storage buckets + variant images
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add images to product_variants (safe to re-run)
alter table public.product_variants
  add column if not exists images text[] default '{}';

-- Create/update storage buckets as PUBLIC
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'page-banners',
  'page-banners',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Drop ALL existing storage policies for these buckets to start clean
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where tablename = 'objects' and schemaname = 'storage'
    and (policyname ilike '%product%' or policyname ilike '%banner%' or policyname ilike '%image%')
  loop
    execute 'drop policy if exists "' || pol.policyname || '" on storage.objects';
  end loop;
end $$;

-- Simple open policies: public read, authenticated write
-- Using auth.uid() is not null (correct modern syntax)
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.uid() is not null);

create policy "product_images_auth_update"
  on storage.objects for update
  using (bucket_id = 'product-images' and auth.uid() is not null);

create policy "product_images_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.uid() is not null);

create policy "page_banners_public_read"
  on storage.objects for select
  using (bucket_id = 'page-banners');

create policy "page_banners_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'page-banners' and auth.uid() is not null);

create policy "page_banners_auth_update"
  on storage.objects for update
  using (bucket_id = 'page-banners' and auth.uid() is not null);

create policy "page_banners_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'page-banners' and auth.uid() is not null);

select 'Phase 7b storage setup complete ✓' as result;
