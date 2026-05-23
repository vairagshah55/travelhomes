import React from "react";
import { motion } from "framer-motion";
import { Search, CalendarCheck, Compass } from "lucide-react";
import { ScrollReveal, staggerContainer, staggerItem } from "./ScrollReveal";

const STEPS = [
  {
    icon: Search,
    step: "01",
    title: "Search & Discover",
    description:
      "Browse campervans, unique stays, and activities across India. Filter by location, date, and budget to find your perfect match.",
    accent: "#222222",
    bg: "#F7F7F7",
  },
  {
    icon: CalendarCheck,
    step: "02",
    title: "Book Instantly",
    description:
      "Secure your booking in seconds with a seamless checkout. Pay safely, get instant confirmation, and receive your itinerary details.",
    accent: "#FF385C",
    bg: "#FFE8EE",
  },
  {
    icon: Compass,
    step: "03",
    title: "Explore & Enjoy",
    description:
      "Pack your bags and go! From Himalayan trails to coastal stays, every Travel Homes experience is curated for unforgettable moments.",
    accent: "#222222",
    bg: "#F7F7F7",
  },
];

export function HowItWorks() {
  return (
    <ScrollReveal delay={0.05}>
      <section className="py-12 md:py-16 px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-10 md:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-2xl md:text-[32px] font-semibold text-[#222222] tracking-tight">
            How Travel Homes Works
          </h2>
          <p className="text-sm text-[#717171] mt-2 max-w-md mx-auto leading-relaxed">
            From search to stay — three easy steps to your next adventure.
          </p>
        </motion.div>

        {/* Steps grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto"
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
              className="relative flex flex-col gap-5 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Connector line — neutral (desktop) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-8 h-px bg-[#DDDDDD] z-10" />
              )}

              {/* Icon circle + step badge */}
              <div className="relative inline-flex w-fit">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: bg }}
                >
                  <Icon size={24} style={{ color: accent }} strokeWidth={2} />
                </div>
                <span
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: "#FF385C" }}
                >
                  {step}
                </span>
              </div>

              {/* Text */}
              <div className="space-y-1.5">
                <h3 className="text-[17px] font-semibold text-[#222222]">{title}</h3>
                <p className="text-sm text-[#717171] leading-relaxed">
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
