import React from "react";
import { Clock, CheckCircle2, Home } from "lucide-react";

interface StayStatusScreensProps {
  status: string;
  primaryPropertyName?: string;
  stayType: "entire" | "individual";
  onGoDashboard: () => void;
  onSubmitAnother: () => void;
  /**
   * Re-enter the wizard for a still-pending submission. Pending-only: the
   * backend reuses a pending/draft/rejected submission on resubmit but treats an
   * approved one as a finished listing, so offering "Edit" on an approved stay
   * would quietly create a second listing instead of editing the live one.
   */
  onEdit?: () => void;
}

/**
 * Loading spinner shown while we check whether the user has an existing
 * stay-onboarding submission.
 */
export function StayStatusLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-th-warm-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-th-brand border-t-transparent animate-spin" />
        <p className="text-sm text-th-warm-text-muted">Loading…</p>
      </div>
    </div>
  );
}

/**
 * Read-only status screen for pending/approved submissions. The editable
 * form is hidden so users don't accidentally restart verification — only
 * `rejected` submissions fall through to the normal form for re-editing.
 */
export function StayStatusScreen({
  status,
  primaryPropertyName,
  stayType,
  onGoDashboard,
  onSubmitAnother,
  onEdit,
}: StayStatusScreensProps) {
  const isPending = status === "pending";

  return (
    <div className="min-h-screen flex items-center justify-center bg-th-warm-surface p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgba(13,69,72,0.08)] border border-[#EBEBEB] p-8 flex flex-col items-center gap-6 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: isPending ? "rgba(234,179,8,0.1)" : "rgba(29,158,117,0.1)",
          }}
        >
          {isPending ? (
            <Clock className="w-8 h-8 text-yellow-500" />
          ) : (
            <CheckCircle2 className="w-8 h-8 text-[#1D9E75]" />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-th-text-primary">
            {isPending ? "Submission Under Review" : "Listing Approved!"}
          </h2>
          <p className="text-sm leading-relaxed text-th-warm-text-muted">
            {isPending
              ? "Your stay listing has been submitted and is currently being reviewed by our team. You can still edit the details while it's in review — resubmitting updates this listing rather than creating a new one."
              : "Your stay listing has been approved and is now live for guests to discover and book."}
          </p>
        </div>

        {primaryPropertyName && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-th-brand-soft text-th-brand border border-th-brand-border-soft">
            <Home className="w-4 h-4" />
            {stayType === "entire" ? `Entire ${primaryPropertyName}` : primaryPropertyName}
          </div>
        )}

        {/* Buttons use the shared .onb-btn-* pair so this screen matches the
            caravan pending screen and the wizard footer it sits in front of. */}
        <div className="w-full flex flex-col gap-3 pt-2">
          {isPending && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="onb-btn-primary w-full rounded-full py-3.5 text-[14px]"
            >
              Edit Details
            </button>
          )}
          <button
            type="button"
            onClick={onGoDashboard}
            className="onb-btn-secondary w-full rounded-full py-3.5 text-[14px]"
          >
            Go to Dashboard
          </button>
          {isPending && (
            <button
              type="button"
              onClick={onSubmitAnother}
              className="onb-btn-secondary w-full rounded-full py-3.5 text-[14px]"
            >
              Submit Another Service
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Shown when a DIFFERENT service type is already awaiting admin action.
 *
 * A vendor may only have one submission in review at a time — the backend
 * enforces it in assertNoOtherPendingSubmission — but without this the vendor
 * only found out after filling in the entire stay wizard and hitting submit.
 * Mirrors the caravan flow's equivalent block.
 */
export function StayCrossTypePendingScreen({
  pendingType,
  onViewPending,
  onGoDashboard,
}: {
  pendingType: string;
  onViewPending: () => void;
  onGoDashboard: () => void;
}) {
  const otherLabel = { activity: "activity", caravan: "caravan" }[pendingType] || "listing";

  return (
    <div
      data-onboarding
      className="min-h-screen flex items-center justify-center bg-[color:var(--onb-page-bg,#efeeea)] px-4"
    >
      <div className="bg-th-surface-0 rounded-[18px] border border-[color:var(--onb-card-border)] shadow-[var(--onb-card-shadow)] p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-[16px] bg-th-warn-bright-bg border border-th-warn-bright-border flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-th-warn-bright" strokeWidth={2} />
        </div>
        <h2 className="font-serif text-[23px] font-normal text-th-text-primary tracking-[-0.02em] mb-2">
          You already have a listing pending review
        </h2>
        <p className="text-[14px] leading-[1.6] text-[color:var(--onb-text-secondary,#657477)] mb-5">
          Your {otherLabel} listing is awaiting admin approval. You can add a unique stay listing
          once that's approved or rejected.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onViewPending}
            className="onb-btn-primary w-full rounded-full py-3.5 text-[14px]"
          >
            View {otherLabel} listing
          </button>
          <button
            type="button"
            onClick={onGoDashboard}
            className="onb-btn-secondary w-full rounded-full py-3.5 text-[14px]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline "Service Rejected" banner shown above the form when a vendor
 * resubmits after rejection.
 */
export function StayRejectedBanner({ rejectionReason }: { rejectionReason: string }) {
  return (
    <div className="w-full max-w-4xl p-4 border border-red-200 bg-red-50 rounded-md">
      <h3 className="text-red-800 font-semibold mb-1">Service Rejected</h3>
      <p className="text-red-700 text-sm">Reason: {rejectionReason || "No reason provided"}</p>
      <p className="text-red-600 text-xs mt-2">
        Please update the details and resubmit for approval.
      </p>
    </div>
  );
}
