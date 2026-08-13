import React from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import LogoWebsite from "@/components/ui/LogoWebsite";

export interface OnboardingPhase {
  label: string;
  /** How many consecutive steps this phase covers. */
  steps: number;
}

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
  canProceed: boolean;
  termsAccepted?: boolean;
  onBack: () => void;
  onNext: () => void;
  children: React.ReactNode;
  // Optional side panel rendered on the right at lg+ screens. Used by listing-
  // content steps to show a live preview of how the listing will appear to guests.
  preview?: React.ReactNode;
  // Named groups for the progress rail. Their `steps` must sum to the number of
  // content steps (totalSteps - 1). Omit to get a plain unnamed bar — each flow
  // (caravan / stays / activity) supplies its own labels.
  phases?: OnboardingPhase[];
}

/**
 * Phase-grouped progress rail.
 *
 * Replaces a row of eight anonymous numbered nodes. Eight `01…08` circles spread
 * across ~1000px answered neither question a host actually has — what's coming,
 * and how much is left — and the long connectors visually out-weighed the nodes
 * themselves. Grouping steps into named phases answers both in the same vertical
 * space: the labels say *what*, the segment ticks say *where*.
 *
 * The final step is the terms/verification hand-off, so it isn't a content step —
 * `count` excludes it, matching the previous `totalSteps - 1` behaviour.
 */
