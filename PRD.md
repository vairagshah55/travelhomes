# TravelHomes — Product Requirements Document

> A two-sided travel marketplace where vendors list **camper vans, unique
> stays, and adventure activities**, and customers discover and book them.

|                |                                                                            |
| -------------- | -------------------------------------------------------------------------- |
| Status         | Active development, pre-launch                                             |
| Repo layout    | Monorepo — `apps/web/` (React frontend) + `Server/` (Node/Express backend) |
| Primary market | India (currency ₹, geo data for IN states/cities)                          |
| Document owner | Engineering                                                                |
| Last updated   | 2026-05-30                                                                 |

---

## 1. Product Vision

TravelHomes connects **independent travel-service vendors** (RV owners, boutique
property hosts, activity operators) with **travellers** looking for non-hotel
experiences. The product replaces what most vendors do today over WhatsApp /
Instagram DMs with:

- A discoverable listing page per service
- A bookings system with calendar visibility and conflict-free reservations
- A vendor dashboard with revenue, occupancy, and visitor analytics
- An admin layer to vet listings before they go live

Closest comparables: Airbnb (stays) + Outdoorsy/RVshare (camper vans) + Viator
(activities), but bundled for the Indian leisure-travel market.

---

## 2. Personas

### 2.1 Vendor (primary)

The owner of one or more services. Examples:

- A retired couple in Gujarat running a single cave-house homestay
- A camper-van fleet operator with 6 vehicles across two cities
- A trekking outfit running monthly Himalayan expeditions

**Jobs to be done:**

- Publish a service (photos, pricing, capacity, rules)
- Receive and confirm bookings
- Track availability — see what's reserved on which dates
- Understand demand — how many people see and click the listing
- Get paid

### 2.2 Customer (primary)

Domestic traveller browsing options for a trip 1–8 weeks out.

**Jobs to be done:**

- Find services by location, dates, type, capacity
- Compare options on price + reviews + photos
- Book and pay
- Manage past + upcoming trips

### 2.3 Admin / Operator (internal)

Platform staff reviewing new listings and monitoring marketplace health.

**Jobs to be done:**

- Approve or reject submitted listings (with reason)
- Take down problematic listings (block / deactivate)
- Monitor platform-wide KPIs (impressions, bookings, revenue)
- Manage CMS content (blogs, FAQs, careers, contact)
- Handle disputes / staff accounts

---

## 3. Core User Journeys

### 3.1 Vendor onboarding (caravan example — 9 steps)

Implemented in `apps/web/src/pages/onboarding/CaravanOnboarding.tsx`
via the wizard at `/onboarding/caravan`. Each step is its own component
under `apps/web/src/components/onboarding/caravan/`.

| Step | Component           | Captures                                                   |
| ---- | ------------------- | ---------------------------------------------------------- |
| 0    | DescriptionStep     | Name, description, rules, photos (cover + 5+ gallery)      |
| 1    | CategoryStep        | Vehicle type (RV / Motorhome / Camper Trailer / etc.)      |
| 2    | FeaturesStep        | Amenities (Wi-Fi, Solar, Shower, Kitchen, ...) + custom    |
| 3    | CapacityAddressStep | Seating + Sleeping capacity, address, state, city, pincode |
| 4    | PricingStep         | Per-km rate AND/OR per-day rate, includes/excludes         |
| 5    | DiscountOffersStep  | First-user, Festival, Weekly/Monthly, Special              |
| 6    | BusinessDetailsStep | Brand, legal name, GST, business email + phone             |
| 7    | PersonalDetailsStep | Personal info, ID proof upload                             |
| 8    | TermsConditionsStep | Acceptance                                                 |

Equivalent flows exist for **Unique Stays** (`/onboarding/stay`) and
**Activities** (`/onboarding/activity`), with type-specific steps:

- Stays: PropertyTypeStep → CategorySelectionStep → StayDetailsStep (entire vs individual room) → FeaturesStep
- Activities: TypeStep → FeaturesStep → DetailsStep → PricingStep (with location) → InclusionExclusionStep

