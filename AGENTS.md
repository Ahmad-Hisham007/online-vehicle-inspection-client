# Online Vehicle Inspection Platform — Agent Guide

## Stack

- Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui (`radix-maia`, `hugeicons`)
- React Hook Form + Zod v4, Zustand with `sessionStorage` persist
- NextAuth v5 (beta) — Credentials (WPGraphQL JWT) + Google OAuth (Site Token)
- Headless WordPress via WPGraphQL — no REST API, no WordPress Media Library
- Stripe, Bunny Storage + Pull Zone (sole direct-to-cloud upload provider)

## Commands

| Command         | Action                                |
| --------------- | ------------------------------------- |
| `npm run dev`       | Dev server at `http://localhost:3000` |
| `npm run lint`      | ESLint (Next.js config)               |
| `npm run build`     | Build + typecheck via `next build`    |
| `npm run test`      | Vitest unit tests (242 tests)         |
| `npm run test:ui`   | Vitest UI mode                        |
| `npm run test:coverage` | Vitest with v8 coverage           |
| `npm run e2e`       | Playwright e2e (opens browser)        |
| `npm run e2e:ui`    | Playwright UI mode                    |

## Workflow (Spec → Commit)

```
spec.md → design.md → plan.md → implement
                                   ↓
                               TEST (new)
                                   ↓
                    update AGENTS.md → update implementation-plan.md(global)
                                   ↓
                 session-summary.md (current spec dir)
                                   ↓
                              git commit
```

Each spec lives in `.opencode/spec/<NNN>-<name>/`. After implementation+testing:
1. Update `AGENTS.md` (this file) with new state
2. Update `docs/implementation-plan.md` (global) 
3. Write/update `session-summary.md` in the spec directory
4. Git commit source code only (exclude `.opencode/`, `AGENTS.md`, `CLAUDE.md`, `implementation-plan.md`)

## Critical Rules

1. **Direct-to-Cloud uploads only** — files never pass through Next.js server or edge functions.
2. **Media Library bypass** — files never touch WordPress Media Library; store public Cloud URLs in WP via GraphQL.
3. **Server Actions** — only for presigned URLs/triggers, never raw binary.
4. **WPGraphQL only** — no REST endpoints for WordPress data.
5. **Zero `any` types** — strict TypeScript enforcement.
6. **Background uploads** — multistep form allows proceeding while files upload asynchronously.

## Architecture

- **Middleware**: `proxy.ts` (NOT `middleware.ts`). Protects `/dashboard/:path*`. Redirects unauthenticated to `/login`.
- **Auth**: `auth.ts` + `auth.config.ts`. JWT session strategy. Custom `User` type in `next-auth.d.ts` extends with `wpId`, `accessToken`. Route handler at `app/api/auth/[...nextauth]/route.ts`.
- **Registration**: Route handler `app/api/register/route.ts` — creates WP user via GraphQL mutation.
- **Layout**: `app/layout.tsx` — wraps with `SessionWrapper` (SessionProvider), `ToasterProvider` (react-hot-toast), and `Header` (client component).
- **Multistep form**: 7-step inspection form at `/dashboard/customer/inspection` with Zustand store persisting to `sessionStorage`.
- **Upload engine**: `useFileUpload` hook + `generateUploadUrl` Server Action. Direct-to-cloud via **Bunny Storage + Pull Zone** (S3-compatible presigned PUT). No server relays binary data.
- **Schemas**: 5 Zod schema files in `app/lib/schemas/` — `vehicleInfo`, `vinInfo`, `inspectionScope`, `uploadFields`, `reviewAgreement`.
- **Constants**: `app/lib/constants.ts` — US states, CA provinces, company lists (with `ext` field for mixed image formats), `calculatePrice()`.
- **Store**: `app/store/inspectionStore.ts` — 6 slices (`currentStep`, `vehicleInfo`, `vinInfo`, `inspectionScope`, `uploadFields`, `reviewAgreement`) with persist middleware.
- **Payment engine**: Server Actions (`app/actions/payment.ts`, `app/actions/inspection.ts`), webhook handler (`app/api/webhooks/stripe/route.ts`), polling endpoint (`app/api/payment/status/route.ts`). Stripe PaymentIntent + `inspection-payment` CPT via WPGraphQL. `confirmInspectionPayment` verifies server-side; `createPaymentIntent` charges stored `orderSubtotal` and rejects cross-owner pay.
- **Inspections listing/detail (Phase 5)**: `app/actions/inspections.ts` (`listInspections` owner-scoped via custom WP connection args + `unstable_cache` 300s; `fetchInspection` full detail). Shared presentation-only `InspectionDetailView` serves customer (`/dashboard/customer/inspection/[id]`), pay (`/dashboard/customer/pay/[id]`, owner-only), and admin (`/dashboard/admin/inspection/[id]`) routes. Status enums in `app/lib/status.ts` (`INSPECTION_STATUSES` / `PAYMENT_STATUSES`).
- **Header session**: `Header.tsx` (client) uses `useSession()` for live auth state; server layouts may pass a `session` prop as first-paint fallback. On static/ISR public pages (`/`, `/login`, `/register`) there is no server prop, so a brief `HeaderMenuSkeleton` renders while the client session resolves. Dashboard layout passes `auth()` server-side — no skeleton there.
- **Dashboard route groups (Phase 6)**: `app/dashboard/layout.tsx` is thin; `app/dashboard/(site)/layout.tsx` renders the standard site header (role-aware WP menu: customer site menu vs `getAdminSiteMenu()`), `app/dashboard/(panel)/layout.tsx` renders `AdminPanelShell` (admin header + sidebar) for `/dashboard/admin/*` (role-guarded to `administrator` | `inspector`). `/dashboard` mirrors the customer dashboard for admin/inspector via shared `app/components/customer/InspectionListing.tsx`.

