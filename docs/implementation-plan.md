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

## Phase 5: Admin Dashboard & PDF Certificates

### 5.1 — Admin Dashboard

**File**: `app/dashboard/admin/page.tsx`

- List all inspections with status filters (pending, paid, approved, rejected)
- Click to view full inspection detail
- Approve / Reject buttons
- Link to generated PDF certificate

### 5.2 — Customer Dashboard

**File**: `app/dashboard/customer/page.tsx`

- List user's inspections
- "New Inspection" button -> starts multistep form
- View past inspection reports / PDF downloads

### 5.3 — PDF Certificate Generation

**File**: `app/actions/pdf.ts`

- `generateCertificate(inspectionId: string): Promise<{ pdfUrl: string }>`
- Uses a PDF generation library (e.g., `@react-pdf/renderer` or server-side Puppeteer)
- 68 templates — template selection based on `inspectionType` + `vehicleMake` + `year`
- Stores PDF URL in WP via GraphQL (never in Media Library)

### 5.4 — Admin Approval Action

**File**: `app/actions/admin.ts`

- `approveInspection(inspectionId: string): Promise<void>` — triggers PDF generation
- `rejectInspection(inspectionId: string, reason: string): Promise<void>` — sends rejection notification
- Both update WP status via GraphQL mutation

---

## Phase 6: Notifications & QA

### 6.1 — Email / In-App Notifications

- WP email for status changes (can be handled by WP plugins, triggered via GraphQL)
- Toast notifications for in-app events

### 6.2 — QA Checklist

- [ ] Auth: login, signup, Google OAuth, logout, session persistence
- [ ] Multistep form: each step validates, stores, advances; back navigation works
- [ ] File upload: images and videos upload in background; progress visible; retry on failure
- [ ] Payment: card accepted, declined, 3DS; webhook received
- [ ] Admin: approve/reject flow; PDF generation
- [ ] Mobile responsive: form works on mobile viewports
- [ ] Lint & build pass with zero warnings

### 6.3 — Deployment Prep

- `next.config.ts` — add image domains, S3/Uploadcare domains
- Environment variable audit (all secrets documented but never committed)
- Build test on Vercel preview deployment

---

## File Tree (Target State)

```
app/
  login/
    page.tsx
  register/
    route.ts
  dashboard/
    page.tsx
    customer/
      page.tsx
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
    admin/
      page.tsx
  components/
    Button.tsx
    FileUploadField.tsx           # Phase 3 — upgraded with drag-drop, progress, icon preview
    FormInput.tsx
    FormSelect.tsx
    Header/
      Header.tsx
    ImageCheckboxGroup.tsx
    PaymentForm.tsx               # Phase 4
    PriceSummary.tsx
    SessionWrapper.tsx
    StepIndicator.tsx
    ToasterProvider.tsx
  hooks/
    useFileUpload.ts              # Phase 3 — upload lifecycle hook
  actions/
    upload.ts                     # Phase 3 — generateUploadUrl Server Action
  lib/
    constants.ts
    schemas/
      vehicleInfo.ts
      vinInfo.ts
      inspectionScope.ts
      uploadFields.ts
      reviewAgreement.ts
      index.ts
    utils.ts
  store/
    inspectionStore.ts
  api/
    auth/[...nextauth]/route.ts
    register/route.ts
    webhooks/stripe/route.ts      # Phase 4
  globals.css
  layout.tsx
  page.tsx
auth.ts
auth.config.ts
next-auth.d.ts
proxy.ts
```