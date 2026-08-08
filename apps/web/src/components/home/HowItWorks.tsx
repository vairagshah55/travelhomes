import React from "react";
import { motion } from "framer-motion";
import { Search, CalendarCheck, Compass } from "lucide-react";
import { ScrollReveal, staggerContainer, staggerItem } from "./ScrollReveal";

// `accent` is the glyph on the cyan disc.
const STEPS = [
  {
    icon: Search,
    step: "01",
    title: "Search & Discover",
    description:
      "Browse campervans, unique stays, and activities across India. Filter by location, date, and budget to find your perfect match.",
    accent: "#FFFFFF",
    bg: "#3BD9DA",
  },
  {
    icon: CalendarCheck,
    step: "02",
    title: "Book Instantly",
    description:
      "Secure your booking in seconds with a seamless checkout. Pay safely, get instant confirmation, and receive your itinerary details.",
    accent: "#FFFFFF",
    bg: "#3BD9DA",
  },
  {
    icon: Compass,
    step: "03",
    title: "Explore & Enjoy",
    description:
      "Pack your bags and go! From Himalayan trails to coastal stays, every Travel Homes experience is curated for unforgettable moments.",
    accent: "#FFFFFF",
    bg: "#3BD9DA",
  },
];

export function HowItWorks() {
  return (
    <ScrollReveal delay={0.05}>
      <section className="py-10 md:py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-6 md:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-[20px] md:text-[32px] font-semibold text-[#0a1c1c] tracking-tight">
            How Travel Homes Works
          </h2>
          <p className="text-[13px] md:text-sm text-[#717171] mt-2 max-w-md mx-auto leading-relaxed">
            From search to stay — three easy steps to your next adventure.
          </p>
        </motion.div>

        {/* Steps grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-8 max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
        >
          {STEPS.map(({ icon: Icon, step, title, description, accent, bg }, i) => (
            <motion.div
              key={step}
              variants={staggerItem}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              // Icon beside the copy on phones — three stacked 200px-tall cards
              // is a lot of scrolling for one explainer.
              className="relative flex flex-row md:flex-col items-start gap-4 md:gap-5 p-4 md:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Connector line — neutral (desktop) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-8 h-px bg-[#DDDDDD] z-10" />
              )}

              {/* Icon circle + step badge */}
              <div className="relative inline-flex w-fit flex-shrink-0">
                <div
                  className="w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: bg }}
                >
                  <Icon size={20} className="md:hidden" style={{ color: accent }} strokeWidth={2} />
                  <Icon
                    size={24}
                    className="hidden md:block"
                    style={{ color: accent }}
                    strokeWidth={2}
                  />
                </div>
                {/* White badge, teal numerals. Separates from the cyan disc
                    by fill (white vs #3BD9DA) rather than by going to ink —
                    #117479 text still reads clearly on white. Ring
                    thickened + shadow so the badge lifts off the disc
                    instead of just sitting flush against it. */}
                <span className="absolute -top-1.5 -left-1.5 w-[22px] h-[22px] md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-[11px] font-bold text-[#117479] bg-white ring-[3px] ring-white dark:ring-gray-900 shadow-md">
                  {step}
                </span>
              </div>

              {/* Text */}
              <div className="space-y-1 md:space-y-1.5 min-w-0">
                <h3 className="text-[15px] md:text-[17px] font-semibold text-[#0a1c1c]">{title}</h3>
                <p className="text-[13px] md:text-sm text-[#717171] leading-relaxed">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </ScrollReveal>
  );
}
