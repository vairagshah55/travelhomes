import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  Search,
  Store,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/adminUtils";
import { formatINR } from "@/utils/formatCurrency";
import { useVendorDirectory } from "@/hooks/admin/useVendors";
import { useOfferingCatalog } from "@/hooks/useOfferingCatalog";
import { SERVICE_TYPES, serviceTypeOf } from "@/lib/listingKind";
/* The field set lives in lib/offeringFields — shared with the vendor create and
   edit wizards, so the four surfaces cannot describe the same listing
   differently. Everything below is rendering. */
import {
  ARRAY_FIELDS,
  DISCOUNT_SLOTS,
  EMPTY,
  ENUM_FIELDS,
  NUMERIC_FIELDS,
  REQUIRED_FIELDS,
  SECTIONS,
  serializeOfferingValues,
  toArr,
  type FieldSpec,
  type Kind,
  type Offer,
} from "@/lib/offeringFields";
import { RoomsEditor } from "@/components/offering/RoomsEditor";
import {
  BTN_GHOST,
  BTN_NEUTRAL,
  BTN_PRIMARY,
  BTN_SM,
  ELEV_3,
  FOCUS_RING,
  INPUT,
  INPUT_SM,
  LABEL,
  PORTAL_VARS,
  SELECT_ITEM,
  TEXTAREA,
} from "@/components/admin/adminUI";

/* Re-exported so the callers that already import `Offer` from this module keep
   working; the type itself now lives with the field registry. */
export type { Offer } from "@/lib/offeringFields";

interface ManagementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Offer>) => void;
  initialData?: Offer;
  isLoading?: boolean;
}

const MAX_IMAGE_MB = 5;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const fieldId = (name: string) => `mf-${name}`;

/** Normalise whatever the caller hands us into the shape the inputs expect. */
function buildInitial(initialData?: Offer): Offer {
  if (!initialData) return { ...EMPTY, photos: { coverUrl: "", galleryUrls: [] }, discounts: {} };
  return {
    ...EMPTY,
    ...initialData,
    ...Object.fromEntries(ARRAY_FIELDS.map((k) => [k, toArr(initialData[k])])),
    discounts: initialData.discounts ? { ...initialData.discounts } : {},
    photos: {
      coverUrl: initialData.photos?.coverUrl || "",
      galleryUrls: [...(initialData.photos?.galleryUrls || [])],
    },
  };
}

/* ── Validation ───────────────────────────────────────────────────────────
   Runs on every keystroke but is only *shown* once a field has been left or
   the form has been submitted, so a half-typed value never looks broken. */
const VALIDATED_FIELDS = Array.from(new Set([...REQUIRED_FIELDS, ...NUMERIC_FIELDS, "pincode"]));

function validateField(name: string, data: Offer): string | undefined {
  const raw = data[name];
  const value = typeof raw === "string" ? raw.trim() : raw;
  const missing = value === "" || value === undefined || value === null;

  if (REQUIRED_FIELDS.includes(name) && missing) {
    const spec = SECTIONS.flatMap((s) => s.fields ?? []).find((f) => f.name === name);
    return `${spec?.label ?? name} is required.`;
  }

  if (name === "pincode" && !missing) {
    return /^\d{6}$/.test(String(value)) ? undefined : "Pincode should be 6 digits.";
  }

  if (NUMERIC_FIELDS.includes(name) && !missing) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "Enter a number.";
    if (n < 0) return "Can't be negative.";
    if (name === "finalPrice") {
      const regular = Number(data.regularPrice);
      if (Number.isFinite(regular) && regular > 0 && n > regular) {
        return "The discounted price can't exceed the regular price.";
      }
    }
  }
  return undefined;
}

/* ── Small pieces ─────────────────────────────────────────────────────────── */

const Field: React.FC<{
  label: string;
  htmlFor?: string;
  required?: boolean;
  help?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, required, help, error, className, children }) => (
  <div className={cn("min-w-0 space-y-1.5", className)}>
    <label htmlFor={htmlFor} className={cn(LABEL, "flex items-center gap-1")}>
      {label}
      {required && (
        <span className="text-red-500" aria-hidden>
          *
        </span>
      )}
    </label>
    {children}
    {error ? (
      <p
        id={`${htmlFor}-error`}
        role="alert"
        className="flex items-start gap-1.5 text-[11.5px] font-medium text-red-600"
      >
        <AlertCircle size={12} strokeWidth={2.4} className="mt-px shrink-0" />
        {error}
      </p>
    ) : (
      help && <p className="text-[11.5px] text-app-fg-muted">{help}</p>
    )}
  </div>
);

/**
 * Chip editor for the array fields. The old form asked for "Features (comma
 * separated)" in a single text input, which gave no feedback that the string
 * was about to be split and made an existing 12-item list unreadable.
 */
