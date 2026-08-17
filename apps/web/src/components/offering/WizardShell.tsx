import React from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ACTIVE_PILL,
  BTN_NEUTRAL,
  BTN_PRIMARY,
  BTN_RAW,
  INSET,
  PANEL,
  PANEL_FOOTER,
} from "@/components/shared";

/** Re-exported so the wizard pages keep one import surface. */
export { SubPanel } from "@/components/shared";
import { cn } from "@/lib/utils";

/* ── Shared shell for the offering wizards ────────────────────────────────────
   /offering/add and /offering/:id/edit are the same flow with a different
   starting point, so the rail, the footer and the step-body primitives live
   here rather than in either page.

   Deliberately NOT reusing `components/offering/ui.tsx` (SectionCard /
   FeaturePill / StyledInput): that module is shared with the PUBLIC onboarding
   flows, where `th-brand` is the navy site brand — restyling it to console teal
   would repaint those pages too.                                             */

export type WizardStep = {
  key: string;
  /** Rail label. */
  label: string;
  /** Mobile chip label. */
  short: string;
  icon: LucideIcon;
  /** Panel heading. */
  title: string;
  blurb: string;
};

/* ── Left rail: where you are, how far there is to go ─────────────────────── */

export const WizardRail = ({
  steps,
  current,
  onJump,
  title,
  subtitle,
  exitLabel,
  onExit,
  pillId,
}: {
  steps: WizardStep[];
  current: number;
  onJump: (index: number) => void;
  title: string;
  subtitle?: string;
  exitLabel: string;
  onExit: () => void;
  /** Unique per page — two live rails sharing a layoutId fight over the pill. */
  pillId: string;
}) => {
  const StepIcon = steps[current].icon;

  return (
    <aside className="lg:sticky lg:top-4 self-start space-y-3">
      <div className={cn(PANEL, "p-4")}>
        <div className="flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-full bg-brand/[0.1] text-brand shrink-0">
            <StepIcon size={18} strokeWidth={2.1} />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-foreground truncate">{title}</p>
            <p className="mt-0.5 text-[11.5px] tabular-nums text-muted-foreground">
              {subtitle ? `${subtitle} · ` : ""}Step {current + 1} of {steps.length}
            </p>
          </div>
        </div>

        <div
          className="mt-3.5 h-1.5 rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={current + 1}
        >
          <motion.span
            className="block h-full rounded-full bg-brand"
            initial={false}
            animate={{ width: `${((current + 1) / steps.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 220, damping: 30 }}
          />
        </div>

        <button
          type="button"
          onClick={onExit}
          className="mt-3 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          {exitLabel}
        </button>
      </div>

      {/* Desktop rail */}
      <nav
        role="tablist"
        aria-label="Steps"
        className={cn(PANEL, "hidden lg:flex flex-col gap-0.5 p-2")}
      >
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          // Jumping back is safe; jumping forward would skip validation.
          const reachable = i <= current;
          return (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={!reachable}
              onClick={() => reachable && onJump(i)}
              className={cn(
                "group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left",
                "outline-none transition-colors duration-150",
                "focus-visible:ring-2 focus-visible:ring-brand/40",
                !active && reachable && "hover:bg-muted/70 dark:hover:bg-white/[0.04]",
                !reachable && "cursor-default",
              )}
            >
              {active && (
                <motion.span
                  layoutId={pillId}
                  className={ACTIVE_PILL}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className={cn(
                  "relative grid place-items-center w-7 h-7 rounded-full shrink-0",
                  "text-[11px] font-bold tabular-nums transition-colors duration-150",
                  active
                    ? "bg-brand text-brand-fg"
                    : done
                      ? "bg-brand/15 text-brand"
                      : "bg-muted text-muted-foreground/70",
                )}
              >
                {done ? <Check size={13} strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "relative min-w-0 text-[13.5px] font-semibold leading-5 truncate",
                  active ? "text-brand" : done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Mobile strip — no sliding pill, so the two rails never share a layoutId */}
      <div
        role="tablist"
        aria-label="Steps"
        className="lg:hidden flex items-center gap-1 p-1 overflow-x-auto scrollbar-hide bg-card border border-border rounded-[10px] shadow-[0_1px_2px_rgba(18,25,38,0.04)]"
      >
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const reachable = i <= current;
          return (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={!reachable}
              onClick={() => reachable && onJump(i)}
              className={cn(
                "flex items-center gap-1.5 h-10 px-3 rounded-xl whitespace-nowrap shrink-0",
                "text-[12.5px] font-semibold transition-colors duration-150 outline-none",
                "focus-visible:ring-2 focus-visible:ring-brand/40",
                active
                  ? "bg-brand/[0.09] text-brand"
                  : done
                    ? "text-foreground"
                    : "text-muted-foreground/70",
              )}
            >
              <span
                className={cn(
                  "grid place-items-center w-5 h-5 rounded-full text-[10px] font-bold tabular-nums",
                  active
                    ? "bg-brand text-brand-fg"
                    : done
                      ? "bg-brand/15 text-brand"
                      : "bg-muted text-muted-foreground/70",
                )}
              >
                {done ? <Check size={11} strokeWidth={3} /> : i + 1}
              </span>
              {s.short}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

/* ── Step navigation ──────────────────────────────────────────────────────── */

export const WizardFooter = ({
  step,
  total,
  canAdvance,
  busy,
  isLastStep,
  onBack,
  onNext,
  backLabel,
  submitLabel,
  busyLabel,
}: {
  step: number;
  total: number;
  canAdvance: boolean;
  busy: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
  backLabel: string;
  submitLabel: string;
  busyLabel: string;
}) => (
  <footer className={PANEL_FOOTER}>
    <Button variant="ghost" onClick={onBack} className={cn(BTN_RAW, BTN_NEUTRAL)}>
      <ChevronLeft size={15} strokeWidth={2.4} />
      {backLabel}
    </Button>

    {/* Says WHY the next button is dead rather than just greying it out. */}
    {!canAdvance && !busy ? (
      <p className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-medium text-amber-600 dark:text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Finish this step to continue
      </p>
    ) : (
      <p className="hidden sm:block text-[11.5px] tabular-nums text-muted-foreground">
        Step {step + 1} of {total}
      </p>
    )}

    <Button
      onClick={onNext}
      disabled={!canAdvance || busy}
      className={cn(BTN_RAW, BTN_PRIMARY, "disabled:opacity-45 disabled:shadow-none")}
    >
      {isLastStep ? (
        busy ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            {busyLabel}
          </>
        ) : (
          <>
            <Check size={15} strokeWidth={3} />
            {submitLabel}
          </>
        )
      ) : (
        <>
          Continue
          <ChevronRight size={15} strokeWidth={2.4} />
        </>
      )}
    </Button>
  </footer>
);

/* ── Step-body primitives ─────────────────────────────────────────────────── */

/** Selectable pill — features. Teal fill when on, hairline when off. */
export const FeatureChip = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-[12.5px] font-semibold",
      "outline-none transition-[background-color,border-color,box-shadow,color] duration-150",
      "focus-visible:ring-4 focus-visible:ring-brand/15",
      selected
        ? "border-brand bg-brand/[0.09] text-brand"
        : "border-border bg-card text-foreground/80 hover:border-brand/30 hover:bg-muted/60",
    )}
  >
    {label}
    {selected && <Check size={12} strokeWidth={3} />}
  </button>
);

/** Rectangular choice tile — categories. */
export const ChoiceTile = ({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={selected}
    className={cn(
      "px-3.5 py-2.5 rounded-xl border text-left text-[13px] font-semibold",
      "outline-none transition-[background-color,border-color,box-shadow,color] duration-150",
      "focus-visible:ring-4 focus-visible:ring-brand/15 disabled:opacity-50",
      selected
        ? "border-brand bg-brand/[0.07] text-brand"
        : "border-border bg-card text-foreground/80 hover:border-brand/30 hover:bg-muted/60",
    )}
  >
    {label}
  </button>
);

/** One recap block on the review step, with a jump-back action. */
export const ReviewSection = ({
  label,
  rows,
  onEdit,
}: {
  label: string;
  rows: [string, string | undefined][];
  onEdit: () => void;
}) => (
  <div className={INSET}>
    <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-muted/50 dark:bg-white/[0.02]">
      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[12px] font-semibold text-brand hover:bg-brand/[0.09] transition-colors duration-150"
      >
        <Edit2 size={11} strokeWidth={2.5} />
        Edit
      </button>
    </header>
    <dl className="divide-y divide-border">
      {rows.map(([k, v]) => {
        const empty = !v || v === "—" || v === "None";
        const missing = v === "Missing";
        return (
          <div key={k} className="flex gap-3 px-4 py-2.5">
            <dt className="w-[110px] shrink-0 text-[12.5px] text-muted-foreground">{k}</dt>
            <dd
              className={cn(
                "min-w-0 text-[13px] font-medium break-words",
                missing
                  ? "text-red-600 dark:text-red-400 font-semibold"
                  : empty
                    ? "text-muted-foreground/60"
                    : "text-foreground",
              )}
            >
              {v || "—"}
            </dd>
          </div>
        );
      })}
    </dl>
  </div>
);

/** Submit-failure banner. Uses the kit's ALERT geometry and a lucide glyph —
    the hand-inlined circle-exclamation SVG this carried was the only icon in
    the console not drawn from the one icon set. */
export const WizardError = ({ message }: { message: string }) => (
  <div
    role="alert"
    className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10"
  >
    <AlertCircle
      size={15}
      strokeWidth={2.2}
      aria-hidden
      className="mt-px shrink-0 text-red-600 dark:text-red-400"
    />
    <p className="text-[12.5px] font-semibold leading-relaxed text-red-700 dark:text-red-300">
      {message}
    </p>
  </div>
);
