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
          // Brand-cyan panel carrying WHITE copy — the --th-brand / --th-brand-fg
          // pairing from global.css. That pairing is 1.6:1 and is a deliberate
          // product decision for brand consistency; see the note on --th-brand
          // before "fixing" this to ink. Hierarchy comes from size/weight here,
          // not opacity — stepped white washes out against a light cyan.
          className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#3BD9DA] border border-[#2BC7C8]"
          whileHover={{ scale: 1.002 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Image first on mobile: the photo sells the pitch, and a wall of
              copy above it is what a thumb scrolls straight past. */}
          <div className="flex flex-col-reverse lg:grid lg:grid-cols-[1.1fr_0.9fr] items-center">
            {/* Copy */}
            <motion.div
              className="w-full px-5 sm:px-8 md:px-12 lg:px-14 py-7 md:py-14 flex flex-col gap-5 md:gap-6"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h3 className="text-[24px] sm:text-[28px] md:text-[40px] lg:text-[44px] font-semibold text-white leading-[1.12] tracking-tight text-balance">
                It's easy to{" "}
                <span className="underline decoration-[3px] underline-offset-4 decoration-white/70">
                  host
                </span>{" "}
                on Travel Homes.
              </h3>
              <p className="text-white text-[14px] md:text-[15px] leading-relaxed max-w-md">
                Earn extra income with your caravan, unique stay, or activity. Full transparency,
                instant payouts — list in minutes.
              </p>

              {/* Stats — an even 3-up grid, because three flex columns with
                  gap-8 collide on a 320px screen. */}
              <div className="grid grid-cols-3 gap-3 md:flex md:gap-12 pt-1 md:pt-2">
                {STATS.map(({ value, label }) => (
                  <div key={label} className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-lg md:text-[26px] font-semibold text-white leading-none">
                      {value}
                    </span>
                    <span className="text-[11px] md:text-xs text-white leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => navigate("/hostwithus")}
                // White fill now does the contrast work against the cyan
                // panel on its own, so the earlier white border is gone —
                // it'd just be invisible on top of a white button anyway.
                // text-[#117479] is the site's actual brand teal (the same
                // shade used for icons/text on white elsewhere, e.g. the
                // search pill) — not the one-off blue tried earlier.
                className="group bg-white hover:bg-[#e6fafa] text-[#117479] rounded-full px-8 h-12 font-semibold shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 w-full md:w-fit mt-1 md:mt-2"
              >
                Become a Host
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Button>
            </motion.div>

            {/* Image */}
            <motion.div
              className="relative w-full h-44 sm:h-64 lg:h-full lg:min-h-[420px]"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <img
                src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80&auto=format&fit=crop"
                srcSet={[640, 828, 1200]
                  .map(
                    (w) =>
                      `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=${w}&q=75&auto=format&fit=crop ${w}w`,
                  )
                  .join(", ")}
                sizes="(min-width: 1024px) 45vw, 100vw"
                loading="lazy"
                decoding="async"
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
