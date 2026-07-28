import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  BellRing,
  CalendarCheck,
  Check,
  Globe,
  LifeBuoy,
  Loader2,
  Mail,
  MessageSquare,
  NotebookPen,
  Phone,
  Send,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { EmptyState, StatusBadge, TableSkeleton } from "@/components/shared";
import { getInitials } from "@/utils/getInitials";
import { cn } from "@/lib/utils";
import {
  helpDeskApi,
  vendorSettingApi,
  type HelpDeskTicketDTO,
  type VendorSettingDTO,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/* ── Constants ────────────────────────────────────────────────────────────── */

type SectionKey = "general" | "account" | "preferences";

/** The `account` key is historical — that route hosts the support desk. */
const TABS: { key: SectionKey; label: string; href: string; icon: LucideIcon }[] = [
  { key: "general", label: "General", href: "/settings", icon: SlidersHorizontal },
  { key: "account", label: "Support", href: "/settings/account", icon: LifeBuoy },
  { key: "preferences", label: "Preferences", href: "/settings/preferences", icon: BellRing },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
];

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

const NOTIFICATION_CHANNELS: {
  key: "email" | "sms" | "push";
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    key: "email",
    label: "Email notifications",
    description: "Booking confirmations, payout updates and review alerts.",
    icon: Mail,
  },
  {
    key: "sms",
    label: "SMS notifications",
    description: "Time-critical booking updates sent as a text message.",
    icon: MessageSquare,
  },
  {
    key: "push",
    label: "Push notifications",
    description: "In-app and browser alerts while you're signed in.",
    icon: BellRing,
  },
];

