export interface MapPinProps {
  price: number;
  currency?: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

function formatPrice(price: number): string {
  return price.toLocaleString("en-IN");
}

export default function MapPin({
  price,
  currency = "₹",
  isActive = false,
  onClick,
  className = "",
}: MapPinProps) {
  const pillBg = isActive ? "var(--ds-navy)" : "var(--ds-deep)";
  const pillShadow = isActive
    ? "0 4px 16px rgba(4,44,83,0.45)"
    : "0 2px 8px rgba(24,95,165,0.3)";

  return (
    <div
      className={`relative inline-flex flex-col items-center ${className}`}
      style={{ position: "relative" }}
    >
      {/* Price pill */}
      <button
        type="button"
        onClick={onClick}
        aria-label={`${currency}${formatPrice(price)}`}
        className="
          font-mono font-semibold text-ds-white
          transition-transform duration-200
          hover:scale-105
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ocean focus-visible:ring-offset-2
          active:scale-95
          cursor-pointer
        "
        style={{
          fontSize: 13,
          lineHeight: 1,
          padding: "6px 12px",
          borderRadius: 999,
          background: pillBg,
          boxShadow: pillShadow,
          transform: isActive ? "scale(1.1)" : undefined,
          transformOrigin: "bottom center",
          whiteSpace: "nowrap",
          border: "none",
        }}
      >
        {currency}
        {formatPrice(price)}
      </button>

      {/* Downward triangle pointer */}
      <span
        aria-hidden="true"
        style={{
          display: "block",
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: `6px solid ${pillBg}`,
          marginTop: 0,
        }}
      />
    </div>
  );
}
