import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  Check,
  CreditCard,
  Loader2,
  Mail,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  Smartphone,
  Store,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { MotionReveal } from "@/components/admin/MotionReveal";
import { Switch } from "@/components/ui/switch";
import {
  settingsService,
  type PaymentGatewayId,
  type PaymentGatewaySettings,
} from "@/services/api";
import { cn } from "@/lib/utils";

import {
  BTN_NEUTRAL,
  BTN_PRIMARY,
  BTN_SOFT,
  CONTROL,
  TEXTAREA,
  CmsField,
  CmsSection,
  CmsSegmented,
  CmsToggleRow,
  MediaPicker,
} from "./AdminCMS/ui";

/**
 * Global settings — SEO/social metadata per public page, plus the account
 * approval switches.
 *
 * Built on the same kit as AdminCMS (`./AdminCMS/ui`): one panel with a head,
 * a segmented rail, and `app-*` tokens throughout. The page used to spell its
 * own greys and legacy `dashboard-*` colours, which is how it drifted from the
 * rest of the admin.
 */

// ─── Tabs ────────────────────────────────────────────────────────────────────
type TabKey = "SEO" | "Approvals" | "Payments";

const TABS: { key: TabKey; label: string; icon: LucideIcon; blurb: string }[] = [
  {
    key: "SEO",
    label: "SEO & sharing",
    icon: Search,
    blurb: "Search metadata and social cards for each public page.",
  },
  {
    key: "Approvals",
    label: "Approvals",
    icon: ShieldCheck,
    blurb: "Which checks a new account must clear before it goes live.",
  },
  {
    key: "Payments",
    label: "Payments",
    icon: CreditCard,
    blurb: "Which gateway takes money at checkout.",
  },
];

/** Backend page keys — these are API values, not display copy. */
const PAGES = [
  "Homepage",
  "About",
  "Career",
  "Blog",
  "Why Host With Us",
  "Contact Us",
  "Policy",
  "Privacy Policy",
  "Blog Details",
  "Help",
] as const;
type PageKey = (typeof PAGES)[number];

type UserType = "Vendor" | "User";

type ApprovalKey = "vendorApproval" | "mobileApproval" | "emailApproval" | "phoneApproval";

const APPROVALS: { key: ApprovalKey; label: string; icon: LucideIcon; blurb: string }[] = [
  {
    key: "vendorApproval",
    label: "Manual account approval",
    icon: Shield,
    blurb: "An admin reviews the account before it can sign in.",
  },
  {
    key: "mobileApproval",
    label: "Mobile verification",
    icon: Smartphone,
    blurb: "The mobile number must be confirmed at sign-up.",
  },
  {
    key: "emailApproval",
    label: "Email verification",
    icon: Mail,
    blurb: "A verification link is sent to the email address.",
  },
  {
    key: "phoneApproval",
    label: "Phone OTP",
    icon: ShieldCheck,
    blurb: "A one-time code is required on every login.",
  },
];

/** Recommended lengths — over these, search engines truncate the snippet. */
const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

interface SeoForm {
  metaKeywords: string;
  metaTitle: string;
  metaDescription: string;
  socialTitle: string;
  socialDescription: string;
  ogImageUrl: string;
}

const EMPTY_SEO: SeoForm = {
  metaKeywords: "",
  metaTitle: "",
  metaDescription: "",
  socialTitle: "",
  socialDescription: "",
  ogImageUrl: "",
};

/* ── Small building blocks ─────────────────────────────────────────────────── */

/** Inline failure with a retry — the page used to swallow load errors silently. */
const ErrorNote = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 dark:border-red-500/30 dark:bg-red-500/10">
    <AlertCircle size={15} className="shrink-0 text-red-600 dark:text-red-400" />
    <p className="flex-1 min-w-0 text-[12.5px] font-medium text-red-700 dark:text-red-300">
      {message}
    </p>
    <button type="button" onClick={onRetry} className={cn(BTN_NEUTRAL, "h-8")}>
      <RotateCcw size={13} /> Retry
    </button>
  </div>
);

const FieldSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="space-y-1.5">
        <div className="h-3 w-24 rounded bg-app-surface-2 animate-pulse" />
        <div className="h-11 rounded-xl bg-app-surface-2 animate-pulse" />
      </div>
    ))}
  </div>
);

