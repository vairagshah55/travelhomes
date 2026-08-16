import React from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AdminDetailDrawer, DetailField, DetailSection } from "./AdminDetailDrawer";

/**
 * Payment inspector.
 *
 * Was a centred overlay of `text-base font-bold` labels over smaller values —
 * the label outweighing the value it describes. Now a right-side drawer on the
 * shared tokens, so the payments table stays visible while a transaction is
 * being read, and the amount and transaction id are tabular.
 */

interface PaymentDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    paymentId: string;
    businessName: string;
    personName: string;
    servicesId: string;
    status: string;
    amount?: string;
    paymentMode?: string;
    transactionId?: string;
  };
  /** Walk the filtered list without closing. */
  position?: { index: number; total: number };
  onPrev?: () => void;
  onNext?: () => void;
}

const PaymentDetailsPopup: React.FC<PaymentDetailsPopupProps> = ({
  isOpen,
  onClose,
  payment,
  position,
  onPrev,
  onNext,
}) => {
  return (
    <AdminDetailDrawer
      open={isOpen}
      onClose={onClose}
      eyebrow="Payment"
      title={payment.paymentId || "Payment"}
      subtitle={payment.businessName || undefined}
      status={payment.status ? <StatusBadge status={payment.status} /> : undefined}
      position={position}
      onPrev={onPrev}
      onNext={onNext}
    >
      <DetailSection title="Transaction">
        <DetailField
          label="Amount"
          value={
            payment.amount ? (
              <span className="tabular-nums">{payment.amount}</span>
            ) : (
              ""
            )
          }
        />
        <DetailField label="Payment mode" value={payment.paymentMode} />
        <DetailField
          label="Transaction ID"
          value={
            payment.transactionId ? (
              <span className="break-all tabular-nums">{payment.transactionId}</span>
            ) : (
              ""
            )
          }
          full
        />
      </DetailSection>

      <DetailSection title="Payer">
        <DetailField label="Business name" value={payment.businessName} />
        <DetailField label="Person name" value={payment.personName} />
      </DetailSection>

      <DetailSection title="Service">
        <DetailField label="Services ID" value={payment.servicesId} />
        <DetailField
          label="Status"
          value={payment.status ? <StatusBadge status={payment.status} /> : ""}
        />
      </DetailSection>
    </AdminDetailDrawer>
  );
};

export default PaymentDetailsPopup;
