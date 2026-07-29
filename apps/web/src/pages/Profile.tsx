import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  Building2,
  Camera,
  IdCard,
  Link2,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  Share2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import {
  BRAND_VARS,
  BTN_NEUTRAL,
  BTN_PRIMARY,
  BTN_SOFT,
  CONTROL,
  EmptyState,
  Field,
  PANEL,
  Panel,
  PanelHead,
  ReadValue,
  SELECT_ITEM,
  StatusBadge,
} from "@/components/shared";
import { getInitials } from "@/utils/getInitials";
import { cn } from "@/lib/utils";
import { userProfileApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { SocialIcon } from "./Profile/SocialIcon";

/** `yyyy-mm-dd` is what the date input needs; nobody wants to read it. Declared
 *  above the schema below because the field definitions reference it directly. */
const readableDate = (v: string) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/* ── Field schema ─────────────────────────────────────────────────────────────
   The old page rendered every field twice — once as a read-only <div>, once as
   an <Input> — which is where ~600 of its 976 lines went, and why the two
   halves had drifted (the edit form was missing fields the view showed). One
   declaration per field now drives both states.                              */

type Scope = "personal" | "business";

interface FieldDef {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  /** Derived or managed elsewhere — rendered, never editable. */
  readOnly?: boolean;
  /** Shown under the label while editing. */
  hint?: string;
  /** Presentation applied in read mode only — the input keeps the raw value. */
  format?: (v: string) => string;
  /** Where to read a display value when the field itself is empty. */
  fallback?: (p: any) => string;
  /** Doubles as the fetch key for the whole profile — see `email` below. */
  loadKey?: boolean;
  span?: string;
}

interface GroupDef {
  id: string;
  scope: Scope;
  title: string;
  blurb?: string;
  icon: LucideIcon;
  cols?: string;
  fields: FieldDef[];
}

const PERSONAL_GROUPS: GroupDef[] = [
  {
    id: "identity",
    scope: "personal",
    title: "Your details",
    blurb: "The name guests see on bookings and messages.",
    icon: UserRound,
    cols: "grid-cols-1 sm:grid-cols-2",
    fields: [
      { key: "firstName", label: "First name", placeholder: "Priya" },
      { key: "lastName", label: "Last name", placeholder: "Nair" },
      { key: "dateOfBirth", label: "Date of birth", type: "date", format: readableDate },
      { key: "maritalStatus", label: "Marital status", placeholder: "Single" },
    ],
  },
  {
    id: "contact",
    scope: "personal",
    title: "Contact",
    blurb: "How we and your guests reach you.",
    icon: AtSign,
    cols: "grid-cols-1 sm:grid-cols-2",
    fields: [
      {
        key: "email",
        label: "Account email",
        type: "email",
        loadKey: true,
        placeholder: "you@example.com",
        hint: "Your profile loads from this address",
      },
      { key: "phoneNumber", label: "Phone", type: "tel", placeholder: "10-digit mobile number" },
    ],
  },
  {
    id: "address",
    scope: "personal",
    title: "Address",
    blurb: "Used for payouts and tax paperwork.",
    icon: MapPin,
    fields: [
      { key: "country", label: "Country", placeholder: "India" },
      { key: "state", label: "State", placeholder: "Maharashtra" },
      { key: "city", label: "City", placeholder: "Mumbai" },
      { key: "personalLocality", label: "Locality", placeholder: "Bandra West" },
      { key: "personalPincode", label: "Pincode", placeholder: "400050" },
    ],
  },
  {
    id: "kyc",
    scope: "personal",
    title: "Identity document",
    blurb: "Verifies you're the person behind the listings.",
    icon: IdCard,
    cols: "grid-cols-1 sm:grid-cols-2",
    fields: [
      { key: "idProof", label: "ID type and number", placeholder: "Aadhaar · 1234 5678 9012" },
    ],
  },
];

const BUSINESS_GROUPS: GroupDef[] = [
  {
    id: "biz-identity",
    scope: "business",
    title: "Business identity",
    blurb: "The trading name shown on invoices and receipts.",
    icon: Building2,
    fields: [
      {
        key: "brandName",
        label: "Brand name",
        placeholder: "Coorg Caravans",
        fallback: (p) => p.vendorDetails?.brandName,
      },
      {
        key: "legalCompanyName",
        label: "Legal company name",
        placeholder: "Registered entity name",
      },
      {
        key: "businessType",
        label: "Business type",
        readOnly: true,
        fallback: (p) => p.vendorDetails?.servicesOffered?.[0] || "Travel & Tourism",
      },
    ],
  },
  {
    id: "biz-contact",
    scope: "business",
    title: "Business contact",
    blurb: "Published on your listings for guest enquiries.",
    icon: AtSign,
    fields: [
      {
        key: "email",
        label: "Business email",
        type: "email",
        placeholder: "hello@yourbrand.in",
        fallback: (p) => p.vendorDetails?.email,
      },
      {
        key: "phoneNumber",
        label: "Business phone",
        type: "tel",
        placeholder: "10-digit number",
        fallback: (p) => p.vendorDetails?.phone,
      },
      { key: "website", label: "Website", type: "url", placeholder: "yourbrand.in" },
    ],
  },
  {
    id: "biz-address",
    scope: "business",
    title: "Business address",
    blurb: "Where the business is registered.",
    icon: MapPin,
    cols: "grid-cols-1 sm:grid-cols-2",
    fields: [
      {
        key: "locality",
        label: "Locality",
        placeholder: "Street and area",
        fallback: (p) => p.vendorDetails?.location,
      },
      { key: "city", label: "City", placeholder: "Mumbai" },
      { key: "state", label: "State", placeholder: "Maharashtra" },
      { key: "pincode", label: "Pincode", placeholder: "400050" },
    ],
  },
  {
    id: "biz-legal",
    scope: "business",
    title: "Legal and tax",
    blurb: "Needed before payouts can be released.",
    icon: ReceiptText,
    cols: "grid-cols-1 sm:grid-cols-2",
    fields: [{ key: "gstNumber", label: "GST number", placeholder: "22AAAAA0000A1Z5" }],
  },
];

/**
 * `SocialProfileSchema.platform` is an enum of exactly these five, lowercase
 * (Server/models/Profile.js). The old free-text input let you type anything —
 * it only persisted because this update path runs without `runValidators`, so
 * any value outside the list is a validation error waiting to surface. Offer
 * the schema's own options instead.
 */
const PLATFORMS = ["facebook", "instagram", "twitter", "linkedin", "youtube"] as const;
const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

const TABS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "personal", label: "Personal", icon: UserRound },
  { key: "business", label: "Business", icon: Building2 },
  { key: "social", label: "Social", icon: Share2 },
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Resolve a field's display value, honouring loadKey and vendorDetails fallbacks. */
const readField = (group: GroupDef, field: FieldDef, profile: any, email: string): string => {
  if (field.loadKey) return email;
  const base = group.scope === "business" ? (profile?.business ?? {}) : (profile ?? {});
  const own = base?.[field.key];
  if (own !== undefined && own !== null && own !== "") return String(own);
  return field.fallback?.(profile) ?? "";
};

