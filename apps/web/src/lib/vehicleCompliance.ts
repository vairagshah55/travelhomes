/**
 * Vehicle compliance-document expiry, client side.
 *
 * The mirror of `Server/shared/vehicleCompliance.js`. Both consoles need to say
 * the same thing about the same listing — the vendor's "your listing is down"
 * banner and the admin's compliance queue are two views of one verdict — and
 * the server is the one that acts on it, so the rules live in both places
 * rather than being re-invented per screen.
 *
 * Keep the two in step: the thresholds, the timezone and the "either document
 * condemns the listing" rule are all duplicated deliberately, and a change to
 * one that misses the other shows up as a badge that disagrees with the site.
 */

/** Minutes east of UTC that "today" is judged in. Asia/Kolkata = +05:30. */
const TZ_OFFSET_MINUTES = 330;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** How far ahead a document counts as "expiring soon". */
export const EXPIRING_SOON_DAYS = 30;

export type ComplianceDocKey = "insurance" | "puc";
export type ComplianceDocState = "ok" | "expiring" | "expired" | "missing" | "absent";
export type ComplianceState = "ok" | "expiring" | "expired" | "missing";

interface ComplianceDocDef {
  key: ComplianceDocKey;
  /** The field on the offer/onboarding document that holds the date. */
  field: "insuranceExpiry" | "pucExpiry";
  label: string;
  /** Insurance is mandatory; PUC is optional at onboarding but binding once given. */
  required: boolean;
}

export const COMPLIANCE_DOCS: ComplianceDocDef[] = [
  { key: "insurance", field: "insuranceExpiry", label: "Insurance", required: true },
  { key: "puc", field: "pucExpiry", label: "PUC certificate", required: false },
];

export interface ComplianceDoc extends ComplianceDocDef {
  /** Raw value as stored, or null. */
  expiry: string | null;
  /** "YYYY-MM-DD", the shape a date input wants. */
  dateKey: string;
  /** Whole days until expiry; negative once lapsed, null when absent. */
  days: number | null;
  state: ComplianceDocState;
}

export interface ComplianceVerdict {
  state: ComplianceState;
  docs: ComplianceDoc[];
  expired: ComplianceDoc[];
  expiring: ComplianceDoc[];
  missing: ComplianceDoc[];
  /** Nearest days-until across the documents present, or null. */
  soonest: number | null;
  /** True when the server has taken the listing down for this. */
  onHold: boolean;
}

/** The compliance-carrying subset of an offer. */
export interface ComplianceSource {
  serviceType?: string;
  insuranceExpiry?: string | Date | null;
  pucExpiry?: string | Date | null;
  complianceHold?: {
    active?: boolean;
    documents?: string[];
    since?: string;
    previousStatus?: string;
  };
}

/** Calendar-day index of a stored expiry (which sits at UTC midnight). */
function dayIndexOf(value?: string | Date | null): number | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / MS_PER_DAY);
}

/** Calendar-day index of "now", read in the operating timezone. */
function todayIndex(now = new Date()): number {
  const shifted = new Date(now.getTime() + TZ_OFFSET_MINUTES * 60 * 1000);
  return Math.floor(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) / MS_PER_DAY,
  );
}

/**
 * Whole days from today until `value`, negative once lapsed.
 *
 * A document is valid through the whole of its stated day — comparing against
 * `new Date()` would expire a policy at 05:30 IST on its own last valid day.
 */
export function daysUntilExpiry(value?: string | Date | null, now = new Date()): number | null {
  const idx = dayIndexOf(value);
  if (idx === null) return null;
  return idx - todayIndex(now);
}

