-- ============================================================================
-- DISCOUNT BEAUTY BARR - OCTOBER CLEARANCE SALE (16-19 Oct 2026)
-- Run once in the Supabase SQL Editor. Safe to re-run: every insert is guarded.
--
-- What this creates
--   1. sale_campaigns   - the sale window, on/off switch and preview key
--   2. sale_items       - which variants are in the sale, at what price, how many
--   3. sale_item_availability (view) - units left, counting paid orders and
--      unpaid orders started in the last 30 minutes
--   4. orders.sale_campaign_id - tags orders placed through the clearance page
--   5. 95 clearance products (hidden from /shop, POS and search: is_active = false)
--
-- All access goes through the server (service role). Nothing here is readable
-- with the public anon key.
-- ============================================================================

-- 1. Campaigns ---------------------------------------------------------------
create table if not exists public.sale_campaigns (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  is_enabled    boolean not null default true,
  preview_key   text not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 24),
  created_at    timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- 2. Sale items --------------------------------------------------------------
create table if not exists public.sale_items (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.sale_campaigns(id) on delete cascade,
  variant_id    uuid not null references public.product_variants(id) on delete cascade,
  original_price numeric(10,2) not null,
  sale_price    numeric(10,2) not null,
  sale_qty      integer not null check (sale_qty >= 0),
  sort_order    integer not null default 0,
  unique (campaign_id, variant_id),
  check (sale_price > 0 and sale_price <= original_price)
);

-- 3. Tag orders from the sale -----------------------------------------------
alter table public.orders add column if not exists sale_campaign_id uuid references public.sale_campaigns(id);
create index if not exists orders_sale_campaign_idx on public.orders (sale_campaign_id) where sale_campaign_id is not null;

-- 4. Units left (view) --------------------------------------------------------
create or replace view public.sale_item_availability as
select
  si.id as sale_item_id,
  si.campaign_id,
  si.variant_id,
  si.sale_qty,
  coalesce(sold.qty, 0)::int as reserved,
  greatest(si.sale_qty - coalesce(sold.qty, 0), 0)::int as remaining
from public.sale_items si
left join lateral (
  select sum(oi.quantity) as qty
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.variant_id = si.variant_id
    and o.sale_campaign_id = si.campaign_id
    and (
      o.status in ('confirmed','processing','ready','delivered')
      or (o.status = 'pending' and o.created_at > now() - interval '30 minutes')
    )
) sold on true;

-- 5. Lock everything down ----------------------------------------------------
alter table public.sale_campaigns enable row level security;
alter table public.sale_items     enable row level security;

drop policy if exists "Staff can view sale campaigns" on public.sale_campaigns;
create policy "Staff can view sale campaigns" on public.sale_campaigns for select using (public.is_staff());
drop policy if exists "Managers manage sale campaigns" on public.sale_campaigns;
create policy "Managers manage sale campaigns" on public.sale_campaigns for all using (public.is_admin_or_manager()) with check (public.is_admin_or_manager());

drop policy if exists "Staff can view sale items" on public.sale_items;
create policy "Staff can view sale items" on public.sale_items for select using (public.is_staff());
drop policy if exists "Managers manage sale items" on public.sale_items;
create policy "Managers manage sale items" on public.sale_items for all using (public.is_admin_or_manager()) with check (public.is_admin_or_manager());

revoke all on public.sale_item_availability from anon, authenticated;
grant select on public.sale_item_availability to service_role;

-- 6. The campaign: Fri 16 Oct 00:00 to Mon 19 Oct 23:59:59 (Accra = GMT/UTC) --
insert into public.sale_campaigns (slug, name, starts_at, ends_at)
values ('october-clearance', 'October Clearance Sale', '2026-10-16 00:00:00+00', '2026-10-19 23:59:59+00')
on conflict (slug) do nothing;

-- 7. The 95 products ---------------------------------------------------------
-- Hidden from the main shop (is_active = false). The clearance checkout reads
-- them through the sale tables, so they never appear anywhere else.
drop table if exists _clr;
create temporary table _clr (
  slug text, sku text, name text, brand text, category text, description text,
  variant text, original_price numeric, sale_price numeric, qty int, sort_order int
);

