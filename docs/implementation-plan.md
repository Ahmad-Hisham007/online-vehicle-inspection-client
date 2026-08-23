# Implementation Plan — Online Vehicle Inspection Platform

## Phase 1: Auth & WP Infrastructure ✅ DONE

| Task | Status |
|------|--------|
| Next.js 16 + Tailwind v4 + shadcn setup | Done |
| NextAuth v5 (Credentials + Google OAuth) | Done |
| WPGraphQL JWT login mutation (`auth.ts`) | Done |
| Google Site Token login (`signIn` callback) | Done |
| Custom `User` type (`next-auth.d.ts`) | Done |
| Registration API (`/api/register`) | Done |
| Login/signup flip-card UI | Done |
| Middleware (`proxy.ts`) | Done |

---

## Phase 2: Multistep Form & Zustand Store ✅ DONE

### 2.1 — Zustand Inspection Store

**File**: `app/store/inspectionStore.ts`

```
// 6 slices: currentStep, vehicleInfo, vinInfo, inspectionScope, uploadFields, reviewAgreement
// Persisted to sessionStorage via zustand/middleware/persist
// File metadata tracked (name, status, progress, publicUrl) — actual File objects never serialized

interface InspectionState {
  currentStep: number;       // 0-6
  vehicleInfo: VehicleInfo | null;
  vinInfo: VinInfo | null;
  inspectionScope: InspectionScope | null;
  uploadFields: UploadFields | null;
  reviewAgreement: ReviewAgreement | null;
}
```

### 2.2 — Step Schemas (`app/lib/schemas/`)

| File | Fields |
|------|--------|
| `vehicleInfo.ts` | `licensePlate`, `mileage` |
| `vinInfo.ts` | `vin`, `make`, `model`, `year`, `fuelType` |
| `inspectionScope.ts` | `country`, `state`, `companies`, `tiresOlderThan6Years`, `batteryOlderThan5Years`, `voltageGreaterThan12_1V` (with superRefine) |
| `uploadFields.ts` | 16 file metadata fields across 4 media steps |
| `reviewAgreement.ts` | `userAgreement` (literal true), `inspectionAgreement` (literal true) |

### 2.3 — Multistep Form Container

**File**: `app/dashboard/customer/inspection/page.tsx`

- Reads `currentStep` from Zustand store
- Renders `<StepIndicator>` with 7 step labels
- Renders active step component (0-6)
- Back (secondary) / Next (primary) navigation buttons
- Step 7: Back visible, button says "Proceed to Payment"
- Each step validates on Next via RHF `handleSubmit` (form `requestSubmit()`)
- On validation pass: store update → `store.setStep(n + 1)`
- Container: `min-h-screen flex flex-col` with Card filling available space, full page scrolls naturally

### 2.4 — Step Components

| Component | File | Description |
|-----------|------|-------------|
| `StepVehicleSelection` | `app/dashboard/customer/inspection/_components/StepVehicleSelection.tsx` | License plate, mileage, country, state, companies (logo grid), Turo conditional radios |
| `StepVinLicense` | `app/dashboard/customer/inspection/_components/StepVinLicense.tsx` | VIN, make, model, year (dropdown 1990-2026), fuelType |
| `StepMediaA` | `app/dashboard/customer/inspection/_components/StepMediaA.tsx` | Registration card photo, odometer photo, horn video |
| `StepMediaB` | `app/dashboard/customer/inspection/_components/StepMediaB.tsx` | Interior driver/passenger photos + seat adjustments |
| `StepMediaC` | `app/dashboard/customer/inspection/_components/StepMediaC.tsx` | Back seat, exterior left/right, front/rear videos |
| `StepMediaD` | `app/dashboard/customer/inspection/_components/StepMediaD.tsx` | 4 tire photos |
| `StepReviewPayment` | `app/dashboard/customer/inspection/_components/StepReviewPayment.tsx` | Order summary, PriceSummary, agreement checkboxes |

### 2.5 — Shared Components Created

| Component | File | Purpose |
|-----------|------|---------|
| `FormSelect` | `app/components/FormSelect.tsx` | Generic `<T extends FieldValues>` select with Controller |
| `ImageCheckboxGroup` | `app/components/ImageCheckboxGroup.tsx` | Company logo grid with selection badges |
| `FileUploadField` | `app/components/FileUploadField.tsx` | File upload with drag-drop, progress, icon preview, retry |
| `PriceSummary` | `app/components/PriceSummary.tsx` | Live price from `calculatePrice()` |
| `StepIndicator` | `app/components/StepIndicator.tsx` | 7-step two-row stepper (circles + connectors + labels) |

