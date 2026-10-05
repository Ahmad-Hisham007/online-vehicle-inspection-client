# Implementation Plan — Online Vehicle Inspection Platform

## Phase 000: Public Site UI & Design 🚧 IN PROGRESS

> Spec: `.opencode/spec/000-UI/spec.md` (status board — resume point for interleaved design sessions).

Design work runs in parallel with feature phases and commits directly to `main`.

### Homepage (`/`)

| Section | File | Status |
|---------|------|--------|
| Hero slider | `app/(public)/Components/Slider.tsx` | ✅ Done |
| About + logo carousel | `About.tsx` + `logoCarousel.tsx` | ✅ Done |
| Video section | `VideoSection.tsx` | ✅ Done |
| How It Works | `HowItWorks.tsx` | ✅ Done |
| Pricing | `PricingSection.tsx` | ✅ Done |
| Why Choose Us | `WhyChooseUs.tsx` | ✅ Done |
| FAQ | `FAQ.tsx` | ✅ Done |
| CTA | `CTA.tsx` | ✅ Done (design) — placeholder copy, needs real text |

### Footer (site-wide)

`Footer.tsx` rendered in `app/(public)/layout.tsx` — appears on every public route (`/`, `/login`, `/register`, `/error`). Dark `#0B0F17`: brand logo + description · Contact Us (support@insve.com, 808-800-9292, ARD315746) · Follow Us (Telegram/Instagram/Facebook) · INSVE.COM © year.

### Other Pages (all pending)

Contact Us (`/contact`), Blog (`/blog`), Blog single (`/blog/[slug]`), Uber (`/uber`), Lyft (`/lyft`), Turo (`/turo`).

### Section Notes (2026-10-05)

- **FAQ** (`FAQ.tsx`): 5-item shadcn `Accordion` (`type="single" collapsible`); wheel badge ("Answer of your queries") + heading via `AutoLineSplitter`; triggers show a `#A82B33` bar→dot morph + `ArrowDownToDot` icon; answers render HTML strings via `dangerouslySetInnerHTML` (`<br/>` line breaks).
- **CTA** (`CTA.tsx`): full-bleed background image (`/car-detailing-concept.jpg`, new asset) + floating `bg-black/90 backdrop-blur-md` card (right-aligned on desktop, centered mobile); heading "…Certified Vehicle Insection at only $29" (typo + price are placeholders), lorem subtitle, "Start Now" shadcn Button → `/dashboard/customer/inspection`. **Needs real copy.**
- **Accordion primitive** (`components/ui/accordion.tsx`): `AccordionTrigger` now accepts optional `icon`, `iconClassName`, `hideDefaultIcon`; default `border border-border` removed from `AccordionItem` (consumers add their own borders).

### Animation System

- `app/(public)/Components/AnimateOnScroll.tsx` — the single `"use client"` wrapper; all landing sections stay Server Components. Props: `variants`, `delay`, `duration`, `className`, `staggerChildren`. Also exports:
  - `TextSplitter` — char-level split (needs visual verification).
  - `AutoLineSplitter` — word-level masked line reveal: each word wrapped in `overflow: hidden` inline-block, revealed from below (`y: "100%" → "0%"`, 0.85s, `smoothEase`, stagger 0.12); wraps naturally on resize (responsive-safe); `paddingBottom: 0.1em` protects descenders. Used in the FAQ heading.
- `app/(public)/Components/animations.ts` — pure-data `Variants`: `fadeUp`, `fadeIn`, `scaleIn`, `slideFromLeft/Right/Top/Bottom`, `flyDownFromTop`, `charFlyInTop/Bottom`, `charFadeInStagger`, `wordFlyInTop`, `lineRevealContainer`/`lineRevealItem`, `staggerChildren`, `childFadeUp`, `smoothFade`, `textWithHighlight`; `withTransition()` helper for per-instance duration/delay; `smoothEase = [0.16, 1, 0.3, 1]`.
- Logo carousel auto-scroll: Embla v9.0.0-rc03 — `emblaApi.plugins().autoScroll?.play()` in `useEffect` (no `useAutoScroll` hook in this version).

**Rules**: never break desktop layout/design; SSR-compatible (no `"use client"` on sections); smooth animations (0.65–1.0s); text with nested `<span>` animates at word level only.

---

## Phase 1: Auth & WP Infrastructure ✅ DONE

| Task                                        | Status |
| ------------------------------------------- | ------ |
| Next.js 16 + Tailwind v4 + shadcn setup     | Done   |
| NextAuth v5 (Credentials + Google OAuth)    | Done   |
| WPGraphQL JWT login mutation (`auth.ts`)    | Done   |
| Google Site Token login (`signIn` callback) | Done   |
| Custom `User` type (`next-auth.d.ts`)       | Done   |
| Registration API (`/api/register`)          | Done   |
| Login/signup flip-card UI                   | Done   |
| Middleware (`proxy.ts`)                     | Done   |

