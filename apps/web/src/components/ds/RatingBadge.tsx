export interface RatingBadgeProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  className?: string;
}

export default function RatingBadge({
  rating,
  reviewCount,
  size = "md",
  className = "",
}: RatingBadgeProps) {
  const textSize = size === "sm" ? "text-[12px]" : "text-[14px]";

  return (
    <div className={`flex items-center gap-1 font-sans ${textSize} ${className}`}>
      <span className="text-ds-dune leading-none select-none" aria-hidden="true">
        ★
      </span>
      <span className="font-semibold text-ds-charcoal leading-none">
        {rating.toFixed(2)}
      </span>
      {reviewCount !== undefined && (
        <span className="text-ds-slate leading-none">
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}
