import React from "react";
import { ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMPLIANCE_TONE,
  describeDays,
  evaluateCompliance,
  formatExpiry,
  listLabels,
  type ComplianceSource,
} from "@/lib/vehicleCompliance";

type Listing = ComplianceSource & { _id?: string; name?: string };

interface ComplianceAlertBandProps {
  /** Every listing on the page. Non-vehicles and healthy ones are ignored. */
  listings: Listing[];
  /** Opens the renewal dialog for one listing. */
  onRenew: (listing: Listing) => void;
  className?: string;
}

/**
 * The "your paperwork needs attention" band above the vendor's offerings grid.
 *
 * A card badge tells a vendor which listing has a problem once they are already
 * looking at it. This tells them there is a problem at all — the listing that
 * went dark is likely somewhere on page three of the grid, and the email that
 * announced it was three weeks ago.
 *
 * Expired listings are listed before expiring ones because one is costing money
 * now and the other is a reminder.
 */
export const ComplianceAlertBand: React.FC<ComplianceAlertBandProps> = ({
  listings,
  onRenew,
  className,
}) => {
  const flagged = React.useMemo(() => {
    const rows = listings
      .map((listing) => ({ listing, verdict: evaluateCompliance(listing) }))
      .filter(
        (row): row is { listing: Listing; verdict: NonNullable<ReturnType<typeof evaluateCompliance>> } =>
          !!row.verdict && row.verdict.state !== "ok",
      );

    const rank = { expired: 0, missing: 1, expiring: 2, ok: 3 };
    return rows.sort(
      (a, b) =>
        rank[a.verdict.state] - rank[b.verdict.state] ||
        (a.verdict.soonest ?? 0) - (b.verdict.soonest ?? 0),
    );
  }, [listings]);

  if (!flagged.length) return null;

  const down = flagged.filter((r) => r.verdict.state === "expired" || r.verdict.state === "missing");
  const worst = down.length ? "expired" : "expiring";
  const tone = COMPLIANCE_TONE[worst];
  const Icon = down.length ? ShieldX : ShieldAlert;

  return (
    <section
      className={cn("rounded-[10px] border px-4 py-3.5", tone.band, className)}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid place-items-center h-8 w-8 shrink-0 rounded-lg",
            down.length
              ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
          )}
        >
          <Icon size={16} strokeWidth={2.2} />
        </span>

        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              "text-[13.5px] font-bold tracking-[-0.01em]",
              down.length
                ? "text-red-900 dark:text-red-200"
                : "text-amber-900 dark:text-amber-200",
            )}
          >
            {down.length
              ? `${down.length} listing${down.length === 1 ? " is" : "s are"} off the site — documents expired`
              : `${flagged.length} listing${flagged.length === 1 ? "" : "s"} need${flagged.length === 1 ? "s" : ""} renewed documents soon`}
          </h2>
          <p
            className={cn(
              "mt-0.5 text-[12.5px] leading-relaxed",
              down.length
                ? "text-red-800/90 dark:text-red-200/80"
                : "text-amber-900/85 dark:text-amber-200/80",
            )}
          >
            A vehicle is removed from the site as soon as its insurance or PUC certificate
            expires. Enter the new date and it goes straight back up.
          </p>

          <ul className="mt-3 flex flex-col gap-1.5">
            {flagged.map(({ listing, verdict }) => {
              const relevant = verdict.expired.length
                ? verdict.expired
                : verdict.missing.length
                  ? verdict.missing
                  : verdict.expiring;

              return (
                <li
                  key={listing._id}
                  className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg bg-app-surface/70 px-3 py-2"
                >
                  <span className="text-[12.5px] font-semibold text-app-fg truncate max-w-[220px]">
                    {listing.name || "Untitled listing"}
                  </span>
                  <span className="text-[12px] text-app-fg-muted">
                    {listLabels(relevant)} ·{" "}
                    {relevant
                      .map((d) => `${formatExpiry(d.expiry)} (${describeDays(d.days)})`)
                      .join(", ")}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRenew(listing)}
                    className="ml-auto h-7 shrink-0 rounded-lg bg-app-accent px-2.5 text-[12px] font-semibold
                      text-app-accent-fg outline-none transition-colors hover:bg-app-accent-hover
                      focus-visible:ring-4 focus-visible:ring-app-accent/25"
                  >
                    Update dates
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ComplianceAlertBand;
