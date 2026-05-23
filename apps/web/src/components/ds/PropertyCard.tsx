import WishlistButton from './WishlistButton';
import PriceTag from './PriceTag';
import RatingBadge from './RatingBadge';
import SuperhostBadge from './SuperhostBadge';

export interface PropertyCardProps {
  id: string;
  imageUrl: string;
  images?: string[];
  title: string;
  location: string;
  rating?: number;
  reviewCount?: number;
  price: number;
  originalPrice?: number;
  isSuperhost?: boolean;
  isWishlisted?: boolean;
  onWishlistToggle?: (id: string) => void;
  onCardClick?: (id: string) => void;
  badges?: string[];
  className?: string;
}

export default function PropertyCard({
  id,
  imageUrl,
  title,
  location,
  rating,
  reviewCount,
  price,
  originalPrice,
  isSuperhost = false,
  isWishlisted = false,
  onWishlistToggle,
  onCardClick,
  badges,
  className = '',
}: PropertyCardProps) {
  const visibleBadges = badges?.slice(0, 2);

  function handleCardClick() {
    onCardClick?.(id);
  }

  function handleWishlistClick(e: React.MouseEvent) {
    e.stopPropagation();
    onWishlistToggle?.(id);
  }

  return (
    <div
      role="article"
      onClick={handleCardClick}
      className={[
        'group bg-ds-white rounded-[12px] overflow-hidden cursor-pointer',
        'transition-all duration-200 ease-in-out',
        'hover:shadow-[var(--ds-shadow-card)] hover:-translate-y-0.5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="object-cover w-full h-full transition-transform duration-200 ease-in-out group-hover:scale-105"
        />

        {/* Wishlist button — stopPropagation so card click doesn't fire */}
        <div className="absolute top-3 right-3" onClick={handleWishlistClick}>
          <WishlistButton
            isWishlisted={isWishlisted}
            onToggle={() => onWishlistToggle?.(id)}
          />
        </div>
      </div>

      {/* Card body */}
      <div className="pt-3 flex flex-col gap-1.5">
        {/* Row 1: location + rating */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] text-ds-slate font-sans leading-none truncate">
            {location}
          </span>
          {rating !== undefined && (
            <RatingBadge
              rating={rating}
              reviewCount={reviewCount}
              size="sm"
              className="shrink-0"
            />
          )}
        </div>

        {/* Row 2: title */}
        <p className="text-[15px] font-medium text-ds-charcoal font-sans line-clamp-1 leading-snug">
          {title}
        </p>

        {/* Row 3: superhost badge */}
        {isSuperhost && <SuperhostBadge />}

        {/* Row 4: badge pills */}
        {visibleBadges && visibleBadges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleBadges.map((badge) => (
              <span
                key={badge}
                className="bg-ds-sky text-ds-ocean text-[11px] rounded-full px-2 py-0.5 font-sans leading-none"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Row 5: price */}
        <PriceTag price={price} originalPrice={originalPrice} className="mt-0.5" />
      </div>
    </div>
  );
}
