import React from "react";
import {
  ShieldCheck,
  FileText,
  UserCheck,
  Lock,
  Scale,
  AlertTriangle,
  RefreshCcw,
  Check,
} from "lucide-react";

interface TermsConditionsStepProps {
  termsAccepted: boolean;
  onTermsChange: (checked: boolean) => void;
}

// ── Terms data ──────────────────────────────────────────────────────────────

const TERMS = [
  {
    icon: UserCheck,
    title: "Accurate Information",
    text: "You must provide truthful and accurate personal & business details. Submitting false or misleading information may result in immediate account suspension or permanent ban.",
  },
  {
    icon: Lock,
    title: "Data Usage & Security",
    text: "Your personal data is encrypted and stored securely. It will only be used for identity verification and platform compliance — never sold to third parties.",
  },
  {
    icon: Scale,
    title: "Verification Rights",
    text: "TravelHomes reserves the right to approve, deny, or revoke verification if submitted information is found to be invalid, incomplete, or fraudulent.",
  },
  {
    icon: AlertTriangle,
    title: "Compliance & Liability",
    text: "You are responsible for ensuring all listings comply with local laws and regulations. TravelHomes is not liable for any legal disputes arising from inaccurate submissions.",
  },
  {
    icon: RefreshCcw,
    title: "Updates to Terms",
    text: "These terms may be updated periodically. Continued use of the platform after changes constitutes acceptance of the revised terms.",
  },
];

// ── Main component ──────────────────────────────────────────────────────────

const TermsConditionsStep: React.FC<TermsConditionsStepProps> = ({
  termsAccepted,
  onTermsChange,
}) => {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="onb-fade-up text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-ds-sky flex items-center justify-center">
          <FileText size={22} className="text-ds-deep" />
        </div>
        <div className="space-y-1">
          <h1 className="font-serif text-[28px] lg:text-[34px] font-normal text-ds-navy leading-tight tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-ds-slate max-w-md mx-auto">
            Please review and accept before completing verification
          </p>
        </div>
      </div>

      {/* ── Terms Card ─────────────────────────────────────────────── */}
      <div
        className="onb-fade-up w-full rounded-2xl border border-ds-pebble bg-white overflow-hidden"
        style={{ animationDelay: "60ms" }}
      >
        {/* Card header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-ds-pebble bg-ds-linen/40">
          <div className="w-7 h-7 rounded-lg bg-ds-sky flex items-center justify-center text-ds-deep">
            <ShieldCheck size={14} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-ds-slate">
            Verification Agreement
          </span>
        </div>

        {/* Intro */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-sm text-ds-slate leading-relaxed">
            By proceeding with verification on{" "}
            <span className="font-semibold text-ds-navy">TravelHomes</span>, you agree to the
            following:
          </p>
        </div>

        {/* Terms list */}
        <div className="px-5 pb-5 flex flex-col gap-1">
          {TERMS.map((term, idx) => (
            <div
              key={idx}
              className="onb-fade-up flex gap-3.5 p-3.5 rounded-xl hover:bg-ds-linen/40 transition-colors"
              style={{ animationDelay: `${120 + idx * 60}ms` }}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-ds-linen flex items-center justify-center mt-0.5">
                <term.icon size={15} className="text-ds-slate" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ds-charcoal leading-snug">
                  {idx + 1}. {term.title}
                </p>
                <p className="text-[13px] text-ds-slate leading-relaxed mt-0.5">{term.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Accept Checkbox ────────────────────────────────────────── */}
      <div className="onb-fade-up w-full" style={{ animationDelay: "420ms" }}>
        <button
          type="button"
          onClick={() => onTermsChange(!termsAccepted)}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
            termsAccepted
              ? "border-ds-deep bg-ds-sky"
              : "border-ds-pebble bg-white hover:border-ds-deep/60"
          }`}
        >
          {/* Checkbox */}
          <div
            className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
              termsAccepted ? "border-ds-deep bg-ds-deep" : "border-ds-pebble bg-white"
            }`}
          >
            {termsAccepted && <Check size={13} className="text-white" strokeWidth={3} />}
          </div>

          {/* Label */}
          <div className="flex-1 text-left">
            <p
              className={`text-sm font-semibold transition-colors ${
                termsAccepted ? "text-ds-navy" : "text-ds-charcoal"
              }`}
            >
              I accept the Terms &amp; Conditions
            </p>
            <p className="text-xs text-ds-slate mt-0.5">
              You must accept to proceed with the verification process
            </p>
          </div>

          {/* Status badge */}
          {termsAccepted && (
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-ds-deep/15 text-ds-deep">
              Accepted
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default TermsConditionsStep;