### 3.2 Customer browse → book

1. **Search/browse** (`/`, `/search`, `/search-results`) — filter by type, location, price, dates
2. **Detail page** (`/offering/:id`) — gallery + sticky pricing card + reviews + booking widget
3. **Booking** — date range pick → payment → confirmation
4. **Post-trip** — review / re-book

### 3.3 Vendor managing operations

1. **Dashboard** (`/dashboard`) — KPI cards (bookings, today, active, revenue) + recent bookings table
2. **Bookings calendar** (`/bookings`) — month grid with service rows, drag-to-reschedule, click cell to create
3. **Booking details** (`/bookings/details`) — list view with filters (search, status, time) + tabs (Upcoming / Past / Cancelled)
4. **Offerings management** (`/offering`) — grid of own listings, tabs for Approved / Pending, stats row
5. **Edit offering** (`/offering/:id/edit`) — single-page form reusing onboarding components inline

### 3.4 Admin review queue

1. **Vendor lists** new offering — saved with `status: "pending"`
2. **Admin reviews** via the admin sub-app at `/admin/*`
3. **Approve** → `status: "approved"` (cascades to Vendor / User / source onboarding doc + email + Notification)
4. **Reject** → `status: "rejected"` + rejection reason → vendor sees it on their pending tab

---

## 4. Feature Inventory (what exists today)

### ✅ Built

- Auth (JWT) with User / Vendor / Admin roles
- 3 onboarding wizards (caravan / stay / activity) with draft persistence
- Offering CRUD + status workflow (pending → approved/rejected/deactivated/blocked)
- Image upload (cover + gallery, served from `/uploads`)
- Searchable State/City dropdowns sourced from `countries_states_cities.json`
- Calendar bookings (month grid, drag-to-resize, conflict detection)
- Bookings list view with filters + status tabs + KPI cards
- Invoice generation + print
- Vendor dashboard with stats + recent-bookings table
- Vendor analytics endpoint (counts + graphs — visitor-scoped)
- Admin sub-app (`/admin/*`) with separate sidebar
- Reviews / ratings (averageRating, ratingsCount on Offer)
- Notifications (in-app)
- Messages / vendor-chat (`/dashchat`, `/vendor-chat`)
- CMS (blogs, FAQs, careers, jobs) with admin editor
- Marketing offers + discounts UI (visual; some persistence gaps — see §7)
- Multi-step booking modal with section grouping, validation, date-picker
- Bot/crawler filtering on impression tracking

### ⚠️ Partial / Visual-only

- **Discounts on offerings**: 4 discount slots (First User / Festival / Weekly-Monthly / Special) — full UI exists but **fields aren't on `OfferDTO`** so they don't persist
- **Per-offer impression counts**: aggregated platform-wide on `AdminAnalyticsMetric`; per-vendor read works but per-offer attribution is biased by sort order (only the "first offer per vendor per page-load" gets credit)
- **Click-through tracking**: `Offer.clicks` field exists + `trackClick` fires; not yet plotted on any dashboard
- **Payment integration**: `Payment` model and aggregations exist; live gateway not connected (mock data on Revenue page)
- **Search**: text + city filtering works; full-text search / typo tolerance not implemented

### 🚫 Not built / future

- Per-offer impressions plotted in vendor analytics
- Client-side **viewability tracking** (IntersectionObserver) — current impressions count any non-bot API response, which over-counts
- Sponsored / promoted listings (paid placement)
- Wishlist sync across devices (LocalStorage only today)
- Refunds / cancellation policy enforcement
- Mobile native apps
- Multi-vendor calendar sync (iCal export)
- Vendor messaging with customers (only vendor-chat exists, no customer-vendor inbox)
- i18n (currently English-only with INR formatting)

---

## 5. Technical Architecture

