import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, Layers, Store, Users2, type LucideIcon } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { MotionReveal } from "@/components/admin/MotionReveal";
import { useAuth } from "@/contexts/AdminAuthContext";
import { featureForPath } from "@/lib/adminPermissions";

interface ManageCard {
  title: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  path: string;
}

/* Each area gets its own hue so the four cards stay scannable at a glance. */
const CARDS: ManageCard[] = [
  {
    title: "Listings",
    desc: "Review, approve and manage every property & experience listing.",
    icon: Layers,
    color: "#2563EB",
    path: "/admin/management/listing",
  },
  {
    title: "Users",
    desc: "Browse guest accounts, KYC status and account activity.",
    icon: Users2,
    color: "#7C3AED",
    path: "/admin/management/user",
  },
  {
    title: "Vendors",
    desc: "Onboard, verify and oversee host & vendor accounts.",
    icon: Store,
    color: "#0891B2",
    path: "/admin/management/vendor",
  },
  {
    title: "Bookings",
    desc: "Track reservations, statuses and the full booking history.",
    icon: CalendarCheck,
    color: "#16A34A",
    path: "/admin/management/booking",
  },
];

/**
 * Management hub — a card-based entry point to the four management areas.
 * Replaces the old sidebar sub-menu: the sidebar's "Management" item now links
 * here, and each card routes to its section.
 */
const ManagementOverview = () => {
  const navigate = useNavigate();
  const { can } = useAuth();

  // Only offer areas this role can actually open — the routes are gated, so an
  // ungated card would just bounce the user back here.
  const cards = CARDS.filter((c) => {
    const feature = featureForPath(c.path);
    return !feature || can(feature);
  });

  return (
    <AdminLayout title="Management" subtitle="Choose an area to manage">
      <MotionReveal delay={0}>
        {cards.length === 0 && (
          <p className="text-[13px] text-gray-500">
            Your role doesn't include access to any management area yet.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          {cards.map((c, i) => (
            <motion.button
              key={c.title}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.28, ease: "easeOut" }}
              onClick={() => navigate(c.path)}
              aria-label={`${c.title} — ${c.desc}`}
              className="group relative overflow-hidden text-left bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 outline-none transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.10)] hover:border-gray-300 focus-visible:ring-2 focus-visible:ring-[#3bd9da] focus-visible:ring-offset-2"
            >
              {/* Top accent stripe — the card's hue bleeding from the icon corner */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 opacity-80"
                style={{ background: `linear-gradient(90deg, ${c.color}, transparent)` }}
              />

              <div className="flex items-start justify-between">
                <span
                  className="size-12 rounded-xl grid place-items-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                  style={{ backgroundColor: `${c.color}1a`, color: c.color }}
                >
                  <c.icon size={24} strokeWidth={2} />
                </span>
                <ArrowRight
                  size={18}
                  className="text-gray-300 transition-all duration-200 group-hover:text-[#117479] group-hover:translate-x-1"
                />
              </div>

              <h3 className="mt-4 text-[17px] font-bold text-gray-900 tracking-tight">{c.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{c.desc}</p>
            </motion.button>
          ))}
        </div>
      </MotionReveal>
    </AdminLayout>
  );
};

export default ManagementOverview;
