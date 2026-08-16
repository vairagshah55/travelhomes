import React from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminDetailDrawer, DetailField, DetailSection } from "./AdminDetailDrawer";

/**
 * User inspector.
 *
 * Was a centred shadcn Dialog of hardcoded `text-gray-700` labels over
 * `text-black` values, with its own hand-rolled green/grey status chip. It is
 * now a right-side drawer on the shared tokens, so the list it was opened from
 * stays readable behind it and the status pill matches every other table.
 *
 * The getters stay as they were: this component is fed by three different
 * shapes (the users list, the analytics report row, and the raw API record),
 * which is why every field has a fallback chain.
 */

interface UserDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // Relaxed type to handle mixed API responses
  /** Walk the filtered list without closing. */
  position?: { index: number; total: number };
  onPrev?: () => void;
  onNext?: () => void;
}

const UserDetailsPopup: React.FC<UserDetailsPopupProps> = ({
  isOpen,
  onClose,
  user,
  position,
  onPrev,
  onNext,
}) => {
  if (!user) return null;

  // Helper to extract display values safely
  const getId = () => user.userId || user._id || "—";
  const getName = () =>
    user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unnamed user";
  const getFirstName = () => user.firstName || user.name?.split(" ")[0] || "";
  const getLastName = () => user.lastName || user.name?.split(" ").slice(1).join(" ") || "";
  const getEmail = () => user.email || "";
  const getMobile = () => user.mobile || user.phone || "";
  const getDob = () => user.dob || "";

  // Location handling
  const getLocation = () => user.location || user.city || "";
  const getState = () => user.state || "";

  // Dates
  const getRegDate = () => {
    const d = user.registrationDate || user.userSince || user.createdAt;
    if (!d) return "";
    const parsed = new Date(d);
    return Number.isNaN(parsed.getTime()) ? String(d) : parsed.toLocaleDateString("en-IN");
  };
  const getLastActive = () => user.lastActiveDate || "";

  const getBookedService = () => user.bookedService || user.bookedServices || "0";

  const getIsVendor = () => {
    if (typeof user.isVendor === "boolean") return user.isVendor ? "Yes" : "No";
    return user.isVendor || "No";
  };

  return (
    <AdminDetailDrawer
      open={isOpen}
      onClose={onClose}
      eyebrow="User"
      title={getName()}
      subtitle={getEmail() || undefined}
      media={
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.photo} alt="" />
          <AvatarFallback className="text-[13px] font-semibold">
            {(getName()[0] ?? "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>
      }
      status={user.status ? <StatusBadge status={user.status} /> : undefined}
      position={position}
      onPrev={onPrev}
      onNext={onNext}
    >
      <DetailSection title="Identity">
        <DetailField label="User ID" value={getId()} />
        <DetailField label="Date of birth" value={getDob()} />
        <DetailField label="First name" value={getFirstName()} />
        <DetailField label="Last name" value={getLastName()} />
      </DetailSection>

      <DetailSection title="Contact">
        <DetailField label="Email" value={getEmail()} full />
        <DetailField label="Mobile" value={getMobile()} />
        <DetailField label="Location" value={getLocation()} />
        <DetailField label="State" value={getState()} />
      </DetailSection>

      <DetailSection title="Activity">
        <DetailField label="Registered" value={getRegDate()} />
        <DetailField label="Last active" value={getLastActive()} />
        <DetailField label="Booked services" value={getBookedService()} />
        <DetailField label="Is a vendor" value={getIsVendor()} />
      </DetailSection>
    </AdminDetailDrawer>
  );
};

export default UserDetailsPopup;