### 5.1 Frontend — `apps/web/`

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** with two brand themes resolved via CSS variables (`data-brand="admin"`)
- **shadcn/ui** primitives (Select, Popover, Dialog, Calendar, etc.)
- **React Router v6** with a `DashboardLayoutShell` route group that mounts the vendor sidebar once and lets pages swap via `<Outlet />` (prevents sidebar re-mount on navigation)
- **TanStack Query** for all data fetching, with stable cache keys per `(user, scope)`
- **react-day-picker** for date pickers
- **date-fns** for date math
- **framer-motion** for page transitions
- **recharts** for analytics graphs
- **lucide-react** + **react-icons** for icons

### 5.2 Backend — `Server/`

- **Node.js** + **Express**
- **MongoDB** via **Mongoose**
- **JWT** auth (`requireJwt` middleware, supports `optional: true`)
- **multer** for image uploads → `/uploads`
- **nodemailer** for transactional email (Gmail SMTP)
- Module-per-feature structure: `modules/<feature>/` contains `router.js`, `controller.js`, `service.js`, `dto.js`, `__tests__/`
- Auth guard layer: roles checked in `auth.js`, owner-vs-non-owner enforcement inside each service's `setStatus` / `update` / `remove`
- Centralised `asyncHandler` and error model (`shared/errors.js`)
- Logging via `pino` (structured logger)

### 5.3 Routing topology

```
apps/web/src/App.tsx
├── Public routes (Index, Search, ProductDetails)
├── Auth routes (Login, Register, VerifyOTP, ForgetPassword)
├── Onboarding routes (CaravanOnboarding, StaysOnboarding, ActivityOnboarding)
├── DashboardLayoutShell (vendor sidebar mounted once)
│   ├── /dashboard
│   ├── /bookings, /bookings/details
│   ├── /offering, /offering/add, /offering/:id, /offering/:id/edit
│   ├── /revenue, /marketing, /marketing/offers
│   ├── /analytics, /notifications, /settings, /profile
│   └── /dashchat, /vendor-chat
└── /admin/*  → AdminApp (separate sub-app)
```

### 5.4 Data model (key entities)

| Collection                                                  | Purpose                                             | Notable fields                                                                                                                     |
| ----------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `User`                                                      | Customers + vendors share this                      | `email`, `userType`, `vendorStatus`                                                                                                |
| `Vendor`                                                    | Vendor-specific profile (joined to User by email)   | `vendorId` (string code `VDxxxx`), business + personal details                                                                     |
| `Offer`                                                     | Single listing (camper-van / stay / activity)       | `serviceType`, `category`, `status`, `vendorId`, `userId`, photos, prices, rules, features                                         |
| `CalendarBooking`                                           | A reservation against an Offer                      | `resourceName` (= offer.name), `startDate`, `endDate`, `status`, `paymentStatus`, prices                                           |
| `BookingDetail`                                             | Newer detail-page bookings (separate flow)          | `serviceName`, `clientName`, `checkIn`, `checkOut`, `serviceType`                                                                  |
| `Payment`                                                   | Payment record per booking                          | `amount`, `status` (pending/paid/completed/refunded)                                                                               |
| `AdminAnalyticsMetric`                                      | Daily per-(offer, day, category) counter rows       | `serviceId`, `metricDate`, `category` (`listing`/`activity`/`camper-van`/`unique-stay`), `impressions`, `visitors`, `visitorIds[]` |
| `VendorAnalyticsSnapshot`                                   | Periodic snapshots of vendor counts for time-series | `total`, `cancelled`, `metrics`, `properties`, `payments`                                                                          |
| `CaravanOnboarding`, `StayOnboarding`, `ActivityOnboarding` | Draft persistence for wizard flows                  | Mirrors Offer fields per type                                                                                                      |

#### Status workflows

- Offer: `pending → approved → deactivated → approved` (vendor can flip), `pending → cancelled` (vendor), admin can `block` / `reject` from any state
- Booking: `Confirmed → Checked-in → Checked-out` or `Cancelled`

