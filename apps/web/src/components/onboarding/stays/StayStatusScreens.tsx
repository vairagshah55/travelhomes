import React from "react";
import { Clock, CheckCircle2, Home } from "lucide-react";

interface StayStatusScreensProps {
  status: string;
  primaryPropertyName?: string;
  stayType: "entire" | "individual";
  onGoDashboard: () => void;
  onSubmitAnother: () => void;
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
          <h2 className="text-xl font-semibold text-[#0d4548]">
            {isPending ? "Submission Under Review" : "Listing Approved!"}
          </h2>
          <p className="text-sm leading-relaxed text-th-warm-text-muted">
            {isPending
              ? "Your stay listing has been submitted and is currently being reviewed by our team. You'll be notified once a decision is made."
              : "Your stay listing has been approved and is now live for guests to discover and book."}
          </p>
        </div>

        {primaryPropertyName && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-th-brand-soft text-th-brand border border-[rgba(59,217,218,0.4)]">
            <Home className="w-4 h-4" />
            {stayType === "entire" ? `Entire ${primaryPropertyName}` : primaryPropertyName}
          </div>
        )}

        <div className="w-full flex flex-col gap-3 pt-2">
          <button
            onClick={onGoDashboard}
            className="w-full py-3 rounded-xl text-th-text-inverse text-sm font-semibold transition-opacity hover:opacity-90 bg-th-brand"
          >
            Go to Dashboard
          </button>
          {isPending && (
            <button
              onClick={onSubmitAnother}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 bg-transparent text-th-warm-text-muted border border-th-warm-border"
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
