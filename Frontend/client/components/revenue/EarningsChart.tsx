import React from "react";
import { ChevronDown } from "lucide-react";
import { TEAL, GRAY_500, GRAY_400, GRAY_200, WHITE, SURFACE } from "./tokens";

interface ChartItem {
  month: string;
  value: number;
}

export const EarningsChart: React.FC<{
  loading: boolean;
  chartData: ChartItem[];
  totalEarnings: string;
}> = ({ loading, chartData, totalEarnings }) => {
  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <div
      style={{
        backgroundColor: WHITE,
        border: "1.5px solid #EBEBEB",
        borderRadius: 20,
        padding: "20px 22px 22px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>Total Earnings</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: TEAL, marginTop: 2 }}>₹ {totalEarnings}</p>
        </div>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 10,
            backgroundColor: SURFACE, border: `1.5px solid ${GRAY_200}`,
            fontSize: 13, fontWeight: 600, color: GRAY_500,
            cursor: "pointer",
          }}
        >
          Monthly <ChevronDown size={14} />
        </div>
      </div>

      {/* Chart area */}
      <div style={{ position: "relative", height: 200, backgroundColor: SURFACE, borderRadius: 14, padding: "12px 16px 12px 36px" }}>
        {loading ? (
          <div className="flex items-end justify-between h-full gap-1.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-t animate-pulse bg-gray-200 dark:bg-gray-600" style={{ height: `${20 + Math.random() * 60}%` }} />
            ))}
          </div>
        ) : (
          <div className="flex items-end justify-between h-full gap-1">
            {chartData.map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  style={{
                    width: "100%", maxWidth: 32,
                    borderRadius: "8px 8px 0 0",
                    background: `linear-gradient(to top, ${TEAL}, rgba(7,228,228,0.4))`,
                    height: `${Math.max(4, (item.value / maxValue) * 100)}%`,
                    transition: "height 0.6s ease",
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, color: GRAY_400 }}>{item.month}</span>
              </div>
            ))}
          </div>
        )}

        {/* Y-Axis */}
        <div style={{ position: "absolute", left: 4, top: 12, height: "calc(100% - 36px)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {[maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0].map((val) => (
            <span key={val} style={{ fontSize: 10, color: GRAY_400, fontWeight: 600 }}>{val}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
