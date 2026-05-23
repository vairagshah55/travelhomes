import { Heart } from "lucide-react";

export interface WishlistButtonProps {
  isWishlisted: boolean;
  onToggle: () => void;
  className?: string;
}

export default function WishlistButton({
  isWishlisted,
  onToggle,
  className = "",
}: WishlistButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isWishlisted}
      className={`
        w-9 h-9 flex items-center justify-center rounded-full bg-white
        shadow-[0_2px_8px_rgba(0,0,0,0.15)]
        transition-transform duration-200 ease-in-out
        hover:scale-110 active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ocean
        ${className}
      `}
    >
      <Heart
        size={18}
        strokeWidth={2}
        className="transition-colors duration-200"
        fill={isWishlisted ? "#E24B4A" : "none"}
        stroke={isWishlisted ? "#E24B4A" : "#2C2C2A"}
      />
    </button>
  );
}
