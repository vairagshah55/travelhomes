import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  LifeBuoy,
  Loader2,
  MessageSquareText,
  Search,
  Send,
  SearchX,
  Sparkles,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardLayout, { DashboardLayoutShell } from "@/components/DashboardLayout";
import {
  BRAND_VARS,
  BTN_PRIMARY,
  BTN_SOFT,
  CONTROL,
  CONTROL_ERROR,
  EmptyState,
  Field,
  Panel,
  PanelHead,
} from "@/components/shared";
import { useFaqs } from "@/hooks/useFaqs";
import { helpDeskApi, type PublicFaq } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

/* ── Categories ───────────────────────────────────────────────────────────────
   Keys are the tab ids; values must match the `category` string stored on the
   FAQ documents (compared case-insensitively).                                */
const CATEGORY_LABELS: Record<string, string> = {
  guest: "Guest",
  booking: "Booking",
  common: "Common Questions",
  locations: "Locations",
};

/** Server caps — helpdesk.dto.js. */
const SUBJECT_MAX = 200;
const MESSAGE_MAX = 5000;

const counterFor = (value: string, max: number) =>
  value.length > max * 0.7 ? `${value.length}/${max}` : undefined;

/* ── FAQ accordion ────────────────────────────────────────────────────────── */

const FaqRow = ({
  faq,
  open,
  onToggle,
  showCategory,
}: {
  faq: PublicFaq;
  open: boolean;
  onToggle: () => void;
  showCategory?: boolean;
}) => {
  const panelId = `faq-panel-${faq._id}`;
  return (
    <div>
      <h3>
        <button
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(
            "group w-full flex items-start justify-between gap-4 px-5 py-4 text-left",
            "outline-none transition-colors duration-150",
            "hover:bg-brand/[0.03] focus-visible:bg-brand/[0.05]",
            "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
          )}
        >
          <span className="min-w-0">
            {showCategory && faq.category && (
              <span className="mb-1 inline-block rounded-full bg-brand/[0.1] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand">
                {faq.category}
              </span>
            )}
            <span
              className={cn(
                "block text-[14px] font-semibold leading-6 transition-colors duration-150",
                open ? "text-brand" : "text-foreground",
              )}
            >
              {faq.question}
            </span>
          </span>
          <ChevronDown
            size={17}
            strokeWidth={2.3}
            className={cn(
              "mt-0.5 shrink-0 transition-transform duration-200",
              open ? "rotate-180 text-brand" : "text-muted-foreground/60 group-hover:text-brand",
            )}
          />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 pr-12 text-[13.5px] leading-relaxed text-muted-foreground whitespace-pre-line">
              {faq.answer || "No answer has been published for this question yet."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Shared body ──────────────────────────────────────────────────────────────
   One implementation for both chromes, so the vendor and public views can't
   drift apart.                                                               */

const HelpContent = ({ compact }: { compact?: boolean }) => {
  const { user, token: authToken } = useAuth();
  const token = authToken ?? undefined;

  const faqsQuery = useFaqs();
  const allFaqs = faqsQuery.data ?? [];

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    phoneNumber: user?.phoneNumber || user?.phone || "",
    email: user?.email || "",
    subject: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  /** Only categories that actually have questions get a tab. */
  const tabs = useMemo(
    () =>
      Object.keys(CATEGORY_LABELS).filter((key) =>
        allFaqs.some(
          (f) => (f.category || "").toLowerCase() === CATEGORY_LABELS[key].toLowerCase(),
        ),
      ),
    [allFaqs],
  );

  /** Derived, not stored — the old page kept this in state and reset the
      selection on every refetch. Falls back to the first available tab. */
  const currentTab = activeTab && tabs.includes(activeTab) ? activeTab : (tabs[0] ?? null);

  const searching = search.trim().length > 0;

  /**
   * Search spans every category. The old page filtered only the active tab, so
   * a question that existed under "Booking" read as "No results found" while
   * you happened to be on "Guest".
   */
  const results = useMemo(() => {
    if (searching) {
      const q = search.trim().toLowerCase();
      return allFaqs.filter(
        (f) =>
          f.question?.toLowerCase().includes(q) ||
          f.answer?.toLowerCase().includes(q) ||
          f.category?.toLowerCase().includes(q),
      );
    }
    if (!currentTab) return [];
    return allFaqs.filter(
      (f) => (f.category || "").toLowerCase() === CATEGORY_LABELS[currentTab].toLowerCase(),
    );
  }, [allFaqs, search, searching, currentTab]);

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Add your name.";
    if (!form.email.trim()) next.email = "Add an email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "That email address isn't valid.";
    if (form.phoneNumber.trim() && !/^\d{10}$/.test(form.phoneNumber.replace(/\D/g, "")))
      next.phoneNumber = "That's not a 10-digit number.";
    if (!form.subject.trim()) next.subject = "Add a subject.";
    if (!form.description.trim()) next.description = "Tell us what happened.";
    return next;
  };

  const submit = async () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Check the highlighted fields.");
      return;
    }
    try {
      setSending(true);
      await helpDeskApi.create(form, token);
      toast.success("Ticket sent — we'll reply by email.");
      setForm((prev) => ({ ...prev, subject: "", description: "" }));
      setErrors({});
    } catch {
      toast.error("We couldn't send your ticket. Try again.");
    } finally {
      setSending(false);
    }
  };

  const greetingName = user?.firstName || user?.name?.split(" ")[0];

  return (
    <div
      style={BRAND_VARS}
      className={cn("space-y-5", compact ? "max-w-4xl" : "max-w-3xl", "mx-auto")}
    >
      {/* ── Ask ── */}
      <Panel className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.09] via-brand/[0.02] to-transparent"
        />
        <div className="relative p-6 sm:p-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/[0.1] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">
            <Sparkles size={12} strokeWidth={2.4} />
            Help centre
          </span>
          <h1
            className={cn(
              "mt-3 font-bold tracking-[-0.02em] text-foreground",
              compact ? "text-[22px]" : "text-[26px] sm:text-[30px]",
            )}
          >
            {greetingName ? `Hi ${greetingName}, how can we help?` : "How can we help?"}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Search our answers, or send us a ticket and we'll get back to you by email.
          </p>

          {/* Live search — no submit button, because typing already filters. */}
          <div className="relative mt-5">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search every answer…"
              aria-label="Search help articles"
              className={cn("h-12 rounded-full pl-11 pr-11 text-[14px]", CONTROL)}
            />
            {searching && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-full text-muted-foreground hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <X size={14} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>
      </Panel>

      {/* ── Answers ── */}
      <Panel>
        <PanelHead
          icon={LifeBuoy}
          title={searching ? "Search results" : "Frequently asked"}
          blurb={
            searching
              ? `${results.length} ${results.length === 1 ? "answer" : "answers"} across all topics`
              : "Browse by topic."
          }
        />

        {/* Tabs hide while searching — results already span every category. */}
        {!searching && tabs.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide border-b border-border/70 px-5 py-3">
            {tabs.map((key) => {
              const active = currentTab === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTab(key);
                    setOpenId(null);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "h-8 whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-semibold outline-none",
                    "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/40",
                    active
                      ? "bg-brand/[0.1] text-brand"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {CATEGORY_LABELS[key]}
                </button>
              );
            })}
          </div>
        )}

        {faqsQuery.isLoading ? (
          <div className="divide-y divide-border/70">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="px-5 py-5">
                <div
                  className="h-3.5 rounded bg-muted animate-pulse"
                  style={{ width: `${72 - i * 9}%` }}
                />
              </div>
            ))}
          </div>
        ) : allFaqs.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="No answers published yet"
            description="Our help articles are on the way. In the meantime, send us a ticket below and we'll help directly."
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={`No answers match “${search.trim()}”`}
            description="Try a different word, or send us a ticket below and we'll answer it for you."
            actionLabel="Clear search"
            onAction={() => setSearch("")}
          />
        ) : (
          <div className="divide-y divide-border/70">
            {results.map((faq) => (
              <FaqRow
                key={faq._id}
                faq={faq}
                showCategory={searching}
                open={openId === faq._id}
                onToggle={() => setOpenId((id) => (id === faq._id ? null : faq._id))}
              />
            ))}
          </div>
        )}
      </Panel>

      {/* ── Ticket ── */}
      <Panel>
        <PanelHead
          icon={Send}
          title="Still stuck? Send a ticket"
          blurb="We usually reply within a day."
          aside={
            compact ? (
              <Button asChild variant="ghost" className={BTN_SOFT}>
                <Link to="/settings/account">
                  Track tickets
                  <ChevronRight size={14} strokeWidth={2.4} />
                </Link>
              </Button>
            ) : undefined
          }
        />

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <Field label="Your name" htmlFor="help-name" error={errors.name}>
              <Input
                id="help-name"
                value={form.name}
                placeholder="e.g. Priya Nair"
                onChange={(e) => setField("name", e.target.value)}
                className={cn("h-11", CONTROL, errors.name && CONTROL_ERROR)}
              />
            </Field>

            <Field label="Phone (optional)" htmlFor="help-phone" error={errors.phoneNumber}>
              <Input
                id="help-phone"
                type="tel"
                inputMode="numeric"
                value={form.phoneNumber}
                placeholder="10-digit mobile number"
                onChange={(e) =>
                  setField("phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                className={cn("h-11", CONTROL, errors.phoneNumber && CONTROL_ERROR)}
              />
            </Field>

            <Field
              label="Email"
              htmlFor="help-email"
              error={errors.email}
              className="sm:col-span-2"
            >
              <Input
                id="help-email"
                type="email"
                value={form.email}
                placeholder="you@example.com"
                onChange={(e) => setField("email", e.target.value)}
                className={cn("h-11", CONTROL, errors.email && CONTROL_ERROR)}
              />
            </Field>

            <Field
              label="Subject"
              htmlFor="help-subject"
              error={errors.subject}
              hint={counterFor(form.subject, SUBJECT_MAX)}
              className="sm:col-span-2"
            >
              <Input
                id="help-subject"
                value={form.subject}
                maxLength={SUBJECT_MAX}
                placeholder="One line on what's wrong"
                onChange={(e) => setField("subject", e.target.value)}
                className={cn("h-11", CONTROL, errors.subject && CONTROL_ERROR)}
              />
            </Field>
          </div>

          <Field
            label="What happened"
            htmlFor="help-description"
            error={errors.description}
            hint={counterFor(form.description, MESSAGE_MAX)}
          >
            <Textarea
              id="help-description"
              value={form.description}
              maxLength={MESSAGE_MAX}
              placeholder="What you expected, what happened instead, and any booking ID involved."
              onChange={(e) => setField("description", e.target.value)}
              className={cn(
                "min-h-[132px] resize-none py-3 leading-relaxed",
                CONTROL,
                errors.description && CONTROL_ERROR,
              )}
            />
          </Field>

          <div className="flex items-center justify-between gap-4 pt-1">
            <p className="text-[11.5px] text-muted-foreground">
              We'll reply to{" "}
              <span className="font-semibold text-foreground/80">{form.email || "your email"}</span>
            </p>
            <Button
              onClick={submit}
              disabled={sending}
              className={cn(BTN_PRIMARY, "disabled:opacity-60 disabled:shadow-none")}
            >
              {sending ? (
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
          </div>
        </div>
      </Panel>
    </div>
  );
};

/* ── Page ─────────────────────────────────────────────────────────────────────
   Vendors get the dashboard chrome (sidebar + dashboard header) because Help is
   part of their console; everyone else gets the public site header and footer.
   `/help` sits outside the dashboard route group, so the shell is mounted
   directly here rather than via <Outlet />.                                   */

const Help = () => {
  const { user } = useAuth();

  if (user?.userType === "vendor") {
    return (
      <DashboardLayoutShell>
        <DashboardLayout
          title="Help"
          contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-muted/40 dark:bg-transparent"
        >
          {/* pb clears the fixed MobileVendorNav on small screens. */}
          <div className="pb-24 lg:pb-12">
            <HelpContent compact />
          </div>
        </DashboardLayout>
      </DashboardLayoutShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40 dark:bg-gray-950">
      <Header variant="white" />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <HelpContent />
      </main>
      <Footer />
    </div>
  );
};

export default Help;
