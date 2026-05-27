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
export function AdminPageHeader({ title, description, count, actions, className = "" }: AdminPageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-3 px-6 py-5 border-b border-app-border sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[18px] font-bold text-app-fg truncate">{title}</h2>
          {typeof count === "number" && (
            <span className="shrink-0 rounded-full bg-app-surface-2 px-2.5 py-0.5 text-[12px] font-semibold text-app-fg-muted">
              {count.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-[13px] text-app-fg-muted">{description}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export default AdminPageHeader;