const ProgressRail: React.FC<{
  current: number;
  count: number;
  phases?: OnboardingPhase[];
}> = ({ current, count, phases }) => {
  // A labels/steps mismatch would silently mis-highlight the rail, so `count`
  // stays authoritative and a bad `phases` falls back to one unnamed bar.
  const groups = React.useMemo(() => {
    const valid =
      phases?.length && phases.reduce((n, p) => n + p.steps, 0) === count
        ? phases
        : [{ label: "", steps: count }];
    let offset = 0;
    return valid.map((phase) => {
      const start = offset;
      offset += phase.steps;
      return { ...phase, start, end: offset - 1 };
    });
  }, [phases, count]);

  const activeGroup = groups.find((g) => current >= g.start && current <= g.end);

  return (
    <div className="w-full">
      {/* Phone: only the phase you're actually in earns a label. */}
      <div className="sm:hidden flex items-baseline justify-between gap-3 mb-2">
        <span className="text-[12.5px] font-bold tracking-[-0.01em] text-th-text-primary truncate">
          {activeGroup?.label || "Progress"}
        </span>
        <span className="text-[11px] font-semibold tabular-nums text-th-warm-text-muted whitespace-nowrap">
          {Math.min(current + 1, count)} / {count}
        </span>
      </div>

      <ol
        className="flex items-end gap-3 sm:gap-5 w-full"
        aria-label={`Onboarding progress — step ${Math.min(current + 1, count)} of ${count}`}
      >
        {groups.map((group) => {
          const isDone = current > group.end;
          const isActive = !!activeGroup && activeGroup.start === group.start;
          return (
            <li
              key={group.start}
              // Weighted so every segment tick is the same width regardless of
              // how many steps a phase holds — computed, so it belongs inline.
              style={{ flexGrow: group.steps, flexBasis: 0 }}
              className="min-w-0"
              aria-current={isActive ? "step" : undefined}
            >
              {group.label && (
                <div className="hidden sm:flex items-center gap-1.5 mb-2.5">
                  {isDone && (
                    <Check
                      size={11}
                      strokeWidth={3.5}
                      aria-hidden="true"
                      className="shrink-0 text-th-brand"
                    />
                  )}
                  <span
                    className={cn(
                      "text-[11.5px] tracking-[-0.005em] truncate transition-colors duration-200",
                      isActive
                        ? "font-bold text-th-text-primary"
                        : isDone
                          ? "font-semibold text-th-brand"
                          : "font-medium text-th-warm-text-muted",
                    )}
                  >
                    {group.label}
                  </span>
                </div>
              )}

              <div className="flex gap-1 h-[4px]">
                {Array.from({ length: group.steps }, (_, i) => {
                  const stepIndex = group.start + i;
                  return (
                    <span
                      key={stepIndex}
                      className={cn(
                        "flex-1 rounded-full transition-colors duration-300",
                        // Completed = teal, current = the brand cyan, so the
                        // live position pops against what's already banked.
                        stepIndex < current && "bg-th-brand",
                        stepIndex === current && "bg-[color:var(--onb-cta,#3bd9da)]",
                        stepIndex > current && "bg-th-warm-border",
                      )}
                    />
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  currentStep,
  totalSteps,
  isLoading,
  canProceed,
  termsAccepted,
  onBack,
  onNext,
  children,
  preview,
  phases,
}) => {
  const isLastStep = currentStep === totalSteps - 1;
  const contentSteps = totalSteps - 1;
  const nextDisabled = isLoading || !canProceed || (isLastStep && !termsAccepted);

  return (
    <div
      data-onboarding
      className="relative min-h-screen overflow-hidden font-sans flex flex-col bg-[color:var(--onb-page-bg,#efeeea)] text-th-text-primary"
    >
      {/* No ambient tint blobs. Depth here comes from white cards on the warm
          off-white page — a large blurred wash just reads as uneven beige, which
          is the "empty beige space" this redesign set out to remove. */}

      {/* Header */}
      <div className="onb-header">
        <LogoWebsite />
        {!isLastStep && (
          <span className="hidden sm:block text-[12px] font-semibold tracking-[0.02em] text-th-warm-text-muted">
            Step <span className="text-th-text-primary">{currentStep + 1}</span> of {contentSteps}
          </span>
        )}
      </div>

      {/* Scrollable content */}
      <div className="relative flex-1 overflow-y-auto pt-16 pb-28">
        <div className="max-w-[1120px] mx-auto w-full px-5 sm:px-6 lg:px-10 py-7 sm:py-9">
          {!isLastStep && (
            <div className="mb-8 sm:mb-10">
              <ProgressRail current={currentStep} count={contentSteps} phases={phases} />
            </div>
          )}

          <div
            key={currentStep}
            className={cn(
              "onb-fade-up",
              preview
                ? "flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_336px] lg:gap-10 lg:items-start"
                : "flex flex-col items-center",
            )}
          >
            <div className={cn("w-full min-w-0", !preview && "max-w-2xl")}>{children}</div>

            {preview && (
              <>
                {/* Desktop — sticky companion panel. */}
                <aside className="hidden lg:block lg:sticky lg:top-24">{preview}</aside>

                {/* Mobile / tablet — collapsible so it never pushes the form
                    fields below the fold on a phone. */}
                <details className="lg:hidden group rounded-[16px] border border-[color:var(--onb-card-border)] bg-th-surface-0 overflow-hidden shadow-[var(--onb-card-shadow)]">
                  <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-th-warm-text-muted">
                      Preview your listing
                    </span>
                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className="text-th-warm-text-muted transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <div className="px-5 pb-6 pt-1">{preview}</div>
                </details>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sticky footer nav */}
      <div className="onb-footer px-5 sm:px-6 lg:px-10 py-3.5">
        <div className="max-w-[1120px] mx-auto w-full flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "onb-btn-secondary h-12 px-5 sm:px-7 text-[14px] rounded-full",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--th-ring)]",
            )}
          >
            Back
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className={cn(
              "onb-btn-primary h-12 px-6 sm:px-8 text-[14px] rounded-full whitespace-nowrap",
              "inline-flex items-center gap-2",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2",
              "focus-visible:ring-[color:var(--onb-cta-ink,#0a5559)] focus-visible:ring-offset-th-surface-0",
            )}
          >
            {isLoading ? "Saving…" : isLastStep ? "Start Verification" : "Continue"}
            {!isLoading && !isLastStep && (
              <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;
