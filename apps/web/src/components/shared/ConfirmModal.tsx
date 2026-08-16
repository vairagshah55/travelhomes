import React from "react";
import { Trash2, AlertTriangle, Info, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Variant = "danger" | "warning" | "info";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  isLoading?: boolean;
}

/**
 * info variant uses brand colors (route-group aware). danger/warning are
 * semantic (red/amber) regardless of brand — destruction should look like
 * destruction in either area.
 */
const VARIANT_MAP: Record<
  Variant,
  { icon: typeof Trash2; iconBg: string; iconColor: string; confirmBg: string }
> = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-50 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    confirmBg: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    confirmBg: "bg-amber-600 hover:bg-amber-700",
  },
  info: {
    icon: Info,
    iconBg: "bg-brand-subtle",
    iconColor: "text-brand",
    confirmBg: "bg-brand hover:bg-brand-hover",
  },
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  const v = VARIANT_MAP[variant];
  const Icon = v.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[440px] p-6 gap-0">
        <DialogHeader className="flex flex-col items-center text-center gap-3.5 sm:text-center">
          <div className="relative">
            <span
              aria-hidden
              className={`absolute inset-0 -m-2 rounded-full opacity-50 ${v.iconBg}`}
            />
            <span className={`relative grid place-items-center w-12 h-12 rounded-full ${v.iconBg}`}>
              <Icon size={22} className={v.iconColor} strokeWidth={2} />
            </span>
          </div>
          <DialogTitle className="text-[16.5px] font-bold tracking-[-0.01em] text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>

        {description && (
          <p className="mt-2 text-[13px] text-muted-foreground text-center leading-relaxed">
            {description}
          </p>
        )}

        {/* Confirm sits on the right, the side the eye lands on last, and the
            dialog opens with focus on Cancel — a destructive action should
            never be one stray Enter away. */}
        <div className="flex items-center gap-2.5 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            autoFocus
            className="flex-1 h-10 rounded-xl bg-muted hover:bg-muted/70 text-foreground/80 text-[13px] font-semibold
              transition-[background-color,transform] duration-150 active:translate-y-px
              disabled:opacity-50 outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-10 rounded-xl text-white text-[13px] font-semibold
              transition-[background-color,transform] duration-150 active:translate-y-px
              disabled:opacity-70 disabled:pointer-events-none inline-flex items-center justify-center gap-2
              outline-none focus-visible:ring-4 focus-visible:ring-brand/25 ${v.confirmBg}`}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {isLoading ? "Working…" : confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmModal;