### 2.6 — Key Details

**Company logos** at `public/company-logos/` with mixed extensions (png/jpg/jpeg), `ext` field in `constants.ts`.

**Pricing formula**:
```
if (uber && lyft) → $39 for the pair + $24 per other company
else → $24 per company
```

**Turo conditional logic** (on Step 1):
- "Manufacture date less than 6 years?" → Yes required to proceed
- "Battery less than 5 years?" → Yes or No
  - If No → "Voltage greater than 12.1V?" → Yes required to proceed

**Layout**: `min-h-screen` with Card filling via `flex-1`. Full page scrolls naturally when content overflows. `.thin-scrollbar` class for styled overflow containers.

### 2.7 — Testing & QA

| Layer | What | Status |
|-------|------|--------|
| Vitest + RTL setup | `vitest.config.ts`, `tests/setup.ts` | Done |
| Constants tests | `tests/constants.test.ts` (12 tests) | Done |
| Schema tests | `tests/schemas.test.ts` (24 tests) | Done |
| Store tests | `tests/store.test.ts` (9 tests) | Done |
| Component tests | 6 files, 60 tests total | Done |
| E2E Playwright | `e2e/inspection-form.spec.ts` | Done |
| Auth fix | `auth.ts` — missing headers + try/catch | Done |

**Coverage goal**: 100% statements/lines, ≥95% branches (3 unreachable branches accepted).

---

## Phase 3: Direct-to-Cloud Upload Engine ✅ DONE

### 3.1 — Upload Server Action

**File**: `app/actions/upload.ts`

- `generateUploadUrl(fileType: string, fileSize: number): Promise<UploadUrlResponse>`
- Detects environment: `UPLOADCARE_PUBLIC_KEY` → Uploadcare (dev), `AWS_ACCESS_KEY_ID` → S3 (prod)
- Returns `{ uploadUrl: string; publicUrl: string; fileKey: string }`
- For Uploadcare: returns sentinel `uploadUrl: "uploadcare"` (client uses SDK directly)
- For S3: returns presigned PUT URL

### 3.2 — Upload Hook

**File**: `app/hooks/useFileUpload.ts`

```typescript
function useFileUpload() {
  // Returns:
  // upload(file: File, onProgress?: (percent: number) => void): Promise<string>
  // cancel(): void
}
```

**Behavior**:
- `upload(file)` → calls `generateUploadUrl`, detects provider via `uploadUrl` sentinel
  - Uploadcare: uses `@uploadcare/upload-client` SDK
  - S3: uses fetch PUT to presigned URL
- Progress callback fires with 0–100 integer
- Retry logic: up to 3 attempts on failure
- AbortController for cancel support
- Returns `Promise<string>` resolving to the public CDN URL

### 3.3 — FileUploadField Component

**File**: `app/components/FileUploadField.tsx`

- 4 states: `pending` (dropzone), `uploading` (spinner + progress bar), `done` (icon preview), `error` (retry)
- **Done state**: Shows static file-type icon (camera for photos, video camera for videos) + filename + "Uploaded" badge + green checkmark. No live thumbnail rendering to avoid CDN processing delays causing 500 errors. The `publicUrl` is stored in Zustand for admin use but not rendered as `<Image>` in the form.
- Drag-and-drop support with visual feedback
- Auto-upload on file selection
- Progress bar from real upload progress
- Retry re-uploads same file; Cancel aborts in-flight upload
- Compact sizing: reduced padding and min-heights for concise layout

### 3.4 — ImageCheckboxGroup Component

**File**: `app/components/ImageCheckboxGroup.tsx`

- Compact company logo grid: smaller boxes (`min-h-[80px]` instead of `aspect-square`), reduced padding (`p-2`), smaller gap (`gap-3`)
- Mobile-friendly: `grid-cols-2` on mobile (instead of single column), `lg:grid-cols-3` on desktop
- Smaller check badge and logo images