### 5.5 Auth & authorisation

- JWT payload contains `_id`, `email`, `name`, `role`
- `requireJwt()` middleware mounts on protected routes; `{ optional: true }` mode for routes that read public-or-personalised data (e.g. vendor analytics — vendors see their own, anon callers see platform total)
- Per-service authz: owners can update/delete their own offers, admins are unrestricted, everyone else gets 403

---

## 6. Analytics Plumbing (current state, post-fixes)

### 6.1 Impressions

- Fired in `offers.service.js → list()` (fire-and-forget, no await)
- One increment per **(vendor, day, visitor)** triplet (deduped via `visitorIds` array on the metric row)
- Bot/crawler User-Agents filtered out
- Owner-view (`mine=true`) and admin calls skip tracking
- Per-offer self-exclusion: a logged-in vendor browsing the public catalog doesn't accumulate impressions on their own listings (filtered via `viewerVendorIds` in the bulkWrite filter)

### 6.2 Visitors (detail-page views)

- Fired in `offers.service.js → getById()` via `trackVisitor`
- Two-stage write: `findOneAndUpdate` with `visitorIds: { $ne: visitorId }` first; falls back to `upsert: true` only if no match
- Owner-self-view filtered (checks `offer.vendorId === userId` AND `Vendor.vendorId` lookup by email)
- Categories used: `activity` / `camper-van` / `unique-stay` (one per serviceType)

### 6.3 Clicks

- `Offer.clicks` field incremented by `trackClick` endpoint (`POST /api/offers/:id/click`)
- Not yet plotted on the vendor dashboard (KPI card present but no time-series)

### 6.4 Vendor-scoped dashboard reads

- Card numbers: `computeCounts(vendorId)` aggregates `AdminAnalyticsMetric` with `serviceId: { $in: vendorOfferIds }` filter
- Graph numbers: same filter, same source — fixed to scope by vendor (was platform-wide previously)

---

## 7. Known Gaps & Tech Debt

| #   | Item                                                                                                                                                                                                         | Severity                                                                | Effort                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------- |
| 1   | **Discount fields not persisted** on offers. UI exists, payload doesn't include them, `OfferDTO` has no fields                                                                                               | Medium                                                                  | 1 day (schema migration + payload wiring) |
| 2   | **Impression accuracy** — measures API responses, not actual viewability. Once `<OfferingCard>` mounts an IntersectionObserver and posts to a `/api/events` endpoint, this becomes a real metric.            | High (for ranking ML / sponsored placement); Low (for vanity dashboard) | 2–3 days                                  |
| 3   | **Camper-van save payload** writes `regularPrice: 0` + empty `priceIncludes`/`Excludes` (legacy fields). Cosmetic but pollutes data.                                                                         | Low                                                                     | Trivial — gated on tab in payload builder |
| 4   | **Duplicate offers from test data** — e.g. 4× "Test 1" + 4× "cave house" on vendor VD8178                                                                                                                    | Cosmetic                                                                | Run a cleanup script + dedupe on create   |
| 5   | **Mixed legacy vs new bookings models** — `CalendarBooking` (calendar grid) and `BookingDetail` (table) are separate. Eventual unification needed.                                                           | Medium                                                                  | 3–4 days (schema migration + UI updates)  |
| 6   | **Multiple Sidebar / Header components** across the codebase. The DashboardLayoutShell unification was a recent fix; pages outside the shell (some legacy admin pages) still need migration.                 | Low                                                                     | Already mostly done                       |
| 7   | **No rate limiting on tracking endpoints**                                                                                                                                                                   | Medium (DDoS / abuse risk)                                              | 1 day with `express-rate-limit`           |
| 8   | **Hardcoded category + features lists** in `AddOfferings.tsx` / `EditOfferings.tsx` for unique-stay & activity tabs. Caravan tab now uses onboarding's source-of-truth; the other two haven't been migrated. | Medium (data inconsistency risk)                                        | 1 day per type                            |
| 9   | **i18n** — strings are inline English. Currency is INR-only (formatted with `Intl.NumberFormat("en-IN")`).                                                                                                   | Low (single-market launch)                                              | Multi-week if pursued                     |
| 10  | **No automated test coverage** beyond a few DTO validation tests in `Server/modules/*/__tests__/`. Frontend has no tests.                                                                                    | High (changes are risky)                                                | Ongoing                                   |
| 11  | **`vendor-analytics resetMetrics` HTTP endpoint** wipes platform-wide data on any vendor JWT. Either restrict to admin or delete the endpoint (CLI script exists at `Server/scripts/reset-impressions.js`).  | High (security)                                                         | 30 minutes                                |

