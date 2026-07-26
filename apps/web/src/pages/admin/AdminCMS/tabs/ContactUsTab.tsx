import React, { useState } from "react";
import { Mail, MoreHorizontal, Trash2, Eye, Send, X } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import { getImageUrl } from "@/lib/adminUtils";
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";
import ConfirmModal from "@/components/shared/ConfirmModal";

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

/**
 * Contact admin, two halves:
 *  1. the editable contact-info block shown on the public Contact page
 *  2. the inbox of submissions from that page (view / mark read / reply / delete)
 *
 * Contact-info state lives in the parent because it is loaded alongside the
 * rest of the CMS bootstrap; the inbox list is passed down for the same reason.
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ContactMessage | null>(null);
  const [replyTo, setReplyTo] = useState<ContactMessage | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null);

  React.useEffect(() => {
    const handle = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".action-menu-container")) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleContactImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      e.target.value = "";
    }
  };

  const handleSaveContactInfo = async () => {
    setSavingInfo(true);
    try {
      await cmsService.upsertContact(contactInfo);
      toast.success("Contact info saved successfully!");
    } catch (err) {
      console.error("Failed to save contact info", err);
      toast.error("Failed to save contact info");
    } finally {
      setSavingInfo(false);
    }
  };

  const markRead = async (msg: ContactMessage) => {
    if (msg.status === "read") return;
    try {
      await cmsService.markContactRead(msg.id);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m)));
    } catch (err) {
      console.error("Failed to mark message read", err);
      toast.error("Failed to mark as read");
    }
  };

  const openMessage = (msg: ContactMessage) => {
    setViewing(msg);
    setOpenMenuId(null);
    markRead(msg);
  };

  const openReply = (msg: ContactMessage) => {
    setReplyTo(msg);
    setReplySubject(`Re: your enquiry to TravelHomes`);
    setReplyBody("");
    setOpenMenuId(null);
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
    try {
      await cmsService.deleteContactMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.success("Message deleted");
    } catch (err) {
      console.error("Failed to delete message", err);
      toast.error("Failed to delete message");
    } finally {
      setPendingDelete(null);
    }
  };

  const fullName = (m: ContactMessage) => `${m.firstName || ""} ${m.lastName || ""}`.trim() || "-";
  const unreadCount = messages.filter((m) => m.status !== "read").length;

  return (
    <div className="space-y-4">
      {/* ── Contact info shown on the public Contact page ───────────────── */}
      <div className="border border-dashboard-stroke rounded-xl bg-white p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Contact Us</h3>
          <button
            onClick={handleSaveContactInfo}
            disabled={savingInfo}
            className="px-5 py-2 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium hover:bg-dashboard-primary/90 transition-colors disabled:opacity-60"
          >
            {savingInfo ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6 max-md:grid-cols-1">
          <div className="col-span-4 max-md:col-span-1">
            <div className="rounded-xl overflow-hidden border bg-gray-50 h-48 flex items-center justify-center">
              {loadingContacts ? (
                <UniqueStaysSkeleton />
              ) : (
                <img
                  src={
                    contactInfo.image
                      ? getImageUrl(contactInfo.image)
                      : "https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683"
                  }
                  className="w-full h-full object-cover"
                  alt="Contact Page"
                />
              )}
            </div>

            <label className="mt-3 w-full block">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleContactImageChange}
              />
              <div className="w-full bg-dashboard-primary text-white py-2 rounded-full text-sm text-center cursor-pointer hover:bg-[#14709F]">
                {uploadingImage ? "Uploading..." : "Change Photo"}
              </div>
            </label>
          </div>

          <div className="col-span-8 max-md:col-span-1 grid grid-cols-12 gap-4">
            <div className="col-span-6 max-sm:col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="col-span-6 max-sm:col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={contactInfo.phone}
                onChange={(e) => {
                  const onlyNums = e.target.value.replace(/\D/g, "");
                  setContactInfo({ ...contactInfo, phone: onlyNums });
                }}
                placeholder="Enter phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="col-span-12">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={contactInfo.address}
                onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                placeholder="Address / Locality"
                className="w-full px-3 mt-1 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="col-span-4 max-sm:col-span-12">
              <input
                type="text"
                value={contactInfo.state}
                onChange={(e) => setContactInfo({ ...contactInfo, state: e.target.value })}
                placeholder="State"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="col-span-4 max-sm:col-span-12">
              <input
                type="text"
                value={contactInfo.city}
                onChange={(e) => setContactInfo({ ...contactInfo, city: e.target.value })}
                placeholder="City"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            <div className="col-span-4 max-sm:col-span-12">
              <input
                type="text"
                value={contactInfo.pincode}
                onChange={(e) => {
                  const onlyNums = e.target.value.replace(/\D/g, "");
                  setContactInfo({ ...contactInfo, pincode: onlyNums });
                }}
                placeholder="Pincode"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Submissions from the public Contact page ────────────────────── */}
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-dashboard-title font-plus-jakarta text-sm font-bold">
              Contact Messages
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-dashboard-primary/20 text-xs font-semibold text-dashboard-heading">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        <div
          className="h-px bg-dashboard-stroke mb-3"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, #EAECF0 0, #EAECF0 2px, transparent 2px, transparent 4px)",
          }}
        />

        <div className="border border-dashboard-stroke rounded-xl overflow-x-auto">
          <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-3 px-4 py-3 min-w-[900px]">
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Date
            </div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Name
            </div>
            <div className="col-span-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Contact
            </div>
            <div className="col-span-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Message
            </div>
            <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Status
            </div>
            <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Action
            </div>
          </div>

          {loadingContacts ? (
            <div className="p-8 text-center text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No messages yet.</div>
          ) : (
            messages.map((m, index) => (
              <div
                key={m.id}
                className={`grid grid-cols-12 gap-3 px-4 py-3.5 min-w-[900px] items-center ${
                  index !== messages.length - 1 ? "border-b border-gray-100" : ""
                } ${m.status !== "read" ? "bg-dashboard-primary/[0.04]" : ""}`}
              >
                <div className="col-span-2 text-sm text-gray-600">
                  {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "-"}
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-900">{fullName(m)}</div>
                <div className="col-span-3 text-sm text-gray-600 flex flex-col">
                  <span className="truncate" title={m.email}>
                    {m.email}
                  </span>
                  {m.phone && <span className="text-xs text-gray-500">{m.phone}</span>}
                </div>
                <div className="col-span-3 text-sm text-gray-700 truncate" title={m.message}>
                  {m.message}
                </div>
                <div className="col-span-1">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      m.status === "read"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {m.status === "read" ? "Read" : "Unread"}
                  </span>
                </div>
                <div className="col-span-1 relative action-menu-container flex justify-center">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Message actions"
                  >
                    <MoreHorizontal size={20} className="text-dashboard-body" />
                  </button>

                  {openMenuId === m.id && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-dashboard-stroke rounded-lg shadow-lg z-50 py-1">
                      <button
                        onClick={() => openMessage(m)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-dashboard-primary/10 flex items-center gap-2"
                      >
                        <Eye size={16} /> View
                      </button>
                      <button
                        onClick={() => openReply(m)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-dashboard-primary/10 flex items-center gap-2"
                      >
                        <Mail size={16} /> Reply
                      </button>
                      {m.status !== "read" && (
                        <button
                          onClick={() => {
                            markRead(m);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-dashboard-primary/10 flex items-center gap-2"
                        >
                          <Eye size={16} /> Mark as read
                        </button>
                      )}
                      <div className="h-px bg-gray-100 my-1" />
                      <button
                        onClick={() => {
                          setPendingDelete(m);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── View message ────────────────────────────────────────────────── */}
      {viewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-dashboard-heading">{fullName(viewing)}</h3>
                <p className="text-sm text-gray-500">
                  {viewing.email}
                  {viewing.phone ? ` · ${viewing.phone}` : ""}
                </p>
                {viewing.createdAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(viewing.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewing(null)}
                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap border-t pt-4">
              {viewing.message}
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setViewing(null)}
                className="px-5 py-2.5 border rounded-full text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const m = viewing;
                  setViewing(null);
                  openReply(m);
                }}
                className="px-5 py-2.5 bg-dashboard-primary text-black rounded-full text-sm font-medium flex items-center gap-2"
              >
                <Mail size={16} /> Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reply composer ──────────────────────────────────────────────── */}
      {replyTo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-dashboard-heading">
                Reply to {fullName(replyTo)}
              </h3>
              <button
                onClick={() => setReplyTo(null)}
                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  value={replyTo.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={7}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  maxLength={20000}
                  placeholder="Write your reply..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">Original message</p>
                <p className="text-xs text-gray-600 whitespace-pre-wrap">{replyTo.message}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setReplyTo(null)}
                className="px-5 py-2.5 border rounded-full text-sm"
              >
                Cancel
              </button>
              <button
                onClick={sendReply}
                disabled={sendingReply}
                className="px-5 py-2.5 bg-dashboard-primary text-black rounded-full text-sm font-medium flex items-center gap-2 disabled:opacity-60"
              >
                <Send size={16} /> {sendingReply ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
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