## Code Conventions

- **Path alias**: `@/*` → root (`./*`)
- **Styling**: Tailwind v4 (`@theme inline` syntax, `@custom-variant dark`). CSS variables in `app/globals.css`.
- **Scrollbar**: `.thin-scrollbar` utility class in `globals.css` — thin 4px rounded scrollbar for overflow containers.
- **Component split**:
  - `app/components/` — app-specific (Button, FormInput, FormSelect, ImageCheckboxGroup, FileUploadField, PriceSummary, StepIndicator, StatusBadge, InspectionCard, FilterInspectionsModal, InspectionDetailView, NavLink, NavigationLoader, LoadingIndicator, Header, HeaderNav, HeaderMenuSkeleton, LanguageSelector, SessionWrapper, ToasterProvider)
  - `app/components/admin/` — AdminPanelShell, AdminHeader, AdminSidebar, DataTable, PaginationFooter, AdminPageShell, StatusPill
  - `components/ui/` — shadcn primitives (button, card, input, checkbox, field, separator, dropdown-menu, dialog, tabs, skeleton, etc.)
- **Two Button components**: `@/app/components/Button` (app custom with `primary`/`secondary` variants) vs `@/components/ui/button` (shadcn). Use the app one for forms.
- **Form pattern**: React Hook Form + Zod schema + `zodResolver` + `@/app/components/FormInput` generic `<T extends FieldValues>` + `@/components/ui/field` (Field, FieldLabel, FieldGroup).
- **Select pattern**: `@/app/components/FormSelect` — generic `<T extends FieldValues>` with `Controller` + native `<select>` styled same as `FormInput`.
- **Icons**: `hugeicons` for shadcn, `react-icons` for app use.
- **Image component**: Next.js `Image` with explicit `width`/`height` + `style={{ width: "auto", height: "auto" }}` when auto-sizing.
- **Company logos**: Located at `public/company-logos/`, mixed extensions (png/jpg/jpeg), mapped via `ext` field in `constants.ts`.
- **Upload done state**: Shows static icon (camera/video) + filename + "Uploaded" badge. No live thumbnail rendering to avoid CDN processing delays causing 500 errors.

## Test Configuration

- **Vitest** v4.1.10 + React Testing Library + user-event v14
- **jsdom** environment, `@testing-library/jest-dom/vitest` matchers
- **Coverage**: v8 provider, excludes `.opencode/**`, `components/ui/**`, `**/index.ts`
- **Playwright** e2e: `e2e/` directory, Chromium only, `headless: false`
- E2E credentials loaded from `.env.local` via `dotenv` in `playwright.config.ts`
- **242 tests across 29 files, all passing**
- Coverage: Statements 100%, Lines 100%, Branches ~98%, Functions ~98%

## Environment & Backend

