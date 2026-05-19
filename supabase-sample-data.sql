-- ============================================================
-- DISCOUNT BEAUTY BARR — SAMPLE DATA (with safe cleanup)
-- Run this in Supabase SQL Editor
-- Safe to run multiple times — cleans up first
-- ============================================================

-- ── Clean up existing sample data ───────────────────────────
delete from public.order_items where order_id in (
  select id from public.orders where order_number like 'DBB-SAMPLE%'
);
delete from public.orders where order_number like 'DBB-SAMPLE%';
delete from public.inventory where variant_id in (
  select id from public.product_variants where product_id in (
    select id from public.products where id::text like '11111111%'
  )
);
delete from public.product_variants where product_id in (
  select id from public.products where id::text like '11111111%'
);
delete from public.products where id::text like '11111111%';

-- ── Insert sample products ───────────────────────────────────
insert into public.products (id, name, slug, description, category, brand, base_price, is_featured, is_active) values
  ('11111111-0001-0001-0001-000000000001', 'Toleriane Hydrating Gentle Cleanser', 'toleriane-hydrating-gentle-cleanser', 'Gentle, hydrating cleanser for sensitive skin.', 'skincare', 'La Roche-Posay', 185, true, true),
  ('11111111-0001-0001-0001-000000000002', 'Hyaluronic Acid 2% + B5', 'hyaluronic-acid-2-b5', 'Hydrating serum for all skin types.', 'skincare', 'The Ordinary', 95, false, true),
  ('11111111-0001-0001-0001-000000000003', 'Moisturising Cream', 'cerave-moisturising-cream', 'Rich moisturiser with ceramides.', 'skincare', 'CeraVe', 210, true, true),
  ('11111111-0001-0001-0001-000000000004', 'Pro Filt''r Soft Matte Foundation', 'pro-filtr-soft-matte-foundation', 'Full coverage matte foundation in 50 shades.', 'makeup', 'Fenty Beauty', 420, true, true),
  ('11111111-0001-0001-0001-000000000005', 'Fit Me Matte Foundation', 'fit-me-matte-poreless-foundation', 'Natural matte finish foundation.', 'makeup', 'Maybelline', 145, false, true),
  ('11111111-0001-0001-0001-000000000006', 'Black Opium Eau de Parfum', 'ysl-black-opium-edp', 'Bold, sensual fragrance with coffee and vanilla.', 'fragrance', 'YSL Beauty', 480, true, true);

-- ── Insert product variants ──────────────────────────────────
insert into public.product_variants (id, product_id, name, sku, price) values
  ('22222222-0001-0001-0001-000000000001', '11111111-0001-0001-0001-000000000001', '400ml', 'LRP-THC-400', 185),
  ('22222222-0001-0001-0001-000000000002', '11111111-0001-0001-0001-000000000001', '200ml', 'LRP-THC-200', 120),
  ('22222222-0001-0001-0001-000000000003', '11111111-0001-0001-0001-000000000002', '30ml',  'ORD-HA-030',  95),
  ('22222222-0001-0001-0001-000000000004', '11111111-0001-0001-0001-000000000003', '340g',  'CVE-MC-340',  210),
  ('22222222-0001-0001-0001-000000000005', '11111111-0001-0001-0001-000000000003', '539g',  'CVE-MC-539',  295),
  ('22222222-0001-0001-0001-000000000006', '11111111-0001-0001-0001-000000000004', '185N',  'FTY-PFF-185N',420),
  ('22222222-0001-0001-0001-000000000007', '11111111-0001-0001-0001-000000000004', '230N',  'FTY-PFF-230N',420),
  ('22222222-0001-0001-0001-000000000008', '11111111-0001-0001-0001-000000000005', '220',   'MBL-FMM-220', 145),
  ('22222222-0001-0001-0001-000000000009', '11111111-0001-0001-0001-000000000005', '330',   'MBL-FMM-330', 145),
  ('22222222-0001-0001-0001-000000000010', '11111111-0001-0001-0001-000000000006', '30ml',  'YSL-BO-030',  480),
  ('22222222-0001-0001-0001-000000000011', '11111111-0001-0001-0001-000000000006', '50ml',  'YSL-BO-050',  680);

