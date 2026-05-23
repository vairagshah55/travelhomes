You are a Senior Next.js Engineer and UI/UX Designer rebuilding a 
Super Admin Dashboard for a Travel Homes platform. The current UI 
looks plain and feels zoomed-in (120% scale problem). 

CRITICAL RULE: Preserve ALL existing functionality, API calls, 
state management, and data flow exactly as-is. You are ONLY 
improving the visual layer — layout, spacing, typography, colors, 
components. Do NOT break any working logic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ROOT CAUSE FIX — THE 120% ZOOM PROBLEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The "feels like 120% zoom" problem is caused by:
1. Font sizes too large (fix: body 13-14px, not 16px in dense UIs)
2. Padding/spacing too generous on compact elements
3. No proper layout density — everything spread out
4. Missing sidebar — content fills full width

Fix ALL of these:
- Base font in admin layout: 13px
- Table cell font: 12px
- Sidebar item font: 12.5px
- Stat card values: 22-24px
- Section headers: 14px font-weight 500
- Table row height: ~36px (not 48px+)
- Sidebar width: 220px (collapsed: 60px)
- Content area padding: 20px
- Card padding: 14px 16px
- Gap between components: 14px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 LAYOUT STRUCTURE — REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use this exact layout in your admin root layout.tsx:

<div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
  <Sidebar />                          {/* 220px fixed */}
  <div className="flex flex-col flex-1 overflow-hidden">
    <TopBar />                         {/* 52px fixed height */}
    <main className="flex-1 overflow-y-auto p-5">
      {children}
    </main>
  </div>
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DESIGN TOKENS — TAILWIND CONFIG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Add to tailwind.config.ts:

colors: {
  brand: {
    50:  '#E6F1FB',
    100: '#B5D4F4',
    400: '#378ADD',
    500: '#185FA5',   // ← primary brand
    600: '#0C447C',
    900: '#042C53',
  },
  surface: {
    DEFAULT: '#ffffff',
    muted:   '#F8F9FB',
    border:  '#E8EAF0',
  }
}