---

## 8. Roadmap (suggested phases)

### Phase A — Pre-launch hardening (now → 2 weeks)

- [ ] Resolve §7 items #3, #4, #7, #11 — small, safe fixes
- [ ] Wire discount persistence (§7 #1)
- [ ] Standardise category + feature source-of-truth (§7 #8)
- [ ] Migrate the remaining unique-stay + activity tabs in edit page to onboarding-style components
- [ ] Smoke-test full vendor flow on staging with real photos
- [ ] Verify admin approval cascade end-to-end

### Phase B — Beta (2–6 weeks)

- [ ] Real payment gateway integration (Razorpay / Stripe India)
- [ ] Refund flow + cancellation policy enforcement
- [ ] Real-time booking conflict detection (currently relies on optimistic single-resource calendar)
- [ ] Email + SMS confirmations to customer (current vendor-side only)
- [ ] Vendor → customer messaging (basic inbox)

### Phase C — Scale (6+ weeks)

- [ ] Client-side viewability impressions (§7 #2)
- [ ] Search relevance — full-text + filters + sort by quality signals
- [ ] Wishlist persistence per user
- [ ] iCal export for vendor calendar
- [ ] Sponsored placements / featured listings (depends on viewability accuracy)
- [ ] Mobile apps (React Native or Capacitor)

---

## 9. Open questions

1. **Pricing model for vendors** — flat commission? Tiered? Promoted-placement upcharge? Currently no commission logic in code.
2. **Vendor verification** — is ID proof upload enough, or does India compliance require GST / Udyam registration check?
3. **Cancellation policy** — set per-vendor or platform-wide?
4. **Multi-language** — Is Hindi/regional language support a launch requirement?
5. **Multi-currency** — INR-only for foreseeable future?
6. **Customer reviews** — do they go live immediately or pass through admin moderation?
7. **Sponsored listings** — is this on the revenue roadmap?
8. **Mobile app** — React Native shared codebase or native?

---

## 10. Appendix — Repo orientation cheat sheet

```
/
├── apps/web/                   Frontend (Vite + React + TS)
│   ├── src/pages/              Page-level components (one per route)
│   ├── src/components/         Feature components (bookings/, onboarding/, offering/, …)
│   ├── src/components/ui/      shadcn primitives
│   ├── src/components/shared/  Cross-feature components
│   ├── src/lib/api.ts          All backend API clients
│   ├── src/contexts/           AuthContext, etc.
│   ├── src/hooks/              Custom hooks
│   └── public/                 Static assets (incl. countries_states_cities.json)
├── Server/
│   ├── modules/<feature>/      router + controller + service + dto + tests
│   ├── models/                 Mongoose schemas
│   ├── middleware/             auth, validate, errorHandler
│   ├── shared/                 errors.js, validate.js, asyncHandler.js
│   ├── scripts/                seed + maintenance CLIs
│   ├── api/index.js            Route mounting
│   └── .env                    MONGO_URI, JWT_SECRET, SMTP creds, PORT
└── PRD.md                      This document
```

---

_This PRD reflects the codebase as of the last commit. For tactical UI work,
see also `apps/web/CONVENTIONS.md` (component patterns, color tokens, error
treatment rules)._
