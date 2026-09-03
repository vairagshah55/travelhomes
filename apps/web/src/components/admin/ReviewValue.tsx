import React from "react";
import { ExternalLink } from "lucide-react";
import { getImageUrl } from "@/lib/adminUtils";
import { cn } from "@/lib/utils";
import { DetailList } from "./AdminDetailDrawer";
import { humanizeKey, isPresent, classifyValue, type ReviewField } from "./listingReview";

/**
 * Renders an arbitrary vendor-submitted value.
 *
 * The approval drawer lays out the fields worth designing by hand, and hands
 * everything else here. That is what makes "no field disappears silently" hold
 * as the wizards grow: an unrecognised key still gets a readable presentation
 * rather than being dropped or dumped as raw JSON.
 *
 * Nothing here is service-specific — it dispatches on the SHAPE of the value,
 * so it works the same for a caravan's booleans and a stay's array of rooms.
 */

/** "Yes" / "No" as a pill — a bare "false" reads as missing data. */
const BoolPill = ({ value }: { value: boolean }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
      value
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        : "bg-app-surface-2 text-app-fg-subtle",
    )}
  >
    {value ? "Yes" : "No"}
  </span>
);

const DateText = ({ value }: { value: string | Date }) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return <>{String(value)}</>;
  // UTC: these are calendar dates (date inputs), not instants — rendering them
  // in the viewer's zone shifts a birthday by a day either side of midnight.
  return <>{d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</>;
};

const isImage = (v: string) =>
  /\.(jpe?g|png|webp|gif|avif)($|\?)/i.test(v) || v.startsWith("data:image/");

const LinkOrImage = ({ value }: { value: string }) => {
  const href = getImageUrl(value);
  if (isImage(value)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block">
        <img
          src={href}
          alt=""
          loading="lazy"
          className="h-16 w-24 rounded-lg border border-app-border object-cover"
        />
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-app-accent hover:underline break-all"
    >
      {value.length > 60 ? `${value.slice(0, 60)}…` : value}
      <ExternalLink size={11} className="shrink-0" />
    </a>
  );
};

/**
 * An array of objects — a stay's `rooms`, a price breakdown. One bordered card
 * per entry with its own label/value pairs, which stays readable at three
 * fields or fifteen. A table would need a column union across entries that
 * disagree about their keys.
 */
const ObjectList = ({ items }: { items: Record<string, unknown>[] }) => (
  <div className="col-span-full grid gap-2.5 sm:grid-cols-2">
    {items.map((item, i) => {
      const entries = Object.entries(item).filter(
        ([k, v]) => isPresent(v) && !["_id", "id", "__v"].includes(k),
      );
      if (!entries.length) return null;
      return (
        <div
          key={i}
          className="rounded-lg border border-app-border bg-app-surface-2/50 px-3.5 py-3"
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-app-fg-subtle">
            {String(item.name || item.title || `Item ${i + 1}`)}
          </p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
            {entries
              .filter(([k]) => !["name", "title"].includes(k))
              .map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-[10.5px] text-app-fg-subtle">{humanizeKey(k)}</dt>
                  <dd className="text-[12.5px] font-medium text-app-fg break-words">
                    <ReviewValue value={v} />
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      );
    })}
  </div>
);

/** A plain nested object — `policies`, `pricing`, `customFields`. */
const NestedObject = ({ value }: { value: Record<string, unknown> }) => {
  const entries = Object.entries(value).filter(
    ([k, v]) => isPresent(v) && !["_id", "id", "__v"].includes(k),
  );
  if (!entries.length) return <span className="text-app-fg-subtle">—</span>;
  return (
    <dl className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-[10.5px] text-app-fg-subtle">{humanizeKey(k)}</dt>
          <dd className="text-[12.5px] font-medium text-app-fg break-words">
            <ReviewValue value={v} />
          </dd>
        </div>
      ))}
    </dl>
  );
};

/** Dispatches on the value's shape. Recurses for nested structures. */
export const ReviewValue: React.FC<{ value: unknown }> = ({ value }) => {
  if (!isPresent(value)) return <span className="text-app-fg-subtle">Not provided</span>;

  switch (classifyValue(value)) {
    case "boolean":
      return <BoolPill value={value as boolean} />;
    case "date":
      return <DateText value={value as string | Date} />;
    case "number":
      return <span className="tabular-nums">{String(value)}</span>;
    case "url":
      return <LinkOrImage value={value as string} />;
    case "list": {
      const items = (value as unknown[]).map((v) => String(v)).filter(Boolean);
      // One value does not need a bulleted list around it.
      if (items.length === 1) return <>{items[0]}</>;
      return <DetailList items={items} className="col-span-1" />;
    }
    case "objectList":
      return <ObjectList items={value as Record<string, unknown>[]} />;
    case "object":
      return <NestedObject value={value as Record<string, unknown>} />;
    default:
      return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
  }
};

/**
 * One catch-all field. Wide shapes (lists, cards, nested grids) span the full
 * row; scalars sit in the normal two-up grid.
 */
export const ReviewExtraField: React.FC<{ field: ReviewField }> = ({ field }) => {
  const wide = field.kind === "objectList" || field.kind === "object" || field.kind === "list";
  return (
    <div className={wide ? "col-span-full" : "col-span-1"}>
      <dt className="mb-1 text-[11.5px] font-medium text-app-fg-subtle">{field.label}</dt>
      <dd className="text-[13.5px] font-medium leading-snug text-app-fg">
        <ReviewValue value={field.value} />
      </dd>
    </div>
  );
};

export default ReviewValue;
