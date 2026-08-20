import React, { useEffect, useState } from "react";
import {
  Award,
  BedDouble,
  Car,
  Caravan,
  MapPin,
  MessageSquareQuote,
  Mountain,
  Star,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import { Switch } from "@/components/ui/switch";
import { CmsToggleRow } from "../ui";

const SECTIONS: { title: string; key: string; icon: LucideIcon; blurb: string }[] = [
  {
    title: "Camper Van",
    key: "camper-van",
    icon: Caravan,
    blurb: "Featured camper vans carousel.",
  },
  { title: "Unique Stays", key: "unique-stays", icon: BedDouble, blurb: "Hand-picked stays." },
  {
    title: "Best Activity",
    key: "best-activity",
    icon: Mountain,
    blurb: "Highlighted activities.",
  },
  {
    title: "Vehicle Rental",
    key: "vehicle-rental",
    icon: Car,
    blurb: "Car, van & bus rentals — search tab, listings, and vendor onboarding.",
  },
  {
    title: "Trending destinations",
    key: "trending-destinations",
    icon: MapPin,
    blurb: "Cities and regions guests are booking now.",
  },
  { title: "Testimonials", key: "testimonials", icon: Award, blurb: "Guest quotes." },
  {
    title: "Top Rated Stays",
    key: "top-rated-stays",
    icon: Star,
    blurb: "Highest-rated listings.",
  },
  {
    title: "Frequently asked questions",
    key: "faq",
    icon: MessageSquareQuote,
    blurb: "The FAQ block near the footer.",
  },
];

const TITLE_BY_KEY = SECTIONS.reduce<Record<string, string>>((acc, s) => {
  acc[s.key] = s.title;
  return acc;
}, {});

/**
 * Homepage section visibility. Each row maps to a backend key; the toggle is
 * optimistic and reverts if the call fails.
 */
export function HomePageTab() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await cmsService.getHomepageSections();
        const next: Record<string, boolean> = {};
        if (Array.isArray(list)) {
          list.forEach((s: any) => {
            const title = TITLE_BY_KEY[s.sectionKey];
            if (title) next[title] = s.isVisible;
          });
        }
        SECTIONS.forEach(({ title }) => {
          if (next[title] === undefined) next[title] = true;
        });
        setVisibility(next);
      } catch (e) {
        console.error("Failed to fetch homepage sections", e);
        toast.error("Could not load homepage sections");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = async (title: string, key: string) => {
    const nextVisible = !visibility[title];
    setVisibility((prev) => ({ ...prev, [title]: nextVisible }));
    setBusy(title);
    try {
      await cmsService.toggleHomepageSection(key);
      toast.success(`${title} ${nextVisible ? "shown on" : "hidden from"} the homepage`);
    } catch (e) {
      console.error("Failed to toggle section", e);
      setVisibility((prev) => ({ ...prev, [title]: !nextVisible }));
      toast.error(`Could not update ${title}`);
    } finally {
      setBusy(null);
    }
  };

  const visibleCount = SECTIONS.filter(({ title }) => visibility[title] !== false).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[12.5px] text-app-fg-muted">
          Turn a section off to hide it from the public homepage — changes apply immediately.
        </p>
        {!loading && (
          <span className="text-[12px] font-semibold text-app-fg-muted tabular-nums">
            {visibleCount} of {SECTIONS.length} shown
          </span>
        )}
      </div>

      <div className="rounded-[14px] border border-app-border overflow-hidden">
        {loading ? (
          <div className="divide-y divide-app-border">
            {SECTIONS.map(({ key }) => (
              <div key={key} className="flex items-center justify-between px-4 py-4">
                <div className="h-3.5 w-40 rounded bg-app-surface-2 animate-pulse" />
                <div className="h-5 w-9 rounded-full bg-app-surface-2 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-app-border">
            {SECTIONS.map(({ title, key, icon, blurb }) => (
              <CmsToggleRow key={key} icon={icon} title={title} blurb={blurb}>
                <Switch
                  checked={visibility[title] !== false}
                  onCheckedChange={() => toggle(title, key)}
                  disabled={busy === title}
                  aria-label={`${visibility[title] !== false ? "Hide" : "Show"} ${title}`}
                />
              </CmsToggleRow>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePageTab;
