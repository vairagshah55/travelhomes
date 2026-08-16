import React from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  AdminDetailDrawer,
  DetailField,
  DetailNote,
  DetailSection,
} from "./AdminDetailDrawer";

/**
 * Support-ticket inspector.
 *
 * Was a centred overlay carrying its own font stack (`font-geist`,
 * `font-plus-jakarta`, `font-poppins` in one panel) and literal `#2A2A2A`
 * inks. Now a right-side drawer on the shared tokens.
 *
 * The shape is deliberately loose: the dashboard's "recent tickets" widget and
 * the help-desk page hold the same record under different keys (`vendorName`
 * vs `name`, `message` vs `description`), and both render through here rather
 * than each keeping its own dialog.
 */

export interface HelpDeskTicket {
  vendorName?: string;
  name?: string;
  email?: string;
  companyName?: string;
  phoneNumber?: string;
  date?: string;
  createdAt?: string;
  status?: string;
  subject?: string;
  message?: string;
  description?: string;
}

interface HelpDeskPopupProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: HelpDeskTicket | null;
  /** Walk the filtered list without closing. */
  position?: { index: number; total: number };
  onPrev?: () => void;
  onNext?: () => void;
}

const formatDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const HelpDeskPopup: React.FC<HelpDeskPopupProps> = ({
  isOpen,
  onClose,
  ticket,
  position,
  onPrev,
  onNext,
}) => {
  if (!isOpen || !ticket) return null;

  const requester = ticket.vendorName || ticket.name || "Unknown sender";
  const body = ticket.message || ticket.description || "";

  return (
    <AdminDetailDrawer
      open={isOpen}
      onClose={onClose}
      eyebrow="Support ticket"
      title={ticket.subject || "No subject"}
      subtitle={requester}
      status={ticket.status ? <StatusBadge status={ticket.status} /> : undefined}
      position={position}
      onPrev={onPrev}
      onNext={onNext}
    >
      <DetailSection title="Sender">
        <DetailField label="Name" value={requester} />
        <DetailField label="Phone" value={ticket.phoneNumber} />
        <DetailField label="Email / company" value={ticket.companyName || ticket.email} full />
      </DetailSection>

      <DetailSection title="Ticket">
        <DetailField label="Raised" value={formatDate(ticket.date || ticket.createdAt)} />
        <DetailField
          label="Status"
          value={ticket.status ? <StatusBadge status={ticket.status} /> : ""}
        />
        <DetailField label="Subject" value={ticket.subject} full />
      </DetailSection>

      <DetailSection title="Message">
        {body ? (
          <DetailNote>{body}</DetailNote>
        ) : (
          <DetailField label="Message" value="" full />
        )}
      </DetailSection>
    </AdminDetailDrawer>
  );
};

export default HelpDeskPopup;