- `.env.local` contains secrets — NEVER commit.
- `WORDPRESS_GRAPHQL_URL=http://localhost/online-vehicle-inspection/graphql` (local WP).
- WP auth: JWT via `login` mutation (credentials), Site Token via `login` mutation with `SITETOKEN` provider + `X-OVI-0982-Token` header (Google OAuth).
- Bunny CDN (Phase 5.8): `BUNNY_STORAGE_ZONE_NAME`, `BUNNY_STORAGE_PASSWORD`, `BUNNY_STORAGE_REGION=ny`, `BUNNY_PULL_ZONE_HOSTNAME=rideshareinspection.b-cdn.net`, `BUNNY_OPTIMIZER_ENABLED=true`. Uploadcare keys kept dormant in `.env.example` (no longer used).
- Netlify (Phase 5.7): prod at `https://rideshareinspector.netlify.app`; `AUTH_TRUST_HOST=true`; `NEXTAUTH_URL` Production-context only; `NEXT_PUBLIC_SITE_URL` = production in all contexts (server-side WP Origin).

## Current State

| Layer                                          | Status                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| Auth (credentials + Google OAuth, JWT session) | Done                                                                       |
| Registration (`/api/register`)                 | Done                                                                       |
| Login page (flip-card login/signup)            | Done                                                                       |
| Middleware (`proxy.ts`)                        | Done — role-based redirect; `administrator` + `inspector` → `/dashboard/admin/requests`, others → `/dashboard/customer` |
| Root layout + Header + shadcn primitives       | Done                                                                       |
| Landing page (`/`)                             | Default Next.js boilerplate                                                |
| Customer dashboard (`/dashboard/customer`)     | Done — Phase 5: owner-scoped listing, status filter + pagination, card layout with Add/Filter, empty state |
| Admin dashboard (Phase 6 Stage A)              | Done — `/dashboard/admin` admin panel (Requests/Users/Archive/Proposals tables + Settings form), desktop sidebar + mobile drawer, page-title header, `/dashboard` mirrors customer dashboard; functional wiring (approve/reject, PDF) deferred to Stage B |
| Multistep inspection form (7 steps)            | Done — Phase 2 complete                                                    |
| Zustand store                                  | Done — `inspectionStore.ts` with sessionStorage persist                    |
| Upload engine (Bunny CDN)                      | Done — Phase 3/5.8: `app/actions/upload.ts`, `app/hooks/useFileUpload.ts` (S3-compatible presigned PUT) |
| Stripe payments                                | Done — Phase 4: full E2E flow with WPGraphQL standardization + Phase 5.6 server-side hardening |
| **WP Token Auto-Refresh**                      | **Done — `app/lib/wp-auth.ts` (auto-refresh via refreshToken mutation)**   |
| **WP Debug & Origin Fix**                      | **Done — debug layers + Origin header fix for refreshToken**               |
| **Header live session (public pages)**         | **Done — `Header.tsx` uses `useSession()`; menu reflects real auth on static/ISR public pages (`/`, `/login`, `/register`)** |
| Inspections listing + detail (Phase 5)         | Done — owner-scoped listing, filters/pagination, shared `InspectionDetailView`, customer detail + pay routes, admin detail route |
| Navigation performance (00502)                 | Done — no `router.refresh()`, `HeaderMenuSkeleton`, HeaderNav out of Suspense, top loader |
| Netlify deployment (Phase 5.7)                 | Done — `rideshareinspector.netlify.app`, `AUTH_TRUST_HOST`, context-scoped `NEXTAUTH_URL`, preview/branch deploys |
| PDF certificate generation                     | Not started — Phase 6 Stage B (approve/reject + `expiryDate` population + PDF) |
| Tests                                          | Done — 242 Vitest tests, 29 files, ~100% lines, 3 E2E Playwright specs     |

## Phase 2 & 3 — Shared Components

```
app/lib/constants.ts                          # States, provinces, companies, pricing
app/lib/schemas/vehicleInfo.ts                # licensePlate, mileage
app/lib/schemas/vinInfo.ts                    # vin, make, model, year, fuelType
app/lib/schemas/inspectionScope.ts            # country, state, companies, Turo radios
app/lib/schemas/uploadFields.ts               # 16 file metadata fields
app/lib/schemas/reviewAgreement.ts            # user + inspection agreement checkboxes
app/lib/schemas/index.ts                      # barrel export
app/store/inspectionStore.ts                  # Zustand + sessionStorage persist
app/actions/upload.ts                         # Server Action — generateUploadUrl()
app/hooks/useFileUpload.ts                    # Upload lifecycle (retry, cancel, progress)
app/components/FormSelect.tsx                 # Generic select dropdown
app/components/ImageCheckboxGroup.tsx         # Company logo grid with selection
app/components/FileUploadField.tsx            # Upload component (drag-drop, progress, icon preview)
app/components/PriceSummary.tsx               # Live price calculator
app/components/StepIndicator.tsx              # 7-step horizontal stepper
app/dashboard/customer/inspection/page.tsx    # Container with navigation
app/dashboard/customer/inspection/_components/StepVehicleSelection.tsx   # Step 1
app/dashboard/customer/inspection/_components/StepVinLicense.tsx         # Step 2
app/dashboard/customer/inspection/_components/StepMediaA.tsx             # Step 3
app/dashboard/customer/inspection/_components/StepMediaB.tsx             # Step 4
app/dashboard/customer/inspection/_components/StepMediaC.tsx             # Step 5
app/dashboard/customer/inspection/_components/StepMediaD.tsx             # Step 6
app/dashboard/customer/inspection/_components/StepReviewPayment.tsx      # Step 7
```