insert into _clr values
  ('clr-001-dr-davey-maximum-strength-tag-wart-remover','CLR-001','Maximum Strength Tag & Wart Remover','Dr. Davey','skincare','Topical tag and wart remover','16 ml / 0.5 fl oz',100,60,15,1),
  ('clr-002-selsun-clear-triple-clear-action-anti-pimples-facial-soap','CLR-002','Triple Clear Action Anti-Pimples Facial Soap','Selsun Clear','skincare','Facial cleansing soap for pimples and blemish-prone skin','Soap',50,30,15,2),
  ('clr-003-selsun-clear-visible-clear-stretch-marks-black-spots-soap','CLR-003','Visible Clear Stretch Marks & Black Spots Soap','Selsun Clear','skincare','Face and body soap marketed for stretch marks and dark spots','Soap',50,30,15,3),
  ('clr-004-dr-rashel-white-skin-whitening-day-cream','CLR-004','White Skin Whitening Day Cream','Dr. Rashel','skincare','Day cream for brightening and even-looking skin tone','Day Cream',100,80,15,4),
  ('clr-005-dr-rashel-white-skin-fade-spots-night-cream','CLR-005','White Skin Fade Spots Night Cream','Dr. Rashel','skincare','Night cream for dark spots and uneven-looking tone','Night Cream',100,80,15,5),
  ('clr-006-sacha-matte-all-nighter-long-lasting-makeup-setting-spray','CLR-006','All Nighter Long Lasting Makeup Setting Spray','Sacha Matte','makeup','Long-lasting makeup setting spray','Setting Spray',95,75,15,6),
  ('clr-007-rimmel-stay-matte-makeup-primer','CLR-007','Stay Matte Makeup Primer','Rimmel','makeup','Mattifying makeup primer/base','30 ml / 1 fl oz',140,100,15,7),
  ('clr-008-ruby-kisses-sweat-lock-makeup-setting-spray','CLR-008','Sweat Lock Makeup Setting Spray','Ruby Kisses','makeup','Sweat-resistant makeup setting spray','Setting Spray',160,140,15,8),
  ('clr-009-kiss-dose-lock-it-makeup-locking-mist','CLR-009','Lock It Makeup Locking Mist','Kiss & Dose','makeup','Waterproof, long-lasting transfer-proof makeup locking mist','200 ml',150,120,15,9),
  ('clr-010-pro-lab-skin-barrier-repair-ceramide-body-lotion','CLR-010','Skin Barrier Repair Ceramide Body Lotion','Pro Lab','body','Ceramide body lotion for skin-barrier support','Body Lotion',150,125,15,10),
  ('clr-011-pro-lab-snail-mucin-retinol-advanced-renewal-body-lotion','CLR-011','Snail Mucin + Retinol Advanced Renewal Body Lotion','Pro Lab','body','Renewal body lotion with snail mucin and retinol','Body Lotion',150,125,15,11),
  ('clr-012-face-facts-revive-brighten-caffeine-serum','CLR-012','Revive + Brighten Caffeine Serum','Face Facts','skincare','Caffeine facial serum for a brighter-looking complexion','30 ml',100,75,15,12),
  ('clr-013-face-facts-renew-radiance-retinol-serum','CLR-013','Renew + Radiance Retinol Serum','Face Facts','skincare','Retinol facial serum for fine lines and uneven skin tone','30 ml',100,75,15,13),
  ('clr-014-face-facts-firm-revitalise-collagen-serum','CLR-014','Firm + Revitalise Collagen Serum','Face Facts','skincare','Collagen facial serum for smoother-looking skin','30 ml',100,75,15,14),
  ('clr-015-face-facts-nourish-restore-ceramide-serum','CLR-015','Nourish + Restore Ceramide Serum','Face Facts','skincare','Ceramide facial serum for barrier support','30 ml',100,75,15,15),
  ('clr-016-face-facts-glow-resurface-lactic-acid-aha-serum','CLR-016','Glow + Resurface Lactic Acid AHA Serum','Face Facts','skincare','Lactic-acid exfoliating facial serum','30 ml',100,75,15,16),
  ('clr-017-face-facts-revive-refresh-hyaluronic-acid-serum','CLR-017','Revive + Refresh Hyaluronic Acid Serum','Face Facts','skincare','Hydrating hyaluronic-acid facial serum','30 ml',100,75,15,17),
  ('clr-018-kiss-beauty-make-up-fix-spray','CLR-018','Make Up Fix Spray','Kiss Beauty','makeup','Refreshing long-lasting makeup fixing mist','150 ml',70,50,15,18),
  ('clr-019-advanced-purity-vitamin-c-turmeric-advanced-brightening-loti','CLR-019','Vitamin C & Turmeric Advanced Brightening Lotion','Advanced Purity','body','Brightening face, neck, hand and body lotion','500 ml',150,120,15,19),
  ('clr-020-advanced-purity-niacinamide-hyaluronic-acid-advanced-brighte','CLR-020','Niacinamide & Hyaluronic Acid Advanced Brightening Lotion','Advanced Purity','body','Brightening and hydrating body lotion','500 ml',150,120,15,20),
  ('clr-021-egyptian-molato-soap-extra-whitening','CLR-021','Molato Soap Extra Whitening','Egyptian','body','Extra-whitening cleansing soap','Soap',100,75,15,21),
  ('clr-022-egyptian-goat-milk-black-soap-with-lemon-oil','CLR-022','Goat Milk Black Soap with Lemon Oil','Egyptian','body','Goat-milk black soap with lemon oil','500 g',100,75,15,22),
  ('clr-023-l-a-girl-pro-prep-hd-high-definition-smoothing-face-primer','CLR-023','PRO.prep HD High-Definition Smoothing Face Primer','L.A. Girl','makeup','Smoothing makeup primer','35 ml / 0.67 fl oz',65,40,15,23),
  ('clr-024-diamond-glow-anti-aging-whitening-body-milk','CLR-024','Anti-Aging Whitening Body Milk','Diamond Glow','body','Anti-ageing brightening body milk','500 ml',140,110,15,24),
  ('clr-025-diamond-glow-triple-fast-strong-whitening-body-milk','CLR-025','Triple Fast Strong Whitening Body Milk','Diamond Glow','body','Strong brightening body milk','500 ml',140,110,15,25),
  ('clr-026-diamond-glow-supreme-even-tone-lightening-body-milk','CLR-026','Supreme Even Tone Lightening Body Milk','Diamond Glow','body','Even-tone lightening body milk','500 ml',140,110,15,26),
  ('clr-027-g-clacos-huile-bio-traitante-42-heures-juste','CLR-027','Huile Bio Traitante 42 Heures Juste','G-Clacos','body','Brightening treatment oil for face, hands and feet','50 ml',100,60,15,27),
  ('clr-028-who-s-that-girl-makeup-fixer-spray-fix','CLR-028','Makeup Fixer Spray FIX+','Who''s That Girl','makeup','Long-lasting makeup fixing spray','150 ml',100,89,15,28),
  ('clr-029-egyptian-half-cast-gold-10-days-active-whitening-lotion','CLR-029','Half Cast Gold 10 Days Active Whitening Lotion','Egyptian','body','Active whitening body lotion','400 ml',140,99,15,29),
  ('clr-030-egyptian-half-cast-carrot-7-days-active-whitening-lotion','CLR-030','Half Cast Carrot 7 Days Active Whitening Lotion','Egyptian','body','Carrot and argan-oil brightening body lotion','400 ml',140,99,15,30),
  ('clr-031-egyptian-half-cast-14-days-whitening-lotion','CLR-031','Half Cast 14 Days Whitening Lotion','Egyptian','body','Intensive brightening body lotion','400 ml',140,99,15,31),
  ('clr-032-dr-davey-bright-clear-cream','CLR-032','Bright & Clear Cream','Dr. Davey','skincare','Cream with kojic acid, niacinamide, AHA/BHA and hyaluronic acid','100 g / 3.5 oz',100,50,15,32),
  ('clr-033-becharm-ageless-stay-matte-sweat-free-face-primer-moisturize','CLR-033','Stay Matte Sweat Free Face Primer Moisturizer','Becharm Ageless','makeup','Mattifying face primer and moisturizer','65 ml / 2.2 fl oz',150,120,15,33),
  ('clr-034-cloud-9-paris-lemon-plus-mango-extracts-cloud-nine-lotion','CLR-034','Lemon Plus Mango Extracts Cloud Nine Lotion','Cloud 9 Paris','body','Multi-vitamin brightening body lotion with lemon and mango extracts','500 ml / 16.8 fl oz',220,195,15,34),
  ('clr-035-classic-makeup-velvet-matte-oil-control-base','CLR-035','Velvet Matte Oil Control Base','Classic Makeup','makeup','Mattifying oil-control makeup base','20 ml / 0.68 fl oz',75,60,15,35),
  ('clr-036-flawless-ivy-optimus-prime-face-primer','CLR-036','Optimus Prime Face Primer','Flawless Ivy','makeup','Face primer for makeup preparation','35 ml / 1.18 fl oz',100,65,15,36),
  ('clr-037-nature-balance-immense-clarifying-fairness-body-lotion','CLR-037','Immense Clarifying Fairness Body Lotion','Nature Balance','body','Clarifying body lotion','500 g / 17.6 fl oz',140,100,15,37),
  ('clr-038-nature-balance-bright-extra-radiance-body-lotion','CLR-038','Bright & Extra Radiance Body Lotion','Nature Balance','body','Body lotion for brighter, more radiant-looking skin','500 g / 17.6 fl oz',140,100,15,38),
  ('clr-039-art-face-palette','CLR-039','Face Palette','ART','makeup','Complexion/face makeup palette','Palette',85,70,15,39),
  ('clr-040-glow-booster-3-in-1-brightening-lotion','CLR-040','3-in-1 Brightening Lotion','Glow Booster','skincare','Brightening skincare lotion','Lotion',140,80,15,40),
  ('clr-041-l-a-girl-pro-prep-face-primer','CLR-041','PRO.prep Face Primer','L.A. Girl','makeup','Makeup primer/base','Primer',65,40,15,41),
  ('clr-042-egyptian-active-whitening-lotion','CLR-042','Active Whitening Lotion','Egyptian','body','Brightening body lotion','Body Lotion',120,90,15,42),
  ('clr-043-egyptian-active-whitening-lotion','CLR-043','Active Whitening Lotion','Egyptian','body','Brightening body lotion','Body Lotion',140,99,15,43),
  ('clr-044-cpd-makeup-fixing-spray','CLR-044','Makeup Fixing Spray','CPD','makeup','Makeup setting/fixing spray','Setting Spray',150,120,15,44),
  ('clr-045-latino-body-lotion','CLR-045','Body Lotion','Latino','body','Moisturizing body lotion','Body Lotion',110,90,15,45),
  ('clr-046-who-s-that-girl-face-primer','CLR-046','Face Primer','Who''s That Girl','makeup','Makeup primer/base','Primer',85,55,15,46),
  ('clr-047-vagen-skincare-serum','CLR-047','Skincare Serum','VAGEN','skincare','Facial treatment serum','Serum',100,60,15,47),
  ('clr-048-advanced-body-lotion','CLR-048','Body Lotion','Advanced','body','Body moisturizing lotion','Body Lotion',220,200,15,48),
  ('clr-049-bang-setter-makeup-setting-spray','CLR-049','Makeup Setting Spray','Bang Setter','makeup','Long-lasting makeup setting spray','Setting Spray',100,80,15,49),
  ('clr-050-shalom-skin-treatment-oil','CLR-050','Skin Treatment Oil','Shalom','body','Topical skincare treatment oil','Oil',90,45,15,50),
  ('clr-051-dr-rashel-vitamin-c-skincare','CLR-051','Vitamin C Skincare','Dr. Rashel','skincare','Vitamin C facial skincare product','Vitamin C',100,50,15,51),
  ('clr-052-l-a-girl-pro-coverage-face-makeup','CLR-052','PRO Coverage / Face Makeup','L.A. Girl','makeup','Face makeup product','Makeup',60,40,15,52),
  ('clr-053-kiss-rose-stay-matte','CLR-053','Stay Matte','Kiss & Rose','makeup','Mattifying makeup product','Stay Matte',95,75,15,53),
  ('clr-054-whitening-cream-whitening-cream','CLR-054','Whitening Cream','Whitening Cream','skincare','Skin brightening cream','Cream',85,60,15,54),
  ('clr-055-derma-white-whitening-cream','CLR-055','Whitening Cream','Derma White','skincare','Skin brightening cream','Cream',100,75,15,55),
  ('clr-056-derma-white-cream','CLR-056','Cream','Derma White','skincare','Facial/body skincare cream','Cream',100,60,15,56),
  ('clr-057-pkd-pink-diamond-sweat-block','CLR-057','Pink Diamond Sweat Block','PKD','makeup','Sweat-block makeup product','Sweat Block',100,85,15,57),
  ('clr-058-sacha-matte-fix-it-spray','CLR-058','Fix-It Spray','Sacha Matte','makeup','Makeup fixing spray','Fixing Spray',95,75,15,58),
  ('clr-059-selsun-clear-fast-whitening-soap','CLR-059','Fast Whitening Soap','Selsun Clear','skincare','Cleansing/brightening soap','Soap',50,30,15,59),
  ('clr-060-purest-glow-scrub-shower-gel','CLR-060','Scrub Shower Gel','Purest Glow','body','Exfoliating shower gel','Shower Gel',160,120,15,60),
  ('clr-061-who-s-that-girl-lock-it-makeup-fixer','CLR-061','Lock It Makeup Fixer','Who''s That Girl','makeup','Long-lasting makeup locking spray','Fixer',150,120,15,61),
  ('clr-062-moist-essence-skincare-essence','CLR-062','Skincare Essence','Moist Essence','skincare','Moisturizing facial essence','Essence',150,120,15,62),
  ('clr-063-acne-treatment-acne-treatment-cream','CLR-063','Acne Treatment Cream','Acne Treatment','skincare','Topical acne treatment cream','Cream',95,60,15,63),
  ('clr-064-lock-in-makeup-fixing-spray','CLR-064','Makeup Fixing Spray','LOCK IN','makeup','Long-lasting makeup fixing spray','Setting Spray',160,140,15,64),
  ('clr-065-probiotic-probiotic-moisturizing-body-lotion','CLR-065','Probiotic Moisturizing Body Lotion','Probiotic','body','Moisturizing probiotic body lotion','Body Lotion',75,65,15,65),
  ('clr-066-mario-badescu-facial-spray-with-aloe-cucumber-and-green-tea','CLR-066','Facial Spray with Aloe, Cucumber and Green Tea','Mario Badescu','skincare','Refreshing facial mist with aloe, cucumber and green tea','118 ml / 4 fl oz',150,120,15,66),
  ('clr-067-mario-badescu-facial-spray-with-aloe-chamomile-and-lavender','CLR-067','Facial Spray with Aloe, Chamomile and Lavender','Mario Badescu','skincare','Refreshing facial mist with aloe, chamomile and lavender','118 ml / 4 fl oz',150,120,15,67),
  ('clr-068-glow-booster-lightening-body-lotion','CLR-068','Lightening Body Lotion','Glow Booster','body','Lightening body lotion','Body Lotion',140,80,15,68),
  ('clr-069-stay-on-makeup-setting-spray','CLR-069','Makeup Setting Spray','Stay On','makeup','Long-wear makeup setting spray','Setting Spray',95,65,15,69),
  ('clr-070-lumine-gold-body-milk','CLR-070','Gold Body Milk','Lumine','body','Gold body milk/lotion','Body Milk',120,90,15,70),
  ('clr-071-lumine-carrot-body-milk','CLR-071','Carrot Body Milk','Lumine','body','Carrot body milk/lotion','Body Milk',120,90,15,71),
  ('clr-072-lumine-vitamin-c-body-milk','CLR-072','Vitamin C Body Milk','Lumine','body','Vitamin C body milk/lotion','Body Milk',120,90,15,72),
  ('clr-073-get-a-grip-hydro-grip-primer','CLR-073','Hydro Grip Primer','Get A Grip','makeup','Hydrating makeup gripping primer','Primer',185,160,15,73),
  ('clr-074-golden-glow-intensive-hair-cream','CLR-074','Intensive Hair Cream','Golden Glow','haircare','Intensive hair cream treatment','Hair Cream',150,120,15,74),
  ('clr-075-golden-white-body-oil','CLR-075','Body Oil','Golden White','body','Golden White skincare/body oil','Body Oil',150,110,15,75),
  ('clr-076-beauty-glazed-brown-6-color-face-palette','CLR-076','Brown 6 Color Face Palette','Beauty Glazed','makeup','6-pan brown-toned face/contour palette','Palette',100,60,10,76),
  ('clr-077-round-blush-palette','CLR-077','Round Blush Palette','','makeup','Multi-pan round blush palette','Palette',45,10,10,77),
  ('clr-078-art-large-multi-color-makeup-palette','CLR-078','Large Multi-Color Makeup Palette','ART','makeup','Large multi-shade makeup palette','Palette',120,100,10,78),
  ('clr-079-who-s-that-girl-4-color-face-palette','CLR-079','4-Color Face Palette','Who''s That Girl','makeup','Four-pan bright face/blush palette','Palette',75,50,10,79),
  ('clr-080-kylie-blush-palette','CLR-080','Blush Palette','Kylie','makeup','Multi-shade blush palette','Palette',35,20,10,80),
  ('clr-081-6-color-blush-palette','CLR-081','6-Color Blush Palette','','makeup','Six-pan blush/face palette','Palette',100,60,10,81),
  ('clr-082-cpd-face-palette-orange','CLR-082','Face Palette - Orange','CPD','makeup','Multi-pan orange-toned face palette','Palette',150,120,10,82),
  ('clr-083-cpd-face-palette-nude-pink','CLR-083','Face Palette - Nude/Pink','CPD','makeup','Multi-pan nude/pink face palette','Palette',150,120,10,83),
  ('clr-084-kiss-dose-highlighter-palette','CLR-084','Highlighter Palette','Kiss & Dose','makeup','Multi-shade highlighting face palette','Palette',150,120,10,84),
  ('clr-085-6-color-highlighter-palette','CLR-085','6-Color Highlighter Palette','','makeup','Six-pan highlighting palette','Palette',120,90,10,85),
  ('clr-086-xclusive-makeup-18-color-face-palette','CLR-086','18 Color Face Palette','Xclusive Makeup','makeup','18-shade complexion/face palette','18 Colors',75,60,10,86),
  ('clr-087-ve-cosmetics-4-color-highlighter-palette','CLR-087','4-Color Highlighter Palette','VE Cosmetics','makeup','Four-pan highlighter palette','Palette',75,50,10,87),
  ('clr-088-blossom-face-palette','CLR-088','Face Palette','Blossom','makeup','Multi-pan blush/highlight face palette','Palette',120,90,10,88),
  ('clr-089-large-color-eyeshadow-palette','CLR-089','Large Color Eyeshadow Palette','','makeup','Large multicolor eyeshadow palette','Palette',120,100,10,89),
  ('clr-090-6-color-blush-palette-bright','CLR-090','6-Color Blush Palette - Bright','','makeup','Six-pan bright blush palette','Palette',85,69,10,90),
  ('clr-091-blossom-nude-face-palette','CLR-091','Nude Face Palette','Blossom','makeup','Neutral blush/highlight face palette','Palette',150,110,10,91),
  ('clr-092-who-s-that-girl-eyeshadow-palette','CLR-092','Eyeshadow Palette','Who''s That Girl','makeup','Warm-toned multi-pan eyeshadow palette','Palette',100,60,10,92),
  ('clr-093-who-s-that-girl-2-color-face-palette','CLR-093','2-Color Face Palette','Who''s That Girl','makeup','Two-pan blush/face palette','Palette',75,50,10,93),
  ('clr-094-warm-tone-9-color-face-palette','CLR-094','Warm Tone 9-Color Face Palette','','makeup','Nine-pan warm blush/face palette','9 Colors',100,60,10,94),
  ('clr-095-kylie-style-8-color-blush-palette','CLR-095','Kylie-Style 8-Color Blush Palette','','makeup','Eight-pan blush palette','8 Colors',35,20,10,95);

insert into public.products (name, slug, description, category, brand, base_price, is_active, is_featured)
select c.name, c.slug, c.description, c.category::product_category, c.brand, c.original_price, false, false
from _clr c
on conflict (slug) do nothing;

insert into public.product_variants (product_id, name, sku, price)
select p.id, c.variant, c.sku, c.original_price
from _clr c
join public.products p on p.slug = c.slug
on conflict (sku) do nothing;

insert into public.sale_items (campaign_id, variant_id, original_price, sale_price, sale_qty, sort_order)
select camp.id, v.id, c.original_price, c.sale_price, c.qty, c.sort_order
from _clr c
join public.product_variants v on v.sku = c.sku
cross join (select id from public.sale_campaigns where slug = 'october-clearance') camp
on conflict (campaign_id, variant_id) do nothing;

drop table if exists _clr;

-- 8. Check: should return 95 items and the preview key -----------------------
select (select count(*) from public.sale_items) as items_in_sale,
       preview_key as preview_key_copy_this
from public.sale_campaigns where slug = 'october-clearance';
