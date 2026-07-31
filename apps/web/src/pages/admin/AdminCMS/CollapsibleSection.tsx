import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  blurb?: string;
  icon?: LucideIcon;
  aside?: React.ReactNode;
  defaultExpanded?: boolean;
  children?: React.ReactNode;
}

/**
 * Disclosure block used for the per-page auth-media editors. Matches CmsSection's
 * frame so an expanded row reads as the same family of surface, with the chevron
 * rotating instead of swapping icons.
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  blurb,
  icon: Icon,
  aside,
  defaultExpanded = false,
  children,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  // Rows used purely as a header have no body — don't offer an affordance that
  // does nothing.
  const expandable = Boolean(children);

  return (
    <section className="rounded-[14px] border border-app-border overflow-hidden">
      <header
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 bg-app-surface-2",
          expanded && expandable && "border-b border-app-border",
        )}
      >
        <button
          type="button"
          onClick={expandable ? () => setExpanded((v) => !v) : undefined}
          aria-expanded={expandable ? expanded : undefined}
          disabled={!expandable}
          className={cn(
            "flex flex-1 items-center gap-3 min-w-0 text-left rounded-lg outline-none",
            "focus-visible:ring-2 focus-visible:ring-app-accent/40",
            expandable ? "cursor-pointer" : "cursor-default",
          )}
        >
          {Icon && (
            <span className="grid place-items-center w-8 h-8 rounded-[10px] bg-app-accent-soft text-app-accent shrink-0">
              <Icon size={15} strokeWidth={2.1} />
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-[13.5px] font-bold text-app-fg truncate">{title}</span>
            {blurb && <span className="block text-[12px] text-app-fg-muted">{blurb}</span>}
          </span>
          {expandable && (
            <ChevronDown
              size={16}
              className={cn(
                "ml-auto shrink-0 text-app-fg-muted transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          )}
        </button>
        {aside && <div className="shrink-0">{aside}</div>}
      </header>

      <AnimatePresence initial={false}>
        {expanded && expandable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default CollapsibleSection;
