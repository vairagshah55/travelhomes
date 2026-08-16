import React, { useMemo, useState } from "react";
import { Eye, Inbox, Loader2, Mail, MapPin, Reply, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import { getImageUrl } from "@/lib/adminUtils";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import {
  AdminFilterBar,
  type ActiveFilters,
  type FilterDefinition,
} from "@/components/admin/AdminFilterBar";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BTN_NEUTRAL,
  BTN_PRIMARY,
  CmsField,
  CmsSection,
  CONTROL,
  DIALOG_VARS,
  MediaPicker,
  TEXTAREA,
  TableFrame,
} from "../ui";

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  image: string;
}

export interface ContactMessage {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  message: string;
  status?: string;
  createdAt?: string;
}

interface ContactUsTabProps {
  contactInfo: ContactInfo;
  setContactInfo: React.Dispatch<React.SetStateAction<ContactInfo>>;
  loadingContacts: boolean;
  messages: ContactMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ContactMessage[]>>;
}

const FILTER_DEFS: FilterDefinition[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "unread", label: "Unread" },
      { value: "read", label: "Read" },
    ],
  },
];

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

/**
 * Contact admin, two halves:
 *  1. the editable contact-info block shown on the public Contact page
 *  2. the inbox of submissions from that page (view / mark read / reply / delete)
 *
 * Contact-info state lives in the parent because it is loaded alongside the rest
 * of the CMS bootstrap; the inbox list is passed down for the same reason.
 */
