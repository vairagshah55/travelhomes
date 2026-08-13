import React from "react";

interface StepHeaderProps {
  kicker: string;
  // Omit to get the compact variant: the kicker becomes the heading and the
  // display serif is dropped. Useful where the progress rail and the section
  // cards already say what the step is, and a full editorial title would be the
  // third restatement in a row.
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  // When supplied, the eyebrow reads "STEP 2 OF 8 · <kicker>". Optional so
  // existing kicker-only call sites keep working unchanged.
  step?: number;
  totalSteps?: number;
}

/**
 * Editorial step heading: quiet category label, large serif title, one short line
 * of plain-language support copy.
 *
 * Two deliberate choices:
 *
 * - Left-aligned, not centred. Centred text flanked by decorative rules reads as a
 *   marketing banner — the wrong register above a form the host has to fill in.
 * - The kicker is muted, not brand-teal, and has no leading dash. The progress rail
 *   already names the phase in colour; a second coloured eyebrow saying nearly the
 *   same thing competed with the title instead of supporting it. It now behaves as
 *   a sub-label under the rail's phase, which is the level of detail it actually adds.
 */
const StepHeader: React.FC<StepHeaderProps> = ({
  kicker,
  title,
  subtitle,
  extra,
  step,
  totalSteps,
}) => {
  const eyebrow =
    step != null && totalSteps != null ? (
      <>
        Step {step} of {totalSteps}
        <span className="mx-1.5 opacity-50">·</span>
        {kicker}
      </>
    ) : (
      kicker
    );

  // Compact variant — the kicker is promoted to the heading so the section still
  // has a real h1 and the supporting line still has something to support.
  if (!title) {
    return (
      <header className="w-full">
        <h1 className="text-[19px] font-bold text-th-text-primary tracking-[-0.02em] leading-tight">
          {kicker}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-[54ch] text-[14px] leading-[1.6] text-[color:var(--onb-text-secondary,#657477)]">
            {subtitle}
          </p>
        )}
        {extra}
      </header>
    );
  }

  return (
    <header className="w-full">
      <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-th-warm-text-muted mb-3">
        {eyebrow}
      </p>

      <h1 className="font-serif text-[clamp(30px,4.8vw,44px)] font-normal text-th-text-primary tracking-[-0.025em] leading-[1.08] text-balance">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-3.5 max-w-[46ch] text-[15px] leading-[1.65] text-[color:var(--onb-text-secondary,#657477)]">
          {subtitle}
        </p>
      )}
      {extra}
    </header>
  );
};

export default StepHeader;
