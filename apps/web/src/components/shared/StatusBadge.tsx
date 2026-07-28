import React from "react";

type Size = "sm" | "md";

interface StatusBadgeProps {
  status: string;
  size?: Size;
  dot?: boolean;
  className?: string;
}

/**
 * Single canonical status badge used across Frontend (vendor) and Admin.
 * Colors are semantic (success / warning / info / danger / neutral) — NOT
 * brand-tinted — so the same component is correct in either route-group.
 */
const COLOR_MAP: Record<string, string> = {
  // positive
  active:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
  confirmed:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
  approved:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
  published:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
  completed:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
  resolved:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",
  success:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30",

  // warning / in-progress
  pending:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  in_progress:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  "in-progress":
    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  processing:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  draft:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  unverified:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  open: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  upcoming:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",

  // info
  verified:
    "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30",
  info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30",
  // helpdesk tickets move Pending → Read → Resolved
  read: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30",

  // accent
  refunded:
    "bg-purple-50 text-purple-700 ring-1 ring-purple-200/60 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/30",

  // neutral
  inactive:
    "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10",
  closed:
    "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10",
  past: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10",

  // negative
  banned:
    "bg-red-50 text-red-700 ring-1 ring-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
  cancelled:
    "bg-red-50 text-red-700 ring-1 ring-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
  rejected:
    "bg-red-50 text-red-700 ring-1 ring-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
  suspended:
    "bg-red-50 text-red-700 ring-1 ring-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
  failed:
    "bg-red-50 text-red-700 ring-1 ring-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
  error:
    "bg-red-50 text-red-700 ring-1 ring-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30",
};

const DOT_MAP: Record<string, string> = {
  active: "bg-emerald-500",
  confirmed: "bg-emerald-500",
  approved: "bg-emerald-500",
  published: "bg-emerald-500",
  completed: "bg-emerald-500",
  resolved: "bg-emerald-500",
  paid: "bg-emerald-500",
  success: "bg-emerald-500",
  pending: "bg-amber-500",
  in_progress: "bg-amber-500",
  "in-progress": "bg-amber-500",
  processing: "bg-amber-500",
  draft: "bg-amber-500",
  unverified: "bg-amber-500",
  open: "bg-amber-500",
  upcoming: "bg-amber-500",
  verified: "bg-blue-500",
  info: "bg-blue-500",
  read: "bg-blue-500",
  refunded: "bg-purple-500",
  inactive: "bg-gray-400",
  closed: "bg-gray-400",
  past: "bg-gray-400",
  banned: "bg-red-500",
  cancelled: "bg-red-500",
  rejected: "bg-red-500",
  suspended: "bg-red-500",
  failed: "bg-red-500",
  error: "bg-red-500",
};

const FALLBACK =
  "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10";
const FALLBACK_DOT = "bg-gray-400";

export function StatusBadge({ status, size = "md", dot = true, className = "" }: StatusBadgeProps) {
  const key = (status || "").toLowerCase().replace(/\s+/g, "_");
  const tone = COLOR_MAP[key] ?? FALLBACK;
  const dotTone = DOT_MAP[key] ?? FALLBACK_DOT;
  const sizing =
    size === "sm" ? "text-[10.5px] px-2 py-0.5 gap-1" : "text-[11px] px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold capitalize ${tone} ${sizing} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotTone}`} />}
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default StatusBadge;
