-- ============================================================
-- PHASE 7 — CONTENT MANAGEMENT & INVENTORY
-- Run in Supabase SQL Editor AFTER the main schema
-- ============================================================

-- ── Page content / banners ───────────────────────────────────
-- Each page has one record. Admin can edit text + upload image.
create table if not exists public.page_content (
  id            uuid primary key default uuid_generate_v4(),
  page_key      text not null unique,   -- e.g. 'home', 'shop', 'about', 'contact'
  page_title    text,                   -- displayed in admin list
  -- Hero / banner fields
  banner_image_url  text,              -- Supabase Storage public URL
  banner_eyebrow    text,              -- small text above title
  banner_title      text,              -- main heading
  banner_subtitle   text,              -- paragraph below title
  banner_cta_text   text,              -- button label
  banner_cta_href   text,              -- button link
  -- Extra per-page content (JSON for flexibility)
  extra             jsonb default '{}',
  updated_at    timestamptz not null default now(),
  updated_by    uuid references public.profiles(id) on delete set null
);

-- Seed one row per page
insert into public.page_content (page_key, page_title, banner_eyebrow, banner_title, banner_subtitle, banner_cta_text, banner_cta_href) values
  ('home',      'Homepage',        '✦ Premium Beauty · Accra Ghana', 'Beauty That Speaks For Itself.', 'Discover premium makeup and skincare curated for every complexion.', 'Shop Now', '/shop'),
  ('shop',      'Shop Page',       'Our Collection',   'Shop All Products',      'Premium makeup, skincare, haircare, and fragrance — curated for every complexion.', null, null),
  ('about',     'About Us',        'Our Story',        'More Than a Beauty Store','Seven years of passion, authenticity, and making premium beauty accessible.', null, null),
  ('contact',   'Contact Page',    'Get in Touch',     'We''d Love to Hear From You', 'Whether you have a question about a product or just want to say hi.', null, null),
  ('faq',       'FAQ Page',        'Help Centre',      'Frequently Asked Questions','Everything you need to know about shopping with Discount Beauty Barr.', null, null),
  ('locations', 'Store Locations', 'Find Us',          'Two Stores in Accra',    'Visit us at either of our locations — our beauty experts are always ready to help.', null, null),
  ('privacy',   'Privacy Policy',  'Legal',            'Privacy Policy',         'How we collect, use, and protect your personal information.', null, null),
  ('returns',   'Return Policy',   'Policies',         'Return & Exchange Policy','We want you to love every product you buy.', null, null),
  ('shipping',  'Shipping Policy', 'Policies',         'Shipping & Delivery',    'Everything you need to know about getting your order to you.', null, null),
  ('terms',     'Terms of Service','Legal',            'Terms of Service',       'Please read these terms carefully before using our website.', null, null)
on conflict (page_key) do nothing;

-- RLS
alter table public.page_content enable row level security;

create policy "Anyone can read page content"
  on public.page_content for select using (true);

create policy "Admins can update page content"
  on public.page_content for update
  using (public.is_admin_or_manager());

-- Storage bucket for page banners
insert into storage.buckets (id, name, public)
values ('page-banners', 'page-banners', true)
on conflict do nothing;

create policy "Public can view page banners"
  on storage.objects for select
  using (bucket_id = 'page-banners');

create policy "Admins can upload page banners"
  on storage.objects for insert
  with check (bucket_id = 'page-banners' and public.is_admin_or_manager());

create policy "Admins can delete page banners"
  on storage.objects for delete
  using (bucket_id = 'page-banners' and public.is_admin_or_manager());

-- Updated_at trigger
create trigger set_page_content_updated_at
  before update on public.page_content
  for each row execute procedure public.set_updated_at();

-- ── Inventory stock transfer log ─────────────────────────────
create table if not exists public.stock_transfers (
  id            uuid primary key default uuid_generate_v4(),
  variant_id    uuid not null references public.product_variants(id) on delete cascade,
  from_branch   branch_id,
  to_branch     branch_id,
  quantity      integer not null check (quantity > 0),
  note          text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.stock_transfers enable row level security;

create policy "Staff can view transfers"
  on public.stock_transfers for select
  using (public.is_staff());

create policy "Staff can create transfers"
  on public.stock_transfers for insert
  with check (public.is_staff());

select 'Phase 7 schema created ✓' as result;