### 3.5 — Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `UPLOADCARE_PUBLIC_KEY` | Server-side | Server Action detects Uploadcare mode |
| `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY` | Client-side | `@uploadcare/upload-client` SDK |
| `AWS_ACCESS_KEY_ID` | Prod only | S3 presigned URL generation |
| `AWS_SECRET_ACCESS_KEY` | Prod only | S3 credentials |
| `AWS_BUCKET` | Prod only | S3 bucket name |
| `AWS_REGION` | Prod only | S3 region |

### 3.6 — Media Step Validation

All 4 media steps (StepMediaA/B/C/D) validate that all their file fields have `status === "done"` before allowing navigation. On submit, the step reads `store.uploadFields`, checks each field's status, and shows `toast.error("Please upload all required files before proceeding")` if any field is not done.

### 3.7 — Testing

| Test File | Tests | Covers |
|-----------|-------|--------|
| `tests/upload-action.test.ts` | 2 | `generateUploadUrl` Uploadcare sentinel path, no-provider throw |
| `tests/useFileUpload.test.ts` | 5 | Upload via Uploadcare, progress callback, retry on failure, all retries exhausted, cancel abort |

### 3.8 — next.config.ts

Added `images.remotePatterns` for:
- `*.ucarecdn.com` (Uploadcare CDN)
- `*.ucarecd.net` (Uploadcare upload domain)
- `*.s3.*.amazonaws.com` (S3)

---

## Phase 4: Stripe Payments & Webhooks ✅ DONE

| Task | Status | Files |
|------|--------|-------|
| 4.1 — Inspection Draft | ✅ Done | `app/actions/inspection.ts` — `createInspectionDraft` |
| 4.2 — PaymentIntent + Payment CPT | ✅ Done | `app/actions/payment.ts` — `createPaymentIntent` |
| 4.3 — Payment Status Polling | ✅ Done | `app/api/payment/status/route.ts` |
| 4.4 — Stripe Webhook | ✅ Done | `app/api/webhooks/stripe/route.ts` |
| 4.5 — PaymentForm | ✅ Done | `app/components/PaymentForm.tsx` |
| 4.6 — Success Page | ✅ Done | `app/dashboard/customer/success/page.tsx` |
| 4.7 — StepReviewPayment integration | ✅ Done | `StepReviewPayment.tsx` |
| 4.8 — Types & Constants | ✅ Done | `app/lib/types.ts`, `inspectionStore.ts` |
| 4.9 — Env docs | ✅ Done | AGENTS.md, session-summary.md |
| 4.10 — E2E Tests | ✅ Done | `e2e/payment.spec.ts` (+ `e2e/inspection-form.spec.ts`) |

### 4.11 — Standardization Fixes (Final Session)

| Fix | Description |
|-----|-------------|
| WPGraphQL standard mutations | Plain integer string IDs (`"173"`), `paymentFields`/`inspectionDetails` nested inputs, JWT auth for all mutations |
| JWT webhook auth | Service account login via `WP_WEBHOOK_USERNAME`/`WP_WEBHOOK_PASSWORD`, token cached per invocation |
| Amount normalization | WordPress stores dollars (`Math.round(amountCents/100)`), Stripe receives cents |
| Payment metadata | `user_ip`, `user_agent`, `referrer`, `payment_method`, `amount_cents` — built via `headers()` |
| Inspection title | `"Inspection - {plate}"`, then updated to `"Inspection #{id} - {plate}"` after creation |
| Back button step 7 | Same style as steps 1–6 |
| Role-based middleware | Non-admin redirected from `/dashboard` and `/dashboard/admin` to `/dashboard/customer` |
| Field mapping | `rightRearTirePhoto` mapping removed, `interiorBackSeatPhoto` → `interiorBackseatPhoto` |

### 4.12 — WP Token Auto-Refresh & Debug (Complete)

| Task | Status | Files |
|------|--------|-------|
| Token refresh logic | ✅ Done | `app/lib/wp-auth.ts` — `getValidAccessToken()`, `wpFetch()` |
| Auth types extension | ✅ Done | `next-auth.d.ts` — `refreshToken`, `refreshTokenExpiration` |
| Login mutation updates | ✅ Done | `auth.ts` — requests `authTokenExpiration`, `refreshToken`, `refreshTokenExpiration` |
| WP headers constant | ✅ Done | `app/lib/wp-headers.ts` — `WP_SITE_TOKEN_HEADER` |
| Debug logging in authorize | ✅ Done | `auth.ts` — `[DEBUG-LAYER-1]` marked logs |
| Debug route | ✅ Done | `app/api/debug/graphql/route.ts` |
| Test mock updates | ✅ Done | All 147 tests pass with new token fields |

