import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Shared primitives for the public marketing pages (/about, /contact,
 * /hostwithus, /blogs).
 *
 * Why this file exists: those four pages had drifted into four separate visual
 * languages — About/Contact/Hostwithus hand-rolled hex values (`#3BD9DA`,
 * `#979797`) with `shadow`/`rounded-lg` cards, while Blogs had already been
 * rebuilt on the `th-*` tokens. Rather than add a fifth dialect, everything
 * below is token-only and all four pages consume it.
 *
 * Follows CONVENTIONS.md: `th-*` tokens, Tailwind classes, CSS-driven hover.
 *
 * ── Two rules that are easy to break here ──────────────────────────────────
 *
 * 1. `--th-brand` is the logo cyan (#3bd9da). It is a FILL, never ink on a light
 *    surface: cyan-as-text on white measures ~1.7:1, far under the WCAG AA
 *    floor. For accent *text* on light surfaces use `text-th-accent` (#128086,
 *    ~4.9:1). On the ink panels (`bg-th-text-primary`, #0a1c1c) cyan flips to
 *    being the high-contrast choice (~14:1) and `text-th-logo` is right there.
 *
 * 2. No `/nn` opacity modifiers on `th-*` classes. The tokens are raw hex
 *    strings behind `var()`, and Tailwind 3 silently drops the alpha — the rule
 *    still emits, just at full opacity, so it fails *invisibly*. Translucency
 *    on the ink panels therefore uses plain `white/nn`, which is a real Tailwind
 *    colour and does support the modifier. See CONVENTIONS.md Rule 3.
 */

/* ── Layout ──────────────────────────────────────────────────────────────── */

/** Shared measure. Matches /blogs so the four pages line up column-for-column. */
export const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6";

/** Vertical rhythm for a top-level band. Large screens are meant to breathe. */
export const SECTION_Y = "py-16 sm:py-20 md:py-24 lg:py-28";

export const SiteSection = ({
  children,
  className,
  tone = "light",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  /** `ink` is the #0a1c1c panel the footer also sits on. */
  tone?: "light" | "raised" | "ink";
  id?: string;
}) => (
  <section
    id={id}
    className={cn(
      SECTION_Y,
      tone === "light" && "bg-th-surface-0",
      tone === "raised" && "bg-th-surface-1",
      tone === "ink" && "bg-th-text-primary",
      className,
    )}
  >
    <div className={CONTAINER}>{children}</div>
  </section>
);

/* ── Motion ──────────────────────────────────────────────────────────────── */

/**
 * Entrance animation that cannot leave content invisible.
 *
 * ── Why it's mount-triggered, not scroll-triggered ────────────────────────
 * Two earlier attempts at a scroll reveal both ended with whole sections
 * permanently at `opacity: 0`, which is far worse than having no animation:
 *
 *   1. Tagging the wrapper `data-animate` collided with the global protocol in
 *      `animations.css:1` — `.th-motion-ready [data-animate] { opacity: 0 }`,
 *      revealed only by a `data-animate-in="true"` that a different controller
 *      owns. Three bands of /about rendered as empty white space.
 *   2. An IntersectionObserver gating an `opacity-0` base class then left
 *      several sections hidden anyway when the callback didn't fire for them.
 *
 * /blogs already carries a comment about the same class of bug. So visibility
 * is no longer conditional on anything: `animate-th-fade-up` runs once on mount
 * with `both` fill, and the keyframe itself supplies the starting `opacity: 0`.
 * There is no hidden resting state to get stuck in — under
 * `prefers-reduced-motion` the `motion-safe:` prefix drops the animation and the
 * element is simply, immediately visible.
 *
 * The trade-off is honest: an element far below the fold plays its entrance
 * before it's scrolled to. That costs a little choreography and buys content
 * that always renders.
 */
export const Reveal = ({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Stagger in ms. Kept short — long chains read as jank, not polish. */
  delay?: number;
  className?: string;
}) => (
  <div
    style={delay ? { animationDelay: `${delay}ms` } : undefined}
    className={cn("motion-safe:animate-th-fade-up", className)}
  >
    {children}
  </div>
);

/* ── Type ────────────────────────────────────────────────────────────────── */

/** Small tracked-out label. */
export const Eyebrow = ({
  children,
  tone = "light",
  className,
}: {
  children: React.ReactNode;
  tone?: "light" | "ink";
  className?: string;
}) => (
  <p
    className={cn(
      "inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.16em]",
      tone === "ink" ? "text-th-logo" : "text-th-accent",
      className,
    )}
  >
    <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-th-logo" />
    {children}
  </p>
);

/**
 * Section opener. `font-display` is DM Serif Display — the editorial voice that
 * separates these pages from the all-Inter-bold look they had. Hierarchy comes
 * from weight, measure and leading rather than from ever-larger type.
 */
export const SectionHead = ({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "light",
  as: Tag = "h2",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  tone?: "light" | "ink";
  as?: "h1" | "h2";
  className?: string;
}) => (
  <div
    className={cn("flex flex-col gap-4", align === "center" && "items-center text-center", className)}
  >
    {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
    <Tag
      className={cn(
        "font-display text-[30px] leading-[1.12] tracking-[-0.02em] sm:text-[38px] md:text-[44px]",
        tone === "ink" ? "text-th-text-inverse" : "text-th-text-primary",
      )}
    >
      {title}
    </Tag>
    {lead && (
      <p
        className={cn(
          "max-w-2xl text-[15px] leading-relaxed sm:text-[16.5px]",
          align === "center" && "mx-auto",
          tone === "ink" ? "text-white/70" : "text-th-text-muted",
        )}
      >
        {lead}
      </p>
    )}
  </div>
);

/** Hairline. Rules instead of card borders are most of what stops these pages
    reading as a stack of boxes. */
export const Rule = ({
  tone = "light",
  className,
}: {
  tone?: "light" | "ink";
  className?: string;
}) => (
  <hr
    className={cn("border-0 border-t", tone === "ink" ? "border-white/10" : "border-th-border", className)}
  />
);

/* ── Actions ─────────────────────────────────────────────────────────────── */

const actionBase =
  "group inline-flex h-12 items-center justify-center gap-2 rounded-th-full px-6 text-[14.5px] font-semibold outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-th-out focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)] disabled:pointer-events-none disabled:opacity-60 motion-safe:hover:-translate-y-0.5";

const actionTone = {
  /* Cyan fill carrying white — the product's accepted brand pairing, matching
     the header CTA and the footer Subscribe button. */
  primary: "bg-th-brand text-th-brand-fg shadow-th-sm hover:bg-th-brand-hover hover:shadow-th-md",
  /* Ink fill, for when cyan would be the third cyan thing in one viewport. */
  ink: "bg-th-text-primary text-th-text-inverse hover:bg-th-text-secondary",
  outline:
    "border border-th-border-hover bg-th-surface-0 text-th-text-primary hover:border-th-text-primary",
  /* On ink panels. */
  inverse: "bg-th-surface-0 text-th-text-primary hover:bg-th-surface-1",
  ghostInverse: "border border-white/25 text-th-text-inverse hover:border-white/60 hover:bg-white/5",
} as const;

type ActionTone = keyof typeof actionTone;

const Arrow = () => (
  <ArrowRight
    size={16}
    strokeWidth={2.4}
    aria-hidden
    className="transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
  />
);

/** Router link styled as a button. */
export const ActionLink = ({
  to,
  children,
  tone = "primary",
  className,
  withArrow,
}: {
  to: string;
  children: React.ReactNode;
  tone?: ActionTone;
  className?: string;
  withArrow?: boolean;
}) => (
  <Link to={to} className={cn(actionBase, actionTone[tone], className)}>
    {children}
    {withArrow && <Arrow />}
  </Link>
);

export const ActionButton = ({
  children,
  tone = "primary",
  className,
  withArrow,
  ...rest
}: {
  children: React.ReactNode;
  tone?: ActionTone;
  withArrow?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...rest} className={cn(actionBase, actionTone[tone], className)}>
    {children}
    {withArrow && <Arrow />}
  </button>
);

/* ── Data display ────────────────────────────────────────────────────────── */

/** A single figure + caption. Tabular numerals so a row of them aligns. */
export const StatFigure = ({
  value,
  label,
  tone = "light",
}: {
  value: string;
  label: string;
  tone?: "light" | "ink";
}) => (
  <div className="flex flex-col gap-1.5">
    <span
      className={cn(
        "font-display text-[30px] leading-none tabular-nums sm:text-[38px]",
        tone === "ink" ? "text-th-logo" : "text-th-text-primary",
      )}
    >
      {value}
    </span>
    <span className={cn("text-[13px] leading-snug", tone === "ink" ? "text-white/65" : "text-th-text-muted")}>
      {label}
    </span>
  </div>
);

/* ── FAQ ─────────────────────────────────────────────────────────────────── */

/**
 * Accordion over real CMS FAQs, for /contact and /hostwithus.
 *
 * `<details>`/`<summary>` rather than the `useState` + `onClick`-on-a-`<div>`
 * pattern the old FAQItem used: that version was unreachable by keyboard and
 * invisible to screen readers. This one gets focus, Enter/Space and the correct
 * expanded announcement from the platform, with no JS at all.
 *
 * Not `components/FAQSection.tsx` — that one ships hundreds of lines of
 * hardcoded sample answers (MPG figures, dollar deposits, AMGA certifications)
 * and is off the token system.
 */
export const FaqList = ({
  items,
}: {
  items: { _id?: string; question: string; answer?: string }[];
}) => (
  <div className="divide-y divide-th-border border-y border-th-border">
    {items.map((faq, i) => (
      <details key={faq._id ?? i} className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-5 rounded-th-sm py-5 outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)] [&::-webkit-details-marker]:hidden">
          <span className="text-[15px] font-semibold leading-snug text-th-text-primary transition-colors duration-150 group-hover:text-th-accent group-open:text-th-accent sm:text-[16px]">
            {faq.question}
          </span>
          <span
            aria-hidden
            className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-th-border text-th-text-muted transition-[transform,border-color,color] duration-200 ease-th-out group-open:rotate-45 group-open:border-th-accent group-open:text-th-accent"
          >
            <Plus size={14} strokeWidth={2.6} />
          </span>
        </summary>
        {faq.answer && (
          <p className="max-w-3xl pb-6 text-[14.5px] leading-relaxed text-th-text-muted">
            {faq.answer}
          </p>
        )}
      </details>
    ))}
  </div>
);

/* ── Loading ─────────────────────────────────────────────────────────────── */

/**
 * Shimmer surface. `animate-th-shimmer` slides background-position, so the
 * gradient is what actually moves — a flat background would animate nothing.
 * `motion-safe:` keeps it still for reduced-motion users while the block still
 * holds its space in the layout.
 */
export const Shimmer = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn(
      "bg-th-surface-2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] bg-[length:400px_100%] bg-no-repeat",
      "motion-safe:animate-th-shimmer",
      className,
    )}
  />
);

