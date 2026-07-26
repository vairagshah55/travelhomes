import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import { CollapsibleSection } from "../CollapsibleSection";

const SECTION_KEY_MAP: Record<string, string> = {
  "Camper Van": "camper-van",
  "Unique Stays": "unique-stays",
  "Best Activity": "best-activity",
  "Trending destinations": "trending-destinations",
  Testimonials: "testimonials",
  "Top Rated Stays": "top-rated-stays",
  "Frequently asked questions": "faq",
};

const TITLE_MAP = Object.entries(SECTION_KEY_MAP).reduce(
  (acc, [title, key]) => {
    acc[key] = title;
    return acc;
  },
  {} as Record<string, string>,
);

/**
 * Homepage section visibility toggles. Each section maps to a backend key;
 * toggle does optimistic UI then reverts on API error.
 */
export function HomePageTab() {
  const [sections, setSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const list = await cmsService.getHomepageSections();
        const next: Record<string, boolean> = {};
        if (Array.isArray(list)) {
          list.forEach((s: any) => {
            const title = TITLE_MAP[s.sectionKey];
            if (title) next[title] = s.isVisible;
          });
        }
        Object.keys(SECTION_KEY_MAP).forEach((title) => {
          if (next[title] === undefined) next[title] = true;
        });
        setSections(next);
      } catch (e) {
        console.error("Failed to fetch homepage sections", e);
      }
    })();
  }, []);

  const toggle = async (sectionTitle: string) => {
    const key = SECTION_KEY_MAP[sectionTitle];
    if (!key) return;
    const nextVisible = !sections[sectionTitle];
    setSections((prev) => ({ ...prev, [sectionTitle]: nextVisible }));
    try {
      await cmsService.toggleHomepageSection(key);
      toast.success(`${sectionTitle} ${nextVisible ? "shown on" : "hidden from"} the homepage`);
    } catch (e) {
      console.error("Failed to toggle section", e);
      setSections((prev) => ({ ...prev, [sectionTitle]: !nextVisible }));
      toast.error(`Could not update ${sectionTitle}`);
    }
  };

  return (
    <div className="space-y-3.5 max-md:flex-wrap overflow-x-hidden">
      <p className="text-sm text-dashboard-body">
        Turn a section off to hide it from the public homepage. Changes apply immediately.
      </p>
      {Object.keys(SECTION_KEY_MAP).map((title) => (
        <CollapsibleSection
          key={title}
          title={title}
          showToggle
          isSectionActive={sections[title] !== false}
          onToggleStatus={() => toggle(title)}
        />
      ))}
    </div>
  );
}

export default HomePageTab;
