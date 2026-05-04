import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "./ScrollReveal";

export function ServiceListingBanner() {
  const navigate = useNavigate();

  return (
    <ScrollReveal delay={0.05}>
      <section className="overflow-hidden rounded-[20px] my-2">
        <motion.div
          className="relative rounded-[20px] md:rounded-3xl p-4 text-white overflow-hidden"
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="relative z-20 rounded-[20px]">
            <img
              src="/Group 1686552378 (1).png"
              alt="Service listing benefits"
              className="max-w-screen w-full h-full border border-transparent rounded-[20px] object-cover max-md:h-[280px] md:h-[250px]"
            />
            <div className="absolute flex max-md:flex-col items-center gap-4 left-10 lg:left-16 top-5 lg:top-5 xl:top-16 rounded-[20px]">
              <motion.div
                className="space-y-4 w-1/2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
              >
                <h3 className="max-md:text-sm text-lg md:text-3xl font-bold leading-tight">
                  Service Listing Benefits
                </h3>
                <p className="text-gray-300 max-md:text-[10px] text-xs md:text-sm leading-relaxed">
                  Once your listing is created, you benefit from full transparency with no hidden fees.
                  The price you see is final, with no additional charges added later.
                </p>
              </motion.div>
              <motion.div
                className="flex w-1/2 justify-center z-10"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.2 }}
              >
                <Button
                  onClick={() => navigate("/hostwithus")}
                  className="bg-white max-md:text-[10px] text-black hover:bg-gray-50 rounded-full px-6 h-12 font-medium shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                  Check here for more information
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>
    </ScrollReveal>
  );
}