**Key Implementation Details:**
- **Auto-refresh**: `getValidAccessToken()` checks `accessTokenExpiration`; if < 1 min, calls `refreshToken` mutation with `X-OVI-0982-Token` header
- **Shared wpFetch**: All WP mutations route through `wpFetch()` — auto-refreshes token, validates content-type, logs non-JSON responses
- **Debug layers**: `authorize()` logs full request/response; `/api/debug/graphql` returns egress IP + raw WP response
- **Test-ready**: `wpFetch` handles mocks without `text()`/`headers`; all 147 tests pass with `refreshToken`/`accessTokenExpiration` mocks

### 4.13 — Refresh Token Origin Header Fix (Complete)

| Task | Status | Files |
|------|--------|-------|
| Origin header on refresh mutation | ✅ Done | `app/lib/wp-auth.ts` — added Origin header to `getValidAccessToken()` |

**Details:**
- The `refreshToken` mutation was failing with "Unauthorized request origin" because the `Origin` header was missing
- Added `Origin` header using same logic as `wpFetch`: `NEXT_PUBLIC_SITE_URL` → `AUTH_URL` → `localhost:3000`
- PHP snippet on WP side handles CORS/origin validation
- All checks pass: lint, build, 147 tests

### 4.1 — Create Inspection Draft

**File**: `app/actions/inspection.ts`

- `createInspectionDraft(formData: InspectionFormData): Promise<{ inspectionId: string }>`
- Maps all 7 step form data → WPGraphQL ACF fields (camelCase keys)
- Sets `inspectionStatus: "pending"`, `paymentStatus: "pending"`
- Filters uploadFields where `status === "done"`, maps `publicUrl` to corresponding ACF field
- Requires authenticated session (throws if no session)
- 9 unit tests

### 4.2 — Create PaymentIntent

**File**: `app/actions/payment.ts`

- `createPaymentIntent(inspectionId: string, amountCents: number): Promise<{ clientSecret, paymentId, returnUrl }>`
- Creates Stripe PaymentIntent with metadata `{ inspectionId, wpPaymentId }`
- Creates `inspection-payment` CPT via WPGraphQL mutation
- Updates PI metadata with `wpPaymentId`
- Sets inspection `paymentStatus: "pending"`
- 6 unit tests

### 4.3 — Payment Status Polling

**File**: `app/api/payment/status/route.ts`

- `GET /api/payment/status?inspectionId=xxx`
- Queries inspection CPT via WPGraphQL → `{ inspection { inspectionStatus, paymentStatus } }`
- `cache: "no-store"` for fresh polling data
- 7 unit tests

### 4.4 — Stripe Webhook Handler

**File**: `app/api/webhooks/stripe/route.ts`