/** Text-line placeholder. `w`/`h` are Tailwind classes so lines can be ragged. */
export const SkelLine = ({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) => (
  <Shimmer className={cn("rounded-th-sm", w, h)} />
);

/* ── States ──────────────────────────────────────────────────────────────── */

/**
 * Empty / error state. The copy is the user's language only — no fetch status,
 * HTTP code or error object is ever passed in, by design.
 */
export const Notice = ({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-th-2xl border border-dashed border-th-border bg-th-surface-1 px-6 py-16 text-center",
      className,
    )}
  >
    <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-th-accent-subtle text-th-accent">
      <Icon size={22} strokeWidth={2} aria-hidden />
    </span>
    <h3 className="text-[16px] font-bold text-th-text-primary">{title}</h3>
    <p className="mx-auto mt-1.5 max-w-md text-[13.5px] leading-relaxed text-th-text-muted">{body}</p>
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

/** The retry affordance that pairs with `Notice`. */
export const RetryButton = ({ onClick, busy }: { onClick: () => void; busy?: boolean }) => (
  <ActionButton type="button" onClick={onClick} disabled={busy} className="h-10 px-5 text-[13.5px]">
    <RefreshCw size={15} aria-hidden className={cn(busy && "motion-safe:animate-spin")} />
    {busy ? "Retrying…" : "Try again"}
  </ActionButton>
);
