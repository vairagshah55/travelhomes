export interface PriceTagProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  className?: string;
}

export default function PriceTag({
  price,
  originalPrice,
  currency = "₹",
  className = "",
}: PriceTagProps) {
  const format = (n: number) => n.toLocaleString("en-IN");

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {originalPrice !== undefined && (
        <span className="text-[13px] leading-none text-ds-slate line-through font-sans">
          {currency}&nbsp;{format(originalPrice)}
        </span>
      )}
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-[22px] font-semibold leading-none text-ds-deep">
          {currency}&nbsp;{format(price)}
        </span>
        <span className="text-[13px] leading-none text-ds-slate font-sans">/night</span>
      </div>
    </div>
  );
}