- `POST` — verifies Stripe signature with `stripe.webhooks.constructEvent`
- Handles: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.requires_action`, `payment_intent.canceled`
- For each event: updates payment CPT status + inspection CPT `paymentStatus` + `inspectionStatus` via GraphQL
- Returns `200` to acknowledge receipt
- 9 unit tests

### 4.5 — Test Cards

| Card | Scenario |
|------|----------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Decline |
| `4000 0025 0000 3155` | Requires 3D Secure |

### 4.14 — Navigation Performance & Header Live Session (Complete)

| Task | Status | Files |
|------|--------|-------|
| Remove redundant `router.refresh()` after push | ✅ Done | `LoginForm.tsx`, `SignupForm.tsx` |
| Move HeaderNav out of Suspense | ✅ Done | `app/dashboard/layout.tsx`, `HeaderNav.tsx`, deleted `HeaderSkeleton.tsx` |
| Per-menu loading skeleton | ✅ Done | New `HeaderMenuSkeleton.tsx` |
| Header live session on public pages | ✅ Done | `app/components/Header/Header.tsx` |

**Header live session (00502 follow-up):**
- **Bug**: Public pages (`/`, `/login`, `/register`) always showed "Login" in the menu because `app/(public)/layout.tsx` hardcoded `initialAuthStatus="unauthenticated"` and passed no session.
- **Fix**: `Header.tsx` (client) now subscribes to `useSession()` — `effectiveSession = clientSession ?? session`, `authenticated` derived from live session/status, falling back to server prop. While `!session && status === "loading"` it renders `HeaderMenuSkeleton` instead of a wrong "Login" flash.
- **Why not server-prop**: Passing `auth()` in the public layout would make public pages dynamic (cookies), losing static/ISR caching. Keeping them static (○ / 1h ISR) costs only a ~100-300ms client-session skeleton; page content streams immediately.
- **Dashboard**: `auth()` passed server-side in `app/dashboard/layout.tsx` → no skeleton, correct first paint.

---

## Phase 5: Customer Inspections Listing & InspectionDetailView ✅ DONE

> Specs: `.opencode/spec/005-customer-inspections-listing/` (incl. `005.*` Bunny CDN, `005.opt` UX/cost sub-tasks) and `.opencode/spec/00502-navigation-performance-fix/`.

### 5.1 — Status Enums & Shared Utilities

| Task | Status | Files |
|------|--------|-------|
| Status enums, styles, types, utility CSS | ✅ Done | `app/lib/types.ts`, `app/lib/status.ts`, `app/globals.css` (`.scrollbar-none`) |
| Date formatter | ✅ Done | `app/lib/format.ts` |

- `INSPECTION_STATUSES`: `pending`, `paid`, `payment_failed`, `in_progress`, `approved`, `rejected`, `cancelled` — replaces all hard-coded status string literals (actions, webhooks, cards, badges).
- `PAYMENT_STATUSES`: `pending`, `succeeded`, `failed`, `refunded`, `requires_action`, `processing`.
- `getStatusStyle()` → `{ label, dot, text }`; `getPaymentStatusLabel()`; `isPaid = paymentStatus === "succeeded" || inspectionStatus === "paid"`.
- Tests: `tests/lib/status.test.ts` (5 tests).

### 5.2 — Server Actions (`app/actions/inspections.ts`)

- `listInspections()` — owner-scoped (JWT author filter) listing via custom WP connection args (`limit`/`offset`/`inspectionStatus` from a WP PHP snippet); single-call `unstable_cache` (revalidate 300s, tags `["inspections"]`); clamps page to `totalPages` (`pageInfo.total` from `graphql_connection_page_info`).
- `fetchInspection(id)` — full detail incl. all media URL fields, `inspectionCompanies`, `orderSubtotal`.
- ACF single-select fields return **arrays** from WPGraphQL → normalized with `asString()`.
- `app/lib/listing-url.ts` — shared listing-state URL builder.
- Registration `displayName` fix — `app/api/register/route.ts`.
- Tests: `tests/actions/inspections.test.ts` (10 tests).

### 5.3 — Listing UI Components

| Component | File | Tests |
|-----------|------|-------|
| `StatusBadge` | `app/components/StatusBadge.tsx` | — |
| `FilterInspectionsModal` (dialog primitive) | `components/ui/dialog.tsx`, `app/components/FilterInspectionsModal.tsx` | 5 |
| `InspectionCard` | `app/components/InspectionCard.tsx` (chevron unfold, Payment Link + Car details) | 7 |

### 5.4 — Pages & Routes

- `app/dashboard/customer/page.tsx` — server-side filtered/paginated listing in `CustomerPageShell` (white-canvas `overflow-clip` card, uncapped heights); keyed `<Suspense>` skeleton on every filter/pagination change.
- `app/dashboard/customer/inspection/[id]/page.tsx` — read-only detail, streamed via `<Suspense fallback={<InspectionDetailSkeleton/>}>`.
- `app/dashboard/customer/pay/[id]/page.tsx` — Payment Link route (owner-only).
- `app/dashboard/admin/inspection/[id]/page.tsx` — admin detail route (same shared component).
- `proxy.ts` — `/inspection` → redirect `/dashboard/customer/`.
- `app/components/InspectionDetailView/` — presentation-only shared component (data via props): `InspectionHeader`, `SpecificationsBlock`, `SelectedCompanies`, `MediaGallery` (Tabs: General/Interior/Exterior/Tires), `CertificatesPanel` (sticky bottom bar; cert links only when `approved`). Primitives: `components/ui/tabs.tsx`, `components/ui/skeleton.tsx`.
- Tests: detail-view modules (12) + `InspectionPagination.test.tsx` (5).

### 5.5 — Navigation Performance Fix (00502)

| Task | Files | Status |
|------|-------|--------|
| Remove redundant `router.refresh()` after `router.push()` | `LoginForm.tsx`, `SignupForm.tsx` | ✅ Done |
| Per-menu loading skeleton | `app/components/Header/HeaderMenuSkeleton.tsx` (new); `HeaderSkeleton.tsx` deleted | ✅ Done |
| Move `HeaderNav` out of Suspense (menu/auth passed as props) | `app/dashboard/layout.tsx`, `app/components/Header/HeaderNav.tsx` | ✅ Done |
| Header live session on public pages (`useSession()`, skeleton while loading) | `app/components/Header/Header.tsx` | ✅ Done |

Login→Dashboard perceived time: ~300ms (was 700–1800ms).

### 5.6 — Payment Hardening (Webhook + Server-side Trust)

- `confirmInspectionPayment(inspectionId, paymentId, paymentIntentId)` — server-side `stripe.paymentIntents.retrieve()`; marks `succeeded`/`paid` only when Stripe reports success AND PI metadata matches; else `failed`/`payment_failed` + real Stripe error. `PaymentForm` awaits, logs + toasts (no silent swallow).
- `createPaymentIntent(inspectionId)` — client amount removed; server charges stored `orderSubtotal` (set at draft creation via `calculatePrice`); rejects when `author` ≠ `session.user.wpId`.
- Stripe webhook = reconciliation layer for events the browser never sees (3DS, async declines, refunds). Dashboard endpoint live on Netlify.

### 5.7 — Netlify Deployment & Routing Performance

- Live at `https://rideshareinspector.netlify.app` (dev/testing running in a production environment — not final prod).
- `AUTH_TRUST_HOST=true` (NextAuth `UntrustedHost` fix, locally proven with prod build + spoofed Host header). `NEXTAUTH_URL` scoped to **Production context only**; `NEXT_PUBLIC_SITE_URL` stays production in all contexts (server-side WP Origin).
- WP origin allowlist updated for the Netlify origin. `app/lib/site-origin.ts` (scheme normalization); `app/lib/menu.ts` + `getSiteSettings` per-instance TTL memo (86400s).
- `netlify.toml`: fixed inverted `ignore` semantics (exit 0 = skip build → `main` deploys skipped, previews always build), pinned `@netlify/plugin-nextjs`, `publish = ".next"`, `NODE_VERSION = "22"`.
- Upload provider hardening in prod (all-or-nothing per provider — see 5.8).

