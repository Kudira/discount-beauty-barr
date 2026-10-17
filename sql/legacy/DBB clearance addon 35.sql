-- DBB clearance ADD-ON: 35 more items (CLR-096 to CLR-130), qty 15 each.
-- Safe to run while the sale is live. Safe to run twice (skips what exists).
-- Needs the main clearance SQL to have been run already.
-- Left out on purpose: 13 items already in the sale.
-- CLR-126 to CLR-130 have no original price, so they sell at their promo price with no discount badge.

drop table if exists _clr;
create temporary table _clr (
  slug text, sku text, name text, brand text, category text, description text,
  variant text, original_price numeric, sale_price numeric, qty int, sort_order int
);

insert into _clr values
  ('clr-096-daroge-matte-stay-4-colors-blush-palette','CLR-096','Matte Stay 4 Colors Blush Palette','Daroge','makeup','Four-shade blush palette for cheek colour.','Assorted pink/coral shades',45,20,15,96),
  ('clr-097-kormesic-prebiotic-oat-moisturizing-body-lotion','CLR-097','Prebiotic Oat Moisturizing Body Lotion','Kormesic','body','Prebiotic oat body lotion for moisturizing and barrier care.','500 g / 17.6 fl oz',75,65,15,97),
  ('clr-098-sacha-ivy-liquid-blush-palette','CLR-098','Liquid Blush Palette','Sacha Ivy','makeup','Four-pan liquid blush palette.','4 shades',75,50,15,98),
  ('clr-099-essa-and-dose-face-sculpting-palette-blush-and-highlight','CLR-099','Face Sculpting Palette – Blush & Highlight','Essa & Dose','makeup','Face sculpting palette combining blush and highlighter shades.','Lush Edition / 6 pan',150,120,15,99),
  ('clr-100-flawless-cosmetics-oil-free-foundation','CLR-100','Oil-Free Foundation','Flawless Cosmetics','makeup','Waterproof matte liquid foundation.','Tan / Ivory / Beige / Honey',120,100,15,100),
  ('clr-101-sama-goddess-blush-and-highlighter-face-palette','CLR-101','Blush & Highlighter Face Palette','Sama Goddess','makeup','Face palette combining blush and highlighter shades.','8 pan',150,100,15,101),
  ('clr-102-nyx-professional-makeup-can-t-stop-won-t-stop-full-coverage-','CLR-102','Can''t Stop Won''t Stop Full Coverage Foundation','NYX Professional Makeup','makeup','24-hour matte full-coverage liquid foundation.','Honey / Golden / Almond',250,220,15,102),
  ('clr-103-xclusive-makeup-4-colors-blush-palette','CLR-103','4 Colors Blush Palette','Xclusive Makeup','makeup','Four-colour blush palette.','4 shades',85,65,15,103),
  ('clr-104-blossom-makeup-blush-and-highlighter-palette','CLR-104','Blush & Highlighter Palette','Blossom Makeup','makeup','Multi-pan face palette combining blush and highlighter shades.','10 pan',150,100,15,104),
  ('clr-105-maybelline-super-stay-active-wear-30h-foundation','CLR-105','Super Stay Active Wear 30H Foundation','Maybelline','makeup','Long-wear liquid foundation.','312 Golden / 320 Honey / 332 Golden Caramel / 375 Java',250,220,15,105),
  ('clr-106-cpd-cheek-fusion-multi-finish-blush-trio','CLR-106','Cheek Fusion Multi-Finish Blush Trio','CPD','makeup','Three-pan blush palette in multiple colourways.','Orange/Coral and Nude/Pink variants',150,120,15,106),
  ('clr-107-vfe-violyn-glow-kit-4-color-highlight-palette','CLR-107','Glow Kit 4 Color Highlight Palette','VFE Violyn','makeup','Four-colour highlighting palette.','Fire / Honey / Blondie / fourth shade shown',75,50,15,107),
  ('clr-108-romantic-flower-make-up-blush','CLR-108','Make Up Blush','Romantic Flower','makeup','Pressed blush compact.','Assorted shades',45,10,15,108),
  ('clr-109-blossom-makeup-brown-ish-eyeshadow-palette','CLR-109','Brown-ish Eyeshadow Palette','Blossom Makeup','makeup','Multi-shade eyeshadow palette.','24 pan',150,120,15,109),
  ('clr-110-adventure-superstay-pro-longwear-full-coverage-foundation','CLR-110','Superstay Pro Longwear Full Coverage Foundation','Adventure','makeup','100% matte long-wear liquid foundation with SPF 30.','30 ml / assorted shades',100,80,15,110),
  ('clr-111-avour-super-stay-full-coverage-matte-base-waterproof-foundat','CLR-111','Super Stay Full Coverage Matte Base Waterproof Foundation','Avour','makeup','Pro long-wear liquid foundation with full coverage.','SPF 25 / 50 ml / assorted shades',100,60,15,111),
  ('clr-112-sacha-ivy-cheek-crush-signature-blush-palette','CLR-112','Cheek Crush Signature Blush Palette','Sacha Ivy','makeup','Nine-shade blush palette.','9 pan',100,60,15,112),
  ('clr-113-latino-skin-whitening-milk','CLR-113','Skin Whitening Milk','Latino','body','Body milk marketed for brightening and tone care.','300 ml',110,90,15,113),
  ('clr-114-lumine-gold-10-days-extra-whitening-lotion','CLR-114','Gold 10 Days Extra Whitening Lotion','Lumine','body','Brightening body lotion.','Gold / 10 Days',120,90,15,114),
  ('clr-115-jackelin-liquid-foundation','CLR-115','Liquid Foundation','Jackelin','makeup','Liquid complexion foundation.','Assorted shades shown',120,80,15,115),
  ('clr-116-pkd-pynk-diamond-24h-smooth-skin-foundation','CLR-116','24H Smooth Skin Foundation','PKD Pynk Diamond','makeup','24-hour smoothing liquid foundation.','Assorted shades shown',100,80,15,116),
  ('clr-117-advanced-korean-skin-vita-and-deep-radiance-body-lotion','CLR-117','Vita & Deep Radiance Body Lotion','Advanced Korean Skin','body','Body lotion for radiance and moisturizing care.','500 ml',220,200,15,117),
  ('clr-118-advanced-korean-skin-bright-and-moisture-body-lotion','CLR-118','Bright & Moisture Body Lotion','Advanced Korean Skin','body','Body lotion for brightening and moisturizing care.','500 ml',220,200,15,118),
  ('clr-119-advanced-korean-skin-lightening-and-barrier-repair-body-loti','CLR-119','Lightening & Barrier Repair Body Lotion','Advanced Korean Skin','body','Body lotion for tone care and skin-barrier support.','500 ml',220,200,15,119),
  ('clr-120-art-makeup-posh-paris-pigmented-highlight-palette','CLR-120','Posh Paris Pigmented Highlight Palette','Art Makeup','makeup','Pigmented highlighting palette.','6 pan',120,90,15,120),
  ('clr-121-flawless-ivy-blush-palette','CLR-121','Blush Palette','Flawless Ivy','makeup','Six-shade blush palette.','Strawberry / Plum / Posh / Rosewood / Scarlet / XO',120,90,15,121),
  ('clr-122-blossom-makeup-liquid-complexion-product-assorted-shades','CLR-122','Liquid Complexion Product – Assorted Shades','Blossom Makeup','makeup','Liquid complexion product shown with a full shade swatch range.','Assorted light-to-deep shades',120,95,15,122),
  ('clr-123-duchess-glow-vitamins-c-turmeric-beauty-therapy-oil','CLR-123','Vitamins C + Turmeric Beauty Therapy Oil','Duchess Glow','body','Body treatment oil with vitamins C and turmeric.','Vitamin C + Turmeric',120,100,15,123),
  ('clr-124-duchess-glow-super-l-glutathione-beauty-therapy-oil','CLR-124','Super L-Glutathione Beauty Therapy Oil','Duchess Glow','body','Body treatment oil with L-glutathione.','Super L-Glutathione',120,100,15,124),
  ('clr-125-duchess-glow-retinol-centella-extract-beauty-therapy-oil','CLR-125','Retinol + Centella Extract Beauty Therapy Oil','Duchess Glow','body','Body treatment oil with retinol and centella extract.','Retinol + Centella Extract',120,100,15,125),
  ('clr-126-miss-betty-lip-gloss','CLR-126','Lip Gloss','Miss Betty','makeup','Lip gloss for shine and colour.','Brown/nude shade shown',25,25,15,126),
  ('clr-127-vc-matte-friends-reunion-palette-josephine','CLR-127','Matte Friends Reunion Palette – Josephine','VC','makeup','Large matte makeup palette.','Josephine',190,190,15,127),
  ('clr-128-avour-super-stay-full-coverage-matte-foundation-spf25','CLR-128','Super Stay Full Coverage Matte Foundation SPF25','Avour','makeup','Full-coverage matte liquid foundation.','SPF 25 / assorted shades',60,60,15,128),
  ('clr-129-avour-bestskin-full-coverage-foundation-spf20','CLR-129','Bestskin Full Coverage Foundation SPF20','Avour','makeup','Full-coverage liquid foundation.','SPF 20',120,120,15,129),
  ('clr-130-l-or-al-paris-infallible-24h-fresh-wear-foundation','CLR-130','Infallible 24H Fresh Wear Foundation','L''Oréal Paris','makeup','24-hour long-wear liquid foundation.','Shade shown in follow-up image',100,100,15,130);

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

-- Check: should return 130 items and the preview key -----------------------
select (select count(*) from public.sale_items) as items_in_sale,
       preview_key as preview_key_copy_this
from public.sale_campaigns where slug = 'october-clearance';
