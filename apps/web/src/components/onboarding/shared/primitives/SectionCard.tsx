import React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  // Whether the card's body is rendered with a default vertical-gap wrapper.
  // Used by shared/* steps which historically wrap children in `flex flex-col gap-4`.
  bodyGap?: boolean;
  // Marks the whole section as mandatory. Needed where the requirement belongs
  // to the section rather than to one labelled input — a cover photo, a photo
  // gallery minimum, "at least one house rule" — so those cards can carry the
  // same red asterisk `Field` puts on required inputs instead of the host only
  // discovering the rule when Continue refuses to advance.
  required?: boolean;
}

/**
 * One content block of a step. White surface on the warm page, hairline border,
 * and a single soft shadow that does the lifting — the depth comes from the
 * surface/page contrast, not from a heavy drop shadow on every card.
 */
const SectionCard: React.FC<SectionCardProps> = ({
  icon,
  title,
  subtitle,
  action,
  children,
  bodyGap,
  required,
}) => (
  <section
    className={cn(
      "bg-th-surface-0 border border-[color:var(--onb-card-border)] rounded-[18px]",
      "px-5 sm:px-6 pt-5 pb-6",
      "shadow-[var(--onb-card-shadow)]",
    )}
  >
    <header
      className={cn(
        "flex justify-between gap-3 mb-5",
        action ? "items-start sm:items-center" : "items-center",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "w-[42px] h-[42px] rounded-[12px] shrink-0 flex items-center justify-center",
            "bg-th-brand-soft border border-th-brand-border-soft",
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-th-text-primary tracking-[-0.015em] leading-tight">
            {title}
            {required && (
              <>
                <span aria-hidden="true" className="text-th-error-bright ml-[3px]">
                  *
                </span>
                {/* Matches Field: the asterisk alone is colour-only signalling. */}
                <span className="sr-only"> (required)</span>
              </>
            )}
          </h2>
          {subtitle && (
            <p className="text-[12.5px] text-[color:var(--onb-text-secondary,#657477)] mt-0.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </header>
    {bodyGap ? <div className="flex flex-col gap-4">{children}</div> : children}
  </section>
);

export default SectionCard;
