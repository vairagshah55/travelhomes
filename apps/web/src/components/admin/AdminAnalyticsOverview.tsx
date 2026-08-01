import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  MousePointerClick,
  TrendingUp,
  Building2,
  CalendarDays,
  IndianRupee,
  Tent,
  Home,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { analyticsService } from "@/services/api";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { formatINR } from "@/utils/formatCurrency";

/**
 * Analytics Overview — aggregate KPI strip + per-service performance cards.
 *
 * Data comes from `analyticsService.getOverview()` keyed by service category
 * (camper-van / unique-stay / activity). We render a top-line summary across
 * all services, then a card per service with engagement (impressions/clicks/
 * CTR), an active-vs-total properties bar, and bookings/revenue.
 */

interface CatStats {
  impressions: number;
  clicks: number;
  totalProperties: number;
  activeProperties: number;
  inactiveProperties: number;
  totalBookings: number;
  totalRevenue: number;
}

const SERVICES: { key: string; label: string; color: string; icon: LucideIcon }[] = [
  { key: "camper-van", label: "Camper Van", color: "#117479", icon: Tent },
  { key: "unique-stay", label: "Unique Stay", color: "#a855f7", icon: Home },
  { key: "activity", label: "Activity", color: "#f59e0b", icon: Compass },
];

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const intl = (n: number) => n.toLocaleString("en-IN");

const AdminAnalyticsOverview = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const json = await analyticsService.getOverview();
        setData(json?.data || null);
      } catch (e) {
        console.error("Failed to load analytics overview", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statsFor = (key: string): CatStats => {
    const s = data?.[key] ?? {};
    return {
      impressions: num(s.impressions),
      clicks: num(s.clicks),
      totalProperties: num(s.totalProperties),
      activeProperties: num(s.activeProperties),
      inactiveProperties: num(s.inactiveProperties),
      totalBookings: num(s.totalBookings),
      totalRevenue: num(s.totalRevenue),
    };
  };

  const services = SERVICES.map((s) => ({ ...s, ...statsFor(s.key) }));
  const sum = (f: (c: CatStats) => number) => services.reduce((t, c) => t + f(c), 0);
  const totals = {
    impressions: sum((c) => c.impressions),
    clicks: sum((c) => c.clicks),
    totalProperties: sum((c) => c.totalProperties),
    totalBookings: sum((c) => c.totalBookings),
    totalRevenue: sum((c) => c.totalRevenue),
  };
  const ctr = pct(totals.clicks, totals.impressions);

  const kpis: {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconColor: string;
    nav?: string;
  }[] = [
    { title: "Total Impressions", value: totals.impressions, icon: Eye, iconColor: "#117479" },
    { title: "Total Clicks", value: totals.clicks, icon: MousePointerClick, iconColor: "#3b82f6" },
    { title: "Avg. CTR", value: `${ctr.toFixed(1)}%`, icon: TrendingUp, iconColor: "#22c55e" },
    {
      title: "Total Properties",
      value: totals.totalProperties,
      icon: Building2,
      iconColor: "#a855f7",
      nav: "/management/listing",
    },
    {
      title: "Total Bookings",
      value: totals.totalBookings,
      icon: CalendarDays,
      iconColor: "#ec4899",
      nav: "/management/booking",
    },
    {
      title: "Total Revenue",
      value: formatINR(totals.totalRevenue),
      icon: IndianRupee,
      iconColor: "#f59e0b",
      nav: "/admin/payments",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[116px] rounded-2xl border border-tpl-stroke bg-white dark:bg-tpl-dark-2 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[280px] rounded-2xl border border-tpl-stroke bg-white dark:bg-tpl-dark-2 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aggregate KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <AdminStatCard
            key={k.title}
            title={k.title}
            value={k.value}
            icon={k.icon}
            iconColor={k.iconColor}
            delay={i * 0.05}
            onClick={k.nav ? () => navigate(k.nav!) : undefined}
          />
        ))}
      </div>

      {/* Per-service performance */}
      <div>
        <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-tpl-dark-5 dark:text-tpl-dark-6">
          Performance by service
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {services.map((s, i) => (
            <ServiceCard
              key={s.key}
              s={s}
              delay={i * 0.06}
              onProperties={() => navigate("/management/listing")}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Engagement stat tile ─────────────────────────────────────────────────── */
function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-tpl-stroke bg-[var(--glass-bg)] p-3">
      <div className="flex items-center gap-1.5 text-tpl-dark-5 dark:text-tpl-dark-6 mb-1">
        <Icon size={13} />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold text-tpl-dark dark:text-white tabular-nums">{value}</p>
    </div>
  );
}

/* ── Per-service performance card ─────────────────────────────────────────── */
function ServiceCard({
  s,
  delay,
  onProperties,
}: {
  s: CatStats & { label: string; color: string; icon: LucideIcon };
  delay: number;
  onProperties: () => void;
}) {
  const ctr = pct(s.clicks, s.impressions);
  const activeRate = pct(s.activeProperties, s.totalProperties);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-5 bg-app-surface rounded-[18px] border border-app-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)] p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
            style={{ backgroundColor: `${s.color}1f`, color: s.color }}
          >
            <s.icon size={20} />
          </span>
          <h3 className="text-base font-bold text-tpl-dark dark:text-white truncate">{s.label}</h3>
        </div>
        <span
          className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full tabular-nums"
          style={{ backgroundColor: `${s.color}1f`, color: s.color }}
        >
          {ctr.toFixed(1)}% CTR
        </span>
      </div>

      {/* Engagement */}
      <div className="grid grid-cols-2 gap-3">
        <Stat icon={Eye} label="Impressions" value={intl(s.impressions)} />
        <Stat icon={MousePointerClick} label="Clicks" value={intl(s.clicks)} />
      </div>

      {/* Properties — active vs total */}
      <button onClick={onProperties} className="text-left group">
        <div className="flex items-center justify-between text-[12px] mb-2">
          <span className="font-medium text-tpl-dark-5 dark:text-tpl-dark-6 group-hover:text-tpl-primary transition-colors">
            Properties
          </span>
          <span className="font-semibold text-tpl-dark dark:text-white tabular-nums">
            {s.totalProperties}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--glass-bg-hover)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${activeRate}%`, backgroundColor: s.color }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-tpl-dark-5 dark:text-tpl-dark-6">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            {intl(s.activeProperties)} active
          </span>
          <span>{intl(s.inactiveProperties)} inactive</span>
        </div>
      </button>

      {/* Bookings + Revenue */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-tpl-stroke">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-tpl-dark-5 dark:text-tpl-dark-6 mb-0.5">
            Bookings
          </p>
          <p className="text-lg font-bold text-tpl-dark dark:text-white tabular-nums">
            {intl(s.totalBookings)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-tpl-dark-5 dark:text-tpl-dark-6 mb-0.5">
            Revenue
          </p>
          <p className="text-lg font-bold text-tpl-dark dark:text-white tabular-nums">
            {formatINR(s.totalRevenue)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default AdminAnalyticsOverview;