## Phase 4 — Payment Engine

```
app/actions/inspection.ts                   # createInspectionDraft server action
app/actions/payment.ts                      # createPaymentIntent (Stripe PI + payment CPT)
app/api/payment/status/route.ts             # GET polling endpoint for success page
app/api/webhooks/stripe/route.ts            # Stripe webhook handler (succeeded/failed/requires_action/canceled)
app/lib/wp-auth.ts                          # wpFetch helper + auto-refresh via refreshToken
app/lib/wp-headers.ts                       # WP_SITE_TOKEN_HEADER constant
app/api/debug/graphql/route.ts              # Debug route for WP connectivity
tests/actions/inspection.test.ts            # 9 tests
tests/actions/payment.test.ts               # 6 tests
tests/api/payment-status.test.ts            # 7 tests
tests/api/webhooks.stripe.test.ts           # 9 tests
```

## Phase 5 — Inspections Listing & Detail

```
app/actions/inspections.ts                 # listInspections / fetchInspection (owner-scoped, unstable_cache 300s)
app/lib/status.ts                          # INSPECTION_STATUSES / PAYMENT_STATUSES + style mapping
app/lib/format.ts                          # date formatter
app/lib/listing-url.ts                     # listing-state URL builder
app/components/StatusBadge.tsx             # dot + label status badge
app/components/InspectionCard.tsx          # 2x2 card with chevron unfold (Payment Link / Car details)
app/components/FilterInspectionsModal.tsx  # filter dialog (sort dir + status multi-select)
app/components/InspectionDetailView/       # shared customer/admin detail (header, specs, companies, media gallery, certs panel)
app/dashboard/(site)/customer/page.tsx      # owner-scoped listing (server-side filter/pagination + skeletons)
app/dashboard/(site)/customer/inspection/[id]/page.tsx   # read-only detail (streamed)
app/dashboard/(site)/customer/pay/[id]/page.tsx   # Payment Link route (owner-only)
app/dashboard/(site)/admin/inspection/[id]/page.tsx      # admin detail route (standard header, no sidebar)
app/components/customer/InspectionListing.tsx  # shared listing (customer + /dashboard mirror)
components/ui/dialog.tsx, tabs.tsx, skeleton.tsx  # Phase 5 primitives
app/components/NavLink.tsx                 # transition-based navigation + prefetch
app/components/NavigationLoader.tsx        # non-blocking top loader (uiStore.navPending)
app/store/uiStore.ts, dataStore.ts         # navPending; inspection-detail cache (5 min TTL)
tests/actions/inspections.test.ts          # 10 tests
tests/lib/status.test.ts                   # 6 tests
tests/components/FilterInspectionsModal.test.tsx / InspectionCard.test.tsx / InspectionDetailView.test.tsx / InspectionPagination.test.tsx
```

## Phase 6 — Admin Dashboard (Stage A: UI/Design done)

