-- ============================================================
-- GAPS & FEATURES SQL
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Add roles ─────────────────────────────────────────────
-- Drop and recreate user_role enum with new roles
-- (Safe approach: add new values to existing enum)
alter type user_role add value if not exists 'super_admin';
alter type user_role add value if not exists 'read_only';

-- ── 2. Wishlist table ────────────────────────────────────────
create table if not exists public.wishlists (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  product_id  text not null,   -- product id (string to work with both local + supabase)
  created_at  timestamptz not null default now(),
  unique(user_id, product_id)
);

alter table public.wishlists enable row level security;

create policy "Users can manage own wishlist"
  on public.wishlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 3. Activity log ──────────────────────────────────────────
create table if not exists public.activity_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete set null,
  user_email  text,
  user_role   text,
  action      text not null,     -- e.g. 'order.status_updated', 'product.created'
  entity_type text,              -- e.g. 'order', 'product', 'customer'
  entity_id   text,              -- the id of what was affected
  details     jsonb default '{}',-- extra context
  ip_address  text,
  created_at  timestamptz not null default now()
);

alter table public.activity_log enable row level security;

create policy "Admins can view activity log"
  on public.activity_log for select
  using (public.is_admin_or_manager());

create policy "Authenticated users can insert activity"
  on public.activity_log for insert
  with check (auth.uid() is not null);

create index idx_activity_log_user    on public.activity_log(user_id);
create index idx_activity_log_action  on public.activity_log(action);
create index idx_activity_log_created on public.activity_log(created_at desc);

-- ── 4. Promo codes ───────────────────────────────────────────
create table if not exists public.promo_codes (
  id            uuid primary key default uuid_generate_v4(),
  code          text not null unique,
  description   text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null,
  min_order     numeric(10,2) default 0,
  max_uses      integer,
  used_count    integer not null default 0,
  is_active     boolean not null default true,
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

create policy "Anyone can read active promo codes"
  on public.promo_codes for select
  using (is_active = true);

create policy "Admins can manage promo codes"
  on public.promo_codes for all
  using (public.is_admin_or_manager());

-- ── 5. Product reviews ───────────────────────────────────────
create table if not exists public.product_reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  text not null,
  user_id     uuid references public.profiles(id) on delete set null,
  user_name   text not null,
  rating      integer not null check (rating between 1 and 5),
  title       text,
  body        text,
  is_verified boolean default false,  -- verified purchaser
  is_approved boolean default false,  -- admin approved
  created_at  timestamptz not null default now()
);

alter table public.product_reviews enable row level security;

create policy "Anyone can view approved reviews"
  on public.product_reviews for select
  using (is_approved = true);

create policy "Authenticated users can submit reviews"
  on public.product_reviews for insert
  with check (auth.uid() = user_id);

create policy "Admins can manage reviews"
  on public.product_reviews for all
  using (public.is_admin_or_manager());

-- ── 6. Email notification log ────────────────────────────────
create table if not exists public.email_log (
  id          uuid primary key default uuid_generate_v4(),
  to_email    text not null,
  subject     text not null,
  template    text not null,
  status      text not null default 'pending',  -- pending, sent, failed
  order_id    uuid references public.orders(id) on delete set null,
  error       text,
  created_at  timestamptz not null default now()
);

alter table public.email_log enable row level security;

create policy "Admins can view email log"
  on public.email_log for select
  using (public.is_admin_or_manager());

create policy "Service can insert email log"
  on public.email_log for insert
  with check (true);

-- ── 7. Add promo_code to orders ──────────────────────────────
alter table public.orders
  add column if not exists promo_code text,
  add column if not exists source text default 'online'; -- 'online' | 'pos'

-- ── 8. Fix inventory linked to product display ───────────────
-- View: products with real stock from inventory (Osu + East Legon combined)
create or replace view public.products_with_stock as
select
  p.*,
  pv.id as variant_id,
  pv.name as variant_name,
  pv.sku,
  pv.price,
  pv.images as variant_images,
  coalesce(sum(i.quantity), 0) as total_stock,
  coalesce(min(i.quantity), 0) as min_branch_stock
from public.products p
join public.product_variants pv on pv.product_id = p.id
left join public.inventory i on i.variant_id = pv.id
where p.is_active = true
group by p.id, pv.id;

select 'Gaps SQL complete ✓' as result;
