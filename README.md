# Discount Beauty Barr

Premium beauty retail platform for Discount Beauty Barr — Accra, Ghana.
Two locations: **Osu** and **East Legon**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | ShadCN UI |
| Database & Auth | Supabase |
| Payments | Paystack |
| Deployment | Vercel |

---

## Folder Structure

```
discount-beauty-bar/
├── app/
│   ├── (public)/          # Customer-facing website
│   ├── (admin)/           # Admin dashboard (protected)
│   └── (pos)/             # POS system (protected)
├── components/
│   ├── ui/                # ShadCN auto-generated components
│   ├── layout/            # Navbar, Footer, MobileMenu
│   ├── shared/            # Reusable: Button, Card, Logo, etc.
│   ├── products/          # Product grid, product card, filters
│   ├── cart/              # Cart drawer, cart item, summary
│   ├── dashboard/         # Admin charts, stats, tables
│   ├── pos/               # POS screen, receipt, keypad
│   └── forms/             # Checkout, login, address forms
├── lib/
│   ├── supabase/          # Supabase client (browser + server)
│   ├── paystack/          # Paystack helpers
│   ├── validations/       # Zod schemas
│   ├── utils.ts           # cn(), formatCurrency(), etc.
│   └── constants.ts       # Brand data, nav links, branches
├── hooks/                 # useCart, useAuth, custom hooks
├── data/                  # Sample products (pre-Supabase)
├── types/                 # Shared TypeScript types
└── public/                # Images, icons, static assets
```

---

## Build Phases

- [x] **Phase 1** — Project Setup & Design Foundation
- [ ] **Phase 2** — Public Website Pages
- [ ] **Phase 3** — Product Catalogue
- [ ] **Phase 4** — Cart & Checkout UI
- [ ] **Phase 5** — Supabase Database & Auth
- [ ] **Phase 6** — Admin Dashboard
- [ ] **Phase 7** — Inventory Management
- [ ] **Phase 8** — POS System
- [ ] **Phase 9** — Paystack Integration
- [ ] **Phase 10** — Reports, Testing & Deployment

---

## Environment Variables

Copy `.env.local` and fill in your keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## Branches

| Branch | Location |
|---|---|
| Osu | Oxford Street, Osu, Accra |
| East Legon | American House Junction, East Legon, Accra |
