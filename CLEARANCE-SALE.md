# October clearance sale (16 to 19 October 2026)

Standalone page at `/clearance`. It has its own header (no main-site menu or footer), is hidden from search engines, and checks the sale dates on the server on every request.

## Go-live steps

1. **Supabase.** Open the SQL Editor, paste `supabase-clearance-sale.sql`, run it. The last query returns `items_in_sale` (75) and your `preview_key`. Copy the key.
2. **GitHub.** Add these files to the repo and push (Vercel deploys):
   - `supabase-clearance-sale.sql`, `CLEARANCE-SALE.md`
   - `middleware.ts` (replaces the old one)
   - `lib/clearance.ts`
   - `app/clearance/` (layout, page, ClearanceShop, Countdown, clearance.css, verify/page)
   - `app/api/clearance/checkout/route.ts`
   - `public/clearance/logo.png`, `public/clearance/logo-light.png`
3. **Vercel env vars** (should already exist, check they are set for Production): `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`.
4. **Check it before the sale:** open `https://YOUR-SITE/clearance?key=PREVIEW_KEY`. Without the key, visitors see a countdown until 00:00 on 16 October, the full sale until 23:59:59 on 19 October (Accra is GMT), then "sale ended". Orders are refused by the server outside those times, even with the key.

## Keeping visitors out of the unfinished shop

Set `SALE_LOCKDOWN_UNTIL` in Vercel to `2026-10-20T00:00:00Z` and redeploy. Until then every public store page (home, shop, cart and so on) redirects to `/clearance`. Admin, POS, login, account and all APIs still work. Delete the variable and redeploy when the main site is ready.

## How it works

- Products are inserted with `is_active = false`, so they never appear in /shop, search or the POS. They show in Admin > Products, where you can add photos later; the clearance page picks up the first image automatically.
- Prices and quantities come from `sale_items`. The checkout API ignores prices sent by the browser.
- Units left = `sale_qty` minus paid orders, minus unpaid orders started in the last 30 minutes. This is separate from the branch `inventory` table, which the sale does not change.
- Orders carry `sale_campaign_id` and the note "[Clearance sale]" so you can find them in Admin > Orders.
- To change dates, on/off or the preview key, edit the row in `sale_campaigns`.
