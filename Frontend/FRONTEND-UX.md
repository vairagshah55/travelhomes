# Frontend UX Guide — TravelHomes

> Inspired by Airbnb (stays/discovery) and Zomato (search UX, filters, cards).
> **Mobile-first** — majority of users come through mobile devices.
> Every page must work on mobile (320px+), tablet (768px+), and desktop (1280px+).

---

## 1. Design Principles

| Principle | Description |
|---|---|
| Mobile-first | Design for 375px first, scale up to tablet → desktop |
| Skeleton-first | Every data-fetching component shows a shimmer skeleton before content loads |
| Thumb-friendly | Touch targets minimum 44×44px, bottom nav on mobile |
| Fast perceived load | Skeleton loaders make the page feel instant |
| Airbnb-style cards | Image-first cards with soft shadows, rounded corners |
| Zomato-style search | Sticky search bar, instant filter chips, clear CTAs |

---

## 2. Breakpoints

```
mobile   : 0px   – 767px    (primary target)
tablet   : 768px – 1279px
desktop  : 1280px+
```

Tailwind classes to use:
```
default → mobile
sm:     → 640px+
md:     → 768px  (tablet)
lg:     → 1024px
xl:     → 1280px (desktop)
```

---

## 3. Pages & Responsive Requirements

### 3.1 Home — `pages/Index.tsx`

**Airbnb reference:** Full-width hero, horizontal scroll category chips, card grid.

| Section | Mobile | Tablet | Desktop |
|---|---|---|---|
| Hero banner | Full width, stacked search | Side-by-side search fields | Large hero with overlay search |
| Category chips | Horizontal scroll, no wrap | Wrap 2 rows | Single row with arrows |
| Unique Stays cards | 1 col horizontal scroll | 2 col grid | 4 col grid |
| Top rated cards | Horizontal scroll | 2 col | 3 col |
| Testimonials | 1 col stack | 2 col | 3 col |

**Skeleton:** `UniqueStaysSkeleton` already exists — apply to all card sections.

---

### 3.2 Search Results — `pages/SearchResults.tsx`

**Zomato reference:** Filter bar pinned at top, cards fill full width on mobile.

| Section | Mobile | Tablet | Desktop |
|---|---|---|---|
| Filter bar | Horizontal scroll chips, "Filters" button opens bottom sheet | Inline filter chips | Full filter sidebar (left) |
| Sort dropdown | Full-width bottom sheet | Inline dropdown | Inline dropdown |
| Result cards | 1 col, full width | 2 col grid | 3 col grid |
| Map toggle | Floating FAB button | Tab switcher | Split view (map right) |
| Pagination | "Load more" button | "Load more" button | Page numbers |

**Skeleton:** Card skeleton — image block + 3 text lines, repeat ×6.

```tsx
// Skeleton pattern for result cards
<div className="animate-pulse">
  <div className="h-48 bg-gray-200 rounded-xl mb-3" />
  <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
  <div className="h-3 w-1/2 bg-gray-200 rounded mb-2" />
  <div className="h-4 w-1/4 bg-gray-200 rounded" />
</div>
```

---

### 3.3 Product Detail Pages

Covers: `UniqueStayDetails.tsx`, `CamperVanDetails.tsx`, `ActivityDetails.tsx`

**Airbnb reference:** Photo gallery grid, sticky booking card, tabbed sections.

| Section | Mobile | Tablet | Desktop |
|---|---|---|---|
| Photo gallery | Full-width carousel, swipe | 2-col grid, tap to expand | 5-photo Airbnb grid (1 large + 4 small) |
| Title + meta | Stacked below photos | Stacked | Inline with share/save |
| Tabs (Overview, Amenities, Reviews, Policy) | Horizontal scroll tabs | Horizontal tabs | Horizontal tabs |
| Booking card | Fixed bottom bar (price + "Book" button) | Sticky sidebar card | Sticky sidebar card (right col) |
| Reviews | 1 col stack | 2 col grid | 2 col grid |
| Map | Full width, 200px height | Full width, 300px | Inline in content flow |

**Skeleton:** `StayDetailsSkeleton` already exists in `utils/UniqueStaysSkeleton.tsx` — reuse for all 3 detail pages.

---

### 3.4 Offering / Listings — `pages/Offering.tsx`, `pages/Offers.tsx`

