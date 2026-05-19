type BadgeStatus =
  | "active" | "inactive" | "pending" | "banned"
  | "verified" | "unverified" | "suspended"
  | "confirmed" | "cancelled" | "completed" | "refunded"
  | "open" | "resolved" | "closed" | "in_progress"
  | "approved" | "rejected" | "draft" | "published";

interface StatusBadgeProps {
  status: BadgeStatus | string;
  size?: "sm" | "md";
  dot?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  active:      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  confirmed:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  approved:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  published:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  completed:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  resolved:    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  pending:     "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  in_progress: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  draft:       "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  banned:      "bg-red-50 text-red-700 ring-1 ring-red-200/60",
  cancelled:   "bg-red-50 text-red-700 ring-1 ring-red-200/60",
  rejected:    "bg-red-50 text-red-700 ring-1 ring-red-200/60",
  suspended:   "bg-red-50 text-red-700 ring-1 ring-red-200/60",
  inactive:    "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60",
  closed:      "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60",
  unverified:  "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60",
  verified:    "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  open:        "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  refunded:    "bg-purple-50 text-purple-700 ring-1 ring-purple-200/60",
};

export function StatusBadge({ status, size = "md", dot = true }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  const colors = COLOR_MAP[key] ?? "bg-gray-100 text-gray-500";
  const sizeClass = size === "sm"
    ? "text-[10px] px-1.5 py-0.5"
    : "text-[11px] px-2 py-0.5";
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${colors}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />}
      {label}
    </span>
  );
}

export default StatusBadge;