### 5.8 — Bunny CDN Upload Integration (005.\* sub-task)

- Replaced Uploadcare/AWS with **Bunny Storage + Pull Zone** as the sole direct-to-cloud provider.
- `app/actions/upload.ts` — presigned PUT via `@aws-sdk/client-s3` against the S3-compatible Bunny endpoint (`forcePathStyle`, creds = zone name/password, region `ny`); sign only `Content-Type`; returns `{ uploadUrl, publicUrl, fileKey, contentType }`; throws unless all 4 `BUNNY_*` vars present. Uploadcare/AWS branches removed.
- `app/hooks/useFileUpload.ts` — XHR sends `response.contentType`; `@uploadcare/upload-client` uninstalled. Retry/cancel/progress unchanged.
- `MediaGallery.tsx` — `<Image unoptimized>` (Bunny does edge optimization; Netlify does not).
- `next.config.ts` — `*.b-cdn.net` remotePatterns; ucarecdn/S3 patterns removed.
- Tests: `upload-action.test.ts` (4), `useFileUpload.test.ts` (6, mocked `XMLHttpRequest`).

### 5.9 — UX & Netlify Cost Optimization (005.opt sub-task)

- `NavigationLoader` (non-blocking dots pill) replaces `nextjs-toploader` (uninstalled); driven by `uiStore.navPending` from the `useTransition` in `NavLink.tsx`.
- `LoadingIndicator` animated primitives blended into all 4 `loading.tsx` above the zero-CLS skeletons.
- Route-group split: `app/(public)/layout.tsx` (static header, `revalidate: 3600`, **no `auth()`**) → `/`, `/login`, `/register` stay **`○` static** (zero per-visit compute); `app/dashboard/layout.tsx` renders the authed header under `Suspense<HeaderSkeleton>`.
- Zustand selector hygiene (`useShallow`) across the 7 step components.
- `app/store/dataStore.ts` — sessionStorage inspection-detail cache (5 min TTL) + `listVersion`; `PaymentForm` invalidates on success.
- Revalidation: list cache 300s, detail 86400s, menu TTL 86400s; payment-status API stays `no-store`.
- Batched server actions: `getPaymentSetup(id)` (detail + PI in one round trip), `createInspectionAndPaymentIntent(formData)` (draft + PI in one round trip).
- Logout → `/login`; login banner via Next `<Image fill>` (gated `USE_NEXT_IMAGE_BANNER`).

