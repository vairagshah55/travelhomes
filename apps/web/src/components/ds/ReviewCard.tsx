import { useState } from "react";

export interface ReviewCardProps {
  author: string;
  avatarUrl?: string;
  date: string;
  rating: number;
  text: string;
  maxLines?: number;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function StarRow({ rating }: { rating: number }) {
  const clamped = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="text-[14px] leading-none select-none"
          style={{ color: i < clamped ? "var(--ds-dune)" : "var(--ds-pebble)" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewCard({
  author,
  avatarUrl,
  date,
  rating,
  text,
  maxLines = 4,
  className = "",
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Estimate whether the text could be clamped. We show "Read more" toggle
  // only when the text is long enough to likely overflow `maxLines` lines.
  // The webkit-line-clamp does the visual clamping; the button lets users
  // toggle it. We always render the button if text is over ~120 chars * maxLines/4.
  const isLongText = text.length > 80 * (maxLines / 4);

  return (
    <div
      className={`bg-ds-white font-sans flex flex-col gap-3 ${className}`}
      style={{
        border: "1px solid var(--ds-pebble)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      {/* Top row: avatar + author + date */}
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${author}'s avatar`}
            className="w-10 h-10 object-cover shrink-0"
            style={{ borderRadius: 999 }}
          />
        ) : (
          <div
            className="w-10 h-10 shrink-0 bg-ds-sky text-ds-deep flex items-center justify-center font-sans font-semibold text-[13px] select-none"
            style={{ borderRadius: 999 }}
            aria-label={`${author} initials`}
          >
            {getInitials(author)}
          </div>
        )}

        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[14px] font-medium text-ds-charcoal leading-tight truncate">
            {author}
          </span>
          <span className="text-[13px] text-ds-slate leading-none">{date}</span>
        </div>
      </div>

      {/* Star rating */}
      <StarRow rating={rating} />

      {/* Review text */}
      <div>
        <p
          className="text-[15px] text-ds-charcoal leading-[1.55]"
          style={
            expanded
              ? undefined
              : {
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: maxLines,
                  overflow: "hidden",
                }
          }
        >
          {text}
        </p>

        {isLongText && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-1 text-[13px] font-medium text-ds-ocean underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ocean focus-visible:ring-offset-1 rounded-sm"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
    </div>
  );
}
