# apps/web — Unified Travel Homes app

The merged home for everything that used to live in `Frontend/` and `Admin/`.
This directory was scaffolded during **Phase 2** of the merge plan
(see `MIGRATION.md` at the repo root).

## Status

| Phase | What | Status |
|-------|------|--------|
| 2 | Scaffold structure, configs, brand theming | ✅ Done |
| 3 | Migrate Frontend (public + vendor) into route groups | ⏳ Pending |
| 4 | Migrate Admin into `(admin)` route group | ⏳ Pending |
| 5 | Delete `Frontend/`, `Admin/`, update root scripts | ⏳ Pending |

Until Phases 3-5 land, this app builds and runs but only shows placeholder
pages. The real apps in `Frontend/` and `Admin/` continue to work unchanged.

## Structure

```
src/
├── app/                       App entry (App.tsx, layout wiring)
├── routes/
│   ├── (public)/              Public routes (Index, search, listings)
│   ├── (vendor)/              Vendor dashboard routes
│   └── (admin)/               Admin panel routes
├── features/                  Feature-first folders (booking/, offering/, …)
├── components/
│   ├── ui/                    shadcn primitives (one source)
│   ├── shared/                Cross-feature components (StatusBadge, TabStrip, …)
│   └── layout/                Layout shells (PublicLayout, VendorLayout, AdminLayout)
├── lib/                       API clients, utils
├── hooks/                     Cross-feature React hooks
├── types/                     Cross-feature TS types
├── styles/
│   └── globals.css            Tailwind base + brand CSS variables
└── config/                    App-level config (env, constants)
```

## Brand theming

One Tailwind config, two brand identities resolved via CSS variables:

```tsx
// Frontend brand (default at :root) — coral primary
<button className="bg-brand">Search</button>  // → #FF385C

// Admin brand — scope swap at the (admin) layout
<div data-brand="admin">
  <button className="bg-brand">Save</button>  // → #185FA5
</div>
```

No component file knows which brand it's in. Brand divergence stops being
a file-fork problem and becomes a route-group concern.

## Dev / build

```bash
cd apps/web
npm install
npm run dev      # http://localhost:8080
npm run build
```

## Path aliases

`@/*` → `./src/*`

Examples:
- `@/components/ui/button`
- `@/features/booking/api`
- `@/lib/utils`
- `@/hooks/useAuth`
