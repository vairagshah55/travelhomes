import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarPlus,
  Check,
  ChevronLeft,
  Loader2,
  Package,
  Save,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  BRAND_VARS,
  BTN_NEUTRAL,
  BTN_PRIMARY,
  PANEL,
  PANEL_FOOTER,
  Panel,
  PanelHead,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useBookingResources } from "@/hooks/useBookingResources";
import {
  type BookingData,
  type NewBookingForm,
  EMPTY_BOOKING_FORM,
  createBooking,
  printInvoice,
  NewBookingFields,
  useNewBookingErrors,
} from "@/components/bookings";
import { currencyINR } from "@/utils/currency";


const prettyDate = (raw: string) => {
  if (!raw) return null;
  const d = new Date(`${raw}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

/** One line in the summary rail. */
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
 * New Booking — a full page at /bookings/new.
 *
 * This used to be a 540px right-side SlidePanel over the calendar. The form is
 * long enough (seven sections) that the narrow column meant constant scrolling,
 * so it now gets the whole content area: sectioned sub-panels in the middle and
 * a sticky live summary in the rail, matching the rest of the console.
 *
 * `?date=` and `?resource=` prefill the form when the user arrives by clicking
 * an empty calendar cell or a service row's + action, which keeps that shortcut
 * working and makes the page reloadable/shareable.
 */
const NewBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token: authToken } = useAuth();
  const queryClient = useQueryClient();
  const token = authToken ?? undefined;

  const { data: resources, isLoading: loadingResources } = useBookingResources();
  const vehicleNames = resources?.names ?? [];
  const services = resources?.services ?? [];

  const [form, setForm] = useState<NewBookingForm>(() => {
    const date = searchParams.get("date") || "";
    const resource = searchParams.get("resource") || "";
    return {
      ...EMPTY_BOOKING_FORM,
      resourceName: resource,
      startDate: date,
      endDate: date,
    };
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = useNewBookingErrors(form);
  const errFor = (field: string) => (attempted || touched[field] ? errors[field] : undefined);
  const markTouched = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  const errorCount = Object.keys(errors).length;

  /** Live recap for the rail — the form is long, and the totals matter. */
  const summary = useMemo(() => {
    const base = Number(form.basePrice || 0);
    const extra = Number(form.extraCharges || 0);
    const total = form.totalAmount ? Number(form.totalAmount) : base + extra;
    const start = prettyDate(form.startDate);
    const end = prettyDate(form.endDate);
    let nights: number | null = null;
    if (form.startDate && form.endDate) {
      const ms =
        new Date(`${form.endDate}T00:00:00`).getTime() -
        new Date(`${form.startDate}T00:00:00`).getTime();
      if (!Number.isNaN(ms) && ms >= 0) nights = Math.round(ms / 86_400_000);
    }
    const guests = Number(form.adults || 0) + Number(form.children || 0);
    return { base, extra, total, start, end, nights, guests };
  }, [form]);

  const backToCalendar = () => navigate("/bookings");

  const handleCreate = async () => {
    setAttempted(true);
    if (errorCount > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      // Throws with the server's reason (e.g. a 409 date conflict), which the
      // catch below surfaces verbatim.
      const nb = await createBooking(form, token, user?.email);
      // The calendar keys its list by month/year, so invalidate rather than
      // patching a single key — the new booking may not be in the month the
      // calendar is currently showing.
      queryClient.invalidateQueries({ queryKey: ["bookings", "calendar"] });
      toast.success("Booking created");
      navigate("/bookings");
      setTimeout(() => {
        try {
          printInvoice(nb as BookingData, token);
        } catch {
          /* invoice is best-effort — the booking is already saved */
        }
      }, 500);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create booking");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="New Booking"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto pb-24 lg:pb-12">
        <div className="grid gap-5 lg:gap-7 lg:grid-cols-[254px_minmax(0,1fr)]">
          {/* ── Rail: live recap of what's being booked ── */}
          <aside className="lg:sticky lg:top-2 self-start space-y-3">
            <div className={cn(PANEL, "p-4")}>
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-11 h-11 rounded-full bg-brand/[0.1] text-brand shrink-0">
                  <CalendarPlus size={18} strokeWidth={2.1} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-foreground truncate">
                    {form.guestName || "New booking"}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground truncate">
                    {form.resourceName || "No service picked yet"}
                  </p>
                </div>
              </div>

              <div className="mt-3 divide-y divide-border/70">
                <SummaryRow
                  label="Dates"
                  muted={!summary.start}
                  value={
                    summary.start
                      ? `${summary.start}${summary.end && summary.end !== summary.start ? ` → ${summary.end}` : ""}`
                      : "Not set"
                  }
                />
                {summary.nights !== null && (
                  <SummaryRow
                    label="Nights"
                    value={<span className="tabular-nums">{summary.nights}</span>}
                  />
                )}
                <SummaryRow
                  label="Guests"
                  muted={summary.guests === 0}
                  value={<span className="tabular-nums">{summary.guests || "—"}</span>}
                />
                <SummaryRow
                  label="Base"
                  muted={!summary.base}
                  value={<span className="tabular-nums">{currencyINR(summary.base)}</span>}
                />
                {summary.extra > 0 && (
                  <SummaryRow
                    label="Extras"
                    value={<span className="tabular-nums">{currencyINR(summary.extra)}</span>}
                  />
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-border/70 flex items-baseline justify-between gap-3">
                <span className="text-[12px] font-semibold text-muted-foreground">Total</span>
                <span className="text-[18px] font-bold tabular-nums tracking-[-0.02em] text-brand">
                  {currencyINR(summary.total)}
                </span>
              </div>
            </div>

            {/* Progress hint — the form has seven groups, so say what's left. */}
            <div className={cn(PANEL, "p-4")}>
              {errorCount === 0 ? (
                <p className="flex items-center gap-2 text-[12.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check size={14} strokeWidth={2.6} />
                  Ready to create
                </p>
              ) : (
                <p className="flex items-start gap-2 text-[12.5px] font-medium text-amber-600 dark:text-amber-400">
                  <AlertCircle size={14} strokeWidth={2.4} className="mt-px shrink-0" />
                  {errorCount} field{errorCount === 1 ? "" : "s"} still{" "}
                  {errorCount === 1 ? "needs" : "need"} filling in
                </p>
              )}
              <button
                type="button"
                onClick={backToCalendar}
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                <ChevronLeft size={13} strokeWidth={2.4} />
                Back to calendar
              </button>
            </div>
          </aside>

          {/* ── The form ── */}
          <div className="min-w-0">
            <Panel>
              <PanelHead
                icon={CalendarPlus}
                title="Booking details"
                blurb={
                  loadingResources
                    ? "Loading your services…"
                    : "Everything marked with * is needed to create the booking."
                }
              />

              <div className="p-5">
                {loadingResources ? (
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
                ) : vehicleNames.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <span className="mx-auto grid place-items-center w-12 h-12 rounded-full bg-brand/[0.1] text-brand">
                      <Package size={22} strokeWidth={2} />
                    </span>
                    <p className="mt-3 text-[14.5px] font-bold text-foreground">
                      No services to book yet
                    </p>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">
                      A booking needs something to book. Add a listing first, then come back.
                    </p>
                    <Button
                      onClick={() => navigate("/offering/add")}
                      className={cn(BTN_PRIMARY, "mt-4")}
                    >
                      Add a listing
                    </Button>
                  </div>
                ) : (
                  <NewBookingFields
                    form={form}
                    setForm={setForm}
                    vehicleNames={vehicleNames}
                    services={services}
                    onAddService={() => navigate("/offering/add")}
                    errFor={errFor}
                    markTouched={markTouched}
                  />
                )}
              </div>

              {!loadingResources && vehicleNames.length > 0 && (
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
                    onClick={handleCreate}
                    disabled={saving}
                    className={cn(BTN_PRIMARY, "disabled:opacity-45 disabled:shadow-none")}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <Save size={15} strokeWidth={2.4} />
                        Create booking
                      </>
                    )}
                  </Button>
                </footer>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewBooking;
