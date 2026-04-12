import React, { useEffect } from "react";
import { X } from "lucide-react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL    = "#07e4e4";
const BLACK   = "#131313";
const GRAY_400 = "#9a9a9a";
const GRAY_200 = "#e4e4e4";
const WHITE   = "#ffffff";

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
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          backgroundColor: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(2px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width, maxWidth: "100vw",
          zIndex: 51,
          backgroundColor: WHITE,
          boxShadow: open ? "-8px 0 40px rgba(0,0,0,0.12)" : "none",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1.5px solid #EBEBEB",
            flexShrink: 0,
          }}
        >
          <div className="flex items-center gap-3">
            {icon && (
              <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(7,228,228,0.07)", border: "1.5px solid rgba(7,228,228,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {icon}
              </div>
            )}
            <h2 style={{ fontSize: 16, fontWeight: 800, color: BLACK, letterSpacing: "-0.02em" }}>{title}</h2>
          </div>
          <button
            type="button" onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#F7F8FA", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background-color 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#EBEBEB"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F7F8FA"; }}
          >
            <X size={15} color={GRAY_400} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {children}
        </div>

        {/* Sticky footer */}
        {footer && (
          <div style={{ padding: "16px 24px", borderTop: "1.5px solid #EBEBEB", flexShrink: 0, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
};