**Registration details**: `/api/register` forwards `phoneNumber` (persisted to the ACF "User fields" group `phone_number`) and sends an auto-generated WP `username` (`{first+last|email-local}` → `[a-z0-9]` + `_` + 8-char UUID) rather than the raw email. Depends on a WP-side `RegisterUserInput` extension (WPCode snippet #277 on the live CMS): the input field is added via the `graphql_input_fields` filter — direct `register_graphql_field` on `RegisterUserInput` does not apply on WPGraphQL 2.21 — and persisted via `graphql_user_object_mutation_update_additional_data` scoped to `registerUser`.

**Auth & session robustness (follow-up)**:

- **Google login fixed for admins**: WP SITETOKEN provider was configured with `loginOptions.metaKey: "login"` (username match) while the app authenticates Google identities by **email** → only accounts whose WP username == email worked. Set to `"email"` on `wpgraphql_login_provider_siteToken` (live CMS).
- **Refresh query root cause**: `auth.ts` `jwt` refresh selected `refreshToken`/`refreshTokenExpiration` from `refreshToken(...)`, but the plugin's `RefreshTokenPayload` only exposes `authToken`/`authTokenExpiration`/`success` → the refresh always failed validation → expired tokens were sent → all token-bearing fetches failed ~5 min after login. Fixed with a **single shared** `app/lib/refresh-token.ts` `refreshAccessToken()` (3-field query) used by both the `jwt` callback and `wp-auth.ts` `getValidAccessToken()`. A real WP rejection throws `SessionExpiredError`; transient network stays non-fatal. NextAuth session `maxAge` set to 30 days. WP access-token lifetime raised 300s → 900s (WPCode snippet #280). No proactive ping/SessionGuard (per-request auto-refresh only).
- **Session expiry → forced logout**: the `jwt` callback flags definitive WP rejections with `token.error = "RefreshAccessTokenError"` (exposed as `session.error`; transient failures stay silent) and clears it on success. Server actions (`listInspections`, `fetchInspection`, `listRequests`, `listUsers`, `listArchivedInspections`, `listInspectors`, `assignInspector`) fail fast via `app/lib/session-error.ts` `assertSessionActive()` / `SessionExpiredError` before any WP call. Client `SessionExpiryHandler` (inside `SessionWrapper`) reacts to `session.error` with a single `signOut({ redirectTo: "/login?expired=1" })`; `SessionExpiredNotice` on the login flip-card shows a one-time message and strips the query param. No polling.
- **Redirect-loop guard (`903fe27`)**: `shouldForceSignOut(pathname, error)` suppresses the forced sign-out on `/login` (otherwise sign-out and the login redirect ping-pong), `proxy.ts` treats a session carrying `error` as logged out and redirects it to `/login?expired=1`, and the `jwt` callback short-circuits once the token is already flagged so a dead session stops probing WP on every `auth()` call.

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

| File                 | Fields                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `vehicleInfo.ts`     | `licensePlate`, `mileage`                                                                                                       |
| `vinInfo.ts`         | `vin`, `make`, `model`, `year`, `fuelType`                                                                                      |
| `inspectionScope.ts` | `country`, `state`, `companies`, `tiresOlderThan6Years`, `batteryOlderThan5Years`, `voltageGreaterThan12_1V` (with superRefine) |
| `uploadFields.ts`    | 16 file metadata fields across 4 media steps                                                                                    |
| `reviewAgreement.ts` | `userAgreement` (literal true), `inspectionAgreement` (literal true)                                                            |

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

| Component              | File                                                                     | Description                                                                            |
| ---------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `StepVehicleSelection` | `app/dashboard/customer/inspection/_components/StepVehicleSelection.tsx` | License plate, mileage, country, state, companies (logo grid), Turo conditional radios |
| `StepVinLicense`       | `app/dashboard/customer/inspection/_components/StepVinLicense.tsx`       | VIN, make, model, year (dropdown 1990-2026), fuelType                                  |
| `StepMediaA`           | `app/dashboard/customer/inspection/_components/StepMediaA.tsx`           | Registration card photo, odometer photo, horn video                                    |
| `StepMediaB`           | `app/dashboard/customer/inspection/_components/StepMediaB.tsx`           | Interior driver/passenger photos + seat adjustments                                    |
| `StepMediaC`           | `app/dashboard/customer/inspection/_components/StepMediaC.tsx`           | Back seat, exterior left/right, front/rear videos                                      |
| `StepMediaD`           | `app/dashboard/customer/inspection/_components/StepMediaD.tsx`           | 4 tire photos                                                                          |
| `StepReviewPayment`    | `app/dashboard/customer/inspection/_components/StepReviewPayment.tsx`    | Order summary, PriceSummary, agreement checkboxes                                      |

### 2.5 — Shared Components Created

| Component            | File                                    | Purpose                                                   |
| -------------------- | --------------------------------------- | --------------------------------------------------------- |
| `FormSelect`         | `app/components/FormSelect.tsx`         | Generic `<T extends FieldValues>` select with Controller  |
| `ImageCheckboxGroup` | `app/components/ImageCheckboxGroup.tsx` | Company logo grid with selection badges                   |
| `FileUploadField`    | `app/components/FileUploadField.tsx`    | File upload with drag-drop, progress, icon preview, retry |
| `PriceSummary`       | `app/components/PriceSummary.tsx`       | Live price from `calculatePrice()`                        |
| `StepIndicator`      | `app/components/StepIndicator.tsx`      | 7-step two-row stepper (circles + connectors + labels)    |

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

| Layer              | What                                    | Status |
| ------------------ | --------------------------------------- | ------ |
| Vitest + RTL setup | `vitest.config.ts`, `tests/setup.ts`    | Done   |
| Constants tests    | `tests/constants.test.ts` (12 tests)    | Done   |
| Schema tests       | `tests/schemas.test.ts` (24 tests)      | Done   |
| Store tests        | `tests/store.test.ts` (9 tests)         | Done   |
| Component tests    | 6 files, 60 tests total                 | Done   |
| E2E Playwright     | `e2e/inspection-form.spec.ts`           | Done   |
| Auth fix           | `auth.ts` — missing headers + try/catch | Done   |

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

| Variable                            | Required    | Purpose                               |
| ----------------------------------- | ----------- | ------------------------------------- |
| `UPLOADCARE_PUBLIC_KEY`             | Server-side | Server Action detects Uploadcare mode |
| `NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY` | Client-side | `@uploadcare/upload-client` SDK       |
| `AWS_ACCESS_KEY_ID`                 | Prod only   | S3 presigned URL generation           |
| `AWS_SECRET_ACCESS_KEY`             | Prod only   | S3 credentials                        |
| `AWS_BUCKET`                        | Prod only   | S3 bucket name                        |
| `AWS_REGION`                        | Prod only   | S3 region                             |

### 3.6 — Media Step Validation

All 4 media steps (StepMediaA/B/C/D) validate that all their file fields have `status === "done"` before allowing navigation. On submit, the step reads `store.uploadFields`, checks each field's status, and shows `toast.error("Please upload all required files before proceeding")` if any field is not done.

### 3.7 — Testing

| Test File                     | Tests | Covers                                                                                          |
| ----------------------------- | ----- | ----------------------------------------------------------------------------------------------- |
| `tests/upload-action.test.ts` | 2     | `generateUploadUrl` Uploadcare sentinel path, no-provider throw                                 |
| `tests/useFileUpload.test.ts` | 5     | Upload via Uploadcare, progress callback, retry on failure, all retries exhausted, cancel abort |

### 3.8 — next.config.ts

Added `images.remotePatterns` for:

- `*.ucarecdn.com` (Uploadcare CDN)
- `*.ucarecd.net` (Uploadcare upload domain)
- `*.s3.*.amazonaws.com` (S3)

---

## Phase 4: Stripe Payments & Webhooks ✅ DONE

| Task                                | Status  | Files                                                   |
| ----------------------------------- | ------- | ------------------------------------------------------- |
| 4.1 — Inspection Draft              | ✅ Done | `app/actions/inspection.ts` — `createInspectionDraft`   |
| 4.2 — PaymentIntent + Payment CPT   | ✅ Done | `app/actions/payment.ts` — `createPaymentIntent`        |
| 4.3 — Payment Status Polling        | ✅ Done | `app/api/payment/status/route.ts`                       |
| 4.4 — Stripe Webhook                | ✅ Done | `app/api/webhooks/stripe/route.ts`                      |
| 4.5 — PaymentForm                   | ✅ Done | `app/components/PaymentForm.tsx`                        |
| 4.6 — Success Page                  | ✅ Done | `app/dashboard/customer/success/page.tsx`               |
| 4.7 — StepReviewPayment integration | ✅ Done | `StepReviewPayment.tsx`                                 |
| 4.8 — Types & Constants             | ✅ Done | `app/lib/types.ts`, `inspectionStore.ts`                |
| 4.9 — Env docs                      | ✅ Done | AGENTS.md, session-summary.md                           |
| 4.10 — E2E Tests                    | ✅ Done | `e2e/payment.spec.ts` (+ `e2e/inspection-form.spec.ts`) |

### 4.11 — Standardization Fixes (Final Session)

| Fix                          | Description                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| WPGraphQL standard mutations | Plain integer string IDs (`"173"`), `paymentFields`/`inspectionDetails` nested inputs, JWT auth for all mutations |
| JWT webhook auth             | Service account login via `WP_WEBHOOK_USERNAME`/`WP_WEBHOOK_PASSWORD`, token cached per invocation                |
| Amount normalization         | WordPress stores dollars (`Math.round(amountCents/100)`), Stripe receives cents                                   |
| Payment metadata             | `user_ip`, `user_agent`, `referrer`, `payment_method`, `amount_cents` — built via `headers()`                     |
| Inspection title             | `"Inspection - {plate}"`, then updated to `"Inspection #{id} - {plate}"` after creation                           |
| Back button step 7           | Same style as steps 1–6                                                                                           |
| Role-based middleware        | Non-admin redirected from `/dashboard` and `/dashboard/admin` to `/dashboard/customer`                            |
| Field mapping                | `rightRearTirePhoto` mapping removed, `interiorBackSeatPhoto` → `interiorBackseatPhoto`                           |

### 4.12 — WP Token Auto-Refresh & Debug (Complete)

| Task                       | Status  | Files                                                                                |
| -------------------------- | ------- | ------------------------------------------------------------------------------------ |
| Token refresh logic        | ✅ Done | `app/lib/wp-auth.ts` — `getValidAccessToken()`, `wpFetch()`                          |
| Auth types extension       | ✅ Done | `next-auth.d.ts` — `refreshToken`, `refreshTokenExpiration`                          |
| Login mutation updates     | ✅ Done | `auth.ts` — requests `authTokenExpiration`, `refreshToken`, `refreshTokenExpiration` |
| WP headers constant        | ✅ Done | `app/lib/wp-headers.ts` — `WP_SITE_TOKEN_HEADER`                                     |
| Debug logging in authorize | ✅ Done | `auth.ts` — `[DEBUG-LAYER-1]` marked logs                                            |
| Debug route                | ✅ Done | `app/api/debug/graphql/route.ts`                                                     |
| Test mock updates          | ✅ Done | All 147 tests pass with new token fields                                             |

**Key Implementation Details:**

- **Auto-refresh**: `getValidAccessToken()` checks `accessTokenExpiration`; if < 1 min, calls `refreshToken` mutation with `X-OVI-0982-Token` header
- **Shared wpFetch**: All WP mutations route through `wpFetch()` — auto-refreshes token, validates content-type, logs non-JSON responses
- **Debug layers**: `authorize()` logs full request/response; `/api/debug/graphql` returns egress IP + raw WP response
- **Test-ready**: `wpFetch` handles mocks without `text()`/`headers`; all 147 tests pass with `refreshToken`/`accessTokenExpiration` mocks

### 4.13 — Refresh Token Origin Header Fix (Complete)

| Task                              | Status  | Files                                                                 |
| --------------------------------- | ------- | --------------------------------------------------------------------- |
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

| Card                  | Scenario           |
| --------------------- | ------------------ |
| `4242 4242 4242 4242` | Success            |
| `4000 0000 0000 0002` | Decline            |
| `4000 0025 0000 3155` | Requires 3D Secure |

### 4.14 — Navigation Performance & Header Live Session (Complete)

| Task                                           | Status  | Files                                                                     |
| ---------------------------------------------- | ------- | ------------------------------------------------------------------------- |
| Remove redundant `router.refresh()` after push | ✅ Done | `LoginForm.tsx`, `SignupForm.tsx`                                         |
| Move HeaderNav out of Suspense                 | ✅ Done | `app/dashboard/layout.tsx`, `HeaderNav.tsx`, deleted `HeaderSkeleton.tsx` |
| Per-menu loading skeleton                      | ✅ Done | New `HeaderMenuSkeleton.tsx`                                              |
| Header live session on public pages            | ✅ Done | `app/components/Header/Header.tsx`                                        |

**Header live session (00502 follow-up):**

- **Bug**: Public pages (`/`, `/login`, `/register`) always showed "Login" in the menu because `app/(public)/layout.tsx` hardcoded `initialAuthStatus="unauthenticated"` and passed no session.
- **Fix**: `Header.tsx` (client) now subscribes to `useSession()` — `effectiveSession = clientSession ?? session`, `authenticated` derived from live session/status, falling back to server prop. While `!session && status === "loading"` it renders `HeaderMenuSkeleton` instead of a wrong "Login" flash.
- **Why not server-prop**: Passing `auth()` in the public layout would make public pages dynamic (cookies), losing static/ISR caching. Keeping them static (○ / 1h ISR) costs only a ~100-300ms client-session skeleton; page content streams immediately.
- **Dashboard**: `auth()` passed server-side in `app/dashboard/layout.tsx` → no skeleton, correct first paint.

---

## Phase 5: Customer Inspections Listing & InspectionDetailView ✅ DONE

> Specs: `.opencode/spec/005-customer-inspections-listing/` (incl. `005.*` Bunny CDN, `005.opt` UX/cost sub-tasks) and `.opencode/spec/00502-navigation-performance-fix/`.

### 5.1 — Status Enums & Shared Utilities

| Task                                     | Status  | Files                                                                          |
| ---------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| Status enums, styles, types, utility CSS | ✅ Done | `app/lib/types.ts`, `app/lib/status.ts`, `app/globals.css` (`.scrollbar-none`) |
| Date formatter                           | ✅ Done | `app/lib/format.ts`                                                            |

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

| Component                                   | File                                                                             | Tests |
| ------------------------------------------- | -------------------------------------------------------------------------------- | ----- |
| `StatusBadge`                               | `app/components/StatusBadge.tsx`                                                 | —     |
| `FilterInspectionsModal` (dialog primitive) | `components/ui/dialog.tsx`, `app/components/FilterInspectionsModal.tsx`          | 5     |
| `InspectionCard`                            | `app/components/InspectionCard.tsx` (chevron unfold, Payment Link + Car details) | 7     |

### 5.4 — Pages & Routes

- `app/dashboard/customer/page.tsx` — server-side filtered/paginated listing in `CustomerPageShell` (white-canvas `overflow-clip` card, uncapped heights); keyed `<Suspense>` skeleton on every filter/pagination change.
- `app/dashboard/customer/inspection/[id]/page.tsx` — read-only detail, streamed via `<Suspense fallback={<InspectionDetailSkeleton/>}>`.
- `app/dashboard/customer/pay/[id]/page.tsx` — Payment Link route (owner-only).
- `app/dashboard/admin/inspection/[id]/page.tsx` — admin detail route (same shared component).
- `proxy.ts` — `/inspection` → redirect `/dashboard/customer/`.
- `app/components/InspectionDetailView/` — presentation-only shared component (data via props): `InspectionHeader`, `SpecificationsBlock`, `SelectedCompanies`, `MediaGallery` (Tabs: General/Interior/Exterior/Tires), `CertificatesPanel` (sticky bottom bar; cert links only when `approved`). Primitives: `components/ui/tabs.tsx`, `components/ui/skeleton.tsx`.
- Tests: detail-view modules (12) + `InspectionPagination.test.tsx` (5).

### 5.5 — Navigation Performance Fix (00502)

| Task                                                                         | Files                                                                              | Status  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------- |
| Remove redundant `router.refresh()` after `router.push()`                    | `LoginForm.tsx`, `SignupForm.tsx`                                                  | ✅ Done |
| Per-menu loading skeleton                                                    | `app/components/Header/HeaderMenuSkeleton.tsx` (new); `HeaderSkeleton.tsx` deleted | ✅ Done |
| Move `HeaderNav` out of Suspense (menu/auth passed as props)                 | `app/dashboard/layout.tsx`, `app/components/Header/HeaderNav.tsx`                  | ✅ Done |
| Header live session on public pages (`useSession()`, skeleton while loading) | `app/components/Header/Header.tsx`                                                 | ✅ Done |

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

| Layer             | Count                                                  | Status |
| ----------------- | ------------------------------------------------------ | ------ |
| Vitest unit tests | 208 tests, 22 files                                    | ✅     |
| Coverage          | Statements 100%, Lines 100%                            | ✅     |
| E2E specs         | `inspection-form`, `payment`, `customer-dashboard` (3) | ✅     |
| Lint / Build      | 0 errors, 8 pre-existing warnings / passes             | ✅     |

**Deferred to Phase 6**: admin management table + approve/reject action bar wiring, `expiryDate` population (ACF field exists), PDF certificate generation + visible cert links (only render when approved).

---

## Phase 6: Admin Dashboard & PDF Certificates

### 6.1 — Admin Dashboard (Stage A ✅ DONE — UI/Design; Stage B 🚧 In Progress — Dynamic Data)

**Single route-aware Header (root layout)**: `app/layout.tsx` fetches all 3 WP menus (cached) → `<Header menus={…}>`. No nested layout renders a header. `Header.tsx` uses `usePathname()` + `useSession()`:

- Admin panel routes (`/dashboard/admin/*` excluding `/dashboard/admin/inspection`) → AdminHeader variant (language left, page title center from the admin panel menu item label, hamburger `md:hidden` only; mobile drawer = admin panel menu).
- All other routes → standard header (language left, logo center, hamburger right) with role-based menu.
- `app/lib/header-config.ts` — unified `ITEM_ICONS` / `BRAND_LOGOS` / `getMenuIcon` / `isLogoutItem` / `isBrandItem`.

**Route groups**: `app/dashboard/layout.tsx` thin → `(site)/layout.tsx` + `(public)/layout.tsx` are passthrough `<main>` (no header); `(panel)/layout.tsx` renders `AdminSidebar` (desktop) + content, role-guarded to `administrator` | `inspector`.

- `/dashboard` — mirrors `/dashboard/customer` for admins/inspectors via shared `app/components/customer/InspectionListing.tsx` (standard header).
- `/dashboard/admin` → redirect → `/dashboard/admin/requests`.
- `/dashboard/admin/{requests,users,archive,proposals,settings}` — table/form pages with search (left) + filter (right), pagination footer "Showing X–Y of Z", and a page-title-in-center header with mobile-only hamburger + desktop sidebar.
- Admin panel menu comes from a **separate WP menu** (`getAdminPanelMenu()`) incl. logout; frontend site header uses `getAdminSiteMenu()` for admin/inspector (conditional `admin`/`dashboard`/`logout` items) vs `getMainMenu()` for customers.
- **Menu caching**: `app/lib/menu.ts` `getMenu(slug)` via `unstable_cache(["menu","slug"], revalidate: 300)`; `auth.ts` `events.signIn/signOut` → `revalidatePath("/", "layout")`.

#### Stage B — Dynamic Data (Server-First + URL State)

Pattern mirrors the customer listing: **Server Components + Server Actions + `unstable_cache` (300s, tag-based) + URL searchParams (`?page&status&search`) + `useTransition` non-blocking nav + Suspense skeletons**.

| Page      | Status                        | Action                                                                                                     | Cache tag  | Filter                                  |
| --------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| Requests  | ✅ Done                       | `listRequests` (`app/actions/requests.ts`) — `inspectionStatusNotIn: [approved,rejected,cancelled]`        | `requests` | status: paid / pending / payment_failed |
| Users     | ✅ Done                       | `listUsers` (`app/actions/users.ts`) — `roleNotIn: [ADMINISTRATOR]`; **edit page admin-only** (`getUser`/`updateUser`) | `users`    | search only                             |
| Archive   | ✅ Done (Task #1)             | `listArchivedInspections` (`app/actions/archive.ts`) — `inspectionStatusIn: [approved,rejected,cancelled]` | `archive`  | status: approved / rejected / cancelled |
| Proposals | ⏳ Deferred (external WP dep) | —                                                                                                          | —          | —                                       |
| Settings  | ⏳ Not started (Task #2)      | `getSettings`/`updateSettings` (`app/actions/settings.ts`)                                                 | `users`    | —                                       |

**Stage B components**:

- `RequestsListing`/`RequestsContent`, `users/AdminUsersList`/`AdminUsersContent`, `ArchiveListing`/`ArchiveContent` — server listing (Suspense + skeleton) → client table + toolbar.
- `DataToolbar` — reusable search (debounced 500ms) + status filter via configurable `filterOptions` prop (Requests passes paid/pending/payment_failed; Archive passes approved/rejected/cancelled).
- `DataTable` (generic), `DataTableSkeleton`, `PaginationFooter` ("Showing X–Y of Z"), `AdminPageShell`, `StatusPill`.
- `app/lib/types.ts` — `AdminRequestSummary`, `AdminUserRow`, `AdminArchiveRow`.
- `app/lib/companyLabels.ts` — company value → label map (from `USA_COMPANIES`/`CA_COMPANIES`).
- `app/lib/listing-url.ts` — `buildListAdminHref()` for admin URL building.

**Acceptance**: SSR pages (no "use client" on `page.tsx`), URL-shareable filters, cache tags invalidated on mutations, role guard (administrator|inspector), lint/build/295 tests pass.

**Follow-up tasks (006-B addendum)**:
| Task | Status | Notes |
|------|--------|-------|
| A — Google login admin null user | ✅ Done | WP SITETOKEN `metaKey` `login`→`email` (see Phase 1 auth note) |
| B — Branded "register first" UX | ✅ Done | `auth.ts` `pages.error: "/error"` + `app/(public)/error/page.tsx` (AccessDenied → register CTA + back); login flip-card untouched |
| C — Branded error boundaries | ✅ Done | `ErrorState.tsx` + root `error`/`global-error`/`not-found` + `dashboard`, `(site)`, `(panel)` boundaries |
| D — Inspection access security + inspector assignment | ✅ Done | `app/lib/access.ts` (`canAccessInspection`); `fetchInspection` gate → not-found; Requests/Archive assigned-only for inspectors; WP snippet #279 (`assigned_inspector` field + where-arg + role-scoped reads + admin-only mutation); Requests Assigned pill + dropdown + ✕; `listInspectors` cached (SSR-list standard), `assignInspector` default-refresh (mutation standard) |
| E — Admin inspection creation flow | ⏳ Open | own `/dashboard/admin/inspection` + assign-user dropdown; block admins from `/dashboard/customer/*` |
| Edit user page (out-of-context, 6.3 branch) | ✅ Done | admin-only `/dashboard/admin/users/[id]` (`notFound()` for non-admins); `getUser`/`updateUser` (`app/actions/users.ts`); `AdminUserDetail` + `userEdit` schema; `EditUserForm` (email, names, phone, role, read-only date joined; Update wired to `updateUser`; Block/Update-password UI-only); **phone not persisted** — WP `UpdateUserInput` lacks `phoneNumber` (needs a #277-style input extension); Users table Edit action admin-only |
| Session/token robustness | ✅ Done | shared `refresh-token.ts` (3-field query), `SessionExpiredError`, session `maxAge` 30d, WP access-token 300→900s (snippet #280), no ping guard |
| Session expiry → forced logout | ✅ Done | `auth.ts` jwt sets `token.error = "RefreshAccessTokenError"` on definitive rejection (transient silent; cleared on success) → `session.error`; `app/lib/session-error.ts` + `assertSessionActive()` fail-fast in listing/detail/assignment actions; `SessionExpiryHandler` in `SessionWrapper` → `signOut({ redirectTo: "/login?expired=1" })` once; `SessionExpiredNotice` one-time message (+ URL cleanup) |
| Session-expiry redirect loop | ✅ Done | `903fe27` — `shouldForceSignOut(pathname, error)` never fires on `/login`; `proxy.ts` treats an errored session as logged out → `/login?expired=1`; `auth.ts` jwt early-returns once flagged (no per-call WP probe); +4 tests (299 total) |

### 6.2 — Customer Dashboard

**File**: `app/dashboard/(site)/customer/page.tsx`

- ✅ **Done in Phase 5** — owner-scoped listing, Add ("New Inspection") button → multistep form, status filter + pagination, shared `InspectionDetailView`, Payment Link route (`pay/[id]`)
- ✅ **Phase 6**: listing extracted to shared `InspectionListing` (mirrors to `/dashboard`)
- Remaining (Phase 6 Stage B): past inspection report / PDF download links (tied to certificate generation)

### 6.3 — Admin Approval / Rejection Action ✅ DONE (UI; PDF deferred to 6.4)

**Spec**: `.opencode/spec/006-3-admin-actions-in-inspection-detail/` (`spec.md`, `plan.md`, `session-summary.md`).

| Task | Status | Files |
| --- | --- | --- |
| Availability helpers | ✅ Done | `app/lib/status.ts` — `canApproveInspection` (`paid`/`in_progress`), `canRejectInspection` (all but `paid`/`in_progress`/`approved`) |
| Approval field registry | ✅ Done | `app/lib/approval-fields.ts` — `APPROVAL_GROUPS` (Vehicle/Registration/Condition/Brakes/Tires/Inspection/Handler/Host), precise types, `visibleFor`, `getVisibleFields`, cert companies |
| Detail pre-fill | ✅ Done | `app/actions/inspections.ts` — `DETAIL_QUERY` + `mapApprovalFields()` → `InspectionDetail.approvalFields` |
| Reject action | ✅ Done | `app/actions/admin.ts` — `rejectInspection` → `inspectionDetails.inspectionStatus = "rejected"`, revalidates `requests`/`archive`/`inspections` |
| Reject UI | ✅ Done | `app/components/InspectionDetailView/RejectDialog.tsx` + enablement in `CertificatesPanel.tsx`; confirm toasts + `router.refresh()` |
| Approve UI | ✅ Done | `app/components/InspectionDetailView/ApprovalDialog.tsx` + `ApprovalCompanyForm.tsx`; one accordion per cert company (lyft/uber/turo), registry-driven groups, **Generate** (icon empty→checked + placeholder new tab) and inline **Save** (stub); `components/ui/accordion.tsx` |
| PDF engine + approval mutation | ⏳ Deferred | Phase 6.4 (`approveInspection`, real Generate output, certificate field persistence, `expiryDate`) |

**Notes**: Reject allows `pending`/`payment_failed`/`rejected`/`cancelled`. Approve is disabled outside `paid`/`in_progress`. Form field edits are local state only; nothing except the reject status is written to WP this phase. Tests: `tests/lib/status.test.ts`, `tests/lib/approval-fields.test.ts`, `tests/actions/admin.test.ts`, `tests/components/{CertificatesPanel,ApprovalDialog}.test.tsx`.

### 6.4 — PDF Certificate Generation (deferred)

**File**: `app/actions/pdf.ts`

- `generateCertificate(inspectionId: string): Promise<{ pdfUrl: string }>`
- Uses a PDF generation library (e.g., `@react-pdf/renderer` or server-side Puppeteer)
- 68 templates — template selection based on `inspectionType` + `vehicleMake` + `year`
- Stores PDF URL in WP via GraphQL (never in Media Library)
- Wires `ApprovalDialog` Generate/Save to real output + `approveInspection` (status `approved`, cert fields, `expiryDate`)

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
    layout.tsx                       # passthrough <main> (no header — root layout renders it)
    page.tsx                         # landing page (static ○)
    (auth)/
      login/page.tsx                 # flip-card login/signup
      register/page.tsx
  dashboard/
    layout.tsx                       # thin: <main>{children}</main>
    (site)/
      layout.tsx                     # passthrough <main> (header from root layout)
      page.tsx                       # Phase 6 — /dashboard admin/inspector mirror of customer
      customer/
        page.tsx                     # Phase 5 — owner-scoped listing + filter/pagination
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
        inspection/[id]/page.tsx     # Phase 5 — read-only detail (streamed)
        pay/[id]/page.tsx            # Phase 5 — Payment Link route (owner-only)
      admin/inspection/[id]/page.tsx # Phase 5 — admin detail route (standard header, no sidebar)
    (panel)/
      layout.tsx                     # Phase 6 — AdminSidebar + content + role guard
      admin/
        page.tsx                     # Phase 6 — /dashboard/admin → redirect → requests
        requests/page.tsx            # Phase 6/6B — server component → RequestsListing (search/filter/pagination)
        users/page.tsx               # Phase 6/6B — server component → AdminUsersList
        archive/page.tsx             # Phase 6/6B — server component → ArchiveListing (Task #1 done)
        proposals/page.tsx           # Phase 6 — Proposals table (DEFERRED external dep)
        settings/page.tsx            # Phase 6 — Settings form (Task #2 not started)
  components/
    Button.tsx
    FileUploadField.tsx              # Phase 3 — upgraded with drag-drop, progress, icon preview
    FormInput.tsx
    FormSelect.tsx
    Header/
      Header.tsx                     # Phase 6 — single route-aware master header (root layout)
      HeaderMenuSkeleton.tsx         # Phase 5 — per-menu loading skeleton
      LanguageSelector.tsx           # Phase 6 — shared language dropdown
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
    admin/
      AdminSidebar.tsx               # Phase 6 — dark desktop sidebar (WP admin panel menu + logout)
      DataToolbar.tsx                # Phase 6B — reusable search + status filter (configurable filterOptions)
      DataTable.tsx                  # Phase 6/6B — generic table (loading state, pagination)
      DataTableSkeleton.tsx          # Phase 6B — skeleton loader
      PaginationFooter.tsx           # Phase 6/6B — "Showing X–Y of Z" + page buttons
      AdminPageShell.tsx             # Phase 6 — page wrapper
      StatusPill.tsx                 # Phase 6 — compact pill
      RequestsListing.tsx            # Phase 6B — server listing (Suspense)
      RequestsContent.tsx            # Phase 6B — client table + toolbar
      ArchiveListing.tsx             # Phase 6B — server listing (Suspense)
      ArchiveContent.tsx             # Phase 6B — client table + toolbar
      users/
        AdminUsersList.tsx           # Phase 6B — server listing (Suspense)
        AdminUsersContent.tsx        # Phase 6B — client table + toolbar
    customer/
      InspectionListing.tsx          # Phase 6 — shared listing (customer + /dashboard mirror)
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
    requests.ts                      # Phase 6B — listRequests
    users.ts                         # Phase 6B — listUsers
    archive.ts                       # Phase 6B — listArchivedInspections
    pdf.ts                           # Phase 6 — generateCertificate (Stage B)
    admin.ts                         # Phase 6 — approve/reject (Stage B)
  lib/
    constants.ts
    schemas/
      vehicleInfo.ts
      vinInfo.ts
      inspectionScope.ts
      uploadFields.ts
      reviewAgreement.ts
      index.ts
    status.ts                        # Phase 5 — status enums + style mapping (+ getStatusPillStyle)
    format.ts                        # Phase 5 — date formatter
    listing-url.ts                   # Phase 5/6B — listing URL builder (+ buildListAdminHref)
    companyLabels.ts                 # Phase 6B — company value → label map
    site-origin.ts                   # Phase 5 — scheme normalization
    menu.ts                          # Phase 6 — getMenu(slug) via unstable_cache(["menu","slug"], 300s)
    header-config.ts                 # Phase 6 — unified ITEM_ICONS / BRAND_LOGOS / getMenuIcon / isLogoutItem / isBrandItem
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
  layout.tsx                         # Phase 6 — root layout renders the single Header
auth.ts                              # Phase 6 — events.signIn/signOut → revalidatePath("/")
auth.config.ts
next-auth.d.ts
proxy.ts
```
