import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FAQItem from "../FAQItem";
import { PublicFaq } from "@/lib/api";
import { FAQSkeleton } from "./skeletons";
import { ScrollReveal } from "./ScrollReveal";

interface FAQTab {
  id: string;
  label: string;
  isVisible: boolean;
}

interface FAQSectionProps {
  homepageSections: Record<string, boolean>;
  faqs: PublicFaq[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  visibleFAQTabs: FAQTab[];
}

export function FAQSection({
  homepageSections,
  faqs,
  activeTab,
  setActiveTab,
  visibleFAQTabs,
}: FAQSectionProps) {
  if (!homepageSections["faq"]) return null;

  const isLoading = faqs.length === 0;

  const filteredFaqs = (tab: string) =>
    faqs.filter((faq) => {
      const cat = (faq.category || "").toLowerCase();
      if (tab === "activities") return cat === "activity";
      if (tab === "unique-stays") return cat === "unique stay";
      if (tab === "caravan") return cat === "camper van";
      return false;
    });

  return (
    <ScrollReveal>
      {/* The bottom-nav clearance now lives on the page (pb-mobile-nav after
          the footer), so this section only owns its own rhythm. */}
      <section className="py-8 md:py-12">
        {isLoading ? (
          <FAQSkeleton />
        ) : (
          <div className="flex flex-col lg:flex-row lg:justify-between gap-6 lg:gap-12">
            {/* ── Left: heading + shadcn Tabs ── */}
            <div className="w-full lg:w-4/12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h2 className="text-center lg:text-left text-[20px] md:text-[28px] font-semibold text-th-text-primary mb-2 md:mb-3 tracking-tight">
                  Frequently Asked Questions
                </h2>
                <p className="text-th-text-muted text-center lg:text-left max-w-sm mx-auto lg:mx-0 mb-5 md:mb-8 text-[13px] md:text-sm leading-relaxed">
                  Everything you need to know about booking, hosting, and exploring with us.
                </p>
              </motion.div>

              {/* shadcn Tabs — pill style */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList
                  className="w-full rounded-full bg-th-surface-raised border border-th-border p-1 shadow-sm h-auto"
                  style={{
                    gridTemplateColumns: `repeat(${visibleFAQTabs.length}, minmax(0, 1fr))`,
                    display: "grid",
                  }}
                >
                  {visibleFAQTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      // Three labels in one pill row: at text-sm they overflow
                      // a 360px screen, so step down and allow truncation.
                      // Active pill rides --th-brand / --th-brand-fg, matching
                      // FilterButton. It was hardcoded to #117479 — the brand value
                      // that predates the cyan artwork. Glow rgba needs comma-only
                      // spacing or Tailwind drops the class.
                      className="rounded-full py-2.5 min-h-[40px] px-1 text-[12px] md:text-sm font-semibold capitalize truncate transition-all duration-200 text-th-text-muted hover:text-th-text-primary data-[state=active]:bg-th-brand data-[state=active]:text-th-brand-fg data-[state=active]:shadow-[0_4px_16px_rgba(59,217,218,0.55)]"
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
                  className="space-y-3 md:space-y-4"
                >
                  {filteredFaqs(activeTab).map((faq) => (
                    <FAQItem key={faq._id} question={faq.question} answer={faq.answer || ""} />
                  ))}
                  {filteredFaqs(activeTab).length === 0 && (
                    <p className="text-th-text-muted italic text-sm py-4">
                      No FAQs available for this category.
                    </p>
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
