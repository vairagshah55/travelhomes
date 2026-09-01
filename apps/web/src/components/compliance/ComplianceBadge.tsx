import React from "react";
import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMPLIANCE_TONE,
  describeDays,
  evaluateCompliance,
  formatExpiry,
  listLabels,
  type ComplianceSource,
  type ComplianceVerdict,
} from "@/lib/vehicleCompliance";

const ICONS = {
  expired: ShieldX,
  missing: ShieldX,
  expiring: ShieldAlert,
  ok: ShieldCheck,
} as const;

interface ComplianceBadgeProps {
  /** The listing. Anything that is not a vehicle rental renders nothing. */
  listing: ComplianceSource | null | undefined;
  /** `sm` for a table cell or a card corner; `md` for a detail header. */
  size?: "sm" | "md";
  /** Healthy listings render nothing by default — only problems earn a pill. */
  showWhenOk?: boolean;
  className?: string;
}

/** The short text on the pill. */
function badgeLabel(v: ComplianceVerdict): string {
  if (v.state === "expired") {
    return v.expired.length > 1 ? "Documents expired" : `${v.expired[0].label} expired`;
  }
  if (v.state === "missing") return `${v.missing[0].label} missing`;
  if (v.state === "expiring") {
    const soonest = Math.min(...v.expiring.map((d) => d.days ?? 0));
    return soonest === 0 ? "Expires today" : `Expires in ${soonest}d`;
  }
  return "Documents current";
}

/**
 * Compliance state of a vehicle listing, as one pill.
 *
 * Deliberately separate from `StatusBadge`: the listing's status already says
 * "deactivated", and that is the effect, not the reason. A vendor scanning a
 * grid of twelve cards needs to see WHICH of them went dark because a document
 * lapsed, without opening any of them.
 *
 * Amber/red rather than a brand token — this reads the same in the vendor
 * console (cyan) and the admin (blue), and neither brand colour means "stop".
 */
export const ComplianceBadge: React.FC<ComplianceBadgeProps> = ({
  listing,
  size = "sm",
  showWhenOk = false,
  className,
}) => {
  const verdict = evaluateCompliance(listing);
  if (!verdict) return null;
  if (verdict.state === "ok" && !showWhenOk) return null;

  const tone = COMPLIANCE_TONE[verdict.state];
  const Icon = ICONS[verdict.state];

  const relevant =
    verdict.expired.length > 0
      ? verdict.expired
      : verdict.missing.length > 0
        ? verdict.missing
        : verdict.expiring;

  const title = relevant.length
    ? relevant.map((d) => `${d.label}: ${formatExpiry(d.expiry)} (${describeDays(d.days)})`).join(" · ")
    : listLabels(verdict.docs);

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap",
        size === "sm" ? "h-6 px-2 text-[11px]" : "h-7 px-2.5 text-[12px]",
        tone.pill,
        className,
      )}
    >
      <Icon size={size === "sm" ? 12 : 13} strokeWidth={2.2} />
      {badgeLabel(verdict)}
    </span>
  );
};

export default ComplianceBadge;
