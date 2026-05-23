import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "./ScrollReveal";
import { ArrowRight } from "lucide-react";

const STATS = [
  { value: "500+", label: "Verified hosts" },
  { value: "10K+", label: "Bookings" },
  { value: "50+", label: "Destinations" },
];

export function ServiceListingBanner() {
  const navigate = useNavigate();

  return (
    <ScrollReveal delay={0.05}>
      <section className="my-8 md:my-12">
        <motion.div
          className="relative rounded-3xl overflow-hidden bg-[#F7F7F7] border border-[#EBEBEB]"
          whileHover={{ scale: 1.002 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] items-center">

            {/* Left — copy */}
            <motion.div
              className="px-8 md:px-12 lg:px-14 py-10 md:py-14 flex flex-col gap-6"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h3 className="text-[28px] md:text-[40px] lg:text-[44px] font-semibold text-[#222222] leading-[1.1] tracking-tight">
                It's easy to <span className="text-[#FF385C]">host</span> on Travel Homes.
              </h3>
              <p className="text-[#717171] text-base md:text-[15px] leading-relaxed max-w-md">
                Earn extra income with your caravan, unique stay, or activity.
                Full transparency, instant payouts — list in minutes.
              </p>

              {/* Stats */}
              <div className="flex gap-8 md:gap-12 pt-2">
                {STATS.map(({ value, label }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-xl md:text-[26px] font-semibold text-[#222222] leading-none">{value}</span>
                    <span className="text-xs text-[#717171] leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => navigate("/hostwithus")}
                className="group bg-[#FF385C] hover:bg-[#E31C5F] text-white rounded-full px-8 h-12 font-semibold shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] flex items-center gap-2 w-fit mt-2"
              >
                Become a Host
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </motion.div>

            {/* Right — image */}
            <motion.div
              className="relative h-64 lg:h-full min-h-[280px] lg:min-h-[420px]"
              initial={{ opacity: 0, scale: 1.02 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <img
                src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80&auto=format"
                alt="Host on Travel Homes"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </motion.div>

          </div>
        </motion.div>
      </section>
    </ScrollReveal>
  );
}
