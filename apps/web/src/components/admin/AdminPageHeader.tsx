import React from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Optional record count rendered as a subtle pill next to the title. */
  count?: number;
  /** Right-aligned actions — primary buttons, export, etc. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * In-content card sub-header for management/list pages — the title + count +
 * actions strip that sits at the top of a white content card.
 *
 * Distinct from the sticky `AdminHeader` (the app top bar). Do NOT pass the
 * same title to both: AdminLayout's `title` drives the breadcrumb/page H1, while
 * this drives the card-level header. Wrap this as the first child inside a
 * `bg-app-surface rounded-[10px]` card (themes for both admin and vendor).
 */
export function AdminPageHeader({
  title,
  description,
  count,
  actions,
  className = "",
}: AdminPageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-3 px-5 pt-4 pb-3.5 border-b border-app-border sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {/* Matches PanelHead in the shared kit: 14.5px bold title, 12.5px
              blurb. The old 18px/13px pairing made every list card shout. */}
          <h2 className="text-[14.5px] font-bold tracking-[-0.01em] text-app-fg truncate">
            {title}
          </h2>
          {typeof count === "number" && (
            <span className="shrink-0 grid place-items-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-app-surface-2 text-[10.5px] font-bold tabular-nums text-app-fg-muted">
              {count.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        {description && <p className="mt-0.5 text-[12.5px] text-app-fg-muted">{description}</p>}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export default AdminPageHeader;