/** Character counter that turns amber once the snippet would be truncated. */
const CountHint = ({ value, limit }: { value: string; limit: number }) => (
  <span
    className={cn(
      "tabular-nums",
      value.length > limit ? "font-semibold text-amber-600 dark:text-amber-500" : "",
    )}
  >
    {value.length}/{limit}
  </span>
);

/* ── Page ──────────────────────────────────────────────────────────────────── */

const AdminGlobalSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("SEO");
  const [activePage, setActivePage] = useState<PageKey>("Homepage");
  const [activeUserType, setActiveUserType] = useState<UserType>("Vendor");

  // ── SEO ────────────────────────────────────────────────────────────────
  const [seo, setSeo] = useState<SeoForm>(EMPTY_SEO);
  const [seoLoading, setSeoLoading] = useState(true);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [seoEditable, setSeoEditable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);

  const setField = <K extends keyof SeoForm>(key: K, value: SeoForm[K]) =>
    setSeo((prev) => ({ ...prev, [key]: value }));

  const loadSeo = useCallback(async () => {
    try {
      setSeoLoading(true);
      setSeoError(null);
      const data = await settingsService.getSeo(activePage);
      setSeo({
        metaKeywords: data?.metaKeywords || "",
        metaTitle: data?.metaTitle || "",
        metaDescription: data?.metaDescription || "",
        socialTitle: data?.socialTitle || "",
        socialDescription: data?.socialDescription || "",
        ogImageUrl: data?.ogImageUrl || "",
      });
      setSeoEditable(false);
    } catch (e: any) {
      setSeoError(typeof e === "string" ? e : "Failed to load SEO settings");
    } finally {
      setSeoLoading(false);
    }
  }, [activePage]);

  useEffect(() => {
    if (activeTab !== "SEO") return;
    loadSeo();
  }, [activeTab, loadSeo]);

  const saveSeo = async () => {
    try {
      setSaving(true);
      await settingsService.upsertSeo({ page: activePage, ...seo });
      setSeoEditable(false);
      toast.success(`SEO for ${activePage} saved.`);
    } catch {
      toast.error("Failed to save SEO settings.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * The OG image upload existed as a handler but was never wired to a control,
   * so the field could only ever be set by pasting a URL — which there was no
   * input for either. MediaPicker gives it both.
   */
  const uploadOgImage = async (file: File) => {
    try {
      setUploadingOg(true);
      const res = await settingsService.uploadSeoAsset(activePage, "og", file);
      const url = res?.ogImageUrl || res?.url || "";
      if (url) setField("ogImageUrl", url);
      toast.success("Image uploaded — save to publish it.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploadingOg(false);
    }
  };

  // ── Approvals ──────────────────────────────────────────────────────────
  const [approvals, setApprovals] = useState<Record<ApprovalKey, boolean>>({
    vendorApproval: true,
    mobileApproval: true,
    emailApproval: true,
    phoneApproval: true,
  });
  const [systemLoading, setSystemLoading] = useState(true);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<ApprovalKey | null>(null);

  const loadSystem = useCallback(async () => {
    try {
      setSystemLoading(true);
      setSystemError(null);
      const data = await settingsService.getSystem(activeUserType);
      setApprovals({
        vendorApproval: Boolean(data?.vendorApproval),
        mobileApproval: Boolean(data?.mobileApproval),
        emailApproval: Boolean(data?.emailApproval),
        phoneApproval: Boolean(data?.phoneApproval),
      });
    } catch (e: any) {
      setSystemError(typeof e === "string" ? e : "Failed to load system settings");
    } finally {
      setSystemLoading(false);
    }
  }, [activeUserType]);

  useEffect(() => {
    if (activeTab !== "Approvals") return;
    loadSystem();
  }, [activeTab, loadSystem]);

  /**
   * Optimistic toggle: paint the new value, persist the whole set (so the
   * server never receives a half-stale row), and roll the switch back if the
   * call fails — the UI must not claim a setting that didn't stick.
   */
  const toggleApproval = async (key: ApprovalKey, checked: boolean) => {
    const previous = approvals;
    const next = { ...previous, [key]: checked };
    setApprovals(next);
    setBusyKey(key);
    try {
      await settingsService.updateSystem({ userType: activeUserType, ...next });
      toast.success("Settings saved.");
    } catch {
      setApprovals(previous);
      toast.error("Failed to save settings.");
    } finally {
      setBusyKey(null);
    }
  };

  const requiredCount = APPROVALS.filter(({ key }) => approvals[key]).length;

  // ── Payment gateway ────────────────────────────────────────────────────
  const [gateway, setGateway] = useState<PaymentGatewaySettings | null>(null);
  const [gatewayLoading, setGatewayLoading] = useState(true);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [switchingTo, setSwitchingTo] = useState<PaymentGatewayId | null>(null);

  const loadGateway = useCallback(async () => {
    try {
      setGatewayLoading(true);
      setGatewayError(null);
      setGateway(await settingsService.getPaymentGateway());
    } catch (e: any) {
      setGatewayError(typeof e === "string" ? e : "Failed to load payment settings");
    } finally {
      setGatewayLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "Payments") return;
    loadGateway();
  }, [activeTab, loadGateway]);

  /**
   * Not optimistic, unlike the approval switches. This one redirects real
   * money, and the server rejects a gateway whose credentials are missing —
   * so we wait for its answer and render that, rather than showing a
   * selection that may not have stuck.
   */
  const selectGateway = async (id: PaymentGatewayId) => {
    if (id === gateway?.gateway || switchingTo) return;
    setSwitchingTo(id);
    try {
      setGateway(await settingsService.updatePaymentGateway(id));
      toast.success(`Checkout now uses ${id === "cashfree" ? "Cashfree" : "Razorpay"}.`);
    } catch (e: any) {
      toast.error(e?.error?.message || e?.message || "Failed to switch gateway.");
    } finally {
      setSwitchingTo(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  const current = TABS.find((t) => t.key === activeTab) ?? TABS[0];
  const TabIcon = current.icon;

  const seoActions = seoEditable ? (
    <>
      <button type="button" onClick={loadSeo} className={BTN_NEUTRAL} disabled={saving}>
        <X size={14} /> Cancel
      </button>
      <button type="button" onClick={saveSeo} className={BTN_PRIMARY} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {saving ? "Saving…" : "Save changes"}
      </button>
    </>
  ) : (
    <button
      type="button"
      onClick={() => setSeoEditable(true)}
      className={BTN_SOFT}
      disabled={seoLoading}
    >
      <Pencil size={14} /> Edit
    </button>
  );

  const renderSeo = () => (
    <div className="space-y-4">
      {/* Page rail + edit actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CmsSegmented
          items={PAGES.map((page) => ({ value: page, label: page }))}
          value={activePage}
          onChange={(page) => setActivePage(page)}
          layoutId="seoPageRail"
          ariaLabel="Public page"
        />
        <div className="flex items-center gap-2 shrink-0">{seoActions}</div>
      </div>

      {seoError && <ErrorNote message={seoError} onRetry={loadSeo} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Search ─────────────────────────────────────────────── */}
        <CmsSection icon={Search} title="Search engine" blurb="What Google shows for this page.">
          {seoLoading ? (
            <FieldSkeleton />
          ) : (
            <div className="space-y-4">
              <CmsField
                label="Meta title"
                htmlFor="meta-title"
                hint={<CountHint value={seo.metaTitle} limit={TITLE_LIMIT} />}
              >
                <input
                  id="meta-title"
                  value={seo.metaTitle}
                  onChange={(e) => setField("metaTitle", e.target.value)}
                  placeholder="e.g. Camper van rentals across India — TravelHomes"
                  className={CONTROL}
                  disabled={!seoEditable}
                />
              </CmsField>

              <CmsField
                label="Meta description"
                htmlFor="meta-description"
                hint={<CountHint value={seo.metaDescription} limit={DESC_LIMIT} />}
              >
                <textarea
                  id="meta-description"
                  value={seo.metaDescription}
                  onChange={(e) => setField("metaDescription", e.target.value)}
                  placeholder="One or two sentences describing this page."
                  rows={4}
                  className={TEXTAREA}
                  disabled={!seoEditable}
                />
              </CmsField>

              <CmsField label="Meta keywords" htmlFor="meta-keywords" hint="comma separated">
                <input
                  id="meta-keywords"
                  value={seo.metaKeywords}
                  onChange={(e) => setField("metaKeywords", e.target.value)}
                  placeholder="camper van, road trip, stays"
                  className={CONTROL}
                  disabled={!seoEditable}
                />
              </CmsField>
            </div>
          )}
        </CmsSection>

        {/* ── Social ─────────────────────────────────────────────── */}
        <CmsSection
          icon={Share2}
          title="Social sharing"
          blurb="Used when the page is shared on WhatsApp, X or LinkedIn."
        >
          {seoLoading ? (
            <FieldSkeleton />
          ) : (
            <div className="space-y-4">
              <CmsField label="Social title" htmlFor="social-title">
                <input
                  id="social-title"
                  value={seo.socialTitle}
                  onChange={(e) => setField("socialTitle", e.target.value)}
                  placeholder="Falls back to the meta title when empty"
                  className={CONTROL}
                  disabled={!seoEditable}
                />
              </CmsField>

              <CmsField label="Social description" htmlFor="social-description">
                <textarea
                  id="social-description"
                  value={seo.socialDescription}
                  onChange={(e) => setField("socialDescription", e.target.value)}
                  placeholder="Falls back to the meta description when empty"
                  rows={4}
                  className={TEXTAREA}
                  disabled={!seoEditable}
                />
              </CmsField>

              <CmsField label="Share image">
                {/* Uploading writes the URL into the form, so it has to follow
                    the same edit gate as the text fields — otherwise you could
                    upload an image with no way to save it. */}
                <div
                  aria-disabled={!seoEditable}
                  className={cn(!seoEditable && "pointer-events-none opacity-60")}
                >
                  <MediaPicker
                    value={seo.ogImageUrl}
                    onFile={uploadOgImage}
                    onChangeUrl={(url) => setField("ogImageUrl", url)}
                    onClear={() => setField("ogImageUrl", "")}
                    busy={uploadingOg}
                    shape="wide"
                    hint="1200 × 630 works everywhere."
                  />
                </div>
              </CmsField>
            </div>
          )}
        </CmsSection>

        {/* ── Preview ──────────────────────────────────────────────
            Length limits mean nothing in the abstract; the snippet shows
            what actually survives truncation. */}
        <div className="lg:col-span-2">
          <CmsSection
            icon={Search}
            title="Search preview"
            blurb="Roughly how the result reads today."
          >
            <div className="max-w-[620px] rounded-xl border border-app-border bg-app-surface-2 px-4 py-3.5">
              <p className="text-[12px] text-app-fg-muted truncate">
                travelhomes.in <span className="mx-1">›</span> {activePage}
              </p>
              <p className="mt-1 text-[16px] font-medium leading-snug text-[#1a0dab] dark:text-[#8ab4f8] truncate">
                {seo.metaTitle || `${activePage} — TravelHomes`}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-app-fg-muted line-clamp-2">
                {seo.metaDescription || "No meta description set for this page yet."}
              </p>
            </div>
          </CmsSection>
        </div>
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-4">
      <CmsSegmented
        items={[
          { value: "Vendor" as UserType, label: "Vendor", icon: Store },
          { value: "User" as UserType, label: "User", icon: Users },
        ]}
        value={activeUserType}
        onChange={(type) => setActiveUserType(type)}
        layoutId="settingsUserTypeRail"
        ariaLabel="Account type"
      />

      {systemError && <ErrorNote message={systemError} onRetry={loadSystem} />}

      <CmsSection
        icon={ShieldCheck}
        title="Approval requirements"
        blurb={`Applied to new ${activeUserType.toLowerCase()} accounts. Changes save immediately.`}
        aside={
          !systemLoading && (
            <span className="text-[12px] font-semibold tabular-nums text-app-fg-muted">
              {requiredCount} of {APPROVALS.length} required
            </span>
          )
        }
        flush
      >
        <div className="divide-y divide-app-border">
          {systemLoading
            ? APPROVALS.map(({ key }) => (
                <div key={key} className="flex items-center justify-between px-4 py-4">
                  <div className="h-3.5 w-44 rounded bg-app-surface-2 animate-pulse" />
                  <div className="h-5 w-9 rounded-full bg-app-surface-2 animate-pulse" />
                </div>
              ))
            : APPROVALS.map(({ key, label, icon, blurb }) => (
                <CmsToggleRow key={key} icon={icon} title={label} blurb={blurb}>
                  <Switch
                    id={key}
                    checked={approvals[key]}
                    onCheckedChange={(checked) => toggleApproval(key, checked)}
                    disabled={busyKey !== null}
                    aria-label={label}
                  />
                </CmsToggleRow>
              ))}
        </div>
      </CmsSection>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-4">
      {gatewayError && <ErrorNote message={gatewayError} onRetry={loadGateway} />}

      <CmsSection
        icon={CreditCard}
        title="Checkout gateway"
        blurb="Every new booking payment goes through the gateway selected here. Payments already in flight finish on the gateway that started them."
        aside={
          !gatewayLoading &&
          gateway?.source === "env" && (
            <span className="text-[12px] font-semibold text-app-fg-muted">
              inherited from server config
            </span>
          )
        }
        flush
      >
        <div className="divide-y divide-app-border">
          {gatewayLoading
            ? [0, 1].map((i) => (
                <div key={i} className="flex items-center justify-between px-4 py-4">
                  <div className="h-3.5 w-40 rounded bg-app-surface-2 animate-pulse" />
                  <div className="h-5 w-16 rounded-full bg-app-surface-2 animate-pulse" />
                </div>
              ))
            : (gateway?.options ?? []).map((option) => {
                const active = gateway?.gateway === option.id;
                const busy = switchingTo === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectGateway(option.id)}
                    disabled={!option.configured || switchingTo !== null}
                    aria-pressed={active}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40",
                      option.configured
                        ? "hover:bg-app-surface-2 cursor-pointer"
                        : "opacity-60 cursor-not-allowed",
                      active && "bg-app-accent-soft/40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid place-items-center w-8 h-8 rounded-[10px] shrink-0",
                        active ? "bg-app-accent text-white" : "bg-app-surface-2 text-app-fg-muted",
                      )}
                    >
                      {busy ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : active ? (
                        <Check size={15} strokeWidth={2.4} />
                      ) : (
                        <CreditCard size={15} strokeWidth={2.1} />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-app-fg">
                        {option.label}
                        {option.mode === "sandbox" && option.configured && (
                          <span className="ml-2 text-[11px] font-semibold text-app-fg-muted">
                            test mode
                          </span>
                        )}
                      </span>
                      <span className="block mt-0.5 text-[12px] text-app-fg-muted">
                        {!option.configured
                          ? "No API credentials on the server — add them before selecting."
                          : active
                            ? "Live at checkout."
                            : "Click to make this the checkout gateway."}
                      </span>
                    </span>
                  </button>
                );
              })}
        </div>
      </CmsSection>
    </div>
  );

  return (
    <AdminLayout title="Global Settings">
      <MotionReveal delay={0}>
        <div className="bg-app-surface rounded-[18px] border border-app-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)] overflow-hidden">
          {/* Panel head — states which surface you're editing. */}
          <header className="flex items-start gap-3 px-5 pt-4 pb-3.5 border-b border-app-border">
            <span className="grid place-items-center w-8 h-8 rounded-[10px] bg-app-accent-soft text-app-accent shrink-0">
              <TabIcon size={15} strokeWidth={2.1} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[14.5px] font-bold tracking-[-0.01em] text-app-fg">
                {current.label}
              </h2>
              <p className="mt-0.5 text-[12.5px] text-app-fg-muted">{current.blurb}</p>
            </div>
          </header>

          {/* Tab rail — the same sliding pill as the CMS page. */}
          <div
            role="tablist"
            aria-label="Settings sections"
            className="flex items-center gap-1 px-3 py-2.5 border-b border-app-border overflow-x-auto scrollbar-hide"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 h-9 px-3 rounded-xl whitespace-nowrap shrink-0",
                    "text-[12.5px] font-semibold outline-none transition-colors duration-150",
                    "focus-visible:ring-2 focus-visible:ring-app-accent/40",
                    active
                      ? "text-app-accent"
                      : "text-app-fg-muted hover:text-app-fg hover:bg-app-surface-2",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="settingsTabPill"
                      className="absolute inset-0 rounded-xl bg-app-accent-soft"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <tab.icon size={14} strokeWidth={2.1} className="relative shrink-0" />
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="px-5 py-5 min-h-[calc(100vh-16rem)]">
            <MotionReveal delay={0.06}>
              {activeTab === "SEO"
                ? renderSeo()
                : activeTab === "Approvals"
                  ? renderApprovals()
                  : renderPayments()}
            </MotionReveal>
          </div>
        </div>
      </MotionReveal>
    </AdminLayout>
  );
};

export default AdminGlobalSettings;
