import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Generic right-side slide panel used for Detail / Create / Edit booking views.
 * Slides in from the right with backdrop overlay.
 */
export const SlidePanel = ({ open, onClose, title, icon, width = 520, children, footer }: {
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
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-opacity duration-[250ms] ease-linear"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-[51] bg-th-surface-0 flex flex-col overflow-hidden"
        style={{
          width,
          maxWidth: "100vw",
          boxShadow: open ? "-8px 0 40px rgba(0,0,0,0.12)" : "none",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-[18px] border-b border-[#EBEBEB] flex-shrink-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-[34px] h-[34px] rounded-[10px] bg-th-brand-soft border border-th-brand-border-soft flex items-center justify-center">
                {icon}
              </div>
            )}
            <h2 className="text-base font-extrabold text-th-text-primary tracking-[-0.02em]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-th-warm-surface border-none flex items-center justify-center cursor-pointer transition-colors hover:bg-[#EBEBEB]"
          >
            <X size={15} className="text-th-warm-text-muted" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Sticky footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[#EBEBEB] flex-shrink-0 flex justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};
