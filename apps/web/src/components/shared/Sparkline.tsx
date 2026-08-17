import React, { useId } from "react";

/**
 * A trend line small enough to live inside a KPI card.
 *
 * Hand-drawn SVG rather than a Recharts `<LineChart>`: Recharts needs a
 * `ResponsiveContainer` (a ResizeObserver per instance) and renders a full
 * cartesian grid engine to draw ~12 points. Four of those in a stat row is a
 * measurable amount of layout work for a decoration.
 *
 * No axes, no labels, no tooltip — a sparkline answers "which way is this
 * going", and anything more precise belongs in the chart the card links to.
 * It is `aria-hidden` for the same reason: the number and its delta beside it
 * already carry the meaning for a screen reader.
 */
export const Sparkline = ({
  data,
  className = "",
  width = 96,
  height = 28,
  /** Renders red instead of the brand colour when the series is trending down. */
  negative = false,
  strokeWidth = 1.6,
}: {
  data: number[];
  className?: string;
  width?: number;
  height?: number;
  negative?: boolean;
  strokeWidth?: number;
}) => {
  const gradientId = useId();

  // Fewer than two points is not a trend. Render nothing rather than a dot,
  // which reads as a rendering fault.
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  // A flat series would divide by zero and collapse to the top edge; pin it to
  // the vertical middle instead, which is the honest picture of "no change".
  const span = max - min || 1;
  const pad = strokeWidth;
  const stepX = (width - pad * 2) / (data.length - 1);
  const scaleY = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);

  const points = data.map((v, i) => [pad + i * stepX, scaleY(v)] as const);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${(pad + (data.length - 1) * stepX).toFixed(2)},${height} L${pad},${height} Z`;

  const stroke = negative ? "#dc2626" : "hsl(var(--brand))";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Sparkline;