/** Normalise a social URL so a bare "instagram.com/x" still opens externally. */
const asHref = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

/* ── Page ─────────────────────────────────────────────────────────────────── */

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("personal");
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "business") setActiveTab("business");
    else if (tab === "social") setActiveTab("social");
    else setActiveTab("personal");
  }, [searchParams]);

  // Load email from URL (?email=) or localStorage; falls back to the signed-in
  // account below so the page isn't blank on a fresh session.
  const defaultEmail =
    new URLSearchParams(window.location.search).get("email") ??
    localStorage.getItem("profileEmail") ??
    "";
  const [email, setEmail] = useState(defaultEmail);

  // Profile state from API
  const [profile, setProfile] = useState<any>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    state: "",
    city: "",
    country: "",
    dateOfBirth: "",
    personalLocality: "",
    personalPincode: "",
    idProof: "",
    photo: "",
    vendorDetails: null,
    business: {},
    socialProfiles: [],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  /** Taken when edit mode opens so Cancel can put everything back. */
  const snapshot = useRef<{ profile: any; email: string } | null>(null);

  /** Nothing to fetch from until an address is known — use the session's own. */
  useEffect(() => {
    if (!email && user?.email) setEmail(user.email);
  }, [user, email]);

  // Fetch profile when email changes
  useEffect(() => {
    if (!email) return;
    localStorage.setItem("profileEmail", email);
    (async () => {
      try {
        const json = await userProfileApi.get(email);
        const data: Record<string, any> = json?.data || {};
        // Format date for input
        if (data.dateOfBirth) {
          data.dateOfBirth = new Date(data.dateOfBirth).toISOString().split("T")[0];
        }
        setProfile((prev) => ({ ...prev, ...data }));
        updateUser(data);
      } catch {
        setProfile((prev) => ({ ...prev, email }));
      }
    })();
  }, [email]);

  const setPersonalField = (key: string, value: string) =>
    setProfile((prev: any) => ({ ...prev, [key]: value }));

  const setBusinessField = (key: string, value: string) =>
    setProfile((prev: any) => ({ ...prev, business: { ...(prev.business || {}), [key]: value } }));

  const startEdit = () => {
    snapshot.current = { profile, email };
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (snapshot.current) {
      setProfile(snapshot.current.profile);
      setEmail(snapshot.current.email);
    }
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    try {
      if (!email) {
        toast.error("Add an email address first.");
        return;
      }
      setSaving(true);
      // GET augments the document with derived/server-managed keys. Echoing
      // them back means PUTting a whole embedded Vendor doc on every save;
      // strict mode drops them today, but don't rely on that.
      const { vendorDetails, vendorStatus, userType, _id, __v, createdAt, updatedAt, ...payload } =
        profile;
      const json = await userProfileApi.upsert({ ...payload, email });
      const data: Record<string, any> = json.data || {};
      if (data.dateOfBirth) {
        data.dateOfBirth = new Date(data.dateOfBirth).toISOString().split("T")[0];
      }
      setProfile((prev) => ({ ...prev, ...data }));
      updateUser(data);
      setIsEditing(false);
      toast.success("Profile saved");
    } catch (e: any) {
      toast.error(
        e?.message
          ? `We couldn't save your profile — ${e.message}`
          : "We couldn't save your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!email) {
      toast.error("Add an email address first.");
      return;
    }
    try {
      setUploading(true);
      const json = await userProfileApi.uploadPhoto(email, file);
      const newUrl = json?.data?.photo || json?.url;
      if (newUrl) {
        setProfile((p) => ({ ...p, photo: newUrl }));
        updateUser({ photo: newUrl });
      }
      toast.success("Photo updated");
    } catch (err: any) {
      toast.error(err?.message ? `Upload failed — ${err.message}` : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  /* ── Social links ────────────────────────────────────────────────────────
     Add and Remove commit straight away. They used to only mutate local state
     behind a separate "Save changes" button, so adding a link and then
     reloading silently lost it — an Add button next to a list has to stick.
     The payload is just {email, socialProfiles}: the upsert `$set`s only those
     paths, so a stale `profile` in state can't clobber anything else.        */
  const [linkPlatform, setLinkPlatform] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [savingSocial, setSavingSocial] = useState(false);
  const socialProfiles: any[] = profile.socialProfiles || [];
  /** One row per platform — the schema keys on it, and two Instagrams is noise. */
  const linkedPlatforms = useMemo(
    () => new Set(socialProfiles.map((l: any) => (l.platform || "").toLowerCase())),
    [socialProfiles],
  );

  const persistSocial = async (next: any[], message: string) => {
    const previous = socialProfiles;
    setProfile((prev: any) => ({ ...prev, socialProfiles: next })); // optimistic
    try {
      setSavingSocial(true);
      await userProfileApi.upsert({ email, socialProfiles: next } as any);
      toast.success(message);
    } catch (e: any) {
      setProfile((prev: any) => ({ ...prev, socialProfiles: previous })); // roll back
      toast.error(e?.message ? `We couldn't save that — ${e.message}` : "We couldn't save that.");
    } finally {
      setSavingSocial(false);
    }
  };

  const handleAddSocialLink = () => {
    if (!linkPlatform || !linkUrl.trim()) {
      toast.error("Pick a platform and add a URL.");
      return;
    }
    if (!email) {
      toast.error("Add an email address first.");
      return;
    }
    if (socialProfiles.some((l) => (l.platform || "").toLowerCase() === linkPlatform)) {
      toast.error(`${PLATFORM_LABELS[linkPlatform] ?? linkPlatform} is already linked.`);
      return;
    }
    persistSocial(
      [...socialProfiles, { platform: linkPlatform, url: linkUrl.trim() }],
      "Link added",
    );
    setLinkPlatform("");
    setLinkUrl("");
  };

  const handleRemoveSocialLink = (index: number) =>
    persistSocial(
      socialProfiles.filter((_: any, i: number) => i !== index),
      "Link removed",
    );

  /* ── Derived ── */

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || user?.name || "";

  /**
   * How much of the profile is filled in. Read-only/derived fields don't count —
   * a host can't act on those, so including them would inflate the number.
   */
  const completeness = useMemo(() => {
    const values = [...PERSONAL_GROUPS, ...BUSINESS_GROUPS].flatMap((g) =>
      g.fields.filter((f) => !f.readOnly).map((f) => readField(g, f, profile, email)),
    );
    const filled = values.filter((v) => String(v ?? "").trim() !== "").length;
    return { filled, total: values.length, pct: Math.round((filled / values.length) * 100) };
  }, [profile, email]);

  const groups = activeTab === "business" ? BUSINESS_GROUPS : PERSONAL_GROUPS;
  /** Social links save immediately on Save; they aren't behind the edit toggle. */
  const editable = activeTab !== "social";

  const renderGroup = (group: GroupDef) => (
    <Panel key={group.id}>
      <PanelHead icon={group.icon} title={group.title} blurb={group.blurb} />
      <div
        className={cn(
          "grid gap-x-5 gap-y-4 p-5",
          group.cols ?? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {group.fields.map((field) => {
          const id = `${group.id}-${field.key}`;
          const value = readField(group, field, profile, email);
          const canEdit = isEditing && !field.readOnly;
          return (
            <Field
              key={field.key}
              label={field.label}
              htmlFor={id}
              className={field.span}
              hint={canEdit ? field.hint : undefined}
            >
              {canEdit ? (
                <Input
                  id={id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={
                    field.loadKey
                      ? email
                      : ((group.scope === "business"
                          ? profile.business?.[field.key]
                          : profile[field.key]) ?? "")
                  }
                  onChange={(e) => {
                    const next = e.target.value;
                    if (field.loadKey) setEmail(next);
                    else if (group.scope === "business") setBusinessField(field.key, next);
                    else setPersonalField(field.key, next);
                  }}
                  className={cn("h-11", CONTROL)}
                />
              ) : (
                <ReadValue value={value && field.format ? field.format(value) : value} />
              )}
            </Field>
          );
        })}
      </div>

      {/* ID photos are uploaded during onboarding — surfaced here, not editable. */}
      {group.id === "kyc" && profile.idPhotos?.length > 0 && (
        <div className="px-5 pb-5 -mt-1">
          <p className="mb-2 text-[12.5px] font-semibold text-foreground/85">Uploaded documents</p>
          <div className="flex flex-wrap gap-3">
            {profile.idPhotos.map((url: string, idx: number) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-28 h-28 rounded-xl overflow-hidden border border-border/70 outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
              >
                <img
                  src={url}
                  alt={`Identity document ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );

  return (
    <DashboardLayout
      title="Profile"
      contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-muted/40 dark:bg-transparent"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-5xl mx-auto space-y-5 pb-24 lg:pb-12">
        {/* ── Identity header ── */}
        <section className={cn(PANEL, "relative overflow-hidden")}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.1] via-brand/[0.03] to-transparent"
          />
          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar + upload */}
              <div className="relative shrink-0">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt=""
                    className="w-20 h-20 rounded-2xl object-cover ring-1 ring-border/70"
                  />
                ) : (
                  <span className="grid place-items-center w-20 h-20 rounded-2xl bg-brand text-brand-fg text-[24px] font-bold tracking-[-0.02em]">
                    {getInitials(displayName)}
                  </span>
                )}

                {isEditing && (
                  <>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onPhotoChange}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploading}
                      aria-label="Change profile photo"
                      className={cn(
                        "absolute -bottom-1.5 -right-1.5 grid place-items-center w-8 h-8 rounded-full",
                        "bg-brand text-brand-fg ring-2 ring-card outline-none",
                        "hover:bg-brand-hover focus-visible:ring-4 focus-visible:ring-brand/30",
                        "transition-colors duration-150 disabled:opacity-70",
                      )}
                    >
                      {uploading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Camera size={14} strokeWidth={2.3} />
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Name + meta */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-[22px] font-bold tracking-[-0.02em] text-foreground truncate">
                    {displayName || "Your profile"}
                  </h1>
                  {user?.vendorStatus && <StatusBadge status={user.vendorStatus} size="sm" />}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                  {email && (
                    <span className="inline-flex items-center gap-1.5">
                      <AtSign size={12.5} strokeWidth={2.2} />
                      {email}
                    </span>
                  )}
                  {profile.phoneNumber && (
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Phone size={12.5} strokeWidth={2.2} />
                      {profile.phoneNumber}
                    </span>
                  )}
                  {(profile.city || profile.state) && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={12.5} strokeWidth={2.2} />
                      {[profile.city, profile.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  onClick={() => setIsChangePasswordOpen(true)}
                  className={BTN_SOFT}
                >
                  <Lock size={14} strokeWidth={2.3} />
                  Change password
                </Button>

                {editable &&
                  (isEditing ? (
                    <>
                      <Button variant="ghost" onClick={cancelEdit} className={BTN_NEUTRAL}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className={cn(BTN_PRIMARY, "disabled:opacity-60 disabled:shadow-none")}
                      >
                        {saving ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            Saving…
                          </>
                        ) : (
                          "Save changes"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={startEdit} className={BTN_PRIMARY}>
                      <Pencil size={14} strokeWidth={2.4} />
                      Edit profile
                    </Button>
                  ))}
              </div>
            </div>

            {/* Completeness — a quiet nudge, not a dashboard tile. */}
            {completeness.pct < 100 && (
              <div className="mt-5 pt-4 border-t border-border/60">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <p className="text-[12px] font-semibold text-foreground/85">
                    Profile {completeness.pct}% complete
                  </p>
                  <p className="text-[11.5px] tabular-nums text-muted-foreground">
                    {completeness.total - completeness.filled} field
                    {completeness.total - completeness.filled === 1 ? "" : "s"} left
                  </p>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-brand"
                    initial={{ width: 0 }}
                    animate={{ width: `${completeness.pct}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Tabs ── */}
        <div
          role="tablist"
          aria-label="Profile sections"
          className={cn(PANEL, "inline-flex items-center gap-1 p-1 rounded-2xl")}
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
                  "relative flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold",
                  "outline-none transition-colors duration-150",
                  "focus-visible:ring-2 focus-visible:ring-brand/40",
                  active ? "text-brand" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="profileTabPill"
                    className="absolute inset-0 rounded-xl bg-brand/[0.09]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <tab.icon size={15} strokeWidth={2.2} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {activeTab === "social" ? (
              <>
                <Panel>
                  <PanelHead
                    icon={Share2}
                    title="Connected accounts"
                    blurb="Linking your socials helps guests trust the listing."
                    aside={
                      socialProfiles.length > 0 ? (
                        <span className="text-[11.5px] font-semibold tabular-nums text-muted-foreground">
                          {socialProfiles.length} linked
                        </span>
                      ) : undefined
                    }
                  />

                  {socialProfiles.length === 0 ? (
                    <EmptyState
                      icon={Link2}
                      title="No accounts linked yet"
                      description="Add your Instagram, Facebook or website below — they show up on your public listings."
                    />
                  ) : (
                    <ul className="divide-y divide-border/70">
                      {socialProfiles.map((link: any, index: number) => (
                        <li
                          key={index}
                          className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-brand/[0.03]"
                        >
                          <span className="grid place-items-center w-9 h-9 rounded-[10px] bg-muted shrink-0">
                            <span className="w-[18px] h-[18px]">
                              <SocialIcon platform={link.platform} />
                            </span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13.5px] font-semibold text-foreground capitalize truncate">
                              {link.platform}
                            </p>
                            <a
                              href={asHref(link.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[12.5px] text-muted-foreground hover:text-brand hover:underline truncate block"
                            >
                              {link.url}
                            </a>
                          </div>
                          <button
                            onClick={() => handleRemoveSocialLink(index)}
                            aria-label={`Remove ${link.platform}`}
                            className={cn(
                              "grid place-items-center w-8 h-8 rounded-lg shrink-0 outline-none",
                              "text-muted-foreground/70 hover:bg-red-50 hover:text-red-600",
                              "dark:hover:bg-red-500/10 dark:hover:text-red-400",
                              "focus-visible:ring-2 focus-visible:ring-brand/40 transition-colors duration-150",
                            )}
                          >
                            <X size={15} strokeWidth={2.4} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>

                <Panel>
                  <PanelHead icon={Plus} title="Add a link" blurb="Saved as soon as you add it." />
                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-4 items-end p-5">
                    <Field label="Platform" htmlFor="link-platform">
                      <Select value={linkPlatform} onValueChange={setLinkPlatform}>
                        <SelectTrigger id="link-platform" className={cn("h-11", CONTROL)}>
                          <SelectValue placeholder="Pick one" />
                        </SelectTrigger>
                        <SelectContent style={BRAND_VARS}>
                          {PLATFORMS.map((p) => (
                            <SelectItem
                              key={p}
                              value={p}
                              disabled={linkedPlatforms.has(p)}
                              className={SELECT_ITEM}
                            >
                              {PLATFORM_LABELS[p]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="URL" htmlFor="link-url">
                      <Input
                        id="link-url"
                        value={linkUrl}
                        placeholder="instagram.com/yourbrand"
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddSocialLink()}
                        className={cn("h-11", CONTROL)}
                      />
                    </Field>
                    <Button
                      onClick={handleAddSocialLink}
                      disabled={savingSocial}
                      className={cn(BTN_PRIMARY, "h-11 disabled:opacity-60 disabled:shadow-none")}
                    >
                      {savingSocial ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Plus size={15} strokeWidth={2.4} />
                      )}
                      Add
                    </Button>
                  </div>
                </Panel>
              </>
            ) : (
              groups.map(renderGroup)
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </DashboardLayout>
  );
};

export default Profile;
