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
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-[#185FA5] dark:text-blue-400",
    confirmBg: "bg-[#185FA5] hover:bg-[#0C447C]",
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
      <DialogContent className="sm:max-w-[420px] rounded-2xl p-6">
        <DialogHeader className="flex flex-col items-center text-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${v.iconBg}`}>
            <Icon size={22} className={v.iconColor} />
          </div>
          <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
            {title}
          </DialogTitle>
        </DialogHeader>
        {description && (
          <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-[13px] font-semibold transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-10 rounded-full text-white text-[13px] font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2 ${v.confirmBg}`}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmModal;
