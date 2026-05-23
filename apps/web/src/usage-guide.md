# Dashboard Animation Usage Guide

## Shared setup

- `Frontend/client/styles/tokens.css`: blue color + motion tokens.
- `Frontend/client/styles/animations.css`: animation utilities and keyframes.
- `Frontend/client/animations.js`: runtime for observers, count-up, lazy image blur, scroll progress, header blur, parallax, and sidebar indicator.

## Core hook pattern

- Add `data-animate` to any element that should reveal in.
- Add `data-animate-item` to repeated children inside a staggered group.
- Add `data-animate-group` and `data-stagger="80"` on the parent container when children should cascade.
- Add `data-countup` to numeric text nodes for KPI animation.
- Add `data-animate-image` to images that should blur in as they load.
- Add `data-parallax="0.05"` on desktop-only card wrappers.

## Class mapping

- Property/listing card: `motion-property-card`
- Property image wrapper/image: `motion-property-image-wrap`, `motion-property-image`
- KPI/stat card: `motion-kpi-card`
- Generic surfaced panel: `motion-surface-card`
- Section reveal block: `motion-section-reveal`
- Search field wrapper/input: `motion-search-field`, `motion-search-input`
- Select trigger/dropdown: `motion-filter-trigger`, `motion-dropdown-surface`
- Sidebar shell/nav/item/link/icon/label: `motion-sidebar-shell`, `motion-sidebar-nav`, `motion-sidebar-item`, `motion-sidebar-link`, `motion-sidebar-icon`, `motion-sidebar-label`
- Sidebar active pill: include a child `.motion-sidebar-indicator` inside the `motion-sidebar-nav`
- Table row: `motion-table-row`
- Pending/confirmed badge: `motion-badge-pending`, `motion-badge-confirmed`
- Calendar shell/month/date/booking: `motion-calendar-shell`, `motion-calendar-month`, `motion-calendar-date`, `motion-calendar-booking`
- Notification item + unread dot: `motion-notification-card`, `motion-unread-dot`
- Modal + drawer overlay/surface: `motion-modal-overlay`, `motion-modal-surface`, `motion-drawer-overlay`, `motion-mobile-sidebar`
- Spinner + skeleton: `motion-spinner`, `motion-skeleton`

## Page-specific notes

- Header blur on scroll: add `data-animate-header` + `motion-dashboard-header` to the sticky dashboard header.
- Sidebar active indicator: mark each item with `data-sidebar-item` and `data-active="true"` for the active route.
- Tab panel transitions: key the content container by tab value and add `motion-tab-panel`.
- Reduced motion is already enforced globally through the `prefers-reduced-motion` rule in `animations.css`.