const TagInput: React.FC<{
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}> = ({ id, value, onChange, placeholder }) => {
  const [draft, setDraft] = useState("");

  const commit = (text: string) => {
    const parts = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    parts.forEach((p) => {
      if (!next.some((existing) => existing.toLowerCase() === p.toLowerCase())) next.push(p);
    });
    onChange(next);
    setDraft("");
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 min-h-10 w-full rounded-xl px-2 py-1.5",
        "border border-app-border bg-app-surface-2",
        "transition-[background-color,border-color,box-shadow] duration-150",
        "focus-within:bg-app-surface focus-within:border-app-accent focus-within:ring-4 focus-within:ring-app-accent/20",
      )}
      onClick={() => document.getElementById(id)?.focus()}
    >
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-lg bg-app-surface border border-app-border text-[12.5px] font-medium text-app-fg"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(value.filter((_, idx) => idx !== i));
            }}
            aria-label={`Remove ${tag}`}
            className={cn(
              "grid place-items-center w-5 h-5 rounded-md text-app-fg-subtle hover:text-red-600 hover:bg-red-50",
              FOCUS_RING,
            )}
          >
            <X size={11} strokeWidth={2.6} />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        // Committing on blur means a typed-but-not-entered value isn't silently
        // dropped when the operator tabs on or hits Save.
        onBlur={() => commit(draft)}
        placeholder={value.length ? "Add another…" : placeholder}
        className="flex-1 min-w-[140px] h-7 px-1.5 bg-transparent text-[13.5px] text-app-fg placeholder:text-app-fg-subtle outline-none"
      />
    </div>
  );
};

/**
 * Searchable vendor picker. Deliberately rendered inline rather than through a
 * Radix Popover — a portalled popover lands outside the Dialog's focus trap and
 * gets swallowed by it.
 */
const VendorPicker: React.FC<{
  id: string;
  value: string;
  onChange: (vendorId: string) => void;
  options: { value: string; label: string; sub?: string }[];
  isLoading?: boolean;
}> = ({ id, value, onChange, options, isLoading }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 60);
    return options
      .filter((o) => `${o.label} ${o.sub ?? ""}`.toLowerCase().includes(q))
      .slice(0, 60);
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setQuery("");
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(INPUT, "flex items-center justify-between gap-2 text-left")}
      >
        <span className={cn("truncate", !selected && "text-app-fg-subtle")}>
          {selected ? selected.label : isLoading ? "Loading vendors…" : "No vendor assigned"}
        </span>
        <ChevronDown size={15} className="shrink-0 text-app-fg-subtle" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-30 top-[calc(100%+4px)] left-0 right-0 rounded-xl border border-app-border bg-app-surface overflow-hidden",
            ELEV_3,
          )}
        >
          <div className="flex items-center gap-2 px-3 border-b border-app-border">
            <Search size={14} className="shrink-0 text-app-fg-subtle" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
              placeholder="Search vendors…"
              className="flex-1 h-9 bg-transparent text-[13px] text-app-fg placeholder:text-app-fg-subtle outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto p-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between gap-2 w-full px-2.5 py-2 rounded-lg text-left text-[13px] text-app-fg-muted hover:bg-app-surface-2",
                )}
              >
                No vendor assigned
                {!value && <Check size={14} className="text-app-accent" />}
              </button>
            </li>
            {results.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between gap-2 w-full px-2.5 py-2 rounded-lg text-left hover:bg-app-surface-2"
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-app-fg truncate">
                      {o.label}
                    </span>
                    {o.sub && (
                      <span className="block text-[11.5px] text-app-fg-subtle truncate tabular-nums">
                        {o.sub}
                      </span>
                    )}
                  </span>
                  {o.value === value && <Check size={14} className="shrink-0 text-app-accent" />}
                </button>
              </li>
            ))}
            {!results.length && (
              <li className="px-2.5 py-6 text-center text-[12.5px] text-app-fg-muted">
                No vendor matches “{query}”.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

/** Cover / gallery drop target. */
const DropZone: React.FC<{
  onFiles: (files: File[]) => void;
  className?: string;
  children: React.ReactNode;
  label: string;
  multiple?: boolean;
}> = ({ onFiles, className, children, label, multiple }) => {
  const [over, setOver] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files || []));
      }}
      className={cn(
        "relative grid place-items-center cursor-pointer rounded-xl border-2 border-dashed transition-colors",
        over
          ? "border-app-accent bg-app-accent-soft"
          : "border-app-border bg-app-surface-2 hover:border-app-fg-subtle/50",
        className,
      )}
    >
      {children}
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        aria-label={label}
        onChange={(e) => {
          onFiles(Array.from(e.target.files || []));
          e.target.value = "";
        }}
      />
    </label>
  );
};

