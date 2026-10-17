-- ============================================================
-- RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- This is the single source of truth - safe to run multiple times
-- ============================================================

-- ── 1. Add missing columns to orders ─────────────────────────
alter table public.orders add column if not exists source text default 'online';
alter table public.orders add column if not exists promo_code text;
alter table public.orders add column if not exists customer_phone text;

-- ── 2. Fix RLS — allow inserts on all transaction tables ─────
-- Orders
drop policy if exists "Customers can create orders" on public.orders;
drop policy if exists "Anyone can create orders" on public.orders;
create policy "Anyone can create orders"
  on public.orders for insert with check (true);

-- Order items  
drop policy if exists "Anyone can insert order items" on public.order_items;
create policy "Anyone can insert order items"
  on public.order_items for insert with check (true);

-- Payments
drop policy if exists "Anyone can insert payments" on public.payments;
create policy "Anyone can insert payments"
  on public.payments for insert with check (true);

-- Activity log
drop policy if exists "Authenticated users can insert activity" on public.activity_log;
drop policy if exists "Anyone can insert activity" on public.activity_log;
create policy "Anyone can insert activity"
  on public.activity_log for insert with check (true);

-- ── 3. Ensure activity_log table exists ──────────────────────
create table if not exists public.activity_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete set null,
  user_email  text,
  user_role   text,
  action      text not null,
  entity_type text,
  entity_id   text,
  details     jsonb default '{}',
  created_at  timestamptz not null default now()
);
alter table public.activity_log enable row level security;

-- ── 4. Ensure wishlists table exists ─────────────────────────
create table if not exists public.wishlists (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
alter table public.wishlists enable row level security;
drop policy if exists "Users can manage own wishlist" on public.wishlists;
create policy "Users can manage own wishlist"
  on public.wishlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 5. Ensure promo_codes table exists ───────────────────────
create table if not exists public.promo_codes (
  id             uuid primary key default uuid_generate_v4(),
  code           text not null unique,
  description    text,
  discount_type  text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null,
  min_order      numeric(10,2) default 0,
  max_uses       integer,
  used_count     integer not null default 0,
  is_active      boolean not null default true,
  expires_at     timestamptz,
  created_at     timestamptz not null default now()
);
alter table public.promo_codes enable row level security;
drop policy if exists "Anyone can read active promo codes" on public.promo_codes;
create policy "Anyone can read active promo codes"
  on public.promo_codes for select using (is_active = true);

-- ── 6. Ensure email_log table exists ─────────────────────────
create table if not exists public.email_log (
  id         uuid primary key default uuid_generate_v4(),
  to_email   text not null,
  subject    text not null,
  template   text not null,
  status     text not null default 'pending',
  order_id   uuid references public.orders(id) on delete set null,
  error      text,
  created_at timestamptz not null default now()
);
alter table public.email_log enable row level security;
drop policy if exists "Service can insert email log" on public.email_log;
create policy "Service can insert email log"
  on public.email_log for insert with check (true);

-- ── 7. Add super_admin and read_only role values ─────────────
do $$ begin
  begin alter type user_role add value 'super_admin'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'read_only';   exception when duplicate_object then null; end;
end $$;

-- ── 8. Create inventory rows for variants that have none ──────
insert into public.inventory (variant_id, branch_id, quantity, low_stock_threshold)
select pv.id, 'osu', 0, 5
from public.product_variants pv
where not exists (
  select 1 from public.inventory i where i.variant_id = pv.id and i.branch_id = 'osu'
);

insert into public.inventory (variant_id, branch_id, quantity, low_stock_threshold)
select pv.id, 'east-legon', 0, 5
from public.product_variants pv
where not exists (
  select 1 from public.inventory i where i.variant_id = pv.id and i.branch_id = 'east-legon'
);

-- ── 9. Fix low_stock_alerts view (only real low stock, not zero) ──
drop view if exists public.low_stock_alerts;
create view public.low_stock_alerts as
select
  i.id,
  p.name  as product_name,
  pv.name as variant_name,
  i.branch_id,
  i.quantity,
  i.low_stock_threshold,
  pv.sku
from public.inventory i
join public.product_variants pv on pv.id = i.variant_id
join public.products p on p.id = pv.product_id
where i.quantity > 0
  and i.quantity <= i.low_stock_threshold
  and p.is_active = true
order by i.quantity asc;

-- ── 10. Ensure profiles trigger exists ───────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 11. Storage buckets ──────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('product-images', 'product-images', true, 5242880)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit)
values ('page-banners', 'page-banners', true, 5242880)
on conflict (id) do update set public = true;

drop policy if exists "product_images_read"   on storage.objects;
drop policy if exists "product_images_insert" on storage.objects;
drop policy if exists "product_images_update" on storage.objects;
drop policy if exists "product_images_delete" on storage.objects;
drop policy if exists "page_banners_read"     on storage.objects;
drop policy if exists "page_banners_insert"   on storage.objects;
drop policy if exists "page_banners_update"   on storage.objects;
drop policy if exists "page_banners_delete"   on storage.objects;

create policy "product_images_read"   on storage.objects for select using (bucket_id = 'product-images');
create policy "product_images_insert" on storage.objects for insert with check (bucket_id = 'product-images' and auth.uid() is not null);
create policy "product_images_update" on storage.objects for update using (bucket_id = 'product-images' and auth.uid() is not null);
create policy "product_images_delete" on storage.objects for delete using (bucket_id = 'product-images' and auth.uid() is not null);
create policy "page_banners_read"     on storage.objects for select using (bucket_id = 'page-banners');
create policy "page_banners_insert"   on storage.objects for insert with check (bucket_id = 'page-banners' and auth.uid() is not null);
create policy "page_banners_update"   on storage.objects for update using (bucket_id = 'page-banners' and auth.uid() is not null);
create policy "page_banners_delete"   on storage.objects for delete using (bucket_id = 'page-banners' and auth.uid() is not null);

-- ── 12. Add brands page content ──────────────────────────────
insert into public.page_content (page_key, page_title, banner_eyebrow, banner_title, banner_subtitle)
values ('brands', 'Brands Page', 'Our Brands', 'Shop by Brand', 'Discover premium beauty brands curated for every skin tone and type.')
on conflict (page_key) do nothing;

-- ── UPGRADE TO SUPER ADMIN (replace with your email) ─────────
-- update public.profiles set role = 'super_admin' where email = 'YOUR_EMAIL_HERE';

select 'All fixes applied successfully ✓' as result;
