import React from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  COMPLIANCE_DOCS,
  COMPLIANCE_TONE,
  describeDays,
  evaluateCompliance,
  formatExpiry,
  todayDateInputValue,
  type ComplianceSource,
} from "@/lib/vehicleCompliance";

export interface CompliancePayload {
  insuranceExpiry?: string | null;
  pucExpiry?: string | null;
}

interface ComplianceRenewDialogProps {
  open: boolean;
  onClose: () => void;
  /** The listing being renewed. Its current dates seed the form. */
  listing: (ComplianceSource & { _id?: string; name?: string }) | null;
  /** Resolves when the renewal has been persisted. Rejects to keep the form open. */
  onSubmit: (payload: CompliancePayload) => Promise<unknown>;
  /**
   * Admins are editing somebody else's paperwork, so the copy drops the
   * "your listing" framing and the reassurance about re-approval.
   */
  asAdmin?: boolean;
}

/**
 * Renew the dated documents on a vehicle listing.
 *
 * This is the whole reason the renewal is not just "edit the listing": going
 * back through the onboarding wizard rewrites the offer and drops it into the
 * admin review queue, so a vendor fixing one date would have their listing
 * stay dark until somebody approved it again. Two dates, one PATCH, listing
 * back up.
 *
 * The form seeds from the current values and sends only what changed, so
 * renewing insurance never silently rewrites a PUC date the vendor did not
 * touch.
 */
export const ComplianceRenewDialog: React.FC<ComplianceRenewDialogProps> = ({
  open,
  onClose,
  listing,
  onSubmit,
  asAdmin = false,
}) => {
  const verdict = evaluateCompliance(listing);

  const [values, setValues] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reseed whenever a different listing is opened — the dialog is mounted once
  // and reused for every row.
  React.useEffect(() => {
    if (!open || !verdict) return;
    setValues(Object.fromEntries(verdict.docs.map((d) => [d.field, d.dateKey])));
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listing?._id]);

  if (!verdict) return null;

  const today = todayDateInputValue();

  /* Only changed fields go up. `null` clears an optional date the vendor wants
     to remove; an untouched field is simply absent from the payload. */
  const changed: CompliancePayload = {};
  for (const doc of verdict.docs) {
    const next = values[doc.field] ?? "";
    if (next === doc.dateKey) continue;
    (changed as Record<string, string | null>)[doc.field] = next === "" ? null : next;
  }
  const hasChanges = Object.keys(changed).length > 0;

  /* Would the listing still be down after this save? Answering before they
     submit beats a toast that says "saved" over a listing that is still dark. */
  const projected = evaluateCompliance({
    serviceType: "vehicle-rental",
    insuranceExpiry: values.insuranceExpiry || null,
    pucExpiry: values.pucExpiry || null,
  });
  const stillBlocked = !!projected && projected.expired.length > 0;
  const wouldRestore = verdict.onHold && hasChanges && !stillBlocked;

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(changed);
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        "Could not save the new dates. Please try again.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 gap-0">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-[16.5px] font-bold tracking-[-0.01em] text-app-fg">
            Update compliance documents
          </DialogTitle>
          <p className="text-[13px] leading-relaxed text-app-fg-muted">
            {listing?.name ? (
              <>
                <span className="font-semibold text-app-fg">{listing.name}</span> —{" "}
              </>
            ) : null}
            {verdict.state === "expired"
              ? asAdmin
                ? "This listing is off the site until a current date is entered."
                : "This listing is off the site until you enter a current date."
              : "Enter the expiry date from the renewed document."}
          </p>
        </DialogHeader>

        <div className="mt-5 flex flex-col gap-4">
          {COMPLIANCE_DOCS.map((def) => {
            const doc = verdict.docs.find((d) => d.key === def.key)!;
            const tone = doc.state === "ok" || doc.state === "absent" ? null : COMPLIANCE_TONE[doc.state];

            return (
              <label key={def.key} className="flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] font-bold text-app-fg">
                    {def.label} valid until
                    {def.required && <span className="ml-0.5 text-red-500">*</span>}
                  </span>
                  {tone && (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-app-fg-muted">
                      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                      {doc.expiry ? formatExpiry(doc.expiry) : "not provided"}
                      {doc.days !== null && ` · ${describeDays(doc.days)}`}
                    </span>
                  )}
                </span>
                <input
                  type="date"
                  value={values[def.field] ?? ""}
                  min={today}
                  disabled={saving}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [def.field]: e.target.value }))
                  }
                  className={cn(
                    "h-10 w-full rounded-xl border bg-app-surface px-3.5",
                    "text-[13.5px] font-medium text-app-fg outline-none",
                    "transition-[border-color,box-shadow] duration-150 disabled:opacity-60",
                    "border-app-border focus:border-app-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]",
                  )}
                />
                {!def.required && (
                  <span className="text-[11.5px] text-app-fg-subtle">
                    Optional — but once a date is on file it is enforced like the insurance date.
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {stillBlocked && hasChanges && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
            {projected!.expired.map((d) => d.label).join(" and ")} is still dated in the past, so
            the listing will stay off the site.
          </p>
        )}

        {wouldRestore && (
          <p className="mt-4 inline-flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
            <ShieldCheck size={15} className="mt-px shrink-0" />
            Saving puts this listing back on the site right away — it does not need approving
            again.
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center gap-2.5">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 h-10 rounded-xl bg-app-surface-2 text-[13px] font-semibold text-app-fg-muted
              outline-none transition-colors hover:text-app-fg disabled:opacity-50
              focus-visible:ring-4 focus-visible:ring-app-accent/20"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex-1 h-10 rounded-xl bg-app-accent text-[13px] font-semibold text-app-accent-fg
              inline-flex items-center justify-center gap-2 outline-none
              transition-[background-color,transform] duration-150 active:translate-y-px
              hover:bg-app-accent-hover disabled:opacity-50 disabled:pointer-events-none
              focus-visible:ring-4 focus-visible:ring-app-accent/25"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving…" : "Save dates"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComplianceRenewDialog;
