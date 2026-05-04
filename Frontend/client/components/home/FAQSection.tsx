import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FAQItem from "../FAQItem";
import { PublicFaq } from "@/lib/api";
import { FAQSkeleton } from "./skeletons";
import { ScrollReveal } from "./ScrollReveal";

interface FAQTab { id: string; label: string; isVisible: boolean }

interface FAQSectionProps {
  homepageSections: Record<string, boolean>;
  faqs: PublicFaq[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  visibleFAQTabs: FAQTab[];
}

export function FAQSection({ homepageSections, faqs, activeTab, setActiveTab, visibleFAQTabs }: FAQSectionProps) {
  if (!homepageSections["faq"]) return null;

  const isLoading = faqs.length === 0;

  const filteredFaqs = (tab: string) =>
    faqs.filter((faq) => {
      const cat = (faq.category || "").toLowerCase();
      if (tab === "activities")   return cat === "activity";
      if (tab === "unique-stays") return cat === "unique stay";
      if (tab === "caravan")      return cat === "camper van";
      return false;
    });

  return (
    <ScrollReveal>
      <section className="py-8 md:py-12 px-4 pb-24 md:pb-12">
        {isLoading ? (
          <FAQSkeleton />
        ) : (
          <div className="flex flex-col lg:flex-row lg:justify-between gap-12">
            {/* ── Left: heading + shadcn Tabs ── */}
            <div className="w-full lg:w-4/12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h2 className="text-center lg:text-left text-2xl md:text-[28px] font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">
                  Frequently Asked Questions
                </h2>
                <p className="text-gray-500 text-center lg:text-left dark:text-gray-400 max-w-sm mx-auto lg:mx-0 mb-8 text-sm leading-relaxed">
                  Everything you need to know about booking, hosting, and exploring with us.
                </p>
              </motion.div>

              {/* shadcn Tabs — pill style */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList
                  className="w-full rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1 shadow-sm h-auto"
                  style={{ gridTemplateColumns: `repeat(${visibleFAQTabs.length}, minmax(0, 1fr))`, display: "grid" }}
                >
                  {visibleFAQTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="rounded-full py-2 text-sm font-semibold capitalize transition-all duration-200 text-gray-600 dark:text-gray-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* TabsContent here is empty — we render items in the right column */}
                {visibleFAQTabs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="mt-0" />
                ))}
              </Tabs>
            </div>

            {/* ── Right: FAQ items ── */}
            <div className="w-full lg:w-7/12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {filteredFaqs(activeTab).map((faq) => (
                    <FAQItem key={faq._id} question={faq.question} answer={faq.answer || ""} />
                  ))}
                  {filteredFaqs(activeTab).length === 0 && (
                    <p className="text-gray-400 italic text-sm py-4">No FAQs available for this category.</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>
    </ScrollReveal>
  );
}