```
app/dashboard/layout.tsx                   # thin: <main>{children}</main> (no HeaderNav)
app/dashboard/(site)/layout.tsx            # standard site header (role-aware menu: customer vs admin site menu)
app/dashboard/(panel)/layout.tsx           # AdminPanelShell + role guard (administrator | inspector)
app/dashboard/(panel)/admin/page.tsx       # /dashboard/admin → redirect → requests
app/dashboard/(panel)/admin/{requests,users,archive,proposals,settings}/page.tsx  # table/form pages (Stage A: static sample data)
app/dashboard/(site)/page.tsx              # /dashboard mirror of customer dashboard (admin/inspector)
app/components/admin/AdminPanelShell.tsx   # panel shell: AdminHeader + AdminSidebar + content
app/components/admin/AdminHeader.tsx       # language left + page title center + hamburger md:hidden
app/components/admin/AdminSidebar.tsx      # dark desktop sidebar (WP admin panel menu + logout) + mobile drawer
app/components/admin/DataTable.tsx         # generic table (columns, search, filter, pagination)
app/components/admin/PaginationFooter.tsx  # "Showing X–Y of Z" + page buttons
app/components/admin/AdminPageShell.tsx    # page wrapper (title + content)
app/components/admin/StatusPill.tsx        # compact pill (existing getStatusStyle colors)
app/components/Header/LanguageSelector.tsx # shared language dropdown (extracted from Header.tsx)
app/lib/admin-menu.ts                      # admin cssClass → icon/href + getAdminPageTitle
app/lib/menu.ts                            # getMenu(slug) / getMainMenu / getAdminSiteMenu / getAdminPanelMenu
proxy.ts                                   # administrator + inspector → /dashboard/admin/requests; others → /dashboard/customer
tests/components/StatusPill.test.tsx / PaginationFooter.test.tsx / DataTable.test.tsx / AdminSidebar.test.tsx / AdminHeader.test.tsx / admin-pages.test.tsx
tests/lib/admin-menu.test.ts               # + 34 new tests (242 total, 29 files)
```

## Skills

14 skills available in `.opencode/skills/`. CLAUDE.md references AGENTS.md.

## Git & Commit Protocol

### Branch Strategy (Trunk-Based Development)

- **`main`** — protected, always deployable, linear history via rebase merges
- **Short-lived feature branches** — one per spec/phase: `feat/NNN-<name>` (e.g., `feat/003-direct-to-cloud-upload`)
- **No long-running `develop`/`release` branches**

### When to Push

| Scenario | Action |
|----------|--------|
| During implementation | Push to feature branch after each *logical task* (not every save) — enables CI feedback |
| Implementation complete | Push final work, run full CI (`lint` + `build` + `test`) |
| Tests pass | Open PR → rebase merge to `main` |
| Build system changes (`package.json`, `next.config.ts`, CI config) | Push immediately in separate commit — affects all contributors |

### On-Demand Commits

When I explicitly say "commit" or "commit and push", you MUST:

1. Run `git add .` to stage all changes
2. Generate a commit message using Conventional Commits format
3. Run `git commit -m "type(scope): description"`
4. Run `git push origin main`

### Commit Standards

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `docs:`
- **PR required for `main`** — even solo (enforces CI, clean history)
- **Rebase merge** — preserve individual commits on `main` (each must be meaningful and independently valid; no WIP/fixup commits)
- **Delete feature branch** after merge

### Important: What NOT to Push

- NEVER stage or commit `.opencode/` folder contents
- NEVER stage or commit `AGENTS.md`, `CLAUDE.md`, or `implementation-plan.md`
- ONLY commit application source code, configs, and public assets

### Phase Transition Protocol

1. Phase N implementation complete + tests pass
2. Push feature branch → open PR
3. Merge to `main` (rebase merge via PR)
4. Delete feature branch
5. Start Phase N+1 on new `feat/NNN+1-<name>` branch

### Automatic Reminders

When I complete a phase (spec/design/plan/implementation), you should:

1. Remind me: "Phase X is complete. Should I commit the source code changes now?"
2. But DO NOT automatically commit the planning files

## Standard Implementation Workflow (Per Phase)

For each new phase/spec, follow this exact sequence:

```
1. CREATE SPEC
   → .opencode/spec/NNN-name/spec.md

2. CREATE DESIGN (optional, can extend existing)
   → .opencode/spec/NNN-name/design.md

3. CREATE PLAN (task breakdown)
   → .opencode/spec/NNN-name/plan.md

4. IMPLEMENT (one task at a time)
   → Follow task breakdown in plan.md
   → After EACH task: git commit + push to feature branch

5. TEST
   → npm run lint && npm run build && npm run test && npm run e2e

6. FINAL COMMIT & PUSH
   → All tasks done + tests pass
   → git commit + push to main (rebase merge via PR)

7. UPDATE DOCS
   → AGENTS.md (current state)
   → docs/implementation-plan.md (global)
   → .opencode/spec/NNN-name/session-summary.md

8. NEXT PHASE
   → Start new feat/NNN+1-name branch
```

### Key Rules
- **One task at a time** — complete, test, commit, then next
- **Feature branch per phase** — `feat/NNN-name`
- **No planning files in commits** — only source code
- **Ask before proceeding** — after each major step, confirm with user