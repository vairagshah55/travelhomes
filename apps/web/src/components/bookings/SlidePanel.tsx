import React, { useEffect } from "react";
import { X } from "lucide-react";
import { BRAND_VARS } from "@/components/shared";
import { cn } from "@/lib/utils";

/**
 * Generic right-side slide panel used for Detail / Create / Edit booking views
 * and the offering quick-view. Slides in from the right over a backdrop.
 *
 * It renders at the document root, outside any page's `style={BRAND_VARS}`
 * wrapper, so it carries the brand vars itself — otherwise `text-brand` inside
 * would fall back to the navy public brand.
 */
export const SlidePanel = ({
  open,
  onClose,
  title,
  icon,
  width = 520,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-50 bg-[#101828]/35 backdrop-blur-[2px]",
          "transition-opacity [transition-duration:250ms] ease-linear",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Panel */}
      <div
        /* The panel stays mounted and slides on a transform, so the dialog role
           has to be conditional: advertised while closed it left a permanent
           `aria-modal` dialog in the accessibility tree, which a screen reader
           reads as "there is a modal open" on every page that mounts one. It
           also collided with the real drawer now used for the detail view —
           two dialogs, one of them a ghost. */
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-hidden={!open}
        style={{ ...BRAND_VARS, width, maxWidth: "100vw" }}
        className={cn(
          "fixed top-0 right-0 bottom-0 z-[51] flex flex-col overflow-hidden",
          "bg-card border-l border-border/70",
          "transition-transform duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]",
          open
            ? "translate-x-0 shadow-[-12px_0_48px_-16px_rgba(16,24,40,0.28)]"
            : "translate-x-full shadow-none",
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <span className="grid place-items-center w-9 h-9 rounded-[10px] bg-brand/10 text-brand shrink-0">
                {icon}
              </span>
            )}
            <h2 className="text-[15px] font-bold tracking-[-0.015em] text-foreground truncate">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="grid place-items-center w-8 h-8 rounded-lg shrink-0 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40 transition-colors duration-150"
          >
            <X size={15} strokeWidth={2.3} />
          </button>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {/* Sticky footer */}
        {footer && (
          <footer className="flex justify-end gap-2 px-5 py-4 border-t border-border/70 bg-muted/40 dark:bg-white/[0.02] shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </>
  );
};