| Section | Mobile | Tablet | Desktop |
|---|---|---|---|
| Listing cards | 1 col | 2 col | 3–4 col |
| Filters | Bottom sheet | Inline chip row | Left sidebar |
| Card image | 16:9 ratio, full width | 16:9 | 4:3 |

**Skeleton:**
```tsx
{[...Array(6)].map((_, i) => (
  <div key={i} className="animate-pulse rounded-xl overflow-hidden">
    <div className="h-48 bg-gray-200" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-1/4" />
    </div>
  </div>
))}
```

---

### 3.5 Blogs — `pages/blogs/Blogs.tsx`, `pages/blogs/BlogDetials.tsx`

| Section | Mobile | Tablet | Desktop |
|---|---|---|---|
| Blog list | 1 col, image top | 2 col grid | 3 col grid |
| Blog detail | Full width, no sidebar | Full width | Content (70%) + sidebar (30%) |
| Related blogs | Horizontal scroll | 2 col | 3 col |

**Skeleton:** Full-width image block + paragraph lines.

---

### 3.6 Dashboard (Vendor) — `pages/Dashboard.tsx`

**Zomato restaurant dashboard reference:** Stats row, booking table, quick actions.

| Section | Mobile | Tablet | Desktop |
|---|---|---|---|
| Stats cards | 2×2 grid, compact | 4 col row | 4 col row |
| Bookings table | Card list (no table) | Condensed table | Full table with all columns |
| Chart | Full width, 200px | Full width, 250px | 60% width |
| Quick actions | Bottom FAB menu | Inline buttons | Inline buttons |

**Skeleton:** Stats card × 4 + table rows × 5.

---

### 3.7 Bookings — `pages/Bookings.tsx`, `pages/BookingDetails.tsx`

| Section | Mobile | Tablet | Desktop |
|---|---|---|---|
| Booking list | Card per booking | Table (condensed) | Full table |
| Status filter | Horizontal scroll tabs | Inline tabs | Inline tabs |
| Booking detail | Single column | Two column | Two column |
| Actions (Cancel/Confirm) | Full-width bottom buttons | Inline | Inline |

---

### 3.8 Auth Pages — `pages/Login.tsx`, `pages/Register.tsx`, `pages/VerifyOTP.tsx`

| | Mobile | Tablet | Desktop |
|---|---|---|---|
| Layout | Full screen form, no split | Centered card | Left image + right form |
| Form fields | Full width | 400px centered | 400px in right panel |
| OTP input | Large digit boxes, numeric keyboard | Same | Same |
| Google OAuth button | Full width | Full width | Full width |

---

### 3.9 Profile & Settings — `pages/Profile.tsx`, `pages/AccountSettings.tsx`

| Section | Mobile | Tablet | Desktop |
|---|---|---|---|
| Navigation | Tab bar at top | Tab bar | Left sidebar nav |
| Form fields | Full width stacked | 2 col grid | 2 col grid |
| Profile photo | Centered, tap to change | Left-aligned | Left-aligned |

---

### 3.10 Wishlist — `pages/Wishlist.tsx`

| | Mobile | Tablet | Desktop |
|---|---|---|---|
| Cards | 1 col | 2 col | 3–4 col |

**Skeleton:** Same as search result cards.

---

### 3.11 Chat — `pages/Chat.tsx`, `pages/VendorChat.tsx`

**Zomato chat reference:** Full-screen chat on mobile.

| Section | Mobile | Tablet | Desktop |
|---|---|---|---|
| Layout | Full screen (list → chat on tap) | Split: list left + chat right | Split: list left + chat right |
| Message input | Fixed at bottom, above keyboard | Fixed at bottom | Fixed at bottom |
| Back button | Visible, returns to list | Hidden | Hidden |

---

### 3.12 Onboarding — `pages/onboarding/*`

| | Mobile | Tablet | Desktop |
|---|---|---|---|
| Steps | Full screen per step, progress bar top | Centered card | Centered card (600px max) |
| File upload | Large tap area, camera option | Same | Drag & drop support |
| Navigation | Full-width Next/Back buttons | Same | Same |

---

## 4. Navigation

### Mobile (bottom nav)
```
[Home] [Search] [Wishlist] [Bookings] [Profile]
```
- Fixed at bottom
- Active state with color fill
- Already in `MobileUserNav.tsx` and `MobileVendorNav.tsx`

### Tablet & Desktop (top nav)
- Already in `Header.tsx` / `AirbnbHeader.tsx`
- Sticky on scroll

