import { useNavigate } from "react-router-dom";
import { ChevronLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/utils";
import { getInitials } from "@/utils/getInitials";

interface User {
  firstName?: string;
  lastName?: string;
  photo?: string;
  email?: string;
  mobileVerified?: boolean;
  emailVerified?: boolean;
}

interface ProfileSidebarProps {
  user: User | null | undefined;
}

const ProfileSidebar = ({ user }: ProfileSidebarProps) => {
  const navigate = useNavigate();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Profile";
  const initials = getInitials(fullName);
  const photoSrc = user?.photo ? getImageUrl(user.photo) : "";

  const emailVerified = !!user?.emailVerified || !!user?.email;
  const mobileVerified = !!user?.mobileVerified;

  return (
    <aside className="lg:w-80 flex-shrink-0">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 relative">
        {/* Back */}
        <button
          onClick={() => navigate("/")}
          className="max-md:hidden absolute top-4 left-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-gray-500 hover:text-[#117479] transition-colors"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        {/* Avatar + Name */}
        <div className="text-center pt-6 pb-6">
          <Avatar className="w-28 h-28 mx-auto mb-4 ring-4 ring-[#e6fafa]">
            {photoSrc && <AvatarImage src={photoSrc} alt={`${fullName} avatar`} />}
            <AvatarFallback className="bg-[#e6fafa] text-[#117479] text-[28px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-[18px] font-bold text-gray-900 leading-tight">{fullName}</h2>
          {user?.email && <p className="text-[12.5px] text-gray-500 mt-1 truncate">{user.email}</p>}
        </div>

        <div className="h-px bg-gray-100 -mx-6 my-1" />

        {/* Identity verification blurb */}
        <div className="pt-5">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-1.5">Identity Verification</h3>
          <p className="text-[12.5px] text-gray-500 leading-relaxed">
            Verify your details so vendors can trust your bookings and we can reach you when it
            matters.
          </p>
        </div>

        {/* Verification chips */}
        <div className="mt-4 space-y-2">
          <VerifyChip
            ok={emailVerified}
            okLabel="Email Verified"
            pendingLabel="Email Not Verified"
          />
          <VerifyChip
            ok={mobileVerified}
            okLabel="Mobile Verified"
            pendingLabel="Mobile Not Verified"
          />
        </div>
      </div>
    </aside>
  );
};

function VerifyChip({
  ok,
  okLabel,
  pendingLabel,
}: {
  ok: boolean;
  okLabel: string;
  pendingLabel: string;
}) {
  return (
    <div
      className={`inline-flex w-full items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-medium ${
        ok
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70"
          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70"
      }`}
    >
      {ok ? (
        <ShieldCheck size={14} className="shrink-0" />
      ) : (
        <AlertCircle size={14} className="shrink-0" />
      )}
      <span>{ok ? okLabel : pendingLabel}</span>
    </div>
  );
}

export default ProfileSidebar;
