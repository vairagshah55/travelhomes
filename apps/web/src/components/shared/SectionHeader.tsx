import React from "react";
import { cn } from "@/lib/utils";

/**
 * The heading that separates two blocks on a page — one level below the page
 * title in `AdminPageTitle`, one level above a panel's own `PanelHead`.
 *
 * Pages used to open each block with a bare `<h2 className="text-lg font-semibold">`
 * spelled slightly differently every time (18px here, 16px there, sometimes
 * bold, sometimes semibold, sometimes with a description and sometimes with the
 * description inside the card below it). One definition means a vendor reading
 * down a page gets the same signal for "new section" every time.
 */
export const SectionHeader = ({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  /** Right-aligned control — a "View all" link, a period selector, a filter. */
  action?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6",
      className,
    )}
  >
    <div className="min-w-0">
      <h2 className="text-[15px] font-bold tracking-[-0.015em] text-foreground">{title}</h2>
      {description && (
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
    {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
  </div>
);

export default SectionHeader;