/** "YYYY-MM-DD" for a stored expiry, or "" — what `<input type="date">` wants. */
export function toDateInputValue(value?: string | Date | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Today as "YYYY-MM-DD", for a date input's `min`. */
export function todayDateInputValue(now = new Date()): string {
  return new Date(todayIndex(now) * MS_PER_DAY).toISOString().slice(0, 10);
}

/** "1 Sep 2026". */
export function formatExpiry(value?: string | Date | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "expired 3 days ago" / "4 days left" / "expires today". */
export function describeDays(days: number | null): string {
  if (days === null) return "not provided";
  if (days < 0) {
    const n = Math.abs(days);
    return `expired ${n} day${n === 1 ? "" : "s"} ago`;
  }
  if (days === 0) return "expires today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

/**
 * Assess one listing's documents. `state` is the worst verdict across both,
 * which is what "if any one of them expires" means: one lapsed date condemns
 * the listing however healthy the other is.
 *
 * Returns null for anything that is not a vehicle rental, so callers can use
 * the result as the "does this listing have compliance at all" test.
 */
export function evaluateCompliance(
  source: ComplianceSource | null | undefined,
  now = new Date(),
): ComplianceVerdict | null {
  if (!source || source.serviceType !== "vehicle-rental") return null;

  const docs: ComplianceDoc[] = COMPLIANCE_DOCS.map((def) => {
    const expiry = source[def.field] ?? null;
    const days = daysUntilExpiry(expiry, now);

    let state: ComplianceDocState = "ok";
    if (days === null) state = def.required ? "missing" : "absent";
    else if (days < 0) state = "expired";
    else if (days <= EXPIRING_SOON_DAYS) state = "expiring";

    return {
      ...def,
      expiry: expiry ? String(expiry) : null,
      dateKey: toDateInputValue(expiry),
      days,
      state,
    };
  });

  const expired = docs.filter((d) => d.state === "expired");
  const expiring = docs.filter((d) => d.state === "expiring");
  const missing = docs.filter((d) => d.state === "missing");

  const present = docs.map((d) => d.days).filter((d): d is number => d !== null);
  const soonest = present.length ? Math.min(...present) : null;

  let state: ComplianceState = "ok";
  if (expired.length) state = "expired";
  else if (missing.length) state = "missing";
  else if (expiring.length) state = "expiring";

  return {
    state,
    docs,
    expired,
    expiring,
    missing,
    soonest,
    onHold: !!source.complianceHold?.active,
  };
}

/** "Insurance and PUC certificate" / "Insurance". */
export function listLabels(entries: { label: string }[]): string {
  const labels = entries.map((e) => e.label);
  if (labels.length <= 1) return labels[0] || "";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/** One line summarising the verdict, for a banner or a tooltip. */
export function complianceHeadline(v: ComplianceVerdict): string {
  if (v.state === "expired") {
    const many = v.expired.length > 1;
    return `${listLabels(v.expired)} ${many ? "have" : "has"} expired — this listing is off the site until you enter a current date.`;
  }
  if (v.state === "missing") {
    return `${listLabels(v.missing)} is missing. Add the expiry date to keep this listing live.`;
  }
  if (v.state === "expiring") {
    const many = v.expiring.length > 1;
    const soonest = Math.min(...v.expiring.map((d) => d.days ?? 0));
    return `${listLabels(v.expiring)} ${many ? "expire" : "expires"} in ${soonest} day${soonest === 1 ? "" : "s"}. The listing comes down automatically once it lapses.`;
  }
  return "Insurance and PUC certificate are current.";
}

/**
 * Tone tokens per state. Amber for a warning, red for a stop — chosen once
 * here so a compliance pill reads the same in the vendor console (cyan brand)
 * and the admin (blue brand), neither of which has a semantic status colour
 * that fits "your paperwork lapsed".
 */
export const COMPLIANCE_TONE: Record<ComplianceState, { pill: string; band: string; dot: string; label: string }> = {
  expired: {
    pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25",
    band: "border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/[0.08]",
    dot: "bg-red-500",
    label: "Document expired",
  },
  missing: {
    pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/25",
    band: "border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/[0.08]",
    dot: "bg-red-500",
    label: "Document missing",
  },
  expiring: {
    pill: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/25",
    band: "border-amber-200 bg-amber-50 dark:border-amber-400/25 dark:bg-amber-400/[0.08]",
    dot: "bg-amber-500",
    label: "Expiring soon",
  },
  ok: {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
    band: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/[0.08]",
    dot: "bg-emerald-500",
    label: "Documents current",
  },
};
