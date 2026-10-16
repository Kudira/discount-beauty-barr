# October clearance sale (16 to 19 October 2026)

Standalone page at `/clearance`. It has its own header (no main-site menu or footer), is hidden from search engines, and checks the sale dates on the server on every request.

## Go-live steps

1. **Supabase.** Open the SQL Editor, paste `supabase-clearance-sale.sql`, run it. The last query returns `items_in_sale` (95) and your `preview_key`. Copy the key.

**Adding the second batch (35 more items, 130 in total).** After the first SQL, run `DBB clearance addon 35.sql` the same way. It is safe while the sale is live and safe to run twice. Its last query should return `items_in_sale` = 130. Deploy the code first so items without a discount show cleanly.
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

## At the till (POS)

While the sale is live (16 to 19 October), the POS shows the clearance products first, with a gold CLEARANCE badge, the sale price (original struck through) and the units left.

- **One stock count.** Till sales and website orders draw from the same units (10 or 15 per product). When it hits zero the card shows SOLD OUT at the till and on the website.
- **Prices are enforced by the server.** If a till page was left open with an old price, the sale is refused with a message to refresh. A cashier cannot sell more than what is left.
- **Outside the dates** the clearance products disappear from the till, and any open till page is refused if it tries to sell one.
- Sales are recorded as normal till sales, with the order tagged to the clearance campaign so you can find them in `orders` (`sale_campaign_id`).
- Your regular product stock (Admin > Inventory) is unchanged by the clearance sale. The clearance units are counted separately.

## 1.95% card / mobile money fee

Customers now pay Paystack's 1.95% on top. Run `supabase-processing-fee.sql` once in the Supabase SQL Editor (it adds `orders.processing_fee`). Checkout still works if you deploy first; the fee is simply not stored separately until the SQL is run.

- **Where it applies:** the website checkout, the clearance checkout, and a single mobile money payment at the till (the one that sends a prompt through Paystack).
- **Where it does not:** cash, the card machine, and split payments at the till. Nothing goes through Paystack there.
- **How it is worked out:** 1.95% of (items + delivery - discount), rounded to the nearest pesewa, on the server. The customer sees it as its own line before the total, and it appears on the order email, the till receipt and the admin order page.
- **Reports:** `orders.total` is what the customer paid, fee included. Goods and delivery = `total - processing_fee`.
- **One rule in one place:** `lib/fees.ts`. Change `PROCESSING_FEE_RATE` there to change the rate everywhere.
