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
    accent: "#185FA5",
    bg: "#EBF2FA",
  },
  {
    icon: CalendarCheck,
    step: "02",
    title: "Book Instantly",
    description:
      "Secure your booking in seconds with a seamless checkout. Pay safely, get instant confirmation, and receive your itinerary details.",
    accent: "#07E4E4",
    bg: "#E4FAFA",
  },
  {
    icon: Compass,
    step: "03",
    title: "Explore & Enjoy",
    description:
      "Pack your bags and go! From Himalayan trails to coastal stays, every Travel Homes experience is curated for unforgettable moments.",
    accent: "#185FA5",
    bg: "#EBF2FA",
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
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-blue-600 mb-3">
            Simple Process
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            How Travel Homes Works
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
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
              className="relative flex flex-col gap-4 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Connector line (desktop) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-8 h-px border-t-2 border-dashed border-gray-200 dark:border-gray-700 z-10" />
              )}

              {/* Step number */}
              <span className="text-[11px] font-bold tracking-[0.15em] text-gray-300 dark:text-gray-600">
                STEP {step}
              </span>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: bg }}
              >
                <Icon size={22} style={{ color: accent }} strokeWidth={2} />
              </div>

              {/* Text */}
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
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