-- ── Insert inventory for both branches ──────────────────────
insert into public.inventory (variant_id, branch_id, quantity, low_stock_threshold) values
  ('22222222-0001-0001-0001-000000000001', 'osu',        18, 5),
  ('22222222-0001-0001-0001-000000000001', 'east-legon', 12, 5),
  ('22222222-0001-0001-0001-000000000002', 'osu',         8, 5),
  ('22222222-0001-0001-0001-000000000002', 'east-legon',  4, 5),
  ('22222222-0001-0001-0001-000000000003', 'osu',        35, 5),
  ('22222222-0001-0001-0001-000000000003', 'east-legon', 28, 5),
  ('22222222-0001-0001-0001-000000000004', 'osu',        22, 5),
  ('22222222-0001-0001-0001-000000000004', 'east-legon', 15, 5),
  ('22222222-0001-0001-0001-000000000005', 'osu',        10, 5),
  ('22222222-0001-0001-0001-000000000005', 'east-legon',  2, 5),
  ('22222222-0001-0001-0001-000000000006', 'osu',        12, 5),
  ('22222222-0001-0001-0001-000000000006', 'east-legon',  9, 5),
  ('22222222-0001-0001-0001-000000000007', 'osu',         8, 5),
  ('22222222-0001-0001-0001-000000000007', 'east-legon',  3, 5),
  ('22222222-0001-0001-0001-000000000008', 'osu',        16, 5),
  ('22222222-0001-0001-0001-000000000008', 'east-legon', 14, 5),
  ('22222222-0001-0001-0001-000000000009', 'osu',        11, 5),
  ('22222222-0001-0001-0001-000000000009', 'east-legon',  0, 5),
  ('22222222-0001-0001-0001-000000000010', 'osu',         6, 5),
  ('22222222-0001-0001-0001-000000000010', 'east-legon',  4, 5),
  ('22222222-0001-0001-0001-000000000011', 'osu',         3, 5),
  ('22222222-0001-0001-0001-000000000011', 'east-legon',  2, 5);

-- ── Insert sample orders ─────────────────────────────────────
insert into public.orders (order_number, branch_id, status, fulfillment, customer_name, customer_email, customer_phone, delivery_address, delivery_city, subtotal, delivery_fee, total, created_at) values
  ('DBB-SAMPLE01', 'osu',        'delivered',  'delivery', 'Ama Mensah',     'ama@email.com',    '+233201234567', '12 Liberation Road, Accra', 'Accra', 420, 0,  420, now() - interval '2 days'),
  ('DBB-SAMPLE02', 'east-legon', 'confirmed',  'pickup',   'Adjoa Asante',   'adjoa@email.com',  '+233209876543', null,                        null,    815, 0,  815, now() - interval '1 day'),
  ('DBB-SAMPLE03', 'osu',        'pending',    'delivery', 'Efua Darko',     'efua@email.com',   '+233244567890', '5 Cantonments Road',        'Accra', 185, 30, 215, now() - interval '3 hours'),
  ('DBB-SAMPLE04', 'east-legon', 'processing', 'delivery', 'Akosua Boateng', 'akosua@email.com', '+233556781234', '78 East Legon Hills',       'Accra', 480, 0,  480, now() - interval '5 hours'),
  ('DBB-SAMPLE05', 'osu',        'ready',      'pickup',   'Abena Owusu',    'abena@email.com',  '+233277890123', null,                        null,    305, 0,  305, now() - interval '6 hours');

-- ── Insert sample order items ────────────────────────────────
insert into public.order_items (order_id, variant_id, product_name, variant_name, brand, sku, price, quantity)
select o.id, '22222222-0001-0001-0001-000000000006', 'Pro Filt''r Soft Matte Foundation', '185N', 'Fenty Beauty', 'FTY-PFF-185N', 420, 1
from public.orders o where o.order_number = 'DBB-SAMPLE01';

insert into public.order_items (order_id, variant_id, product_name, variant_name, brand, sku, price, quantity)
select o.id, '22222222-0001-0001-0001-000000000001', 'Toleriane Hydrating Gentle Cleanser', '400ml', 'La Roche-Posay', 'LRP-THC-400', 185, 1
from public.orders o where o.order_number = 'DBB-SAMPLE02';

insert into public.order_items (order_id, variant_id, product_name, variant_name, brand, sku, price, quantity)
select o.id, '22222222-0001-0001-0001-000000000004', 'Moisturising Cream', '340g', 'CeraVe', 'CVE-MC-340', 210, 3
from public.orders o where o.order_number = 'DBB-SAMPLE02';

insert into public.order_items (order_id, variant_id, product_name, variant_name, brand, sku, price, quantity)
select o.id, '22222222-0001-0001-0001-000000000001', 'Toleriane Hydrating Gentle Cleanser', '400ml', 'La Roche-Posay', 'LRP-THC-400', 185, 1
from public.orders o where o.order_number = 'DBB-SAMPLE03';

insert into public.order_items (order_id, variant_id, product_name, variant_name, brand, sku, price, quantity)
select o.id, '22222222-0001-0001-0001-000000000010', 'Black Opium Eau de Parfum', '30ml', 'YSL Beauty', 'YSL-BO-030', 480, 1
from public.orders o where o.order_number = 'DBB-SAMPLE04';

insert into public.order_items (order_id, variant_id, product_name, variant_name, brand, sku, price, quantity)
select o.id, '22222222-0001-0001-0001-000000000004', 'Moisturising Cream', '340g', 'CeraVe', 'CVE-MC-340', 210, 1
from public.orders o where o.order_number = 'DBB-SAMPLE05';

insert into public.order_items (order_id, variant_id, product_name, variant_name, brand, sku, price, quantity)
select o.id, '22222222-0001-0001-0001-000000000003', 'Hyaluronic Acid 2% + B5', '30ml', 'The Ordinary', 'ORD-HA-030', 95, 1
from public.orders o where o.order_number = 'DBB-SAMPLE05';

-- ── IMPORTANT: Make yourself admin ──────────────────────────
-- Replace YOUR_EMAIL with your actual email address, then run:
-- update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';

select 'Sample data inserted successfully ✓' as result;
