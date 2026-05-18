import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "./ScrollReveal";
import { ShieldCheck, TrendingUp, MapPin, ArrowRight } from "lucide-react";

const STATS = [
  { icon: ShieldCheck, value: "500+", label: "Verified Vendors" },
  { icon: TrendingUp, value: "10K+", label: "Happy Bookings" },
  { icon: MapPin, value: "50+", label: "Destinations" },
];

export function ServiceListingBanner() {
  const navigate = useNavigate();

  return (
    <ScrollReveal delay={0.05}>
      <section className="my-8 md:my-12 overflow-hidden rounded-2xl md:rounded-3xl">
        <motion.div
          className="relative rounded-2xl md:rounded-3xl overflow-hidden"
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#112244] to-[#0e2040]" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-400/8 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 p-8 md:p-12 lg:p-16">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

              {/* Left — copy */}
              <motion.div
                className="flex-1 space-y-4 text-center lg:text-left"
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
              >
                <p className="text-xs font-bold tracking-[0.18em] uppercase text-cyan-400">
                  For Vendors & Hosts
                </p>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  List Your Service.{" "}
                  <span className="text-cyan-400">Earn More.</span>
                </h3>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-md mx-auto lg:mx-0">
                  Join hundreds of verified vendors on Travel Homes. Full transparency,
                  no hidden fees — the price you see is always final.
                </p>
              </motion.div>

              {/* Right — stats + CTA */}
              <motion.div
                className="flex flex-col items-center gap-7 w-full lg:w-auto"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.2 }}
              >
                <div className="flex gap-8 md:gap-12">
                  {STATS.map(({ icon: Icon, value, label }) => (
                    <div key={label} className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Icon size={18} className="text-cyan-400" />
                      </div>
                      <span className="text-xl font-bold text-white">{value}</span>
                      <span className="text-[11px] text-gray-400 text-center leading-tight">{label}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => navigate("/hostwithus")}
                  className="group bg-white text-gray-900 hover:bg-cyan-400 hover:text-gray-900 rounded-full px-8 h-12 font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
                >
                  Start Listing Today
                  <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </section>
    </ScrollReveal>
  );
}
