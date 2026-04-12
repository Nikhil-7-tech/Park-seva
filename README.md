# ParkSeva

A modern parking management and booking web app built with React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Supabase, and Stripe.

- Frontend: React 18 + Vite 5 + TypeScript
- UI: Tailwind CSS + shadcn/ui (Radix UI primitives)
- Data/Auth: Supabase (Postgres, Auth)
- Payments: Stripe (via Supabase Edge Functions)
- Routing/Data: React Router + TanStack Query

## Features

- Responsive landing page with hero and feature sections
- Auth flows and profile context (via Supabase)
- Book a parking slot and manage bookings
- Admin dashboard for slot management and monitoring
- Dark/light theme toggle
- QR code/scan utilities
- Toasts, dialogs, carousels, forms via shadcn/ui

## Quick Start

Prerequisites:
- Node.js 18+
- PNPM/NPM/Yarn (examples below use npm)
- Supabase CLI (for local dev): `npm i -g supabase`
- Stripe account (for payments)

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

The app runs on `http://localhost:8080` (configured in `vite.config.ts`).

## Environment Variables

Create a `.env` file in project root. Typical variables:

```bash
# Supabase
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Check `src/integrations/supabase/client.ts` for how these are used.

## Supabase Setup

- Install and login: `supabase login`
- Start local stack: `supabase start`
- Configure project: see `supabase/config.toml`
- Apply schema: run the SQL in `supabase/migrations/` in order
- Edge functions:
  - `supabase/functions/create-payment-intent`
  - `supabase/functions/send-sms`
  - `supabase/functions/send-whatsapp`

During development, `vite.config.ts` proxies `"/functions/v1"` to the local Supabase functions host (`http://127.0.0.1:54321`). In production it targets your deployed functions domain from Supabase.

## Scripts

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run build:dev  # Development-mode build
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## Project Structure

```
src/
  components/           # UI and app components (shadcn/ui)
  contexts/             # Auth and theme contexts
  hooks/                # Custom hooks
  integrations/supabase # Client, types, seeds, functions proxy
  pages/                # Routes: Index, Booking(s), Admin, etc.
  assets/               # Static assets
supabase/
  functions/            # Edge functions (Stripe, SMS, WhatsApp)
  migrations/           # SQL migrations
  config.toml           # Supabase local config
```

## Payments

Stripe is integrated via a Supabase edge function `create-payment-intent`. You’ll need a Stripe test account and keys set in `.env`. On the client, `@stripe/stripe-js` is used.

## Development Notes

- Aliases: `@` maps to `./src` (see `vite.config.ts`)
- React Router is used for navigation (see `src/pages`)
- Sample data seeding: `seedSampleData()` is called on `Index` route for local dev
- shadcn/ui components live in `src/components/ui`

## License

MIT