### 5.10 — Testing & QA

| Layer | Count | Status |
|-------|-------|--------|
| Vitest unit tests | 208 tests, 22 files | ✅ |
| Coverage | Statements 100%, Lines 100% | ✅ |
| E2E specs | `inspection-form`, `payment`, `customer-dashboard` (3) | ✅ |
| Lint / Build | 0 errors, 8 pre-existing warnings / passes | ✅ |

**Deferred to Phase 6**: admin management table + approve/reject action bar wiring, `expiryDate` population (ACF field exists), PDF certificate generation + visible cert links (only render when approved).

---

## Phase 6: Admin Dashboard & PDF Certificates

### 6.1 — Admin Dashboard (Stage A ✅ DONE — UI/Design)

**Route groups**: `app/dashboard/layout.tsx` thin → `(site)/layout.tsx` (standard header) + `(panel)/layout.tsx` (AdminPanelShell, role-guarded to `administrator` | `inspector`).

- `/dashboard` — mirrors `/dashboard/customer` for admins/inspectors via shared `app/components/customer/InspectionListing.tsx` (standard header).
- `/dashboard/admin` → redirect → `/dashboard/admin/requests`.
- `/dashboard/admin/{requests,users,archive,proposals,settings}` — table/form pages with search (left) + filter (right), pagination footer "Showing X–Y of Z", and a page-title-in-center header with mobile-only hamburger + desktop sidebar.
- Admin panel menu comes from a **separate WP menu** (`getAdminPanelMenu()`) incl. logout; frontend site header uses `getAdminSiteMenu()` for admin/inspector (conditional `admin`/`dashboard`/`logout` items) vs `getMainMenu()` for customers.
- Stage A renders static sample data — data wiring (Stage B) deferred.
- Stage B (deferred): list inspections with status filters, approve/reject wired to WP, PDF links.

### 6.2 — Customer Dashboard

**File**: `app/dashboard/(site)/customer/page.tsx`

- ✅ **Done in Phase 5** — owner-scoped listing, Add ("New Inspection") button → multistep form, status filter + pagination, shared `InspectionDetailView`, Payment Link route (`pay/[id]`)
- ✅ **Phase 6**: listing extracted to shared `InspectionListing` (mirrors to `/dashboard`)
- Remaining (Phase 6 Stage B): past inspection report / PDF download links (tied to certificate generation)

### 6.3 — PDF Certificate Generation (Stage B — deferred)

**File**: `app/actions/pdf.ts`

- `generateCertificate(inspectionId: string): Promise<{ pdfUrl: string }>`
- Uses a PDF generation library (e.g., `@react-pdf/renderer` or server-side Puppeteer)
- 68 templates — template selection based on `inspectionType` + `vehicleMake` + `year`
- Stores PDF URL in WP via GraphQL (never in Media Library)

### 6.4 — Admin Approval Action (Stage B — deferred)

**File**: `app/actions/admin.ts`

- `approveInspection(inspectionId: string): Promise<void>` — triggers PDF generation
- `rejectInspection(inspectionId: string, reason: string): Promise<void>` — sends rejection notification
- Both update WP status via GraphQL mutation

---

## Phase 7: Notifications & QA

### 7.1 — Email / In-App Notifications

- WP email for status changes (can be handled by WP plugins, triggered via GraphQL)
- Toast notifications for in-app events

### 7.2 — QA Checklist

- [ ] Auth: login, signup, Google OAuth, logout, session persistence
- [ ] Multistep form: each step validates, stores, advances; back navigation works
- [ ] File upload: images and videos upload in background; progress visible; retry on failure
- [ ] Payment: card accepted, declined, 3DS; webhook received
- [ ] Admin: approve/reject flow; PDF generation
- [ ] Mobile responsive: form works on mobile viewports
- [ ] Lint & build pass with zero warnings

