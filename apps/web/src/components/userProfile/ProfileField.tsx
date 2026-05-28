import type { LucideIcon } from "lucide-react";

interface ProfileFieldProps {
  label: string;
  value?: string | null;
  icon?: LucideIcon;
}

const ProfileField = ({ label, value, icon: Icon }: ProfileFieldProps) => (
  <div className="min-w-0">
    <div className="flex items-center gap-1.5 mb-1.5">
      {Icon && <Icon size={13} strokeWidth={1.75} className="text-gray-400 shrink-0" />}
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </span>
    </div>
    <p className="text-[14px] text-gray-900 dark:text-white font-medium truncate">
      {value || <span className="text-gray-400 font-normal">—</span>}
    </p>
  </div>
);

export default ProfileField;