---

## 5. Skeleton Shimmer System

### Existing skeletons (already built)
| Component | Location | Used on |
|---|---|---|
| `Skeleton` (base) | `components/ui/skeleton.tsx` | All skeletons |
| `UniqueStaysSkeleton` | `utils/UniqueStaysSkeleton.tsx` | Home page cards |
| `StayDetailsSkeleton` | `utils/UniqueStaysSkeleton.tsx` | Stay detail page |

### Pages that NEED skeletons added

| Page | Skeleton needed |
|---|---|
| `SearchResults.tsx` | Result card skeleton ×6 |
| `Blogs.tsx` | Blog card skeleton ×6 |
| `BlogDetials.tsx` | Article skeleton (title + paragraphs) |
| `Dashboard.tsx` | Stats card ×4 + table rows ×5 |
| `Bookings.tsx` | Booking row skeleton ×5 |
| `Wishlist.tsx` | Card skeleton ×6 |
| `Offering.tsx` | Card skeleton ×6 |
| `CamperVanDetails.tsx` | Reuse `StayDetailsSkeleton` |
| `ActivityDetails.tsx` | Reuse `StayDetailsSkeleton` |
| `Profile.tsx` | Form field skeleton |
| `Notifications.tsx` | List item skeleton ×5 |

### Standard shimmer pattern
```tsx
// Use the existing Skeleton component
import { Skeleton } from "@/components/ui/skeleton";

// Card skeleton
const CardSkeleton = () => (
  <div className="animate-pulse rounded-xl overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  </div>
);

// Use in page
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
  </div>
) : (
  // real content
)}
```

---

## 6. Typography Scale (Mobile → Desktop)

| Element | Mobile | Desktop |
|---|---|---|
| Page title | `text-xl font-bold` | `text-3xl font-bold` |
| Section heading | `text-lg font-semibold` | `text-2xl font-semibold` |
| Card title | `text-sm font-medium` | `text-base font-medium` |
| Body text | `text-sm` | `text-base` |
| Caption / meta | `text-xs text-gray-500` | `text-sm text-gray-500` |
| Price | `text-base font-bold` | `text-lg font-bold` |

---

## 7. Spacing & Layout Rules

- Page horizontal padding: `px-4 md:px-6 lg:px-10`
- Max content width: `max-w-7xl mx-auto`
- Card gap: `gap-3 md:gap-4 lg:gap-6`
- Section margin: `mb-8 md:mb-12`
- Bottom padding on mobile (for fixed nav): `pb-20 md:pb-0`

---

## 8. Airbnb-style Card Rules

```
- Rounded corners   : rounded-xl
- Shadow            : shadow-sm hover:shadow-md transition
- Image ratio       : aspect-video (16:9) or aspect-square
- Heart/save button : absolute top-3 right-3
- Image overlay     : gradient bottom for text readability
- Price display     : bold price + "/ night" in gray
- Rating            : ★ 4.8 (120) inline with title
```

---

## 9. Zomato-style Filter/Search Rules

```
- Search bar        : sticky top-0 z-50 on scroll
- Filter chips      : horizontal scroll on mobile, no wrap
- Active filter     : filled background (brand color)
- Clear all         : text button at end of chip row
- Results count     : "124 stays found" below filter bar
- Sort options      : bottom sheet on mobile, dropdown on desktop
```

---

## 10. Color & Theme

| Token | Value | Usage |
|---|---|---|
| Primary | `#FF385C` (Airbnb red) or brand color | CTAs, active states |
| Surface | `#FFFFFF` | Cards, modals |
| Background | `#F7F7F7` | Page background |
| Text primary | `#222222` | Headings |
| Text secondary | `#717171` | Subtitles, meta |
| Border | `#DDDDDD` | Dividers, input borders |
| Skeleton | `#E5E7EB` (gray-200) | Shimmer base |

---

## 11. Implementation Priority Order

1. **Skeleton loaders** on all missing pages (highest impact on perceived performance)
2. **Mobile bottom nav** — verify `MobileUserNav` / `MobileVendorNav` are shown correctly
3. **Search Results page** — filter bottom sheet on mobile
4. **Product detail pages** — sticky booking card on mobile (fixed bottom bar)
5. **Home page** — hero search responsiveness
6. **Dashboard** — table → card list on mobile
7. **Chat** — full-screen on mobile
8. **Remaining pages** — typography and spacing polish