fontSize: {
  'xs2': ['11px', '16px'],
  'xs':  ['12px', '18px'],
  'sm':  ['13px', '20px'],
  'base':['14px', '22px'],
  'lg':  ['16px', '24px'],
  'xl':  ['18px', '26px'],
  '2xl': ['22px', '30px'],
  '3xl': ['28px', '36px'],
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧩 COMPONENT SPECS — BUILD EACH ONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. SIDEBAR — components/admin/Sidebar.tsx

Visual spec:
- Width: 220px, collapsible to 60px (toggle button at bottom)
- Background: white / dark:zinc-900
- Right border: 1px solid #E8EAF0 / dark:zinc-800
- Logo area: 52px height, border-bottom — logo mark + "TravelHomes" + "Admin" pill
- Nav sections with uppercase 10px muted group labels
- Nav items: icon (16px) + label, 36px height, 6px border-radius
- Active item: bg-brand-50 text-brand-500 font-medium
- Hover: bg-gray-50 dark:bg-zinc-800
- Notification badges: red pill on right
- Bottom section: user avatar + name + logout

Nav sections and items:
  OVERVIEW:  Dashboard, Analytics
  MANAGE:    Properties, Users, Bookings, Reviews
  FINANCE:   Payouts, Transactions
  SYSTEM:    Settings, Notifications, Logs

Collapsed state (60px):
- Show icons only, centered
- Tooltip on hover showing label
- Logo area shows only logo mark

## 2. TOPBAR — components/admin/TopBar.tsx

Visual spec:
- Height: 52px, white bg, bottom border
- Left: Breadcrumb (Home > Section > Page) in 12px muted text
- Center: Global search bar — 320px wide, rounded-lg, 
  placeholder "Search users, properties, bookings...",
  Cmd+K hint on right
- Right: 
  • Notifications bell (badge count)
  • Theme toggle (light/dark)
  • Avatar with dropdown:
    - Profile, Settings, separator, Sign out

## 3. STAT CARDS — components/admin/StatCard.tsx

Props: { label, value, delta, deltaType, icon, iconColor, trend[] }

Visual spec:
- White card, 1px border, 10px radius, 14px 16px padding
- Top row: muted label (11px uppercase) + colored icon box (28px, 6px radius)
- Value: 24px font-weight 600
- Delta: 11px — green with ↑ for positive, red with ↓ for negative
- Optional sparkline (tiny 40px wide recharts LineChart, no axes, 
  no tooltip) in bottom-right corner

Dashboard cards:
  Total Users    | icon: Users      | blue
  Properties     | icon: Home       | teal  
  Revenue (₹)    | icon: TrendingUp | amber
  Active Bookings| icon: Calendar   | purple
  Pending Verif. | icon: AlertCircle| red
  Avg Rating     | icon: Star       | orange

Grid layout: 3 cols on lg, 2 on md, 1 on sm

## 4. DATA TABLE — components/admin/DataTable.tsx

This is the most important component — make it premium:

Features to implement:
  ✅ Column header sorting (asc/desc toggle with arrows)
  ✅ Global search input (filters rows client-side)
  ✅ Column-level filter dropdowns
  ✅ Row selection with checkboxes (+ select all)
  ✅ Bulk action toolbar (appears when rows selected): 
       Delete, Export, Change Status
  ✅ Pagination (with page size selector: 10/25/50/100)
  ✅ Row actions menu (⋯ button): View, Edit, Delete, Ban
  ✅ Status badge pills (color-coded)
  ✅ Loading skeleton (animate-pulse rows)
  ✅ Empty state (icon + message + CTA button)
  ✅ Export to CSV button

Visual spec:
- Table container: white card, border, rounded-lg, overflow-hidden
- Toolbar above table: search left, filters + export right (all in one row)
- Header row: bg-gray-50 text-xs uppercase text-gray-500 font-medium
- Body rows: 36px height, hover:bg-gray-50, border-bottom
- Font: 12.5px
- Status pills: 
    active/confirmed  → green bg + dark green text
    pending/review    → amber bg + dark amber text
    cancelled/banned  → red bg + dark red text
    inactive/draft    → gray bg + gray text
- Last column: actions menu (shadcn DropdownMenu)

## 5. PAGE HEADER — components/admin/PageHeader.tsx

Props: { title, subtitle?, actions? }

Visual spec:
- Stack: title (18px 500) above subtitle (13px muted)
- Right side: action buttons passed as children
- Bottom border OR just margin-bottom 20px
- Breadcrumb above title in 11px muted

## 6. MINI CHARTS — components/admin/MiniChart.tsx

Use recharts. Three variants:
  sparkline   → tiny LineChart, no axes, 60x32px
  bar-mini    → tiny BarChart, 4-6 bars, no axes
  donut-mini  → PieChart with innerRadius, 60x60px

## 7. QUICK STATS ROW (top of each section page)
Before the main table on each page, show a row of 3-4 
colored metric tiles relevant to that section:
  Users page:    Total / Active / Hosts / Guests
  Properties:    Total / Active / Pending / Suspended
  Bookings:      Total / Confirmed / Pending / Cancelled
  Revenue:       This Month / Last Month / Growth / Avg/Booking

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PAGES TO REBUILD (keep all data/API logic)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/admin/dashboard
  - 6 stat cards grid (2 rows × 3)
  - Two-column: Recent Users table + Recent Bookings table
  - Full-width: Top properties by revenue (horizontal bar list)
  - Activity feed (last 10 actions, right sidebar if space)

/admin/users
  - PageHeader + quick stats row
  - DataTable with: Name, Email, Role, Status, Joined, Actions
  - Filter by: Role (All/Host/Guest), Status (All/Active/Banned)

/admin/properties
  - PageHeader + quick stats row
  - DataTable with: Title, Host, Location, Price, Status, Rating, Actions
  - Filter by: Status, City, Price range

/admin/bookings
  - PageHeader + quick stats row
  - DataTable with: ID, Property, Guest, Check-in, Check-out, Amount, Status, Actions
  - Filter by: Status, Date range, Amount range

/admin/reviews
  - DataTable: Property, Guest, Rating (stars), Comment preview, Status, Actions
  - Bulk approve / bulk reject actions

/admin/payouts
  - DataTable: Host, Amount, Status, Date, Actions (Approve / Reject)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 DO NOT CHANGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- All API calls (useQuery / fetch / axios)
- All server actions
- All state management (useState, context, zustand)
- All form logic (react-hook-form, zod validation)
- All authentication / middleware
- All existing TypeScript types and interfaces
- Next.js routing structure

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ IMPLEMENTATION ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Build in this exact order:
1. tailwind.config.ts — add tokens
2. layout.tsx — shell layout
3. Sidebar.tsx — with collapse
4. TopBar.tsx — with search + dropdown
5. StatCard.tsx — with sparkline
6. DataTable.tsx — fully featured
7. PageHeader.tsx
8. Rebuild dashboard page
9. Rebuild users page
10. Rebuild remaining pages one by one