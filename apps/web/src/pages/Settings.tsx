import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  BellRing,
  Building2,
  CalendarCheck,
  Check,
  ChevronRight,
  KeyRound,
  LifeBuoy,
  Loader2,
  Mail,
  MessageSquare,
  NotebookPen,
  Phone,
  Send,
  SlidersHorizontal,
  UserRound,
  Wallet,
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
import {
  BRAND_VARS,
  BTN_NEUTRAL,
  BTN_PRIMARY,
  BTN_SOFT,
  CONTROL,
  CONTROL_ERROR,
  EmptyState,
  Field,
  PANEL,
  PANEL_FOOTER,
  Panel,
  PanelHead,
  SELECT_ITEM,
  SettingRow,
  StatusBadge,
} from "@/components/shared";
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

/* ── Navigation ───────────────────────────────────────────────────────────── */

type SectionKey = "general" | "account" | "preferences";

/** `account` is the historical route key — that URL hosts the support desk. */
const SECTIONS: {
  key: SectionKey;
  label: string;
  blurb: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    key: "general",
    label: "General",
    blurb: "Your account and booking flow",
    href: "/settings",
    icon: SlidersHorizontal,
  },
  {
    key: "account",
    label: "Support",
    blurb: "Get help and track tickets",
    href: "/settings/account",
    icon: LifeBuoy,
  },
  {
    key: "preferences",
    label: "Preferences",
    blurb: "Alerts, language and timezone",
    href: "/settings/preferences",
    icon: BellRing,
  },
];

/* ── Support triage ────────────────────────────────────────────────────────
   The four things that actually break for a host. Picking one writes the
   subject and drops focus into the message box, so the form is never a blank
   wall. Tile colours are data-driven, which is the sanctioned use of inline
   `style` (CONVENTIONS.md Rule 1) and matches the sidebar's tile convention. */

const HELP_TOPICS: {
  id: string;
  label: string;
  subject: string;
  icon: LucideIcon;
  color: string;
}[] = [
  {
    id: "booking",
    label: "Booking",
    subject: "Booking issue",
    icon: CalendarCheck,
    color: "#0ea5e9",
  },
  { id: "payout", label: "Payout", subject: "Payout issue", icon: Wallet, color: "#22c55e" },
  { id: "listing", label: "Listing", subject: "Listing issue", icon: Building2, color: "#a855f7" },
  { id: "account", label: "Account", subject: "Account issue", icon: KeyRound, color: "#f59e0b" },
];

const TOPIC_SUBJECTS = new Set(HELP_TOPICS.map((t) => t.subject));

/** Status drives each row's left accent bar — structure, not decoration. */
const STATUS_ACCENT: Record<string, string> = {
  pending: "bg-amber-400",
  open: "bg-amber-400",
  read: "bg-blue-400",
  resolved: "bg-emerald-400",
  closed: "bg-gray-300 dark:bg-gray-600",
};

const TICKET_FILTERS = ["all", "pending", "read", "resolved"] as const;
type TicketFilter = (typeof TICKET_FILTERS)[number];

/* ── Preferences ──────────────────────────────────────────────────────────── */

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
  blurb: string;
  icon: LucideIcon;
}[] = [
  {
    key: "email",
    label: "Email",
    blurb: "Booking confirmations, payout updates and review alerts.",
    icon: Mail,
  },
  {
    key: "sms",
    label: "SMS",
    blurb: "Time-critical booking updates, sent as a text message.",
    icon: MessageSquare,
  },
  {
    key: "push",
    label: "Push",
    blurb: "In-app and browser alerts while you're signed in.",
    icon: BellRing,
  },
];

/** Server caps — helpdesk.dto.js. */
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

