import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle, Info, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const VARIANT_CONFIG = {
  danger: {
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    Icon: Trash2,
    btnClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    Icon: AlertTriangle,
    btnClass: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  info: {
    iconBg: "bg-brand-50",
    iconColor: "text-brand-600",
    Icon: Info,
    btnClass: "bg-brand-500 hover:bg-brand-600 text-white",
  },
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  const { iconBg, iconColor, Icon, btnClass } = VARIANT_CONFIG[variant];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader className="items-center text-center space-y-3">
          <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
            <Icon size={22} className={iconColor} />
          </div>
          <DialogTitle className="text-sm font-semibold text-gray-900">{title}</DialogTitle>
          <DialogDescription className="text-xs text-gray-500 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${btnClass}`}
          >
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmModal;
