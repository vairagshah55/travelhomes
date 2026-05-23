You are a Senior UI/UX Designer and Figma expert with 10+ years experience 
designing travel and hospitality platforms (like Airbnb, Booking.com, Vrbo).

I am building a Travel Homes platform using Next.js + Tailwind CSS.
Design and build the UI with the following design system:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 COLOR SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIMARY (Blue — trust, ocean, sky):
  --color-sky:    #E6F1FB   ← backgrounds, hover states
  --color-mist:   #B5D4F4   ← borders, dividers
  --color-ocean:  #378ADD   ← links, icons
  --color-deep:   #185FA5   ← primary buttons, CTAs  ✅ MAIN BRAND
  --color-navy:   #042C53   ← dark headings, footer

ACCENT (Warm Sand — energy, warmth):
  --color-sand:   #FAEEDA   ← highlight backgrounds
  --color-dune:   #EF9F27   ← ratings, icons, warm accents
  --color-rust:   #BA7517   ← hover state on warm elements

ACCENT (Teal — nature, calm):
  --color-lagoon: #E1F5EE   ← badge backgrounds
  --color-palm:   #1D9E75   ← success, superhost badge
  --color-forest: #085041   ← dark teal text

NEUTRALS:
  --color-linen:    #F1EFE8  ← page background
  --color-pebble:   #D3D1C7  ← borders
  --color-slate:    #888780  ← muted text
  --color-charcoal: #2C2C2A  ← body text

WHITE / SURFACE: #FFFFFF
ERROR: #E24B4A  |  SUCCESS: #1D9E75  |  WARNING: #EF9F27

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔤 TYPOGRAPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Heading font:  'DM Serif Display' (Google Fonts) — for H1, hero text
Body font:     'Inter' (Google Fonts) — for all UI text
Mono font:     'JetBrains Mono' — for prices, codes

Scale:
  H1:      32–40px / weight 400 / DM Serif / color: #042C53
  H2:      24px    / weight 500 / Inter    / color: #1a1a1a
  H3:      18px    / weight 500 / Inter    / color: #1a1a1a
  Body:    15px    / weight 400 / Inter    / color: #2C2C2A
  Caption: 13px    / weight 400 / Inter    / color: #888780
  Price:   22px    / weight 600 / Inter    / color: #185FA5
  Label:   11px    / weight 500 / Inter    / UPPERCASE / letter-spacing: 0.08em

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 SPACING & LAYOUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Border radius:
  Button / Badge / Input: 8px
  Card:                   12px
  Image container:        16px
  Full pill:              999px

Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px
Container max-width: 1280px, padding: 0 24px
Grid: 12-column, gap: 24px

Shadows:
  Card hover:  0 4px 20px rgba(24, 95, 165, 0.10)
  Dropdown:    0 8px 24px rgba(0,0,0,0.08)
  No heavy shadows — keep it airy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧩 COMPONENTS TO BUILD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Make each as a reusable Next.js + Tailwind component:

1. PropertyCard       — image, title, location, rating, price/night, badges
2. SearchBar          — location, check-in, check-out, guests, search button
3. FilterChips        — scrollable horizontal chips (Ocean view, Pool, Pet friendly...)
4. PriceTag           — ₹ price with /night, strikethrough for discount
5. RatingBadge        — ★ 4.92 (28 reviews) format
6. Superhost Badge    — teal pill with shield icon
7. WishlistButton     — heart icon toggle, filled/outline state
8. ImageGallery       — 1 large + 4 thumbnails grid, "Show all photos" overlay
9. AmenitiesGrid      — icon + label grid (WiFi, Kitchen, Pool, Parking...)
10. BookingWidget     — sticky sidebar: price, date picker, guest count, Book button
11. HostCard          — avatar, name, "Hosted since", response rate
12. ReviewCard        — avatar, name, date, star rating, review text
13. MapPin            — custom map marker with price bubble
14. NavBar            — logo, search, login, profile
15. Footer            — links, logo, copyright

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DESIGN PRINCIPLES TO FOLLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Whitespace first: breathable layouts, never crowded
- Mobile-first: design for 375px → 768px → 1280px
- Image-led: large, high-quality images drive trust
- Clear CTAs: "Book now" always in #185FA5 deep blue
- Accessible: WCAG AA contrast ratios minimum
- Micro-interactions: hover scale on cards (scale-105), 
  smooth transitions (200ms ease), button active states
- No dark mode needed initially — focus on light, airy feel
- Icons: use Heroicons or Lucide (already in Next.js ecosystem)