export interface SuperhostBadgeProps {
  className?: string;
}

const ShieldIcon = () => (
  <svg
    width="11"
    height="13"
    viewBox="0 0 11 13"
    fill="none"
    aria-hidden="true"
    className="shrink-0"
  >
    <path
      d="M5.5 0.5L1 2.5V6C1 8.76 3 11.35 5.5 12C8 11.35 10 8.76 10 6V2.5L5.5 0.5Z"
      fill="currentColor"
    />
  </svg>
);

export default function SuperhostBadge({ className = "" }: SuperhostBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans font-semibold uppercase tracking-[0.05em] text-[11px] text-ds-forest bg-ds-lagoon rounded-full px-[10px] py-1 ${className}`}
      style={{ border: "1px solid rgba(29,158,117,0.3)" }}
    >
      <ShieldIcon />
      Superhost
    </span>
  );
}
