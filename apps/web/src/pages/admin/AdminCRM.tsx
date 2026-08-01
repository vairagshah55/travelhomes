import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Loader2,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Send,
  ShieldCheck,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { MotionReveal } from "@/components/admin/MotionReveal";
import { ADMIN_APP_VARS } from "@/components/shared/Panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crmService } from "@/services/crm";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MESSAGE_MAX = 1000;

type Audience = "Vendor" | "User" | "Staff";

const AUDIENCES: { key: Audience; label: string; icon: LucideIcon; blurb: string }[] = [
  { key: "Vendor", label: "Vendors", icon: Store, blurb: "Everyone who lists on the platform." },
  { key: "User", label: "Users", icon: Users, blurb: "Guests with an account." },
  { key: "Staff", label: "Staff", icon: ShieldCheck, blurb: "Your internal admin team." },
];

const CHANNELS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "Email", label: "Email", icon: Mail },
  { key: "Text", label: "SMS", icon: MessageSquare },
  { key: "Whatsapp", label: "WhatsApp", icon: MessageCircle },
];

const SERVICE_TYPES = [
  { value: "all", label: "All service types" },
  { value: "Caravan", label: "Caravan" },
  { value: "Stay", label: "Stay" },
  { value: "Activity", label: "Activity" },
];

/** Counters are noise until the field is nearly full. */
const counterFor = (value: string, max: number) =>
  value.length > max * 0.7 ? `${value.length}/${max}` : undefined;

const AdminCRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Audience>("Vendor");
  // Supports multiple channels
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  // Generic service type for Vendor, User, and Staff. "all" == no filter.
  const [serviceType, setServiceType] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const audience = AUDIENCES.find((a) => a.key === activeTab) ?? AUDIENCES[0];

  const toggleChannel = (type: string) => {
    setSelectedChannels((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  /** Plain-English recap of who gets this — the old form never said. */
  const recipientSummary = useMemo(() => {
    const via =
      selectedChannels.length === 0
        ? "no channel yet"
        : selectedChannels.map((c) => CHANNELS.find((x) => x.key === c)?.label ?? c).join(" + ");
    const segment =
      activeTab === "Staff" || serviceType === "all"
        ? audience.label.toLowerCase()
        : `${audience.label.toLowerCase()} · ${serviceType}`;
    return `${segment} via ${via}`;
  }, [activeTab, serviceType, selectedChannels, audience.label]);

  const blocker =
    selectedChannels.length === 0
      ? "Pick at least one channel"
      : !message.trim()
        ? "Write a message first"
        : null;

  const handleSendMessage = async () => {
    if (blocker) {
      toast.error(blocker);
      return;
    }

    try {
      setLoading(true);
      await crmService.sendMessage({
        targetType: activeTab,
        channels: selectedChannels,
        // "all" is a UI-only sentinel — the API expects an empty string for
        // "no service filter". A Radix Select can't hold an empty value.
        serviceType: (serviceType === "all" ? "" : serviceType) as
          | "Caravan"
          | "Stay"
          | "Activity"
          | "",
        message,
      });
      toast.success("Message sent successfully!");
      setMessage("");
      setServiceType("all");
      setSelectedChannels([]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="CRM">
      <MotionReveal className="max-w-4xl">
        <div className="bg-app-surface rounded-[18px] border border-app-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)] overflow-hidden">
          {/* Panel head — mirrors PanelHead in the shared kit. */}
          <header className="flex items-start gap-3 px-5 pt-4 pb-3.5 border-b border-app-border">
            <span className="grid place-items-center w-8 h-8 rounded-[10px] bg-app-accent-soft text-app-accent shrink-0">
              <Megaphone size={15} strokeWidth={2.1} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[14.5px] font-bold tracking-[-0.01em] text-app-fg">Broadcast</h2>
              <p className="mt-0.5 text-[12.5px] text-app-fg-muted">
                Send one message to a whole segment. It goes out immediately.
              </p>
            </div>
          </header>

          {/* Audience — segmented rail with the kit's sliding pill. */}
          <div
            role="tablist"
            aria-label="Audience"
            className="flex items-center gap-1 px-3 py-2.5 border-b border-app-border overflow-x-auto scrollbar-hide"
          >
            {AUDIENCES.map((a) => {
              const active = activeTab === a.key;
              return (
                <button
                  key={a.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveTab(a.key);
                    setServiceType("all"); // Reset service filter when switching segments
                  }}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl whitespace-nowrap shrink-0",
                    "text-[12.5px] font-semibold outline-none transition-colors duration-150",
                    "focus-visible:ring-2 focus-visible:ring-app-accent/40",
                    active
                      ? "text-app-accent"
                      : "text-app-fg-muted hover:text-app-fg hover:bg-app-surface-2",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="crmAudiencePill"
                      className="absolute inset-0 rounded-xl bg-app-accent-soft"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <a.icon size={14} strokeWidth={2.1} className="relative shrink-0" />
                  <span className="relative">{a.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-5 space-y-5">
            {/* Channels — multi-select, so these read as checkable chips rather
                than the single-select segmented control they used to look like. */}
            <div className="space-y-2">
              <p className="text-[12.5px] font-semibold text-app-fg/85">
                Channels
                <span className="ml-1.5 font-normal text-app-fg-muted">pick one or more</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((c) => {
                  const selected = selectedChannels.includes(c.key);
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => toggleChannel(c.key)}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border text-[13px] font-semibold",
                        "outline-none transition-[background-color,border-color,color] duration-150",
                        "focus-visible:ring-4 focus-visible:ring-app-accent/20",
                        selected
                          ? "border-app-accent bg-app-accent-soft text-app-accent"
                          : "border-app-border bg-app-surface-2 text-app-fg/80 hover:bg-app-surface",
                      )}
                    >
                      <c.icon size={15} strokeWidth={2.1} />
                      {c.label}
                      {selected && <Check size={13} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Service-type filter — only meaningful for Vendor/User segments,
                who are grouped by service category. Staff have no service type. */}
            {activeTab !== "Staff" && (
              <div className="space-y-1.5 max-w-sm">
                <label
                  htmlFor="crm-service-type"
                  className="block text-[12.5px] font-semibold text-app-fg/85"
                >
                  Service type
                </label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger
                    id="crm-service-type"
                    className="h-11 rounded-xl border-app-border bg-app-surface-2 text-[13.5px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  {/* Radix portals this to <body>, outside AdminLayout, so the
                      `app-*` vars have to come along or the highlight resolves to
                      the global purple. */}
                  <SelectContent style={ADMIN_APP_VARS}>
                    {SERVICE_TYPES.map((s) => (
                      <SelectItem
                        key={s.value}
                        value={s.value}
                        className="cursor-pointer focus:bg-app-accent-soft focus:text-app-accent data-[highlighted]:bg-app-accent-soft data-[highlighted]:text-app-accent"
                      >
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Message */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <label
                  htmlFor="crm-message"
                  className="block text-[12.5px] font-semibold text-app-fg/85"
                >
                  Message
                </label>
                {counterFor(message, MESSAGE_MAX) && (
                  <span className="text-[11px] tabular-nums text-app-fg-muted">
                    {counterFor(message, MESSAGE_MAX)}
                  </span>
                )}
              </div>
              <textarea
                id="crm-message"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
                placeholder="Write the message your recipients will see…"
                rows={6}
                maxLength={MESSAGE_MAX}
                className={cn(
                  "w-full px-3.5 py-3 rounded-xl border border-app-border bg-app-surface-2",
                  "text-[13.5px] text-app-fg placeholder:text-app-fg-muted/70 resize-none outline-none",
                  "transition-[background-color,border-color,box-shadow] duration-150",
                  "focus:bg-app-surface focus:border-app-accent focus:ring-4 focus:ring-app-accent/20",
                )}
              />
            </div>
          </div>

          {/* Footer — says who receives this before you commit. */}
          <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-app-border bg-app-surface-2">
            <p className="text-[11.5px] text-app-fg-muted">
              Sending to <span className="font-semibold text-app-fg/80">{recipientSummary}</span>
            </p>

            <div className="flex items-center gap-3">
              {blocker && !loading && (
                <span className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-medium text-amber-600 dark:text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {blocker}
                </span>
              )}
              <button
                onClick={handleSendMessage}
                disabled={loading || !!blocker}
                className={cn(
                  "inline-flex items-center gap-2 h-10 px-5 rounded-xl",
                  "bg-app-accent text-app-accent-fg text-[13px] font-semibold",
                  "transition-[background-color,box-shadow] duration-150 hover:bg-app-accent-hover",
                  "shadow-[0_1px_2px_rgba(17, 116, 121,0.24),0_6px_16px_-6px_rgba(17, 116, 121,0.45)]",
                  "disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed",
                )}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={15} strokeWidth={2.3} />
                    Send message
                  </>
                )}
              </button>
            </div>
          </footer>
        </div>
      </MotionReveal>
    </AdminLayout>
  );
};

export default AdminCRM;
