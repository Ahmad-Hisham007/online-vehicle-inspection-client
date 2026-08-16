# Online Vehicle Inspection Platform — Frontend

A headless vehicle-inspection web app. Customers register/login, submit a guided
7-step inspection (vehicle details + media), pay by Stripe, and track status in
their dashboard. The WordPress backend is accessed exclusively through WPGraphQL.

## Features

- **NextAuth v5 authentication** — credentials + Google OAuth (JWT session, WP JWT / Site Token)
- **7-step inspection form** — React Hook Form + Zod v4, live pricing, background uploads, Zustand state persisted to sessionStorage
- **Direct-to-cloud uploads** — Uploadcare (dev) / AWS S3 (prod); files never pass through the Next.js server
- **Stripe payments** — PaymentIntent, webhooks, status polling, pay route for existing inspections
- **Customer dashboard** — owner-scoped inspection listing with server-side filter/pagination, detail view with sticky action bar, Payment Links
- **Admin dashboard + PDF certificate generation** — planned (Phase 6)

## Tech Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
shadcn/ui · React Hook Form + Zod v4 · Zustand · NextAuth v5 · WPGraphQL ·
Stripe · Uploadcare / AWS S3 · Vitest + Playwright

## Architecture

- **Headless WordPress via WPGraphQL only** — no REST endpoints for WP data
- **Direct-to-cloud uploads** — Server Actions issue presigned URLs/triggers only; binary data goes straight to Uploadcare/S3
- **Auto-refreshing WP tokens** — `app/lib/wp-auth.ts` (refreshToken mutation)
- **Route protection** — `proxy.ts` middleware guards `/dashboard/*` and role-redirects
- **Form state** — 7-step form persisted to sessionStorage (survives refresh)

## Getting Started

Prerequisites: Node.js 20+, a WordPress install with the WPGraphQL + ACF plugins.

```bash
npm install
cp .env.example .env.local    # fill in values (see Environment Variables)
npm run dev                   # → http://localhost:3000
```

## Scripts

| Command                | Action                               |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Dev server at `http://localhost:3000` |
| `npm run build`        | Production build + typecheck         |
| `npm run start`        | Serve the production build           |
| `npm run lint`         | ESLint (Next.js config)              |
| `npm run test`         | Vitest unit tests (190 tests / 21 files) |
| `npm run test:coverage`| Vitest with v8 coverage              |
| `npm run e2e`          | Playwright e2e (opens browser)       |
| `npm run e2e:ui`       | Playwright UI mode                   |

## Environment Variables

Copy `.env.example` → `.env.local` and fill in the values. Groups:

- **Site** — `NEXT_PUBLIC_SITE_URL`
- **WordPress** — `WORDPRESS_GRAPHQL_URL`, `WP_SITE_TOKEN_HEADER`, `WP_SITE_TOKEN_SECRET`
- **Auth** — `AUTH_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Stripe** — `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **WP webhook service account** — `WP_WEBHOOK_USERNAME`, `WP_WEBHOOK_PASSWORD`
- **Uploads** — Uploadcare (`UPLOADCARE_PUBLIC_KEY`, `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY`) or AWS S3 (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET`)
- **E2E tests** — `TEST_EMAIL`, `TEST_PASSWORD`

Never commit real secrets.

## Deployment (Netlify)

Netlify Free uses credit-based pricing: **production deploys cost 15 credits
each; deploy previews and branch deploys are free (0 credits)**. This project is
configured so auto-deploys **never** consume credits:

- **Feature branches / PRs** auto-deploy for free (branch deploys / deploy previews).
- **`main` never auto-deploys** — `netlify.toml` skips production builds triggered by git pushes.
- **Releasing to production is a manual `netlify deploy --prod`** (15 credits, only at release time).

Env vars are set in the Netlify dashboard. Requirements for a live site: the
WordPress GraphQL URL must be publicly reachable, `AUTH_URL` must be the site
domain, `AUTH_SECRET` must be freshly generated, and the Google OAuth redirect
(`/api/auth/callback/google`) and Stripe webhook endpoint
(`/api/webhooks/stripe`) must include the Netlify domain.

## License

Private — all rights reserved.
