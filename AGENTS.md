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
| `npm run test`      | Vitest unit tests (299 tests)         |
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
- **Auth**: `auth.ts` + `auth.config.ts`. JWT session strategy (`maxAge` 30 days). Custom `User` type in `next-auth.d.ts` extends with `wpId`, `accessToken`. Route handler at `app/api/auth/[...nextauth]/route.ts`. WP token refresh is centralized in `app/lib/refresh-token.ts` (`refreshAccessToken()` — single 3-field `refreshToken` mutation) used by BOTH the NextAuth `jwt` callback and `wp-auth.ts` `getValidAccessToken()`; a real WP rejection throws `SessionExpiredError` (transient network stays non-fatal). The `jwt` callback flags definitive rejections via `token.error = "RefreshAccessTokenError"` (exposed as `session.error`; transient failures stay silent), server actions fail fast with `assertSessionActive()`, and `SessionExpiryHandler` (inside `SessionWrapper`) signs the user out to `/login?expired=1` once, where `SessionExpiredNotice` shows a one-time message. No proactive ping guard (per-request auto-refresh only).
- **Registration**: Route handler `app/api/register/route.ts` — creates WP user via GraphQL `registerUser`. Sends `firstName`/`lastName`/`displayName`/`email`/`password`/`phoneNumber`; the WP `username` is auto-generated (`{first+last|email-local}` sanitized to `[a-z0-9]` + `_` + 8-char UUID) rather than using the raw email. `phoneNumber` persists to the ACF "User fields" group (`phone_number`) via a WP-side `RegisterUserInput` extension (WPCode snippet #277 on the live CMS) that adds the input through the `graphql_input_fields` filter — direct `register_graphql_field` on `RegisterUserInput` silently fails on WPGraphQL 2.21+ — and saves via `graphql_user_object_mutation_update_additional_data` scoped to `registerUser` (`update_field('phone_number', …, 'user_' . $user_id)`).
- **Layout**: `app/layout.tsx` — wraps with `SessionWrapper` (SessionProvider), `ToasterProvider` (react-hot-toast), and the single route-aware `Header` (client component). Root layout fetches all 3 WP menus (cached) and passes them to `<Header menus={…}>`.
- **Multistep form**: 7-step inspection form at `/dashboard/customer/inspection` with Zustand store persisting to `sessionStorage`.
- **Upload engine**: `useFileUpload` hook + `generateUploadUrl` Server Action. Direct-to-cloud via **Bunny Storage + Pull Zone** (S3-compatible presigned PUT). No server relays binary data.
- **Schemas**: 5 Zod schema files in `app/lib/schemas/` — `vehicleInfo`, `vinInfo`, `inspectionScope`, `uploadFields`, `reviewAgreement`.
- **Constants**: `app/lib/constants.ts` — US states, CA provinces, company lists (with `ext` field for mixed image formats), `calculatePrice()`.
- **Store**: `app/store/inspectionStore.ts` — 6 slices (`currentStep`, `vehicleInfo`, `vinInfo`, `inspectionScope`, `uploadFields`, `reviewAgreement`) with persist middleware.
- **Payment engine**: Server Actions (`app/actions/payment.ts`, `app/actions/inspection.ts`), webhook handler (`app/api/webhooks/stripe/route.ts`), polling endpoint (`app/api/payment/status/route.ts`). Stripe PaymentIntent + `inspection-payment` CPT via WPGraphQL. `confirmInspectionPayment` verifies server-side; `createPaymentIntent` charges stored `orderSubtotal` and rejects cross-owner pay.
- **Inspections listing/detail (Phase 5)**: `app/actions/inspections.ts` (`listInspections` owner-scoped via custom WP connection args + `unstable_cache` 300s; `fetchInspection` full detail). Shared presentation-only `InspectionDetailView` serves customer (`/dashboard/customer/inspection/[id]`), pay (`/dashboard/customer/pay/[id]`, owner-only), and admin (`/dashboard/admin/inspection/[id]`) routes. Status enums in `app/lib/status.ts` (`INSPECTION_STATUSES` / `PAYMENT_STATUSES`).
- **Header (single, route-aware)**: `Header.tsx` (client) is rendered **once** in the root layout — no nested layout renders a header. It uses `usePathname()` + `useSession()` (single auth source). `usePathname` → admin panel routes (`/dashboard/admin/*` excluding `/dashboard/admin/inspection`) render the **AdminHeader variant** (language left, current page title center from the admin panel menu item label, hamburger `md:hidden` only — mobile drawer = admin panel menu). All other routes render the **standard header** (language left, logo center, hamburger right) with a role-based menu. `app/lib/header-config.ts` holds the unified `ITEM_ICONS` map, `BRAND_LOGOS`, `getMenuIcon`, `isLogoutItem`, `isBrandItem`.
- **Menu fetching/caching**: `app/lib/menu.ts` — `getMenu(slug)` wrapped in `unstable_cache(["menu","slug"], revalidate: 300)`; helpers `getMainMenu`, `getAdminSiteMenu`, `getAdminPanelMenu`. Revalidated on login/logout via `auth.ts` `events.signIn/signOut` → `revalidatePath("/", "layout")`.
- **Header session**: `Header.tsx` uses `useSession()` for live auth state. On static/ISR public pages (`/`, `/login`, `/register`) a brief `HeaderMenuSkeleton` renders while the client session resolves (no server auth call in root layout — keeps public pages static).
- **Dashboard route groups (Phase 6)**: `app/dashboard/layout.tsx` is thin; `app/dashboard/(site)/layout.tsx` and `app/dashboard/(public)/layout.tsx` are passthrough `<main>` wrappers (no header — the root layout renders it). `app/dashboard/(panel)/layout.tsx` renders `AdminSidebar` (desktop) + content for `/dashboard/admin/{requests,users,archive,proposals,settings}` (role-guarded to `administrator` | `inspector`; admin inspection detail lives under `(site)` with the standard header). `/dashboard` mirrors the customer dashboard for admin/inspector via shared `app/components/customer/InspectionListing.tsx`.

## Code Conventions

- **Path alias**: `@/*` → root (`./*`)
- **Styling**: Tailwind v4 (`@theme inline` syntax, `@custom-variant dark`). CSS variables in `app/globals.css`.
- **Scrollbar**: `.thin-scrollbar` utility class in `globals.css` — thin 4px rounded scrollbar for overflow containers.
- **Component split**:
  - `app/components/` — app-specific (Button, FormInput, FormSelect, ImageCheckboxGroup, FileUploadField, PriceSummary, StepIndicator, StatusBadge, InspectionCard, FilterInspectionsModal, InspectionDetailView, NavLink, NavigationLoader, LoadingIndicator, Header, HeaderMenuSkeleton, LanguageSelector, SessionWrapper, SessionExpiryHandler, ToasterProvider)
  - `app/components/admin/` — AdminSidebar, DataTable, PaginationFooter, AdminPageShell, StatusPill, users/EditUserForm
  - `components/ui/` — shadcn primitives (button, card, input, checkbox, field, separator, dropdown-menu, dialog, accordion, tabs, skeleton, etc.)
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
- **299 tests across 36 files, all passing**
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
| Admin dashboard (Phase 6 Stage A)              | Done — `/dashboard/admin` admin panel (Requests/Users/Archive/Proposals tables + Settings form), desktop sidebar, single route-aware Header in root layout, `/dashboard` mirrors customer dashboard; functional wiring (approve/reject, PDF) deferred to Stage B |
| Admin dashboard dynamic (Phase 6 Stage B)      | In progress — Task #1 Archive page dynamic (SSR + `listArchivedInspections` + status filter + search + pagination); Requests + Users pages dynamic; **Users edit page (admin-only) done**; Proposals deferred (external dep); Settings not started |
| Admin approve/reject in detail (Phase 6.3)     | **Done (UI)** — `canApproveInspection`/`canRejectInspection` gate the action bar; **Reject wired** (`app/actions/admin.ts` `rejectInspection` → `inspectionDetails.inspectionStatus = "rejected"` + `RejectDialog`); **Approve UI-only** (`ApprovalDialog` + `ApprovalCompanyForm`: one accordion per certificate company, registry-driven grouped fields, Generate/Save stubs); PDF engine + approval mutation deferred to 6.4 |
| Multistep inspection form (7 steps)            | Done — Phase 2 complete                                                    |
| Zustand store                                  | Done — `inspectionStore.ts` with sessionStorage persist                    |
| Upload engine (Bunny CDN)                      | Done — Phase 3/5.8: `app/actions/upload.ts`, `app/hooks/useFileUpload.ts` (S3-compatible presigned PUT) |
| Stripe payments                                | Done — Phase 4: full E2E flow with WPGraphQL standardization + Phase 5.6 server-side hardening |
| **WP Token Auto-Refresh**                      | **Done — `app/lib/wp-auth.ts` (auto-refresh via refreshToken mutation)**   |
| **WP Debug & Origin Fix**                      | **Done — debug layers + Origin header fix for refreshToken**               |
| **Single route-aware Header (root layout)**    | **Done — `Header.tsx` uses `useSession()` + `usePathname()`; AdminHeader variant for admin panel routes (page title center, mobile-only hamburger); standard header for all other routes; 3 menus fetched server-side in root layout with `unstable_cache`; `events.signIn/signOut` → `revalidatePath`** |
| Inspections listing + detail (Phase 5)         | Done — owner-scoped listing, filters/pagination, shared `InspectionDetailView`, customer detail + pay routes, admin detail route |
| Navigation performance (00502)                 | Done — no `router.refresh()`, `HeaderMenuSkeleton`, HeaderNav out of Suspense, top loader |
| Netlify deployment (Phase 5.7)                 | Done — `rideshareinspector.netlify.app`, `AUTH_TRUST_HOST`, context-scoped `NEXTAUTH_URL`, preview/branch deploys |
| PDF certificate generation                     | Not started — Phase 6.4 (real Generate output + approval mutation + `expiryDate` population) |
| Admin edit user (Phase 6.3)                    | **Done** — admin-only `/dashboard/admin/users/[id]` (`notFound()` for non-admins); `getUser`/`updateUser` (`app/actions/users.ts`); `AdminUserDetail` + `userEdit` Zod schema; `EditUserForm` (email, names, phone, role, read-only date joined; Update wired to `updateUser`; Block + Update password UI-only); **phone not persisted** — WP `UpdateUserInput` has no `phoneNumber` (needs a snippet-#277-style extension); Users table Edit action is admin-only (inspectors see read-only rows) |
| Google login — admin role returns null user   | **Done** — 006-B Task A: WP SITETOKEN provider had `loginOptions.metaKey: "login"` (matches WP **username**) while the app sends the Google **email** → changed to `"email"` (option `wpgraphql_login_provider_siteToken` on live CMS). Only accounts whose username == email (e.g. `hishamthed@gmail.com`) ever worked before |
| Google sign-in — unregistered users UX        | **Done** — 006-B Task B: `auth.ts` `pages.error: "/error"` + branded `app/(public)/error/page.tsx` (AccessDenied → "Account not registered" + Register CTA + Back); no NextAuth default error page; login flip-card untouched |
| Branded error boundaries                       | **Done** — 006-B Task C: shared `ErrorState.tsx` + root `app/error.tsx`/`global-error.tsx`/`not-found.tsx`, `dashboard/error.tsx`, `(site)/error.tsx`, `(panel)/error.tsx` + `not-found.tsx`; existing customer detail boundaries remain; no default Next error/404 page can surface |
| Inspection access security (Task D)            | **Done** — `app/lib/access.ts` (roles + `canAccessInspection`); `fetchInspection` gate → not-found on deny; Requests/Archive auto-scoped **assigned-only for inspectors**, admins see all; WP snippet #279 (`assigned_inspector` read field + `assignedInspector` where-arg + role-scoped connection reads + admin-only mutation input); Requests rows show Assigned pill + inspector dropdown + ✕ (admin only); assignment actions (`listInspectors` cached like SSR lists, `assignInspector` default-refresh like mutations) |
| Admin inspection creation flow + role isolation | Open — 006-B backlog Task E (own `/dashboard/admin/inspection` flow + assign-user dropdown; block admins from `/dashboard/customer/*`) |
| Session/token robustness                       | **Done** — root cause: `auth.ts` jwt refresh queried `refreshToken`/`refreshTokenExpiration` fields that the plugin's `RefreshTokenPayload` does NOT expose → refresh always failed silently → expired tokens sent → all authed fetches failed ~5 min after login. Fixed via shared `refresh-token.ts` (3-field query), `SessionExpiredError` on real rejection, NextAuth `session.maxAge` 30d, WP access-token lifetime 300s→900s (snippet #280). No proactive ping/SessionGuard (removed) |
| Session expiry → forced logout                 | **Done** — 006-B: `auth.ts` jwt sets `token.error = "RefreshAccessTokenError"` on definitive WP rejection (transient `serverReached=false` stays silent; cleared on success), exposed as `session.error`; `app/lib/session-error.ts` + `assertSessionActive()` make listing/detail/assignment actions fail fast before the WP call; `SessionExpiryHandler` inside `SessionWrapper` calls `signOut({ redirectTo: "/login?expired=1" })` exactly once; `SessionExpiredNotice` (login flip-card) shows a one-time "session expired" note and strips the query param |
| Session-expiry sign-out redirect loop          | **Done** (`903fe27`) — `shouldForceSignOut(pathname, error)` never fires on `/login`; `proxy.ts` treats an errored session as logged out → `/login?expired=1`; `auth.ts` jwt stops re-probing WP once the token is already flagged |
| Tests                                          | Done — 299 Vitest tests, 36 files, ~100% lines, 3 E2E Playwright specs     |

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

## Phase 6 — Admin Dashboard (Stage A: UI/design done; Stage B: dynamic data in progress)

```
app/dashboard/layout.tsx                   # thin: <main>{children}</main>
app/dashboard/(site)/layout.tsx            # passthrough <main> (header comes from root layout)
app/dashboard/(panel)/layout.tsx           # AdminSidebar + content + role guard (administrator | inspector)
app/dashboard/(panel)/admin/page.tsx       # /dashboard/admin → redirect → requests
app/dashboard/(panel)/admin/requests/page.tsx  # Stage B: server component → RequestsListing
app/dashboard/(panel)/admin/users/page.tsx     # Stage B: server component → AdminUsersList (Edit action admin-only)
app/dashboard/(panel)/admin/users/[id]/page.tsx # Phase 6.3: admin-only edit user page (notFound() for non-admins) → EditUserForm
app/dashboard/(panel)/admin/archive/page.tsx   # Stage B: server component → ArchiveListing (Task #1 done)
app/dashboard/(panel)/admin/proposals/page.tsx # Stage A: static sample data (DEFERRED external dep)
app/dashboard/(panel)/admin/settings/page.tsx  # Stage A: client-only form (Task #2 — not started)
app/dashboard/(site)/page.tsx              # /dashboard mirror of customer dashboard (admin/inspector)
app/actions/requests.ts                    # Stage B: listRequests (unstable_cache 300s, tag "requests", excludes archived)
app/actions/users.ts                       # Stage B: listUsers (unstable_cache 300s, tag "users", roleNotIn ADMINISTRATOR) + Phase 6.3 getUser/updateUser (admin-only)
app/actions/archive.ts                     # Stage B: listArchivedInspections (unstable_cache 300s, tag "archive", inspectionStatusIn approved/rejected/cancelled)
app/actions/admin.ts                       # Phase 6.3: rejectInspection (updateInspection → inspectionStatus "rejected"; approveInspection deferred to 6.4)
app/lib/approval-fields.ts                 # Phase 6.3: approval form registry (ApprovalFieldType/Def/Group, APPROVAL_GROUPS, getVisibleFields, cert companies)
app/lib/schemas/userEdit.ts                # Phase 6.3: user edit Zod schema (email, names, phone, role)
app/components/admin/RequestsListing.tsx   # Stage B: server listing (Suspense + skeleton)
app/components/admin/RequestsContent.tsx   # Stage B: client table + toolbar
app/components/admin/users/AdminUsersList.tsx / AdminUsersContent.tsx  # Stage B: server + client (Edit column admin-only via canEdit)
app/components/admin/users/EditUserForm.tsx # Phase 6.3: edit user form (profile fields; Update wired; Block/password UI-only)
app/components/admin/ArchiveListing.tsx    # Stage B: server listing (Suspense + skeleton)
app/components/admin/ArchiveContent.tsx    # Stage B: client table + toolbar (status filter Approved/Rejected/Cancelled)
app/components/admin/DataToolbar.tsx       # reusable search + status filter (configurable filterOptions prop)
app/components/admin/DataTable.tsx         # generic table (columns, search, filter, pagination)
app/components/admin/DataTableSkeleton.tsx # skeleton loader
app/components/admin/PaginationFooter.tsx  # "Showing X–Y of Z" + page buttons
app/components/admin/AdminPageShell.tsx    # page wrapper (title + content)
app/components/admin/StatusPill.tsx        # compact pill (existing getStatusStyle colors)
app/components/Header/Header.tsx           # single route-aware master header (root layout)
app/components/Header/LanguageSelector.tsx # shared language dropdown (extracted from Header.tsx)
app/lib/header-config.ts                   # unified ITEM_ICONS / BRAND_LOGOS / getMenuIcon / isLogoutItem / isBrandItem
app/lib/menu.ts                            # getMenu(slug) via unstable_cache(["menu","slug"], 300s)
app/lib/companyLabels.ts                   # company value → label map (from USA/CA_COMPANIES)
auth.ts                                    # events.signIn/signOut → revalidatePath("/", "layout"); jwt flags session.error on definitive refresh rejection
app/lib/session-error.ts                   # REFRESH_ACCESS_TOKEN_ERROR + shouldMarkSessionExpired (pure, client-safe)
app/components/SessionExpiryHandler.tsx    # session.error → signOut({ redirectTo: "/login?expired=1" }) once (rendered inside SessionWrapper)
app/(public)/(auth)/login/_components/SessionExpiredNotice.tsx  # one-time "session expired" note + strips the query param
proxy.ts                                   # administrator + inspector → /dashboard/admin/requests; others → /dashboard/customer
tests/components/StatusPill.test.tsx / PaginationFooter.test.tsx / DataTable.test.tsx / AdminSidebar.test.tsx / Header.test.tsx / admin-pages.test.tsx
tests/lib/header-config.test.ts            # + 36 new tests (295 tests, 36 files)
tests/lib/session-error.test.ts / tests/components/SessionExpiryHandler.test.tsx / tests/components/SessionExpiredNotice.test.tsx
tests/lib/approval-fields.test.ts / tests/actions/admin.test.ts / tests/components/CertificatesPanel.test.tsx / tests/components/ApprovalDialog.test.tsx  # Phase 6.3
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