### 7.3 — Deployment Prep

- ✅ **Resolved in Phase 5** — deployment target is **Netlify** (`rideshareinspector.netlify.app`): `netlify.toml` (ignore rule, pinned `@netlify/plugin-nextjs`, Node 22), `AUTH_TRUST_HOST`, context-scoped `NEXTAUTH_URL`, WP origin allowlist, preview/branch deploy workflow.
- Remaining: environment variable audit (all secrets documented but never committed); verify live-mode Stripe keys + webhook endpoint when going to final prod; final build test on Netlify deploy preview.

---

## File Tree (Target State)

```
app/
  (public)/
    layout.tsx                       # static header, revalidate 3600, no auth() — Phase 5.9
    page.tsx                         # landing page (static ○)
    (auth)/
      login/page.tsx                 # flip-card login/signup
      register/page.tsx
  dashboard/
    layout.tsx                       # authed header under Suspense<HeaderSkeleton>
    customer/
      page.tsx                       # Phase 5 — owner-scoped listing + filter/pagination
      inspection/
        page.tsx
        _components/
          StepVehicleSelection.tsx
          StepVinLicense.tsx
          StepMediaA.tsx
          StepMediaB.tsx
          StepMediaC.tsx
          StepMediaD.tsx
          StepReviewPayment.tsx
      inspection/[id]/page.tsx       # Phase 5 — read-only detail (streamed)
      pay/[id]/page.tsx              # Phase 5 — Payment Link route (owner-only)
    admin/
      page.tsx                       # Phase 6 — management table
      inspection/[id]/page.tsx       # Phase 5 — admin detail route
  components/
    Button.tsx
    FileUploadField.tsx              # Phase 3 — upgraded with drag-drop, progress, icon preview
    FormInput.tsx
    FormSelect.tsx
    Header/
      Header.tsx
      HeaderNav.tsx
      HeaderMenuSkeleton.tsx         # Phase 5 — per-menu loading skeleton
    ImageCheckboxGroup.tsx
    InspectionCard.tsx               # Phase 5
    InspectionDetailView/            # Phase 5 — shared customer/admin detail
    StatusBadge.tsx                  # Phase 5
    FilterInspectionsModal.tsx       # Phase 5
    NavLink.tsx                      # Phase 5 — transition-based navigation
    NavigationLoader.tsx             # Phase 5.9 — non-blocking loader
    LoadingIndicator.tsx             # Phase 5.9 — animated primitives
    PaymentForm.tsx                  # Phase 4
    PriceSummary.tsx
    SessionWrapper.tsx
    StepIndicator.tsx
    ToasterProvider.tsx
  components/ui/
    dialog.tsx                       # Phase 5
    tabs.tsx                         # Phase 5
    skeleton.tsx                     # Phase 5
    button.tsx, card.tsx, input.tsx, checkbox.tsx, field.tsx, separator.tsx, dropdown-menu.tsx ...
  hooks/
    useFileUpload.ts                 # Phase 3/5.8 — upload lifecycle hook (XHR)
  actions/
    upload.ts                        # Phase 3/5.8 — Bunny presigned PUT
    inspections.ts                   # Phase 5 — list/fetch server actions
    payment.ts                       # Phase 4/5 — getPaymentSetup, confirmInspectionPayment
    inspection.ts                    # Phase 4
    pdf.ts                           # Phase 6 — generateCertificate
    admin.ts                         # Phase 6 — approve/reject
  lib/
    constants.ts
    schemas/
      vehicleInfo.ts
      vinInfo.ts
      inspectionScope.ts
      uploadFields.ts
      reviewAgreement.ts
      index.ts
    status.ts                        # Phase 5 — status enums + style mapping
    format.ts                        # Phase 5 — date formatter
    listing-url.ts                   # Phase 5 — listing URL builder
    site-origin.ts                   # Phase 5 — scheme normalization
    menu.ts                          # Phase 5.7 — TTL-memoized WP menu
    utils.ts
  store/
    inspectionStore.ts
    uiStore.ts                       # Phase 5.9 — navPending
    dataStore.ts                     # Phase 5.9 — inspection detail cache
  api/
    auth/[...nextauth]/route.ts
    register/route.ts
    webhooks/stripe/route.ts         # Phase 4
  globals.css
  layout.tsx
auth.ts
auth.config.ts
next-auth.d.ts
proxy.ts
```