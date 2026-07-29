import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  Loader2,
  Pencil,
  Printer,
  Save,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  BRAND_VARS,
  BTN_NEUTRAL,
  BTN_PRIMARY,
  BTN_SOFT,
  ConfirmModal,
  EmptyState,
  PANEL,
  PANEL_FOOTER,
  Panel,
  PanelHead,
  StatusBadge,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  type BookingData,
  EditBookingFields,
  deleteBooking,
  fetchBooking,
  printInvoice,
  updateBooking,
  useEditBookingErrors,
} from "@/components/bookings";

const currencyINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const prettyDate = (d?: Date | null) =>
  d && !Number.isNaN(new Date(d).getTime())
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const SummaryRow = ({
  label,
  value,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) => (
  <div className="flex items-baseline justify-between gap-3 py-2">
    <span className="text-[12px] text-muted-foreground shrink-0">{label}</span>
    <span
      className={cn(
        "text-[12.5px] font-semibold text-right break-words",
        muted ? "text-muted-foreground/60" : "text-foreground",
      )}
    >
      {value}
    </span>
  </div>
);

/**
 * Edit Booking — a full page at /bookings/:id/edit.
 *
 * Replaces the 540px EditBookingModal slide-panel that opened over the
 * calendar: the form is six groups long, so the panel meant scrolling a narrow
 * column with the actions pinned out of context. As a route it's also
 * deep-linkable and survives a refresh.
 */
const EditBooking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token: authToken } = useAuth();
  const token = authToken ?? undefined;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bookingQuery = useQuery<BookingData | null>({
    queryKey: ["bookings", "one", id],
    enabled: !!id,
    queryFn: () => fetchBooking(id!, token),
  });

  // Local copy is what the form edits; the query result seeds it.
  useEffect(() => {
    if (bookingQuery.data) setBooking(bookingQuery.data);
  }, [bookingQuery.data]);

  const errors = useEditBookingErrors(booking);
  const errorCount = Object.keys(errors).length;
  const errFor = (field: string) => (attempted || touched[field] ? errors[field] : undefined);
  const markTouched = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  const summary = useMemo(() => {
    if (!booking) return null;
    const base = Number(booking.basePrice || 0);
    const extra = Number(booking.extraCharges || 0);
    const total = base + extra;
    const paid = Number(booking.paidAmount || 0);
    return {
      total,
      paid,
      pending: Math.max(0, total - paid),
      guests: Number(booking.adults || 0) + Number(booking.children || 0),
    };
  }, [booking]);

  const backToCalendar = () => navigate("/bookings");

  const handleUpdate = async () => {
    if (!booking) return;
    setAttempted(true);
    if (errorCount > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      // Totals and the numeric coercion the server DTO needs are derived inside
      // updateBooking, so the edited booking can go straight through.
      const updated = await updateBooking(booking._id, booking, token);
      if (updated) {
        // The calendar keys its list by month/year, so invalidate the family
        // rather than patching one key — dates may have moved months.
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        toast.success("Booking updated");
        backToCalendar();
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to update booking");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!booking) return;
    setDeleting(true);
    try {
      if (await deleteBooking(booking._id, token)) {
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        toast.success("Booking deleted");
        backToCalendar();
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete booking");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handlePrint = () => {
    if (!booking) return;
    try {
      printInvoice(booking, token);
    } catch {
      toast.error("Failed to print invoice");
    }
  };

  const loading = bookingQuery.isLoading || (!booking && !bookingQuery.isError);

  return (
    <DashboardLayout
      title="Edit Booking"
      contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-muted/40 dark:bg-transparent"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto pb-24 lg:pb-12">
        {bookingQuery.isError ? (
          <Panel>
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load this booking"
              description="It may have been deleted, or the link is wrong."
              actionLabel="Back to calendar"
              onAction={backToCalendar}
              secondaryLabel="Try again"
              onSecondary={() => bookingQuery.refetch()}
              className="min-h-[320px]"
            />
          </Panel>
        ) : (
          <div className="grid gap-5 lg:gap-7 lg:grid-cols-[254px_minmax(0,1fr)]">
            {/* ── Rail: what this booking is ── */}
            <aside className="lg:sticky lg:top-2 self-start space-y-3">
              <div className={cn(PANEL, "p-4")}>
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-11 w-11 rounded-full bg-muted animate-pulse" />
                    <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-24 rounded bg-muted/70 animate-pulse" />
                  </div>
                ) : (
                  booking && (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="grid place-items-center w-11 h-11 rounded-full bg-brand/[0.1] text-brand shrink-0">
                          <Pencil size={17} strokeWidth={2.1} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-bold text-foreground truncate">
                            {booking.guestName || "Booking"}
                          </p>
                          <p className="mt-0.5 text-[11.5px] tabular-nums text-muted-foreground">
                            {booking.bookingId}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <StatusBadge status={booking.status} size="sm" />
                      </div>

                      <div className="mt-3 divide-y divide-border/70">
                        <SummaryRow label="Service" value={booking.resourceName || "—"} />
                        <SummaryRow label="Check in" value={prettyDate(booking.startDate)} />
                        <SummaryRow label="Check out" value={prettyDate(booking.endDate)} />
                        <SummaryRow
                          label="Nights"
                          value={<span className="tabular-nums">{booking.totalDays || "—"}</span>}
                        />
                        <SummaryRow
                          label="Guests"
                          muted={!summary?.guests}
                          value={<span className="tabular-nums">{summary?.guests || "—"}</span>}
                        />
                        <SummaryRow
                          label="Paid"
                          muted={!summary?.paid}
                          value={
                            <span className="tabular-nums">{currencyINR(summary?.paid ?? 0)}</span>
                          }
                        />
                        <SummaryRow
                          label="Pending"
                          muted={!summary?.pending}
                          value={
                            <span
                              className={cn(
                                "tabular-nums",
                                summary?.pending ? "text-amber-600 dark:text-amber-400" : "",
                              )}
                            >
                              {currencyINR(summary?.pending ?? 0)}
                            </span>
                          }
                        />
                      </div>

                      <div className="mt-3 pt-3 border-t border-border/70 flex items-baseline justify-between gap-3">
                        <span className="text-[12px] font-semibold text-muted-foreground">
                          Total
                        </span>
                        <span className="text-[18px] font-bold tabular-nums tracking-[-0.02em] text-brand">
                          {currencyINR(summary?.total ?? 0)}
                        </span>
                      </div>
                    </>
                  )
                )}
              </div>

              {!loading && booking && (
                <div className={cn(PANEL, "p-4 space-y-3")}>
                  {errorCount === 0 ? (
                    <p className="flex items-center gap-2 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Check size={14} strokeWidth={2.6} />
                      No problems to fix
                    </p>
                  ) : (
                    <p className="flex items-start gap-2 text-[12.5px] font-medium text-amber-600 dark:text-amber-400">
                      <AlertCircle size={14} strokeWidth={2.4} className="mt-px shrink-0" />
                      {errorCount} field{errorCount === 1 ? "" : "s"} need
                      {errorCount === 1 ? "s" : ""} attention
                    </p>
                  )}

                  <Button variant="ghost" onClick={handlePrint} className={cn(BTN_SOFT, "w-full")}>
                    <Printer size={14} strokeWidth={2.3} />
                    Print invoice
                  </Button>

                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-[12.5px] font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors duration-150"
                  >
                    <Trash2 size={14} strokeWidth={2.3} />
                    Delete booking
                  </button>

                  <button
                    type="button"
                    onClick={backToCalendar}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150"
                  >
                    <ChevronLeft size={13} strokeWidth={2.4} />
                    Back to calendar
                  </button>
                </div>
              )}
            </aside>

            {/* ── The form ── */}
            <div className="min-w-0">
              <Panel>
                <PanelHead
                  icon={Pencil}
                  title="Booking details"
                  blurb={
                    loading
                      ? "Loading this booking…"
                      : "Changes save to the calendar as soon as you update."
                  }
                />

                <div className="p-5">
                  {loading ? (
                    <div className="space-y-4">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="rounded-[14px] border border-border/70 overflow-hidden"
                        >
                          <div className="h-[58px] bg-muted/50 animate-pulse" />
                          <div className="p-4 grid sm:grid-cols-2 gap-4">
                            <div className="h-[68px] rounded-xl bg-muted animate-pulse" />
                            <div className="h-[68px] rounded-xl bg-muted animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    booking && (
                      <EditBookingFields
                        booking={booking}
                        setBooking={setBooking}
                        errFor={errFor}
                        markTouched={markTouched}
                      />
                    )
                  )}
                </div>

                {!loading && booking && (
                  <footer className={PANEL_FOOTER}>
                    <Button variant="ghost" onClick={backToCalendar} className={BTN_NEUTRAL}>
                      Cancel
                    </Button>

                    {attempted && errorCount > 0 && (
                      <p className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-medium text-amber-600 dark:text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {errorCount} field{errorCount === 1 ? "" : "s"} to fix
                      </p>
                    )}

                    <Button
                      onClick={handleUpdate}
                      disabled={saving}
                      className={cn(BTN_PRIMARY, "disabled:opacity-45 disabled:shadow-none")}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Updating…
                        </>
                      ) : (
                        <>
                          <Save size={15} strokeWidth={2.4} />
                          Update booking
                        </>
                      )}
                    </Button>
                  </footer>
                )}
              </Panel>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete booking?"
        description={
          booking
            ? `${booking.bookingId} for ${booking.guestName} will be permanently removed. This can't be undone.`
            : "This booking will be permanently removed and cannot be undone."
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </DashboardLayout>
  );
};

export default EditBooking;
