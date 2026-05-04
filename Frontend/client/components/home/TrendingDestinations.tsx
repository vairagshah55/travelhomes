import React from "react";
import { motion } from "framer-motion";
import DestinationCard from "../DestinationCard";
import { DestinationsSkeleton } from "./skeletons";
import { ScrollReveal, staggerContainer, staggerItem } from "./ScrollReveal";

interface TrendingDestinationsProps {
  homepageSections: Record<string, boolean>;
  loadingOffers: boolean;
  offerError: string | null;
}

const DESTINATIONS = [
  { image: "https://api.builder.io/api/v1/image/assets/TEMP/4766a16ac97656234c2dd7e78a19fabc9e9361f1?width=641", title: "Delhi"   },
  { image: "https://api.builder.io/api/v1/image/assets/TEMP/3d98c6169a4accab38df839bcb2d9390e2e0f6ad?width=641", title: "Kolkata" },
  { image: "https://api.builder.io/api/v1/image/assets/TEMP/e768669efb8c29a3468b96ce5cb10cf4e7c7d719?width=641", title: "Bombay"  },
  { image: "https://api.builder.io/api/v1/image/assets/TEMP/344595448bfa2603988d6406e077bc1b7911c209?width=488", title: "Kerala"  },
];

export function TrendingDestinations({ homepageSections, loadingOffers, offerError }: TrendingDestinationsProps) {
  if (!homepageSections["trending-destinations"]) return null;

  return (
    <ScrollReveal>
      <section className="py-8 md:py-12 px-4">
        {loadingOffers && <DestinationsSkeleton />}
        {offerError && <p className="text-red-500 text-center py-8">Failed to load. Please try again.</p>}

        {!loadingOffers && !offerError && (
          <>
            {/* Mobile heading */}
            <div className="mb-4 lg:hidden">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white leading-tight tracking-tight">
                Trending Destinations
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">India's most-booked destinations</p>
            </div>

            {/* Mobile: horizontal scroll with stagger */}
            <motion.div
              className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:hidden"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={staggerContainer}
            >
              <div className="flex gap-4 min-w-max">
                {DESTINATIONS.map((d) => (
                  <motion.div key={d.title} variants={staggerItem}>
                    <DestinationCard image={d.image} title={d.title} className="w-[240px] h-[180px] flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Desktop: grid with stagger */}
            <motion.div
              className="hidden lg:grid lg:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
            >
              <motion.div className="lg:col-span-1 flex flex-col" variants={staggerItem}>
                <div className="mb-6">
                  <h2 className="text-2xl md:text-[28px] font-semibold text-gray-900 dark:text-white leading-tight tracking-tight">
                    Trending Destinations
                  </h2>
                </div>
                <DestinationCard image={DESTINATIONS[0].image} title={DESTINATIONS[0].title} className="h-52" />
              </motion.div>
              <motion.div className="lg:col-span-1" variants={staggerItem}>
                <DestinationCard image={DESTINATIONS[1].image} title={DESTINATIONS[1].title} className="h-52 lg:h-80" />
              </motion.div>
              <motion.div className="lg:col-span-1" variants={staggerItem}>
                <DestinationCard image={DESTINATIONS[2].image} title={DESTINATIONS[2].title} className="h-52 lg:h-80" />
              </motion.div>
              <motion.div className="lg:col-span-1 flex flex-col gap-6" variants={staggerItem}>
                <DestinationCard image={DESTINATIONS[3].image} title={DESTINATIONS[3].title} className="h-44" />
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  From the Himalayas to backwaters — India's most-booked destinations await you.
                </p>
              </motion.div>
            </motion.div>
          </>
        )}
      </section>
    </ScrollReveal>
  );
}
