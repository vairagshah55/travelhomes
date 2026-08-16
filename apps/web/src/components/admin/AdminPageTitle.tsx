import React from "react";
import { PAGE_CONTAINER } from "./adminUI";

/**
 * The page header BAND — a white strip that runs edge to edge under the top
 * bar, carrying title, description, actions and (optionally) the page's tab
 * strip.
 *
 * It is deliberately full-bleed rather than another rounded card. Previously
 * the title floated on the grey page above a card that held everything else,
 * which gave the page no anchor: every element was the same white rounded
 * rectangle and nothing announced "this is the top". A flush band with a
 * hairline base reads as structure, and it lets the tab strip sit ON the band,
 * so switching tabs clearly swaps the content below rather than changing
 * something inside a card.
 *
 * The breadcrumb moved to the top bar (AdminHeader). It is location chrome —
 * the same class of thing as the search and account controls — and drawing it
 * here as well meant nested routes rendered the trail twice, ~20px apart.
 */

interface AdminPageTitleProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Tab strip rendered flush with the band's bottom edge. */
  tabs?: React.ReactNode;
}

export default function AdminPageTitle({ title, subtitle, actions, tabs }: AdminPageTitleProps) {
  return (
    <header className="bg-app-surface border-b border-app-border">
      <div className={`${PAGE_CONTAINER} px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0">
            {/* 30px and tight. The old 22–27px title was barely heavier than a
                card heading, which is why nothing on the page felt like the
                top of it. */}
            <h1 className="text-[26px] sm:text-[30px] font-bold text-app-fg tracking-[-0.028em] leading-[1.1]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-app-fg-muted max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2 shrink-0 sm:pt-1">{actions}</div>
          )}
        </div>

        {/* Tabs hang off the band's bottom edge: -mb-px lets the active
            underline sit exactly on the band's border rather than above it. */}
        {tabs && <div className="mt-4 sm:mt-5 -mb-px">{tabs}</div>}
        {!tabs && <div className="h-5 sm:h-6" />}
      </div>
    </header>
  );
}
