import React, { useEffect, useState } from "react";
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
    setSections((prev) => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
    try {
      await cmsService.toggleHomepageSection(key);
    } catch (e) {
      console.error("Failed to toggle section", e);
      setSections((prev) => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
    }
  };

  return (
    <div className="space-y-3.5 max-md:flex-wrap overflow-x-hidden">
      <CollapsibleSection
        title="Camper Van"
        showToggle
        isSectionActive={sections["Camper Van"]}
        onToggleStatus={() => toggle("Camper Van")}
      />
      <CollapsibleSection
        title="Unique Stays"
        defaultExpanded
        hasContent
        isActive
        showToggle
        isSectionActive={sections["Unique Stays"]}
        onToggleStatus={() => toggle("Unique Stays")}
      />
      <CollapsibleSection
        title="Best Activity"
        hasContent
        defaultExpanded
        showToggle
        isSectionActive={sections["Best Activity"]}
        onToggleStatus={() => toggle("Best Activity")}
      />
      <CollapsibleSection
        title="Trending destinations"
        hasContent
        defaultExpanded
        showToggle
        isSectionActive={sections["Trending destinations"]}
        onToggleStatus={() => toggle("Trending destinations")}
      />
      <CollapsibleSection
        title="Testimonials"
        hasContent
        defaultExpanded
        showToggle
        isSectionActive={sections["Testimonials"]}
        onToggleStatus={() => toggle("Testimonials")}
      />
      <CollapsibleSection
        title="Top Rated Stays"
        hasContent
        defaultExpanded
        showToggle
        isSectionActive={sections["Top Rated Stays"]}
        onToggleStatus={() => toggle("Top Rated Stays")}
      />
      <CollapsibleSection
        title="Frequently asked questions"
        hasContent
        defaultExpanded
        showToggle
        isSectionActive={sections["Frequently asked questions"]}
        onToggleStatus={() => toggle("Frequently asked questions")}
      />
    </div>
  );
}

export default HomePageTab;