const formatRelative = (raw?: string) => {
  if (!raw) return "";
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.round((Date.now() - t) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

/** Recent tickets read better relatively; older ones need the actual date. */
const ticketWhen = (raw?: string) => {
  const t = raw ? new Date(raw).getTime() : NaN;
  if (Number.isNaN(t)) return "—";
  return Date.now() - t < 7 * 86_400_000 ? formatRelative(raw) : formatTicketDate(raw);
};

/** Counters are noise until the field is nearly full. */
const counterFor = (value: string, max: number) =>
  value.length > max * 0.7 ? `${value.length}/${max}` : undefined;

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

  const messageRef = useRef<HTMLTextAreaElement>(null);

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [sendingTicket, setSendingTicket] = useState(false);
  const [showSentModal, setShowSentModal] = useState(false);
  const [openTicket, setOpenTicket] = useState<HelpDeskTicketDTO | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>("all");

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

  /** Counts per filter — drives the chip labels and the rail badge. */
  const filterCounts = useMemo(() => {
    const counts: Record<TicketFilter, number> = {
      all: tickets.length,
      pending: 0,
      read: 0,
      resolved: 0,
    };
    for (const t of tickets) {
      const key = (t.status || "pending").toLowerCase();
      // `open` is legacy for `pending`; `closed` folds into `resolved`.
      if (key === "pending" || key === "open") counts.pending += 1;
      else if (key === "read") counts.read += 1;
      else if (key === "resolved" || key === "closed") counts.resolved += 1;
    }
    return counts;
  }, [tickets]);

  const visibleTickets = useMemo(() => {
    if (ticketFilter === "all") return tickets;
    return tickets.filter((t) => {
      const key = (t.status || "pending").toLowerCase();
      if (ticketFilter === "pending") return key === "pending" || key === "open";
      if (ticketFilter === "resolved") return key === "resolved" || key === "closed";
      return key === ticketFilter;
    });
  }, [tickets, ticketFilter]);

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
    // Merge, don't replace: the server document has no `general.confirmBeforeBooking`
    // (it isn't in the VendorSetting schema), so assigning data.general wholesale
    // dropped the flag and the toggle snapped back to off on every load.
    if (data.general) setGeneral((prev) => ({ ...prev, ...data.general }));
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
      toast.success("Preferences saved");
    } catch {
      toast.error("We couldn't save your preferences. Try again.");
    } finally {
      setSavingPrefs(false);
    }
  };

  /** The stored timezone is always selectable, even if it's off our list. */
  const timezoneOptions = useMemo(() => {
    const current = preferences.timezone;
    return current && !TIMEZONES.includes(current) ? [current, ...TIMEZONES] : TIMEZONES;
  }, [preferences.timezone]);

  const setTicketField = (key: string, value: string) => {
    setTicket((prev) => ({ ...prev, [key]: value }));
    setTicketErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  /**
   * Picking a topic writes the subject and hands focus to the message box.
   * A subject the host typed themselves is never overwritten — only an empty
   * one, or one another topic put there.
   */
  const pickTopic = (topic: (typeof HELP_TOPICS)[number]) => {
    setActiveTopic(topic.id);
    const current = ticket.subject.trim();
    if (!current || TOPIC_SUBJECTS.has(current)) setTicketField("subject", topic.subject);
    requestAnimationFrame(() => messageRef.current?.focus());
  };

  const validateTicket = () => {
    const errors: Record<string, string> = {};
    if (!ticket.name.trim()) errors.name = "Add your name.";
    if (!ticket.phone.trim()) errors.phone = "Add a phone number.";
    else if (!/^\d{10}$/.test(ticket.phone.replace(/\D/g, "")))
      errors.phone = "That's not a 10-digit number.";
    if (!ticket.email.trim()) errors.email = "Add an email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticket.email))
      errors.email = "That email address isn't valid.";
    if (!ticket.subject.trim()) errors.subject = "Add a subject.";
    if (!ticket.message.trim()) errors.message = "Tell us what happened.";
    return errors;
  };

  const sendTicket = async () => {
    const errors = validateTicket();
    setTicketErrors(errors);
    if (Object.keys(errors).length) {
      toast.error("Check the highlighted fields.");
      return;
    }

    try {
      setSendingTicket(true);
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
      // Pull the new row into the list below the form.
      queryClient.invalidateQueries({ queryKey: ticketsKey });
      setShowSentModal(true);
      setTicket(ticketDefaults());
      setTicketErrors({});
      setActiveTopic(null);
      setTicketFilter("all");
    } catch {
      toast.error("We couldn't send your ticket. Try again.");
    } finally {
      setSendingTicket(false);
    }
  };

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName}` : user?.name;
  const avatar = user?.photo || user?.avatar;

  const identityFields: {
    key: "name" | "phone" | "email" | "subject";
    label: string;
    type: string;
    placeholder: string;
    maxLength?: number;
    className?: string;
  }[] = [
    { key: "name", label: "Your name", type: "text", placeholder: "e.g. Priya Nair" },
    { key: "phone", label: "Phone", type: "tel", placeholder: "10-digit mobile number" },
    {
      key: "email",
      label: "Email",
      type: "email",
      placeholder: "you@example.com",
      className: "sm:col-span-2",
    },
    {
      key: "subject",
      label: "Subject",
      type: "text",
      placeholder: "One line on what's wrong",
      maxLength: SUBJECT_MAX,
      className: "sm:col-span-2",
    },
  ];

  return (
    <DashboardLayout
      title="Settings"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto pb-24 lg:pb-12">
        <div className="grid gap-5 lg:gap-7 lg:grid-cols-[254px_minmax(0,1fr)]">
          {/* ── Left rail: who you are, where you can go ── */}
          <aside className="lg:sticky lg:top-2 self-start space-y-3">
            <div className={cn(PANEL, "hidden lg:flex items-center gap-3 p-4")}>
              {avatar ? (
                <img src={avatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <span className="grid place-items-center w-11 h-11 rounded-full bg-brand text-brand-fg text-[14px] font-bold shrink-0">
                  {getInitials(displayName)}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-foreground truncate">
                  {displayName || "Your account"}
                </p>
                <p className="text-[11.5px] text-muted-foreground">
                  {user?.userType === "vendor" ? "Vendor account" : "Account"}
                </p>
              </div>
            </div>

            {/* Desktop rail */}
            <nav
              role="tablist"
              aria-label="Settings sections"
              className={cn(PANEL, "hidden lg:flex flex-col gap-1 p-2")}
            >
              {SECTIONS.map((section) => {
                const active = activeSection === section.key;
                return (
                  <button
                    key={section.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => navigate(section.href)}
                    className={cn(
                      "group relative w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left",
                      "outline-none transition-colors duration-150",
                      "focus-visible:ring-2 focus-visible:ring-brand/40",
                      !active && "hover:bg-muted/70 dark:hover:bg-white/[0.04]",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="settingsRailPill"
                        className="absolute inset-0 rounded-xl bg-brand/[0.09] shadow-[inset_3px_0_0_0_hsl(var(--brand))]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span
                      className={cn(
                        "relative grid place-items-center w-8 h-8 rounded-[10px] shrink-0 transition-colors duration-150",
                        active
                          ? "bg-brand text-brand-fg"
                          : "bg-muted text-muted-foreground group-hover:text-foreground/70",
                      )}
                    >
                      <section.icon size={15} strokeWidth={2.1} />
                    </span>
                    <span className="relative min-w-0">
                      <span
                        className={cn(
                          "block text-[13.5px] font-semibold leading-5",
                          active ? "text-brand" : "text-foreground",
                        )}
                      >
                        {section.label}
                      </span>
                      <span className="block text-[11.5px] leading-4 mt-0.5 text-muted-foreground">
                        {section.blurb}
                      </span>
                    </span>
                    {section.key === "account" && filterCounts.pending > 0 && (
                      <span className="relative ml-auto mt-1 shrink-0 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold tabular-nums dark:bg-amber-500/15 dark:text-amber-400">
                        {filterCounts.pending}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile strip — no sliding pill, so the two navs never share a layoutId */}
            <div
              role="tablist"
              aria-label="Settings sections"
              className="lg:hidden flex items-center gap-1 p-1 overflow-x-auto scrollbar-hide bg-card border border-border/70 rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            >
              {SECTIONS.map((section) => {
                const active = activeSection === section.key;
                return (
                  <button
                    key={section.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => navigate(section.href)}
                    className={cn(
                      "flex items-center gap-2 h-10 px-3.5 rounded-xl whitespace-nowrap",
                      "text-[13px] font-semibold transition-colors duration-150 outline-none",
                      "focus-visible:ring-2 focus-visible:ring-brand/40",
                      active ? "bg-brand/[0.09] text-brand" : "text-muted-foreground",
                    )}
                  >
                    <section.icon size={15} strokeWidth={2.2} />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Content ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0 space-y-5"
            >
              {/* ── General ── */}
              {activeSection === "general" && (
                <>
                  <Panel>
                    <PanelHead
                      title="Booking flow"
                      blurb="How much you check before a stay is locked in."
                    />
                    <SettingRow
                      icon={CalendarCheck}
                      title="Confirm before accepting a booking"
                      blurb="Leave this on to review the full assessment before a booking is confirmed."
                    >
                      <Switch
                        checked={!!general.confirmBeforeBooking}
                        onCheckedChange={(checked) =>
                          setGeneral({ ...general, confirmBeforeBooking: checked })
                        }
                        aria-label="Confirm before accepting a booking"
                      />
                    </SettingRow>
                  </Panel>

                  <Panel>
                    <PanelHead
                      title="Contact details"
                      blurb="Where guests and our team reach you."
                      aside={
                        <Button
                          variant="ghost"
                          onClick={() => navigate("/profile")}
                          className={BTN_SOFT}
                        >
                          Edit profile
                          <ChevronRight size={14} strokeWidth={2.4} />
                        </Button>
                      }
                    />
                    <div className="divide-y divide-border/70">
                      <SettingRow icon={Mail} title="Email" blurb={user?.email || "Not added yet"}>
                        {user?.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <BadgeCheck size={14} strokeWidth={2.3} />
                            Verified
                          </span>
                        ) : (
                          <StatusBadge status="unverified" size="sm" />
                        )}
                      </SettingRow>
                      <SettingRow
                        icon={Phone}
                        title="Phone"
                        blurb={user?.phoneNumber || user?.phone || "Not added yet"}
                      >
                        {user?.mobileVerified ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <BadgeCheck size={14} strokeWidth={2.3} />
                            Verified
                          </span>
                        ) : (
                          <StatusBadge status="unverified" size="sm" />
                        )}
                      </SettingRow>
                      {user?.vendorStatus && (
                        <SettingRow
                          icon={UserRound}
                          title="Account status"
                          blurb="Set by our team as your listings are reviewed."
                        >
                          <StatusBadge status={user.vendorStatus} size="sm" />
                        </SettingRow>
                      )}
                    </div>
                  </Panel>
                </>
              )}

              {/* ── Support (route: /settings/account) ── */}
              {activeSection === "account" && (
                <>
                  {/* Signature: triage strip. Pick what broke, land in the message box. */}
                  <Panel className="relative">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.08] via-brand/[0.02] to-transparent"
                    />
                    <div className="relative p-5">
                      <h2 className="text-[19px] font-bold tracking-[-0.015em] text-foreground">
                        What do you need help with?
                      </h2>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        Pick the closest match, then tell us what happened. Most tickets get a reply
                        within a day.
                      </p>

                      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {HELP_TOPICS.map((topic) => {
                          const selected = activeTopic === topic.id;
                          return (
                            <motion.button
                              key={topic.id}
                              type="button"
                              onClick={() => pickTopic(topic)}
                              aria-pressed={selected}
                              whileTap={{ scale: 0.97 }}
                              transition={{ type: "spring", stiffness: 520, damping: 30 }}
                              className={cn(
                                "flex items-center gap-2.5 p-2.5 pr-3.5 rounded-xl border bg-card text-left",
                                "outline-none transition-[border-color,box-shadow] duration-150",
                                "focus-visible:ring-4 focus-visible:ring-brand/15",
                                selected
                                  ? "border-brand ring-4 ring-brand/10"
                                  : "border-border/70 hover:border-border shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
                              )}
                            >
                              <span
                                className="grid place-items-center w-8 h-8 rounded-[10px] shrink-0"
                                style={{ backgroundColor: `${topic.color}1f`, color: topic.color }}
                              >
                                <topic.icon size={16} strokeWidth={2.1} />
                              </span>
                              <span
                                className={cn(
                                  "text-[12.5px] font-semibold leading-4 truncate",
                                  selected ? "text-brand" : "text-foreground",
                                )}
                              >
                                {topic.label}
                              </span>
                              {selected && (
                                <Check
                                  size={14}
                                  strokeWidth={3}
                                  className="ml-auto shrink-0 text-brand"
                                />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </Panel>

                  <Panel>
                    <PanelHead
                      title="Report the issue"
                      blurb="Every field is needed to open a ticket."
                    />
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                        {identityFields.map((f) => (
                          <Field
                            key={f.key}
                            label={f.label}
                            htmlFor={`ticket-${f.key}`}
                            error={ticketErrors[f.key]}
                            className={f.className}
                            hint={
                              f.key === "subject"
                                ? counterFor(ticket.subject, SUBJECT_MAX)
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
                              className={cn("h-11", CONTROL, ticketErrors[f.key] && CONTROL_ERROR)}
                            />
                          </Field>
                        ))}
                      </div>

                      <Field
                        label="What happened"
                        htmlFor="ticket-message"
                        error={ticketErrors.message}
                        hint={counterFor(ticket.message, MESSAGE_MAX)}
                      >
                        <Textarea
                          id="ticket-message"
                          ref={messageRef}
                          maxLength={MESSAGE_MAX}
                          aria-invalid={!!ticketErrors.message}
                          placeholder="What you expected, what happened instead, and any booking or listing ID involved."
                          value={ticket.message}
                          onChange={(e) => setTicketField("message", e.target.value)}
                          className={cn(
                            "min-h-[132px] resize-none py-3 leading-relaxed",
                            CONTROL,
                            ticketErrors.message && CONTROL_ERROR,
                          )}
                        />
                      </Field>
                    </div>

                    <footer className={PANEL_FOOTER}>
                      <p className="text-[11.5px] text-muted-foreground">
                        We'll reply to{" "}
                        <span className="font-semibold text-foreground/80">
                          {ticket.email || "your email"}
                        </span>
                      </p>
                      <Button
                        onClick={sendTicket}
                        disabled={sendingTicket}
                        className={cn(BTN_PRIMARY, "disabled:opacity-60 disabled:shadow-none")}
                      >
                        {sendingTicket ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send size={15} strokeWidth={2.2} />
                            Send ticket
                          </>
                        )}
                      </Button>
                    </footer>
                  </Panel>

                  {/* ── Your tickets ── */}
                  <Panel>
                    <PanelHead
                      title="Your tickets"
                      blurb="Every issue you've reported, newest first."
                    />

                    {tickets.length > 0 && (
                      <div className="flex items-center gap-1.5 px-5 py-3 overflow-x-auto scrollbar-hide border-b border-border/70">
                        {TICKET_FILTERS.map((f) => {
                          const selected = ticketFilter === f;
                          return (
                            <button
                              key={f}
                              onClick={() => setTicketFilter(f)}
                              aria-pressed={selected}
                              className={cn(
                                "flex items-center gap-1.5 h-7 px-2.5 rounded-full whitespace-nowrap",
                                "text-[12px] font-semibold capitalize outline-none",
                                "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/40",
                                selected
                                  ? "bg-brand/[0.1] text-brand"
                                  : "text-muted-foreground hover:bg-muted",
                              )}
                            >
                              {f}
                              <span className="tabular-nums opacity-70">{filterCounts[f]}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {ticketsQuery.isLoading ? (
                      <div className="divide-y divide-border/70">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-1/3 rounded bg-muted" />
                              <div className="h-2.5 w-3/4 rounded bg-muted/70" />
                            </div>
                            <div className="h-5 w-16 rounded-full bg-muted" />
                          </div>
                        ))}
                      </div>
                    ) : ticketsQuery.isError ? (
                      <EmptyState
                        icon={AlertCircle}
                        title="We couldn't load your tickets"
                        description="The request didn't go through. Try again in a moment."
                        actionLabel="Try again"
                        onAction={() => ticketsQuery.refetch()}
                      />
                    ) : tickets.length === 0 ? (
                      <EmptyState
                        icon={NotebookPen}
                        title="Nothing reported yet"
                        description="Report an issue above and it lands here, so you can follow it without leaving the dashboard."
                      />
                    ) : visibleTickets.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <p className="text-[13px] text-muted-foreground">
                          No {ticketFilter} tickets.
                        </p>
                        <button
                          onClick={() => setTicketFilter("all")}
                          className="mt-2 text-[12.5px] font-semibold text-brand hover:underline"
                        >
                          Show all tickets
                        </button>
                      </div>
                    ) : (
                      <ul className="divide-y divide-border/70">
                        {visibleTickets.map((t, i) => {
                          const key = (t.status || "pending").toLowerCase();
                          return (
                            <motion.li
                              key={t._id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.035 }}
                            >
                              <button
                                onClick={() => setOpenTicket(t)}
                                className={cn(
                                  "group relative w-full flex items-center gap-4 pl-5 pr-4 py-4 text-left",
                                  "outline-none transition-colors duration-150",
                                  "hover:bg-brand/[0.035] focus-visible:bg-brand/[0.05]",
                                  "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
                                )}
                              >
                                <span
                                  aria-hidden
                                  className={cn(
                                    "absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full",
                                    STATUS_ACCENT[key] ?? "bg-gray-300 dark:bg-gray-600",
                                  )}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-2">
                                    <span className="text-[13.5px] font-semibold text-foreground truncate">
                                      {t.subject}
                                    </span>
                                    <StatusBadge status={key} size="sm" />
                                  </span>
                                  <span className="mt-1 block text-[12.5px] text-muted-foreground line-clamp-1">
                                    {t.description}
                                  </span>
                                </span>
                                <span className="hidden sm:block shrink-0 text-[12px] tabular-nums text-muted-foreground">
                                  {ticketWhen(t.createdAt)}
                                </span>
                                <ChevronRight
                                  size={16}
                                  strokeWidth={2.2}
                                  className="shrink-0 text-muted-foreground/60 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand"
                                />
                              </button>
                            </motion.li>
                          );
                        })}
                      </ul>
                    )}
                  </Panel>
                </>
              )}

              {/* ── Preferences ── */}
              {activeSection === "preferences" && (
                <>
                  <Panel>
                    <PanelHead
                      title="Region"
                      blurb="Sets the language of the dashboard and how times are shown."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                      <Field label="Language" htmlFor="pref-language">
                        <Select
                          value={preferences.language}
                          onValueChange={(value) =>
                            setPreferences({ ...preferences, language: value })
                          }
                        >
                          <SelectTrigger id="pref-language" className={cn("h-11", CONTROL)}>
                            <SelectValue placeholder="Pick a language" />
                          </SelectTrigger>
                          <SelectContent style={BRAND_VARS}>
                            {LANGUAGES.map((l) => (
                              <SelectItem key={l.value} value={l.value} className={SELECT_ITEM}>
                                {l.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="Timezone" htmlFor="pref-timezone">
                        <Select
                          value={preferences.timezone}
                          onValueChange={(value) =>
                            setPreferences({ ...preferences, timezone: value })
                          }
                        >
                          <SelectTrigger id="pref-timezone" className={cn("h-11", CONTROL)}>
                            <SelectValue placeholder="Pick a timezone" />
                          </SelectTrigger>
                          <SelectContent style={BRAND_VARS}>
                            {timezoneOptions.map((tz) => (
                              <SelectItem key={tz} value={tz} className={SELECT_ITEM}>
                                {tz}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </Panel>

                  <Panel>
                    <PanelHead
                      title="Notifications"
                      blurb="Choose how we reach you. Booking alerts are worth keeping on."
                    />
                    <div className="divide-y divide-border/70">
                      {NOTIFICATION_CHANNELS.map((channel) => (
                        <SettingRow
                          key={channel.key}
                          icon={channel.icon}
                          title={channel.label}
                          blurb={channel.blurb}
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
                            aria-label={`${channel.label} notifications`}
                          />
                        </SettingRow>
                      ))}
                    </div>

                    <footer className={PANEL_FOOTER}>
                      <AnimatePresence>
                        {prefsDirty && (
                          <motion.p
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1.5 text-[11.5px] font-medium text-amber-600 dark:text-amber-400"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Unsaved changes
                          </motion.p>
                        )}
                      </AnimatePresence>
                      <Button
                        onClick={savePreferences}
                        disabled={savingPrefs || !prefsDirty}
                        className={cn(
                          BTN_PRIMARY,
                          "ml-auto disabled:opacity-45 disabled:shadow-none",
                        )}
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
                    </footer>
                  </Panel>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Ticket detail ── */}
      <Dialog open={!!openTicket} onOpenChange={(open) => !open && setOpenTicket(null)}>
        <DialogContent
          style={BRAND_VARS}
          className="sm:max-w-[560px] p-0 gap-0 overflow-hidden rounded-[18px] bg-card border-border/70"
        >
          {openTicket && (
            <>
              <div className="px-6 pt-6 pb-4 border-b border-border/70">
                <StatusBadge status={(openTicket.status || "pending").toLowerCase()} />
                <h2 className="mt-3 pr-8 text-[18px] font-bold leading-6 tracking-[-0.01em] text-foreground">
                  {openTicket.subject}
                </h2>
                <p className="mt-1 text-[12px] tabular-nums text-muted-foreground">
                  Reported {formatTicketDate(openTicket.createdAt)} ·{" "}
                  {formatRelative(openTicket.createdAt)}
                </p>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[52vh] overflow-y-auto">
                <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-foreground/80">
                  {openTicket.description}
                </p>

                <div className="flex flex-wrap gap-x-5 gap-y-2 pt-4 border-t border-border/70">
                  {openTicket.name && (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                      <UserRound size={13} strokeWidth={2.1} />
                      {openTicket.name}
                    </span>
                  )}
                  {openTicket.email && (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                      <Mail size={13} strokeWidth={2.1} />
                      {openTicket.email}
                    </span>
                  )}
                  {openTicket.phoneNumber && (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] tabular-nums text-muted-foreground">
                      <Phone size={13} strokeWidth={2.1} />
                      {openTicket.phoneNumber}
                    </span>
                  )}
                </div>
              </div>

              <footer className={cn(PANEL_FOOTER, "justify-end px-6")}>
                <Button variant="ghost" onClick={() => setOpenTicket(null)} className={BTN_NEUTRAL}>
                  Close
                </Button>
              </footer>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Ticket sent ── */}
      <Dialog open={showSentModal} onOpenChange={setShowSentModal}>
        <DialogContent
          style={BRAND_VARS}
          className="sm:max-w-[420px] p-8 text-center rounded-[18px] bg-card border-border/70"
        >
          <div className="flex flex-col items-center">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              className="relative grid place-items-center w-16 h-16"
            >
              <span className="absolute inset-0 rounded-full bg-emerald-500/10" />
              <span className="absolute inset-2.5 rounded-full bg-emerald-500/20" />
              <span className="relative grid place-items-center w-10 h-10 rounded-full bg-emerald-500">
                <Check size={20} className="text-white" strokeWidth={3} />
              </span>
            </motion.span>

            <h2 className="mt-5 text-[18px] font-bold tracking-[-0.01em] text-foreground">
              Ticket sent
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Our support team picks it up from here. Follow its status any time under{" "}
              <span className="font-semibold text-foreground/80">Your tickets</span>.
            </p>

            <Button
              onClick={() => setShowSentModal(false)}
              className={cn(BTN_PRIMARY, "mt-6 w-full h-11")}
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