/* ── Component ────────────────────────────────────────────────────────────── */
const ManagementForm: React.FC<ManagementFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const isEdit = !!initialData;

  const [formData, setFormData] = useState<Offer>(() => buildInitial(initialData));
  /* The snapshot the dirty count is measured against. Same normalisation as the
     form state, so simply opening a record is never "1 unsaved change". */
  const [baseline, setBaseline] = useState<Offer>(() => buildInitial(initialData));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTIONS[0].key);
  const [askDiscard, setAskDiscard] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const { query: vendorQuery } = useVendorDirectory();

  useEffect(() => {
    if (!isOpen) return;
    const next = buildInitial(initialData);
    setFormData(next);
    setBaseline(next);
    setTouched({});
    setSubmitAttempted(false);
    setShowAllFields(false);
    setAskDiscard(false);
    setActiveSection(SECTIONS[0].key);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [initialData, isOpen]);

  /* ── Derived ── */
  const kind: Kind | null = serviceTypeOf(formData as any);

  /* Categories come from the same CMS rows the vendor wizards offer, narrowed
     to the chosen service type. They used to be five hard-coded strings —
     "Camper Van", "Unique Stay", "Activity" and two caravan types — so a stay
     listed under "Villas" opened with an empty required Category, and the only
     way to satisfy it was to overwrite the real category with the words
     "Unique Stay". */
  const catalog = useOfferingCatalog();
  const categoryOptions = useMemo(() => {
    const fromCms = kind ? catalog.categories[kind] || [] : [];
    const current = String(formData.category || "").trim();
    if (current && !fromCms.some((c) => c.toLowerCase() === current.toLowerCase())) {
      // Keep a legacy or since-renamed category selectable, or opening the form
      // would silently reset it.
      return [current, ...fromCms];
    }
    return fromCms;
  }, [catalog.categories, kind, formData.category]);

  const vendorOptions = useMemo(() => {
    const list = (vendorQuery.data ?? [])
      .filter((v) => v.vendorId)
      .map((v) => ({
        value: String(v.vendorId),
        label: v.brandName || v.personName || String(v.vendorId),
        sub: String(v.vendorId),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    /* An existing listing can point at a vendor the directory no longer returns
       (deleted, or a different status page). Without this the picker would show
       "No vendor assigned" and quietly clear the association on save. */
    const current = String(formData.vendorId || "");
    if (current && !list.some((o) => o.value === current)) {
      list.unshift({ value: current, label: current, sub: "Not in the vendor directory" });
    }
    return list;
  }, [vendorQuery.data, formData.vendorId]);

  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    VALIDATED_FIELDS.forEach((name) => {
      const message = validateField(name, formData);
      if (message) out[name] = message;
    });
    return out;
  }, [formData]);

  const errorFor = (name: string) => (touched[name] || submitAttempted ? errors[name] : undefined);

  /* A field belongs on screen if it suits the chosen category, if the operator
     asked for everything, or if it already holds a value — the last clause is
     what stops an edit from hiding data the record actually has. */
  const hasValue = useCallback(
    (name: string) => {
      const v = formData[name];
      if (Array.isArray(v)) return v.length > 0;
      return v !== "" && v !== undefined && v !== null;
    },
    [formData],
  );

  const isFieldVisible = useCallback(
    (f: FieldSpec) => {
      if (!f.only || !kind || showAllFields) return true;
      return f.only.includes(kind) || hasValue(f.name);
    },
    [kind, showAllFields, hasValue],
  );

  /* The body already drops a section whose fields are all irrelevant, but both
     rails were built from SECTIONS directly — so a stay listed "Vehicle" and
     "Rental rates" and clicking either scrolled to nothing. */
  const visibleSections = useMemo(
    () =>
      SECTIONS.filter((s) => {
        if (s.onlyKinds && kind && !showAllFields && !s.onlyKinds.includes(kind)) return false;
        return s.custom || (s.fields ?? []).some(isFieldVisible);
      }),
    [isFieldVisible],
  );

  const hiddenCount = useMemo(() => {
    if (!kind) return 0;
    return SECTIONS.flatMap((s) => s.fields ?? []).filter(
      (f) => f.only && !f.only.includes(kind) && !hasValue(f.name),
    ).length;
  }, [kind, hasValue]);

  const changedKeys = useMemo(() => {
    const keys = new Set([...Object.keys(baseline), ...Object.keys(formData)]);
    const out: string[] = [];
    keys.forEach((k) => {
      if (k === "_id") return;
      if (JSON.stringify(baseline[k] ?? "") !== JSON.stringify(formData[k] ?? "")) out.push(k);
    });
    return out;
  }, [baseline, formData]);

  const isDirty = changedKeys.length > 0;

  /* Per-section error badge — an operator scrolled to Photos shouldn't have to
     hunt for the one empty required field three sections up. */
  const sectionErrorCount = useMemo(() => {
    const out: Record<string, number> = {};
    SECTIONS.forEach((s) => {
      out[s.key] = (s.fields ?? []).filter(
        (f) => errors[f.name] && (touched[f.name] || submitAttempted),
      ).length;
    });
    return out;
  }, [errors, touched, submitAttempted]);

  /* ── Scroll spy ──
     Measured with rects rather than offsetTop: the sections' offsetParent is
     the (fixed) dialog, not the scroll container, so offsetTop carries the
     header's height and the rail lags a whole section behind. */
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const line = container.getBoundingClientRect().top + 96;
    let current = SECTIONS[0].key;
    for (const s of SECTIONS) {
      const el = sectionRefs.current[s.key];
      if (el && el.getBoundingClientRect().top <= line) current = s.key;
    }
    setActiveSection(current);
  }, []);

  const goToSection = (key: string) => {
    const el = sectionRefs.current[key];
    const container = scrollRef.current;
    if (!el || !container) return;
    const delta = el.getBoundingClientRect().top - container.getBoundingClientRect().top;
    container.scrollTo({
      top: Math.max(0, container.scrollTop + delta - 12),
      behavior: "smooth",
    });
    setActiveSection(key);
  };

  /* ── Change handlers ── */
  const setValue = (name: string, value: any) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const markTouched = (name: string) => setTouched((prev) => ({ ...prev, [name]: true }));

  const handleDiscountChange = (slot: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      discounts: {
        ...(prev.discounts || {}),
        [slot]: { ...(prev.discounts?.[slot] || {}), [field]: value },
      },
    }));
  };

  /* ── Photos ── */
  const acceptImages = (files: File[]) =>
    files.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(`"${f.name}" isn't an image.`);
        return false;
      }
      if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
        toast.error(`"${f.name}" is over ${MAX_IMAGE_MB} MB.`);
        return false;
      }
      return true;
    });

  const handleCoverFiles = async (files: File[]) => {
    const [file] = acceptImages(files);
    if (!file) return;
    const url = await readFileAsDataUrl(file);
    setFormData((prev) => ({ ...prev, photos: { ...(prev.photos || {}), coverUrl: url } }));
  };

  /** Same data-URL path the cover and gallery use; the server normalises it. */
  const handleRoomPhotos = async (files: FileList | null) => {
    const accepted = acceptImages(Array.from(files || []));
    if (!accepted.length) return [];
    return Promise.all(accepted.map(readFileAsDataUrl));
  };

  const handleGalleryFiles = async (files: File[]) => {
    const accepted = acceptImages(files);
    if (!accepted.length) return;
    const urls = await Promise.all(accepted.map(readFileAsDataUrl));
    setFormData((prev) => ({
      ...prev,
      photos: {
        ...(prev.photos || {}),
        galleryUrls: [...(prev.photos?.galleryUrls || []), ...urls],
      },
    }));
  };

  const removeCover = () =>
    setFormData((prev) => ({ ...prev, photos: { ...(prev.photos || {}), coverUrl: "" } }));

  const removeGalleryImage = (index: number) =>
    setFormData((prev) => {
      const gallery = [...(prev.photos?.galleryUrls || [])];
      gallery.splice(index, 1);
      return { ...prev, photos: { ...(prev.photos || {}), galleryUrls: gallery } };
    });

  /* Promote a gallery shot to cover, pushing the old cover back into the
     gallery so nothing is lost by the swap. */
  const promoteToCover = (index: number) =>
    setFormData((prev) => {
      const gallery = [...(prev.photos?.galleryUrls || [])];
      const [picked] = gallery.splice(index, 1);
      const previous = prev.photos?.coverUrl;
      if (previous) gallery.unshift(previous);
      return {
        ...prev,
        photos: { ...(prev.photos || {}), coverUrl: picked, galleryUrls: gallery },
      };
    });

  /* ── Close / submit ── */
  const requestClose = () => {
    if (isDirty && !isLoading) setAskDiscard(true);
    else onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const firstError = VALIDATED_FIELDS.find((name) => errors[name]);
    if (firstError) {
      const section = SECTIONS.find((s) => (s.fields ?? []).some((f) => f.name === firstError));
      if (section) goToSection(section.key);
      // After the smooth scroll settles, put the caret in the offending field.
      window.setTimeout(() => document.getElementById(fieldId(firstError))?.focus(), 320);
      toast.error(
        Object.keys(errors).length === 1
          ? "One field needs attention before this can be saved."
          : `${Object.keys(errors).length} fields need attention before this can be saved.`,
      );
      return;
    }

    const processed = serializeOfferingValues(formData, baseline);
    if (!processed.vendorId) delete processed.vendorId;

    onSubmit(processed);
  };

  /* ── Field renderer ── */
  const renderField = (f: FieldSpec) => {
    const id = fieldId(f.name);
    const error = errorFor(f.name);
    const describedBy = error ? `${id}-error` : undefined;
    const wide = f.wide || f.control === "textarea" || f.control === "tags";

    const body = () => {
      switch (f.control) {
        case "vendor":
          return (
            <VendorPicker
              id={id}
              value={String(formData.vendorId || "")}
              onChange={(v) => setValue("vendorId", v)}
              options={vendorOptions}
              isLoading={vendorQuery.isLoading}
            />
          );

        case "category":
          return (
            <Select
              value={formData.category || undefined}
              onValueChange={(v) => {
                setValue("category", v);
                markTouched("category");
              }}
            >
              <SelectTrigger
                id={id}
                aria-invalid={!!error}
                aria-describedby={describedBy}
                className={cn(INPUT, error && "border-red-400")}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent style={PORTAL_VARS}>
                {categoryOptions.length === 0 ? (
                  <SelectGroup>
                    <SelectLabel className="text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-subtle">
                      {kind ? "No categories configured" : "Pick a service type first"}
                    </SelectLabel>
                  </SelectGroup>
                ) : (
                  categoryOptions.map((name) => (
                    <SelectItem key={name} value={name} className={SELECT_ITEM}>
                      {name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          );

        case "serviceType":
          return (
            <Select
              value={(formData.serviceType as string) || undefined}
              onValueChange={(v) => {
                setValue("serviceType", v);
                markTouched("serviceType");
              }}
            >
              <SelectTrigger
                id={id}
                aria-invalid={!!error}
                aria-describedby={describedBy}
                className={cn(INPUT, error && "border-red-400")}
              >
                <SelectValue placeholder="Select a service type" />
              </SelectTrigger>
              <SelectContent style={PORTAL_VARS}>
                {SERVICE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className={SELECT_ITEM}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case "select":
          return (
            <Select
              value={(formData[f.name] as string) || undefined}
              onValueChange={(v) => {
                setValue(f.name, v);
                markTouched(f.name);
              }}
            >
              <SelectTrigger
                id={id}
                aria-invalid={!!error}
                aria-describedby={describedBy}
                className={cn(INPUT, error && "border-red-400")}
              >
                <SelectValue placeholder={f.placeholder || "Select"} />
              </SelectTrigger>
              <SelectContent style={PORTAL_VARS}>
                {(f.options ?? []).map((o) => (
                  <SelectItem key={o.value} value={o.value} className={SELECT_ITEM}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case "switch":
          return (
            <span className="flex h-[42px] items-center">
              <Switch
                id={id}
                checked={!!formData[f.name]}
                onCheckedChange={(v) => setValue(f.name, v)}
              />
            </span>
          );

        case "tags":
          return (
            <TagInput
              id={id}
              value={Array.isArray(formData[f.name]) ? (formData[f.name] as string[]) : []}
              onChange={(next) => setValue(f.name, next)}
              placeholder={f.placeholder || "Type and press Enter"}
            />
          );

        case "textarea":
          return (
            <textarea
              id={id}
              name={f.name}
              value={(formData[f.name] as string) ?? ""}
              onChange={(e) => setValue(f.name, e.target.value)}
              onBlur={() => markTouched(f.name)}
              placeholder={f.placeholder}
              aria-invalid={!!error}
              aria-describedby={describedBy}
              rows={f.name === "description" ? 4 : 2}
              className={cn(
                TEXTAREA,
                error && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
              )}
            />
          );

        default:
          return (
            <div className="relative">
              {f.prefix && (
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13.5px] text-app-fg-subtle pointer-events-none">
                  {f.prefix}
                </span>
              )}
              <input
                id={id}
                name={f.name}
                type={
                  f.control === "number" ? "number" : f.control === "time" ? "time" : "text"
                }
                inputMode={f.control === "number" ? "numeric" : undefined}
                min={f.control === "number" ? 0 : undefined}
                value={(formData[f.name] as any) ?? ""}
                onChange={(e) => setValue(f.name, e.target.value)}
                onBlur={() => markTouched(f.name)}
                placeholder={f.placeholder}
                aria-invalid={!!error}
                aria-describedby={describedBy}
                className={cn(
                  INPUT,
                  f.prefix && "pl-7",
                  error && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
                )}
              />
            </div>
          );
      }
    };

    return (
      <Field
        key={f.name}
        label={f.label}
        htmlFor={id}
        required={f.required}
        help={f.help}
        error={error}
        className={wide ? "md:col-span-full" : undefined}
      >
        {body()}
      </Field>
    );
  };

  /* ── Photos section ── */
  const gallery = formData.photos?.galleryUrls || [];
  const renderPhotos = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,320px)_1fr] gap-5">
        <div className="space-y-1.5">
          <span className={LABEL}>Cover photo</span>
          {formData.photos?.coverUrl ? (
            <div className="group relative aspect-[16/10] rounded-xl overflow-hidden border border-app-border">
              <img
                src={getImageUrl(formData.photos.coverUrl)}
                alt="Listing cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-end justify-end gap-1.5 p-2 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={removeCover}
                  className={cn(BTN_NEUTRAL, BTN_SM)}
                  aria-label="Remove cover photo"
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <DropZone
              onFiles={handleCoverFiles}
              label="Upload cover photo"
              className="aspect-[16/10]"
            >
              <div className="flex flex-col items-center gap-1.5 text-center px-4">
                <Upload size={18} className="text-app-fg-subtle" />
                <span className="text-[12.5px] font-semibold text-app-fg">
                  Drop an image or browse
                </span>
                <span className="text-[11.5px] text-app-fg-muted">
                  Landscape, up to {MAX_IMAGE_MB} MB
                </span>
              </div>
            </DropZone>
          )}
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className={LABEL}>Gallery</span>
            <span className="text-[11.5px] tabular-nums text-app-fg-muted">
              {gallery.length} image{gallery.length === 1 ? "" : "s"}
            </span>
          </div>
          {/* One lonely square tile next to the big cover reads as a rendering
              fault. With nothing uploaded yet the gallery takes the full column
              and says what it's for. */}
          {!gallery.length ? (
            <DropZone
              onFiles={handleGalleryFiles}
              multiple
              label="Add gallery photos"
              className="flex-1 min-h-[140px]"
            >
              <div className="flex flex-col items-center gap-1.5 text-center px-4">
                <Upload size={17} className="text-app-fg-subtle" />
                <span className="text-[12.5px] font-semibold text-app-fg">
                  Drop images or browse
                </span>
                <span className="text-[11.5px] text-app-fg-muted">
                  Several at a time. Any one of them can be promoted to cover.
                </span>
              </div>
            </DropZone>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {gallery.map((img, i) => (
                <div
                  key={`${img.slice(0, 24)}-${i}`}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-app-border"
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`Gallery image ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => promoteToCover(i)}
                      className="px-2 h-6 rounded-md bg-white/95 text-[10.5px] font-semibold text-slate-900 hover:bg-white"
                    >
                      Set as cover
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(i)}
                      aria-label={`Remove gallery image ${i + 1}`}
                      className="px-2 h-6 rounded-md bg-red-600/95 text-[10.5px] font-semibold text-white hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <DropZone
                onFiles={handleGalleryFiles}
                multiple
                label="Add gallery photos"
                className="aspect-square"
              >
                <div className="flex flex-col items-center gap-1 text-app-fg-subtle">
                  <Upload size={16} />
                  <span className="text-[11px] font-medium">Add</span>
                </div>
              </DropZone>
            </div>
          )}
        </div>
      </div>

      {!formData.photos?.coverUrl && (
        <p className="flex items-start gap-2 text-[12px] text-app-fg-muted">
          <ImageIcon size={13} className="mt-px shrink-0" />
          Without a cover, the listing falls back to the first gallery image on the public site.
        </p>
      )}
    </div>
  );

  /* ── Discounts section ── */
  const renderDiscounts = () => {
    const regular = Number(formData.regularPrice);
    return (
      <div className="space-y-2.5">
        {DISCOUNT_SLOTS.map(({ key, label, blurb }) => {
          const disc = (formData.discounts as any)?.[key] || {};
          const enabled = !!disc.enabled;
          const type = disc.type || "percentage";
          const raw = Number(disc.value);
          /* Offered rather than written: computing into the field on every
             keystroke would clobber a figure the operator typed deliberately. */
          const suggested =
            Number.isFinite(regular) && regular > 0 && Number.isFinite(raw) && raw > 0
              ? Math.max(
                  0,
                  Math.round(type === "fixed" ? regular - raw : regular * (1 - raw / 100)),
                )
              : null;

          return (
            <div
              key={key}
              className={cn(
                "rounded-xl border transition-colors",
                enabled ? "border-app-accent/30 bg-app-accent-soft" : "border-app-border",
              )}
            >
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-app-fg">{label}</p>
                  <p className="text-[11.5px] text-app-fg-muted truncate">{blurb}</p>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(v) => handleDiscountChange(key, "enabled", v)}
                  aria-label={`Enable the ${label} discount`}
                />
              </div>

              {enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-3.5 pb-3.5 pt-1">
                  <div className="space-y-1">
                    {/* Same wrapper on all three labels — the "Use ₹x" slot on
                        the third one otherwise pushes only that input out of
                        line with its neighbours. */}
                    <div className="flex items-baseline justify-between gap-2 min-h-[17px]">
                      <span className="text-[11.5px] font-medium text-app-fg-muted">Type</span>
                    </div>
                    <Select
                      value={type}
                      onValueChange={(v) => handleDiscountChange(key, "type", v)}
                    >
                      <SelectTrigger className={INPUT_SM} aria-label={`${label} discount type`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={PORTAL_VARS}>
                        <SelectItem value="percentage" className={SELECT_ITEM}>
                          Percentage
                        </SelectItem>
                        <SelectItem value="fixed" className={SELECT_ITEM}>
                          Fixed amount
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2 min-h-[17px]">
                      <span className="text-[11.5px] font-medium text-app-fg-muted">Value</span>
                    </div>
                    <input
                      value={disc.value || ""}
                      onChange={(e) => handleDiscountChange(key, "value", e.target.value)}
                      className={INPUT_SM}
                      aria-label={`${label} discount value`}
                      placeholder={type === "fixed" ? "₹ off" : "% off"}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2 min-h-[17px]">
                      <span className="text-[11.5px] font-medium text-app-fg-muted">
                        Final price
                      </span>
                      {suggested !== null &&
                        String(disc.finalPrice || "") !== String(suggested) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDiscountChange(key, "finalPrice", String(suggested))
                            }
                            className="text-[11px] font-semibold text-app-accent hover:underline"
                          >
                            Use {formatINR(suggested)}
                          </button>
                        )}
                    </div>
                    <input
                      value={disc.finalPrice || ""}
                      onChange={(e) => handleDiscountChange(key, "finalPrice", e.target.value)}
                      className={INPUT_SM}
                      aria-label={`${label} final price`}
                      placeholder="₹ final"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && requestClose()}>
      <DialogContent
        style={PORTAL_VARS}
        onOpenAutoFocus={(e) => {
          // Radix would land on the first section-nav button; the first thing
          // anyone wants to type is the vendor/name, not to navigate.
          e.preventDefault();
          document.getElementById(fieldId("name"))?.focus();
        }}
        className={cn(
          "max-w-[1060px] w-[calc(100vw-1.5rem)] p-0 gap-0 rounded-[14px] overflow-hidden",
          "h-[min(90vh,900px)] flex flex-col bg-app-surface",
        )}
      >
        {/* ── Header ── */}
        <header className="shrink-0 flex items-start gap-3 px-5 py-3.5 pr-14 border-b border-app-border">
          <span className="grid place-items-center w-9 h-9 rounded-[10px] bg-app-accent-soft text-app-accent shrink-0">
            <Store size={17} strokeWidth={2.1} />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-[15px] font-bold tracking-[-0.01em] text-app-fg">
              {isEdit ? "Edit listing" : "Create listing"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-[12.5px] text-app-fg-muted truncate">
              {isEdit
                ? formData.name || "Untitled listing"
                : "New listings are saved as pending and appear in the review queue."}
            </DialogDescription>
          </div>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllFields((v) => !v)}
              className={cn(BTN_GHOST, BTN_SM, "hidden sm:inline-flex shrink-0")}
            >
              {showAllFields ? "Show relevant fields" : `Show all fields (+${hiddenCount})`}
            </button>
          )}
        </header>

        {/* ── Body ── */}
        <div className="flex-1 min-h-0 flex">
          {/* Section rail — doubles as a progress map and an error map. */}
          <nav
            aria-label="Form sections"
            className="hidden md:flex flex-col gap-0.5 w-[204px] shrink-0 p-3 border-r border-app-border bg-app-surface-2/50 overflow-y-auto"
          >
            {visibleSections.map((s) => {
              const active = s.key === activeSection;
              const errs = sectionErrorCount[s.key] ?? 0;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => goToSection(s.key)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-left transition-colors",
                    FOCUS_RING,
                    active
                      ? "bg-app-surface text-app-accent shadow-[0_1px_2px_rgba(18,25,38,0.06)]"
                      : "text-app-fg-muted hover:bg-app-surface/70 hover:text-app-fg",
                  )}
                >
                  <s.icon size={15} strokeWidth={2} className="shrink-0" />
                  <span className="flex-1 text-[13px] font-medium truncate">{s.label}</span>
                  {errs > 0 && (
                    <span
                      className="grid place-items-center min-w-[17px] h-[17px] px-1 rounded-full bg-red-100 text-[10px] font-bold text-red-600 tabular-nums"
                      title={`${errs} field${errs === 1 ? "" : "s"} need attention`}
                    >
                      {errs}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 min-w-0 overflow-y-auto overscroll-contain"
          >
            {/* Mobile equivalent of the rail. */}
            <div className="md:hidden sticky top-0 z-10 flex gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide border-b border-app-border bg-app-surface/95 backdrop-blur">
              {visibleSections.map((s) => {
                const errs = sectionErrorCount[s.key] ?? 0;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => goToSection(s.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-3 rounded-full whitespace-nowrap shrink-0 text-[12px] font-semibold transition-colors",
                      s.key === activeSection
                        ? "bg-app-accent-soft text-app-accent"
                        : "bg-app-surface-2 text-app-fg-muted",
                    )}
                  >
                    {s.label}
                    {errs > 0 && (
                      <span className="grid place-items-center min-w-[16px] h-4 px-1 rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                        {errs}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <form
              id="management-listing-form"
              onSubmit={handleSubmit}
              noValidate
              className="px-4 py-5 md:px-6 md:py-6 space-y-7"
            >
              {SECTIONS.map((s) => {
                const fields = (s.fields ?? []).filter(isFieldVisible);
                // A category-specific section with nothing to show is noise —
                // "Capacity" with zero fields reads as a broken form.
                if (!s.custom && !fields.length) return null;
                return (
                  <section
                    key={s.key}
                    ref={(el) => {
                      sectionRefs.current[s.key] = el;
                    }}
                    aria-labelledby={`section-${s.key}`}
                    className="scroll-mt-4"
                  >
                    <div className="flex items-baseline gap-2.5 pb-3 mb-4 border-b border-app-border">
                      <h3
                        id={`section-${s.key}`}
                        className="text-[13.5px] font-bold tracking-[-0.01em] text-app-fg"
                      >
                        {s.label}
                      </h3>
                      <p className="text-[12px] text-app-fg-muted truncate">{s.blurb}</p>
                    </div>

                    {s.custom === "photos" ? (
                      renderPhotos()
                    ) : s.custom === "discounts" ? (
                      renderDiscounts()
                    ) : s.custom === "rooms" ? (
                      <RoomsEditor
                        rooms={(formData.rooms as any) || []}
                        onChange={(rooms) => setValue("rooms", rooms)}
                        onUploadPhotos={handleRoomPhotos}
                        perRoomPricing={formData.stayType === "individual"}
                      />
                    ) : (
                      <div
                        className={cn(
                          "grid grid-cols-1 gap-x-5 gap-y-4",
                          s.cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
                        )}
                      >
                        {fields.map(renderField)}
                      </div>
                    )}
                  </section>
                );
              })}

              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllFields((v) => !v)}
                  className={cn(BTN_GHOST, BTN_SM, "sm:hidden w-full")}
                >
                  {showAllFields ? "Show relevant fields" : `Show all fields (+${hiddenCount})`}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* ── Footer save bar ── */}
        <footer className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-t border-app-border bg-app-surface-2/60">
          <p className="text-[12.5px] text-app-fg-muted min-w-0 truncate" aria-live="polite">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-app-accent" aria-hidden />
                {changedKeys.length} unsaved change{changedKeys.length === 1 ? "" : "s"}
              </span>
            ) : isEdit ? (
              "No changes yet"
            ) : (
              "Saved as pending for review"
            )}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={requestClose} className={BTN_NEUTRAL}>
              Cancel
            </button>
            <button
              type="submit"
              form="management-listing-form"
              disabled={isLoading || (isEdit && !isDirty)}
              className={BTN_PRIMARY}
            >
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {isLoading ? "Saving…" : isEdit ? "Save changes" : "Create listing"}
            </button>
          </div>
        </footer>

        {/* Discard guard. Rendered inside the dialog rather than as a second
            Radix dialog — nesting two focus traps is what makes the Escape key
            close the wrong one. */}
        {askDiscard && (
          <div className="absolute inset-0 z-40 grid place-items-center p-6 bg-slate-950/40 backdrop-blur-[2px]">
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="discard-title"
              className={cn(
                "w-full max-w-[380px] rounded-[14px] border border-app-border bg-app-surface p-5",
                ELEV_3,
              )}
            >
              <h4 id="discard-title" className="text-[14.5px] font-bold text-app-fg">
                Discard your changes?
              </h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-app-fg-muted">
                {changedKeys.length} change{changedKeys.length === 1 ? "" : "s"} to this listing
                {changedKeys.length === 1 ? " hasn't" : " haven't"} been saved. Closing now loses
                {changedKeys.length === 1 ? " it" : " them"}.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setAskDiscard(false)}
                  className={BTN_NEUTRAL}
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAskDiscard(false);
                    onClose();
                  }}
                  className={cn(BTN_PRIMARY, "bg-red-600 hover:bg-red-700")}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManagementForm;
