import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
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

/**
 * New Booking — a full page at /bookings/new.
 *
 * This used to be a 540px right-side SlidePanel over the calendar. The form is
 * long enough (seven sections) that the narrow column meant constant scrolling,
 * so it now gets the whole content area and lays out two columns per section.
 *
 * `?date=` and `?resource=` prefill the form when the user arrives by clicking
 * an empty calendar cell, which keeps that shortcut working and makes the page
 * reloadable/shareable.
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

  const backToCalendar = () => navigate("/bookings");

  const handleCreate = async () => {
    setAttempted(true);
    if (Object.keys(errors).length > 0) {
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
    <DashboardLayout title="New Booking" contentClassName="flex-1 overflow-y-auto p-3 lg:p-5 pb-24">
      <div className="bg-th-surface-0 border border-[#EBEBEB] rounded-[20px] px-[22px] py-5 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-5 pb-4 gap-4 border-b border-[#EBEBEB]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={backToCalendar}
              aria-label="Back to calendar"
              className="w-9 h-9 rounded-[11px] border border-th-warm-border bg-th-surface-0 flex items-center justify-center cursor-pointer flex-shrink-0 hover:bg-th-warm-surface transition-colors"
            >
              <ArrowLeft size={16} className="text-th-warm-text-dark" />
            </button>
            <div>
              <h1 className="text-[22px] font-extrabold text-th-text-primary tracking-[-0.025em] leading-[1.2]">
                New Booking
              </h1>
              <p className="text-[13px] text-th-warm-text-muted mt-[3px]">
                Add a booking to your calendar
              </p>
            </div>
          </div>
        </div>

        {loadingResources ? (
          <div className="flex items-center justify-center h-64 gap-2 text-th-warm-text-muted">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-[13px]">Loading services…</span>
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

        {/* The form's only actions — the header keeps just the back arrow. */}
        {!loadingResources && (
          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#EBEBEB]">
            <button
              type="button"
              onClick={backToCalendar}
              className="h-10 px-[18px] rounded-[11px] border border-th-warm-border bg-transparent text-[13px] font-semibold text-th-warm-text-dark cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className={`flex items-center gap-1.5 h-10 px-5 rounded-[11px] border-none bg-th-brand text-[13px] font-bold text-th-text-inverse shadow-[0_4px_16px_rgba(13,148,136,0.30)] transition-all duration-150 ${
                saving ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
            >
              <Save size={14} /> {saving ? "Creating…" : "Create Booking"}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewBooking;