/** Server caps: subject 200 chars, description 5000 (helpdesk.dto.js). */
const SUBJECT_MAX = 200;
const MESSAGE_MAX = 5000;

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const formatTicketDate = (raw?: string) => {
  if (!raw) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/** Compact secondary line under the absolute date — "3d ago". */
const formatRelative = (raw?: string) => {
  if (!raw) return "";
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.round((Date.now() - t) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.round(days / 30)}mo ago`;
};

/**
 * Stable identity for the three preference fields the UI actually edits.
 * A raw JSON compare against the server document would always differ —
 * Mongoose stamps `_id` onto the nested notifications subdocument.
 */
const prefsFingerprint = (p?: Partial<VendorSettingDTO["preferences"]> | null) =>
  JSON.stringify({
    language: p?.language ?? "",
    timezone: p?.timezone ?? "",
    email: !!p?.notifications?.email,
    sms: !!p?.notifications?.sms,
    push: !!p?.notifications?.push,
  });

/* ── Local presentational primitives ──────────────────────────────────────────
   These encode this page's card/row rhythm. Tokens only, no hardcoded hex —
   see CONVENTIONS.md Rule 1/3. `tpl-*` values are raw CSS strings, so they
   never take an opacity modifier; `brand` is hsl-channel based and does.     */

const SectionHeading = ({
  icon: Icon,
  title,
  description,
  aside,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  aside?: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid place-items-center w-9 h-9 rounded-xl bg-brand/10 text-brand shrink-0">
        <Icon size={17} strokeWidth={2.1} />
      </span>
      <div>
        <h2 className="text-[15px] font-bold leading-6 text-tpl-dark dark:text-white">{title}</h2>
        <p className="mt-0.5 text-[13px] text-tpl-dark-5 dark:text-gray-400">{description}</p>
      </div>
    </div>
    {aside}
  </div>
);

const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div
    className={cn(
      "bg-tpl-card-bg border border-tpl-stroke rounded-2xl shadow-tpl-1 overflow-hidden",
      className,
    )}
  >
    {children}
  </div>
);

const CardHeader = ({ title, aside }: { title: string; aside?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-tpl-stroke">
    <h3 className="text-[13px] font-bold uppercase tracking-wide text-tpl-dark-5 dark:text-gray-400">
      {title}
    </h3>
    {aside}
  </div>
);

/** Label + description on the left, control on the right. */
const SettingRow = ({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-6 px-5 py-4">
    <div className="flex items-start gap-3 min-w-0">
      {Icon && (
        <span className="mt-px grid place-items-center w-8 h-8 rounded-lg bg-tpl-gray-2 dark:bg-white/5 text-tpl-dark-4 dark:text-gray-300 shrink-0">
          <Icon size={15} strokeWidth={2} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-tpl-dark dark:text-gray-100">{title}</p>
        {description && (
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-tpl-dark-5 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Field = ({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-wide text-tpl-dark-5 dark:text-gray-400"
    >
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error ? (
      <p className="flex items-center gap-1 text-[11.5px] font-medium text-red-600 dark:text-red-400">
        <AlertCircle size={12} strokeWidth={2.4} />
        {error}
      </p>
    ) : hint ? (
      <p className="text-[11.5px] text-tpl-dark-6 dark:text-gray-500">{hint}</p>
    ) : null}
  </div>
);

/** Shared control skin so inputs, textarea and selects sit on one grid. */
const CONTROL_BASE =
  "rounded-xl bg-tpl-gray-1 dark:bg-white/5 border-tpl-stroke text-[13.5px] " +
  "placeholder:text-tpl-dark-6 focus-visible:border-brand focus-visible:ring-2 " +
  "focus-visible:ring-brand/25 focus-visible:ring-offset-0 transition-colors duration-150";
const CONTROL_ERROR = "border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20";

/** One read-only identity cell in the account-overview strip. */
const MetaCell = ({
  label,
  value,
  verified,
}: {
  label: string;
  value?: React.ReactNode;
  verified?: boolean;
}) => (
  <div className="px-5 py-3.5">
    <p className="text-[11px] font-bold uppercase tracking-wide text-tpl-dark-6 dark:text-gray-500">
      {label}
    </p>
    <div className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-tpl-dark dark:text-gray-100">
      <span className="truncate">{value || "—"}</span>
      {verified && (
        <BadgeCheck size={14} className="shrink-0 text-emerald-500" aria-label="Verified" />
      )}
    </div>
  </div>
);

/* ── Page ─────────────────────────────────────────────────────────────────── */

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token: authToken } = useAuth();
  const token = authToken ?? undefined;
  const queryClient = useQueryClient();
  // Real vendor id only — empty string disables the settings query until the
  // user is loaded (no more hardcoded "1" demo fallback hitting the API).
  const vendorId = useMemo(() => user?.id ?? "", [user]);

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [openTicket, setOpenTicket] = useState<HelpDeskTicketDTO | null>(null);

  // Which section is active by URL
  const activeSection: SectionKey = location.pathname.endsWith("/account")
    ? "account"
    : location.pathname.endsWith("/preferences")
      ? "preferences"
      : "general";

  // Form state for vendor settings sections
  // `general` holds both the DTO's general fields (siteName / theme /
  // logoUrl / faviconUrl) and the page-local UI flag confirmBeforeBooking.
  // Typed permissively because the API can supply either shape.
  const [general, setGeneral] = useState<
    Partial<VendorSettingDTO["general"]> & { confirmBeforeBooking?: boolean }
  >({
    confirmBeforeBooking: true,
  });
  const [preferences, setPreferences] = useState<VendorSettingDTO["preferences"]>({
    language: "en",
    timezone: "Asia/Kolkata",
    notifications: { email: true, sms: false, push: false },
  });
  const [account, setAccount] = useState<VendorSettingDTO["account"]>({
    contactEmail: "",
    contactPhone: "",
    supportEmail: "",
  });
  const [ticket, setTicket] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });
  const [ticketErrors, setTicketErrors] = useState<Record<string, string>>({});

  /** Prefill the ticket form from the signed-in vendor. */
  const ticketDefaults = () => ({
    name: user?.firstName ? `${user.firstName} ${user.lastName}` : "",
    phone: user?.phoneNumber || user?.phone || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    if (user) {
      setTicket((prev) => ({
        ...prev,
        name: user.firstName ? `${user.firstName} ${user.lastName}` : prev.name,
        email: user.email || prev.email,
        phone: user.phoneNumber || user.phone || prev.phone,
      }));
    }
  }, [user]);

  // The vendor's own tickets. The server scopes this to the caller's token,
  // so no client-side filtering is needed.
  const ticketsKey = ["helpDesk", "myTickets", user?.id] as const;
  const ticketsQuery = useQuery<HelpDeskTicketDTO[]>({
    queryKey: ticketsKey,
    enabled: !!token,
    queryFn: async () => {
      const res = await helpDeskApi.list(token);
      return res.data ?? [];
    },
  });
  const tickets = ticketsQuery.data ?? [];

  // Vendor settings — try to fetch, create defaults if not found.
  const settingsQuery = useQuery<VendorSettingDTO | null>({
    queryKey: ["vendorSettings", vendorId],
    enabled: !!vendorId,
    retry: false,
    queryFn: async () => {
      try {
        const res = await vendorSettingApi.get(vendorId);
        return res.data ?? null;
      } catch {
        // First-time login — create the row with the current local
        // defaults. The created row is returned for caching.
        const created = await vendorSettingApi.create({
          vendorId,
          general: general as VendorSettingDTO["general"],
          account,
          preferences,
        });
        return created.data ?? null;
      }
    },
  });

  useEffect(() => {
    const data = settingsQuery.data;
    if (!data) return;
    if (data.general) setGeneral(data.general);
    if (data.account) setAccount(data.account);
    if (data.preferences) setPreferences(data.preferences);
    // Update favicon and title when loaded
    if (data.general?.faviconUrl) {
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (link) link.href = data.general.faviconUrl;
    }
    if (data.general?.siteName) {
      document.title = data.general.siteName;
    }
  }, [settingsQuery.data]);

  /** Save is only offered when something actually changed. */
  const prefsDirty =
    prefsFingerprint(preferences) !== prefsFingerprint(settingsQuery.data?.preferences);

  const savePreferences = async () => {
    if (!vendorId) return;
    try {
      setSavingPrefs(true);
      await vendorSettingApi.updateSection(vendorId, "preferences", preferences);
      queryClient.invalidateQueries({ queryKey: ["vendorSettings", vendorId] });
      toast.success("Preferences saved.");
    } catch {
      toast.error("Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  /** Timezone list always contains whatever is currently stored. */
  const timezoneOptions = useMemo(() => {
    const current = preferences.timezone;
    return current && !TIMEZONES.includes(current) ? [current, ...TIMEZONES] : TIMEZONES;
  }, [preferences.timezone]);

  const validateTicket = () => {
    const errors: Record<string, string> = {};
    if (!ticket.name.trim()) errors.name = "Name is required.";
    if (!ticket.phone.trim()) errors.phone = "Phone number is required.";
    else if (!/^\d{10}$/.test(ticket.phone.replace(/\D/g, "")))
      errors.phone = "Enter a valid 10-digit number.";
    if (!ticket.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticket.email))
      errors.email = "Enter a valid email address.";
    if (!ticket.subject.trim()) errors.subject = "Subject is required.";
    if (!ticket.message.trim()) errors.message = "Tell us what went wrong.";
    return errors;
  };

  const setTicketField = (key: string, value: string) => {
    setTicket((prev) => ({ ...prev, [key]: value }));
    // Clear the field's error as soon as the vendor edits it.
    setTicketErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  const handleSubmitTicket = async () => {
    const errors = validateTicket();
    setTicketErrors(errors);
    if (Object.keys(errors).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    try {
      setSubmittingTicket(true);
      await helpDeskApi.create(
        {
          name: ticket.name,
          phoneNumber: ticket.phone,
          email: ticket.email,
          subject: ticket.subject,
          description: ticket.message,
          vendorName: user?.firstName ? `${user.firstName} ${user.lastName}` : ticket.name,
          vendorEmail: user?.email || ticket.email,
        },
        token,
      );
      // Pull the new row into the table below the form.
      queryClient.invalidateQueries({ queryKey: ticketsKey });
      setShowSuccessModal(true);
      setTicket(ticketDefaults());
      setTicketErrors({});
    } catch {
      toast.error("Failed to submit ticket. Please try again.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName}` : user?.name;

  const ticketFields: {
    key: "name" | "phone" | "email" | "subject";
    label: string;
    type: string;
    placeholder: string;
    maxLength?: number;
    className?: string;
  }[] = [
    { key: "name", label: "Your name", type: "text", placeholder: "e.g. Priya Nair" },
    { key: "phone", label: "Phone number", type: "tel", placeholder: "10-digit mobile number" },
    { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
    {
      key: "subject",
      label: "Subject",
      type: "text",
      placeholder: "Short summary of the issue",
      maxLength: SUBJECT_MAX,
      className: "md:col-span-2",
    },
  ];

  return (
    <DashboardLayout
      title="Settings"
      contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6"
    >
      <div className="max-w-4xl mx-auto space-y-5 pb-10">
        {/* ── Settings nav tabs ── */}
        <div
          role="tablist"
          aria-label="Settings sections"
          className="inline-flex items-center gap-1 p-1 rounded-2xl bg-tpl-gray-2 dark:bg-white/5 border border-tpl-stroke"
        >
          {TABS.map((tab) => {
            const active = activeSection === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={active}
                onClick={() => navigate(tab.href)}
                className={cn(
                  "relative flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold",
                  "transition-colors duration-150 outline-none",
                  "focus-visible:ring-2 focus-visible:ring-brand/40",
                  active
                    ? "text-brand"
                    : "text-tpl-dark-5 hover:text-tpl-dark dark:text-gray-400 dark:hover:text-gray-100",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="settingsTabPill"
                    className="absolute inset-0 rounded-xl bg-tpl-card-bg shadow-tpl-1"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <tab.icon size={15} strokeWidth={2.2} />
                  {tab.label}
                  {tab.key === "account" && tickets.length > 0 && (
                    <span
                      className={cn(
                        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1",
                        "rounded-full text-[10px] font-bold",
                        active
                          ? "bg-brand/10 text-brand"
                          : "bg-tpl-gray-3 text-tpl-dark-5 dark:bg-white/10 dark:text-gray-400",
                      )}
                    >
                      {tickets.length}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-5"
          >
            {/* ── General ── */}
            {activeSection === "general" && (
              <>
                <SectionHeading
                  icon={SlidersHorizontal}
                  title="General"
                  description="Your account at a glance, plus how bookings reach you."
                />

                {/* Account overview — read-only, sourced from the signed-in user. */}
                <Card>
                  <div className="flex items-center gap-4 p-5">
                    {user?.photo || user?.avatar ? (
                      <img
                        src={user.photo || user.avatar}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <span className="grid place-items-center w-12 h-12 rounded-full bg-brand text-brand-fg text-[15px] font-bold shrink-0">
                        {getInitials(displayName)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold text-tpl-dark dark:text-white truncate">
                        {displayName || "Your account"}
                      </p>
                      <p className="text-[12.5px] text-tpl-dark-5 dark:text-gray-400 capitalize">
                        {user?.userType === "vendor" ? "Vendor account" : "Account"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/profile")}
                      className="shrink-0 h-9 rounded-xl border-tpl-stroke text-[12.5px] font-semibold"
                    >
                      Edit profile
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-3 border-t border-tpl-stroke divide-y sm:divide-y-0 sm:divide-x divide-tpl-stroke">
                    <MetaCell label="Email" value={user?.email} verified={user?.emailVerified} />
                    <MetaCell
                      label="Phone"
                      value={user?.phoneNumber || user?.phone}
                      verified={user?.mobileVerified}
                    />
                    <MetaCell
                      label="Status"
                      value={
                        user?.vendorStatus ? (
                          <StatusBadge status={user.vendorStatus} size="sm" />
                        ) : (
                          "—"
                        )
                      }
                    />
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Bookings" />
                  <SettingRow
                    icon={CalendarCheck}
                    title="Confirmation before accepting booking"
                    description="When enabled, a complete assessment is required before a booking is confirmed."
                  >
                    <Switch
                      checked={!!general.confirmBeforeBooking}
                      onCheckedChange={(checked) =>
                        setGeneral({ ...general, confirmBeforeBooking: checked })
                      }
                      aria-label="Confirmation before accepting booking"
                    />
                  </SettingRow>
                </Card>
              </>
            )}

            {/* ── Support (route: /settings/account) ── */}
            {activeSection === "account" && (
              <>
                <SectionHeading
                  icon={LifeBuoy}
                  title="Support"
                  description="Raise an issue with our team and track everything you've filed."
                />

                <Card>
                  <CardHeader
                    title="Raise an issue"
                    aside={
                      <span className="text-[11.5px] text-tpl-dark-6 dark:text-gray-500">
                        Usually answered within 24 hours
                      </span>
                    }
                  />
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ticketFields.map((f) => (
                        <div key={f.key} className={f.className}>
                          <Field
                            label={f.label}
                            htmlFor={`ticket-${f.key}`}
                            required
                            error={ticketErrors[f.key]}
                            hint={
                              f.key === "subject" && !ticketErrors.subject
                                ? `${ticket.subject.length}/${SUBJECT_MAX}`
                                : undefined
                            }
                          >
                            <Input
                              id={`ticket-${f.key}`}
                              type={f.type}
                              placeholder={f.placeholder}
                              maxLength={f.maxLength}
                              inputMode={f.key === "phone" ? "numeric" : undefined}
                              aria-invalid={!!ticketErrors[f.key]}
                              value={ticket[f.key]}
                              onChange={(e) => {
                                const raw = e.target.value;
                                setTicketField(
                                  f.key,
                                  f.key === "phone" ? raw.replace(/\D/g, "").slice(0, 10) : raw,
                                );
                              }}
                              className={cn(
                                "h-11",
                                CONTROL_BASE,
                                ticketErrors[f.key] && CONTROL_ERROR,
                              )}
                            />
                          </Field>
                        </div>
                      ))}
                    </div>

                    <Field
                      label="Message"
                      htmlFor="ticket-message"
                      required
                      error={ticketErrors.message}
                      hint={`${ticket.message.length}/${MESSAGE_MAX}`}
                    >
                      <Textarea
                        id="ticket-message"
                        maxLength={MESSAGE_MAX}
                        aria-invalid={!!ticketErrors.message}
                        placeholder="Describe the issue — what you expected, what happened, and any booking or listing IDs involved."
                        value={ticket.message}
                        onChange={(e) => setTicketField("message", e.target.value)}
                        className={cn(
                          "min-h-[130px] resize-none py-3",
                          CONTROL_BASE,
                          ticketErrors.message && CONTROL_ERROR,
                        )}
                      />
                    </Field>
                  </div>

                  <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-tpl-stroke bg-tpl-gray-1 dark:bg-white/[0.02]">
                    <p className="text-[11.5px] text-tpl-dark-5 dark:text-gray-500">
                      We'll reply to <span className="font-semibold">{ticket.email || "—"}</span>
                    </p>
                    <Button
                      onClick={handleSubmitTicket}
                      disabled={submittingTicket}
                      className="h-10 px-5 rounded-xl bg-brand hover:bg-brand-hover font-semibold gap-2 disabled:opacity-60"
                    >
                      {submittingTicket ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Send size={15} strokeWidth={2.2} />
                          Submit ticket
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* ── My tickets ── */}
                <Card>
                  <CardHeader
                    title="My tickets"
                    aside={
                      tickets.length > 0 ? (
                        <span className="text-[11.5px] font-semibold text-tpl-dark-5 dark:text-gray-400">
                          {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
                        </span>
                      ) : undefined
                    }
                  />

                  {ticketsQuery.isError ? (
                    <EmptyState
                      icon={AlertCircle}
                      title="Couldn't load your tickets"
                      description="Something went wrong while fetching them. Try again in a moment."
                      actionLabel="Try again"
                      onAction={() => ticketsQuery.refetch()}
                    />
                  ) : !ticketsQuery.isLoading && tickets.length === 0 ? (
                    <EmptyState
                      icon={NotebookPen}
                      title="No tickets yet"
                      description="Tickets you raise will appear here with their status, so you can follow them without leaving the dashboard."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th className="px-5">Subject</th>
                            <th className="px-5 hidden md:table-cell">Message</th>
                            <th className="px-5 hidden sm:table-cell">Raised on</th>
                            <th className="px-5">Status</th>
                          </tr>
                        </thead>
                        {ticketsQuery.isLoading ? (
                          <TableSkeleton rows={3} columns={4} />
                        ) : (
                          <tbody>
                            {tickets.map((t) => (
                              <tr
                                key={t._id}
                                tabIndex={0}
                                role="button"
                                aria-label={`Open ticket ${t.subject}`}
                                onClick={() => setOpenTicket(t)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setOpenTicket(t);
                                  }
                                }}
                                className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
                              >
                                <td className="px-5 align-top">
                                  <span className="font-semibold text-tpl-dark dark:text-white">
                                    {t.subject}
                                  </span>
                                </td>
                                <td className="px-5 align-top hidden md:table-cell max-w-md">
                                  <span className="line-clamp-2 text-tpl-dark-4 dark:text-gray-400">
                                    {t.description}
                                  </span>
                                </td>
                                <td className="px-5 align-top whitespace-nowrap hidden sm:table-cell">
                                  <span className="block">{formatTicketDate(t.createdAt)}</span>
                                  <span className="block text-[11.5px] text-tpl-dark-6 dark:text-gray-500">
                                    {formatRelative(t.createdAt)}
                                  </span>
                                </td>
                                <td className="px-5 align-top">
                                  <StatusBadge status={(t.status || "pending").toLowerCase()} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        )}
                      </table>
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* ── Preferences ── */}
            {activeSection === "preferences" && (
              <>
                <SectionHeading
                  icon={BellRing}
                  title="Preferences"
                  description="Language, timezone, and how we should reach you."
                />

                <Card>
                  <CardHeader title="Regional" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                    <Field label="Language" htmlFor="pref-language">
                      <Select
                        value={preferences.language}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, language: value })
                        }
                      >
                        <SelectTrigger id="pref-language" className={cn("h-11", CONTROL_BASE)}>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.value} value={l.value}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field
                      label="Timezone"
                      htmlFor="pref-timezone"
                      hint={
                        <span className="inline-flex items-center gap-1">
                          <Globe size={11} strokeWidth={2.2} />
                          Used for booking times and reports
                        </span>
                      }
                    >
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) =>
                          setPreferences({ ...preferences, timezone: value })
                        }
                      >
                        <SelectTrigger id="pref-timezone" className={cn("h-11", CONTROL_BASE)}>
                          <SelectValue placeholder="Select a timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezoneOptions.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Notifications" />
                  <div className="divide-y divide-tpl-stroke">
                    {NOTIFICATION_CHANNELS.map((channel) => (
                      <SettingRow
                        key={channel.key}
                        icon={channel.icon}
                        title={channel.label}
                        description={channel.description}
                      >
                        <Switch
                          checked={!!preferences.notifications?.[channel.key]}
                          onCheckedChange={(checked) =>
                            setPreferences({
                              ...preferences,
                              notifications: {
                                ...preferences.notifications,
                                [channel.key]: checked,
                              },
                            })
                          }
                          aria-label={channel.label}
                        />
                      </SettingRow>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-tpl-stroke bg-tpl-gray-1 dark:bg-white/[0.02]">
                    <p className="text-[11.5px] text-tpl-dark-5 dark:text-gray-500">
                      {prefsDirty ? "You have unsaved changes." : "All changes saved."}
                    </p>
                    <Button
                      onClick={savePreferences}
                      disabled={savingPrefs || !prefsDirty}
                      className="h-10 px-5 rounded-xl bg-brand hover:bg-brand-hover font-semibold gap-2 disabled:opacity-50"
                    >
                      {savingPrefs ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </div>
                </Card>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Ticket detail ── */}
      <Dialog open={!!openTicket} onOpenChange={(open) => !open && setOpenTicket(null)}>
        <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden rounded-2xl bg-tpl-card-bg border-tpl-stroke">
          {openTicket && (
            <>
              <div className="px-6 pt-6 pb-4 border-b border-tpl-stroke">
                <StatusBadge status={(openTicket.status || "pending").toLowerCase()} />
                <h2 className="mt-3 pr-6 text-[17px] font-bold leading-6 text-tpl-dark dark:text-white">
                  {openTicket.subject}
                </h2>
                <p className="mt-1 text-[12px] text-tpl-dark-5 dark:text-gray-400">
                  Raised on {formatTicketDate(openTicket.createdAt)} ·{" "}
                  {formatRelative(openTicket.createdAt)}
                </p>
              </div>

              <div className="px-6 py-5 space-y-4 max-h-[52vh] overflow-y-auto">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-tpl-dark-6 dark:text-gray-500">
                    Message
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed whitespace-pre-wrap text-tpl-dark-3 dark:text-gray-300">
                    {openTicket.description}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  {openTicket.name && (
                    <div className="flex items-center gap-2 text-[12.5px] text-tpl-dark-4 dark:text-gray-400">
                      <UserRound size={13} strokeWidth={2.1} className="shrink-0" />
                      <span className="truncate">{openTicket.name}</span>
                    </div>
                  )}
                  {openTicket.email && (
                    <div className="flex items-center gap-2 text-[12.5px] text-tpl-dark-4 dark:text-gray-400">
                      <Mail size={13} strokeWidth={2.1} className="shrink-0" />
                      <span className="truncate">{openTicket.email}</span>
                    </div>
                  )}
                  {openTicket.phoneNumber && (
                    <div className="flex items-center gap-2 text-[12.5px] text-tpl-dark-4 dark:text-gray-400">
                      <Phone size={13} strokeWidth={2.1} className="shrink-0" />
                      <span className="truncate">{openTicket.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end px-6 py-4 border-t border-tpl-stroke bg-tpl-gray-1 dark:bg-white/[0.02]">
                <Button
                  variant="outline"
                  onClick={() => setOpenTicket(null)}
                  className="h-9 rounded-xl border-tpl-stroke text-[12.5px] font-semibold"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Ticket submitted ── */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-[440px] p-8 text-center rounded-2xl bg-tpl-card-bg border-tpl-stroke">
          <div className="flex flex-col items-center">
            <div className="relative grid place-items-center w-20 h-20">
              <span className="absolute inset-0 rounded-full bg-emerald-500/10" />
              <span className="absolute inset-3 rounded-full bg-emerald-500/20" />
              <span className="relative grid place-items-center w-11 h-11 rounded-full bg-emerald-500">
                <Check size={22} className="text-white" strokeWidth={3} />
              </span>
            </div>

            <h2 className="mt-5 text-[19px] font-bold text-tpl-dark dark:text-white">
              Ticket submitted
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-tpl-dark-5 dark:text-gray-400">
              Our support team will review your issue and get back to you shortly. You can track its
              status under <span className="font-semibold">My tickets</span>.
            </p>

            <Button
              onClick={() => setShowSuccessModal(false)}
              className="mt-6 w-full h-11 rounded-xl bg-brand hover:bg-brand-hover font-semibold"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Settings;