export function ContactUsTab({
  contactInfo,
  setContactInfo,
  loadingContacts,
  messages,
  setMessages,
}: ContactUsTabProps) {
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [viewing, setViewing] = useState<ContactMessage | null>(null);
  const [replyTo, setReplyTo] = useState<ContactMessage | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleContactImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const res = await cmsService.uploadMedia({
        page: "Contact Us",
        section: "Main Image",
        file,
      });
      if (res?.data?.url) {
        setContactInfo((prev) => ({ ...prev, image: res.data.url }));
        toast.success("Contact image updated");
      }
    } catch (err) {
      console.error("Contact image upload failed", err);
      toast.error("Failed to upload contact image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveContactInfo = async () => {
    setSavingInfo(true);
    try {
      await cmsService.upsertContact(contactInfo);
      toast.success("Contact details saved");
    } catch (err) {
      console.error("Failed to save contact info", err);
      toast.error("Failed to save contact details");
    } finally {
      setSavingInfo(false);
    }
  };

  const markRead = async (msg: ContactMessage) => {
    if (msg.status === "read") return;
    setBusyId(msg.id);
    try {
      await cmsService.markContactRead(msg.id);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m)));
    } catch (err) {
      console.error("Failed to mark message read", err);
      toast.error("Failed to mark as read");
    } finally {
      setBusyId(null);
    }
  };

  const openMessage = (msg: ContactMessage) => {
    setViewing(msg);
    markRead(msg);
  };

  const openReply = (msg: ContactMessage) => {
    setReplyTo(msg);
    setReplySubject("Re: your enquiry to TravelHomes");
    setReplyBody("");
  };

  const sendReply = async () => {
    if (!replyTo) return;
    if (!replySubject.trim() || !replyBody.trim()) {
      toast.error("Subject and message are both required");
      return;
    }
    setSendingReply(true);
    try {
      await cmsService.replyToContact(replyTo.id, {
        subject: replySubject.trim(),
        body: replyBody.trim(),
      });
      toast.success(`Reply sent to ${replyTo.email}`);
      markRead(replyTo);
      setReplyTo(null);
    } catch (err: any) {
      console.error("Reply failed", err);
      // 503 = SMTP not configured on the server; surface that rather than a generic error.
      const status = err?.response?.status;
      toast.error(
        status === 503
          ? "Email is not configured on the server — reply not sent"
          : err?.response?.data?.message || "Failed to send reply",
      );
    } finally {
      setSendingReply(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setDeleting(true);
    try {
      await cmsService.deleteContactMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.success("Message deleted");
      setPendingDelete(null);
    } catch (err) {
      console.error("Failed to delete message", err);
      toast.error("Failed to delete message");
    } finally {
      setDeleting(false);
    }
  };

  const fullName = (m: ContactMessage) => `${m.firstName || ""} ${m.lastName || ""}`.trim() || "—";
  const unreadCount = messages.filter((m) => m.status !== "read").length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const status = filters.status as string | undefined;
    return messages.filter((m) => {
      const isRead = m.status === "read";
      if (status === "read" && !isRead) return false;
      if (status === "unread" && isRead) return false;
      if (!q) return true;
      return [fullName(m), m.email, m.phone, m.message].some((v) =>
        (v || "").toLowerCase().includes(q),
      );
    });
  }, [messages, search, filters]);

  const columns: ColumnDef<ContactMessage>[] = [
    {
      key: "createdAt",
      header: "Received",
      className: "w-28",
      cell: (m) => (
        <span className="text-app-fg-muted tabular-nums">{formatDate(m.createdAt)}</span>
      ),
    },
    {
      key: "firstName",
      header: "From",
      cell: (m) => (
        <div className="min-w-0">
          <p
            className={`truncate ${m.status === "read" ? "text-app-fg" : "font-semibold text-app-fg"}`}
          >
            {fullName(m)}
          </p>
          <p className="text-[12px] text-app-fg-muted truncate">{m.email}</p>
        </div>
      ),
    },
    {
      key: "message",
      header: "Message",
      hideBelow: "md",
      cell: (m) => (
        <p className="max-w-[420px] text-app-fg-muted line-clamp-2 leading-relaxed">{m.message}</p>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-28",
      cell: (m) => <StatusBadge status={m.status === "read" ? "read" : "pending"} />,
    },
  ];

  const rowActions: RowAction<ContactMessage>[] = [
    { label: "View", icon: Eye, onClick: openMessage },
    { label: "Reply", icon: Reply, onClick: openReply },
    {
      label: "Mark as read",
      icon: Mail,
      hidden: (m) => m.status === "read",
      onClick: markRead,
    },
    { label: "Delete", icon: Trash2, variant: "danger", onClick: (m) => setPendingDelete(m) },
  ];

  return (
    <div className="space-y-4">
      {/* ── Contact details shown on the public Contact page ──────────────── */}
      <CmsSection
        icon={MapPin}
        title="Contact details"
        blurb="Shown on the public Contact page."
        aside={
          <button onClick={handleSaveContactInfo} disabled={savingInfo} className={BTN_PRIMARY}>
            {savingInfo ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[280px,1fr]">
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-app-border bg-app-surface-2 h-40">
              {loadingContacts ? (
                <div className="w-full h-full animate-pulse bg-app-surface-2" />
              ) : (
                <img
                  src={
                    contactInfo.image
                      ? getImageUrl(contactInfo.image)
                      : "https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683"
                  }
                  className="w-full h-full object-cover"
                  alt="Contact page"
                />
              )}
            </div>
            {/* The framed preview above already shows the image — no second thumb. */}
            <MediaPicker
              value={contactInfo.image}
              hidePreview
              busy={uploadingImage}
              onFile={handleContactImageUpload}
              onClear={() => setContactInfo((prev) => ({ ...prev, image: "" }))}
              buttonLabel="Change photo"
              hint="Falls back to the built-in image when empty."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Email" htmlFor="contact-email">
              <input
                id="contact-email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                placeholder="hello@travelhomes.in"
                className={CONTROL}
              />
            </CmsField>
            <CmsField label="Phone" htmlFor="contact-phone">
              <input
                id="contact-phone"
                inputMode="numeric"
                value={contactInfo.phone}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, phone: e.target.value.replace(/\D/g, "") })
                }
                placeholder="9876543210"
                className={CONTROL}
              />
            </CmsField>
            <CmsField label="Address" htmlFor="contact-address" className="sm:col-span-2">
              <input
                id="contact-address"
                value={contactInfo.address}
                onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                placeholder="Street / locality"
                className={CONTROL}
              />
            </CmsField>
            <CmsField label="State" htmlFor="contact-state">
              <input
                id="contact-state"
                value={contactInfo.state}
                onChange={(e) => setContactInfo({ ...contactInfo, state: e.target.value })}
                className={CONTROL}
              />
            </CmsField>
            <CmsField label="City" htmlFor="contact-city">
              <input
                id="contact-city"
                value={contactInfo.city}
                onChange={(e) => setContactInfo({ ...contactInfo, city: e.target.value })}
                className={CONTROL}
              />
            </CmsField>
            <CmsField label="Pincode" htmlFor="contact-pincode">
              <input
                id="contact-pincode"
                inputMode="numeric"
                value={contactInfo.pincode}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, pincode: e.target.value.replace(/\D/g, "") })
                }
                className={CONTROL}
              />
            </CmsField>
          </div>
        </div>
      </CmsSection>

      {/* ── Submissions from the public Contact page ──────────────────────── */}
      <CmsSection
        icon={Inbox}
        title="Enquiries"
        blurb="Everything submitted through the Contact page."
        aside={
          unreadCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-app-accent-soft px-2.5 py-1 text-[11px] font-bold text-app-accent">
              {unreadCount} unread
            </span>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <AdminToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search name, email or message…"
            filterSlot={
              <AdminFilterBar
                filters={FILTER_DEFS}
                activeFilters={filters}
                onApply={setFilters}
                onClear={() => setFilters({})}
              />
            }
          />

          <TableFrame>
            <AdminDataTable<ContactMessage>
              columns={columns}
              data={visible}
              isLoading={loadingContacts}
              hasActiveQuery={!!search.trim() || Object.keys(filters).length > 0}
              emptyIcon={Inbox}
              emptyTitle="No enquiries yet"
              emptyDescription="Messages sent from the Contact page land here."
              noResultsDescription="No message matches the current search or filters."
              noResultsAction={{
                label: "Clear filters",
                onClick: () => {
                  setSearch("");
                  setFilters({});
                },
              }}
              rowActions={rowActions}
              rowBusy={(m) => busyId === m.id}
              onRowClick={openMessage}
            />
          </TableFrame>
        </div>
      </CmsSection>

      {/* ── View message ─────────────────────────────────────────────────── */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent
          style={DIALOG_VARS}
          className="max-w-xl w-[calc(100vw-2rem)] p-0 gap-0 rounded-2xl overflow-hidden"
        >
          {viewing && (
            <>
              <DialogHeader className="px-5 py-4 border-b border-app-border text-left">
                <DialogTitle className="text-[15px] font-bold text-app-fg">
                  {fullName(viewing)}
                </DialogTitle>
                <DialogDescription className="text-[12.5px] text-app-fg-muted">
                  {viewing.email}
                  {viewing.phone ? ` · ${viewing.phone}` : ""}
                  {viewing.createdAt ? ` · ${new Date(viewing.createdAt).toLocaleString()}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="px-5 py-4 max-h-[50vh] overflow-y-auto">
                <p className="text-[13.5px] leading-6 text-app-fg whitespace-pre-wrap">
                  {viewing.message}
                </p>
              </div>

              <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-app-border bg-app-surface-2">
                <button onClick={() => setViewing(null)} className={BTN_NEUTRAL}>
                  Close
                </button>
                <button
                  onClick={() => {
                    const m = viewing;
                    setViewing(null);
                    openReply(m);
                  }}
                  className={BTN_PRIMARY}
                >
                  <Reply size={15} /> Reply
                </button>
              </footer>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Reply composer ───────────────────────────────────────────────── */}
      <Dialog open={!!replyTo} onOpenChange={(o) => !o && !sendingReply && setReplyTo(null)}>
        <DialogContent
          style={DIALOG_VARS}
          className="max-w-xl w-[calc(100vw-2rem)] p-0 gap-0 rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {replyTo && (
            <>
              <DialogHeader className="px-5 py-4 border-b border-app-border text-left">
                <DialogTitle className="text-[15px] font-bold text-app-fg">
                  Reply to {fullName(replyTo)}
                </DialogTitle>
                <DialogDescription className="text-[12.5px] text-app-fg-muted">
                  Sent from the TravelHomes support mailbox.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
                <CmsField label="To">
                  <input value={replyTo.email} readOnly className={CONTROL} />
                </CmsField>
                <CmsField label="Subject" htmlFor="reply-subject">
                  <input
                    id="reply-subject"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    maxLength={200}
                    className={CONTROL}
                  />
                </CmsField>
                <CmsField label="Message" htmlFor="reply-body">
                  <textarea
                    id="reply-body"
                    rows={7}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    maxLength={20000}
                    placeholder="Write your reply…"
                    className={TEXTAREA}
                  />
                </CmsField>
                <div className="rounded-xl border border-app-border bg-app-surface-2 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-app-fg-muted mb-1">
                    Original message
                  </p>
                  <p className="text-[12.5px] leading-5 text-app-fg-muted whitespace-pre-wrap">
                    {replyTo.message}
                  </p>
                </div>
              </div>

              <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-app-border bg-app-surface-2">
                <button
                  onClick={() => setReplyTo(null)}
                  disabled={sendingReply}
                  className={BTN_NEUTRAL}
                >
                  Cancel
                </button>
                <button onClick={sendReply} disabled={sendingReply} className={BTN_PRIMARY}>
                  {sendingReply ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Send reply
                    </>
                  )}
                </button>
              </footer>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isLoading={deleting}
        title="Delete message"
        description={
          pendingDelete
            ? `Delete the message from ${fullName(pendingDelete)}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

export default ContactUsTab;
