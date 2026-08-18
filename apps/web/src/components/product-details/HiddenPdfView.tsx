import React from "react";
import { Mail, Phone } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { logoSrc } from "@/lib/brand";
import { formatINR } from "@/utils/formatCurrency";
import { PDF_PAGE_WIDTH } from "@/utils/pdfGenerator";

interface HiddenPdfViewProps {
  pdfRef: React.RefObject<HTMLDivElement>;
  stay: any;
  vendor: any;
  allReviews: Array<{ name: string; date: string; review: string }>;
  /** Page-local mapper from feature label to icon component. */
  getAmenityIcon: (name: string) => React.ComponentType<{ className?: string }>;
  /** Category label shown next to location. */
  categoryLabel: string;
  /** Price unit ("night" | "day" | "person"). */
  priceLabel: string;
}

/* ── Print palette ─────────────────────────────────────────────────────────
   Hardcoded hex, not tokens. This node is rasterised by html2canvas, so it has
   to render identically whether the site is in light or dark mode — a CSS
   variable that flips with the theme would put white text on white paper. */
const C = {
  ink: "#0F1E20", // near-black, warmed toward the brand teal
  deep: "#117479", // brand teal — the document's only accent
  cyan: "#3BD9DA", // logo cyan, hairlines on dark bands only
  paper: "#FFFFFF",
  wash: "#F1F7F7", // pale teal panel fill
  rule: "#D8E4E4",
  muted: "#5B6B6C",
  onDark: "#C3D6D7",
};

/* Only fonts that exist on every machine. The public site asks for "DM Sans"
   but never loads it, so a webfont here would silently fall back mid-render
   and reflow the capture. Georgia carries the editorial voice, the system sans
   carries the body, and the mono stack carries labels and reference codes. */
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS =
  '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
const MONO = '"JetBrains Mono", Consolas, "Courier New", monospace';

/** Gutter inside the full-bleed sheet. */
const PAD = 44;

/* ── Photo mosaic geometry ─────────────────────────────────────────────────
   210mm at 96dpi. Every frame below is sized in whole pixels off this number
   rather than in percentages: html2canvas resolves percentage heights inside a
   flex row inconsistently, and a half-pixel error shows up as a seam. */
const SHEET = 794;
const BAND_H = 339;
const GUTTER = 3;
const COVER_W = 486;

/** Uppercase tracked mono — the fact-sheet voice, used for every label. */
const label: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 8.5,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: C.muted,
};

const body: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.75,
  color: "#243A3B",
};

/** Tolerates the legacy comma-separated strings still in older documents. */
function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string")
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  return [];
}

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Label + hairline. The rule runs to the margin so short and long headings
    still line up as a column of section starts. */
function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
      <span style={{ ...label, color: C.deep, whiteSpace: "nowrap" }}>{title}</span>
      <span style={{ flex: 1, height: 1, background: C.rule, marginLeft: 14 }} />
    </div>
  );
}

/** `pdf-avoid` keeps html2pdf from slicing a section across a page boundary;
    the top padding doubles as the inset when one does get pushed to page 2. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pdf-avoid" style={{ paddingTop: 26 }}>
      <SectionHead title={title} />
      {children}
    </section>
  );
}

/**
 * Off-screen print replica of a product detail page, captured by html2pdf when
 * the user picks Share → Download PDF.
 *
 * Laid out as a document, not a web page: a full-bleed masthead, a hero, a rate
 * strip, then hairline-ruled sections down one column. The old two-column build
 * put the price and host in a sidebar that html2pdf clipped — see PDF_PAGE_WIDTH
 * for why anything wider than the page gets cut rather than scaled.
 */
export function HiddenPdfView({
  pdfRef,
  stay,
  vendor,
  allReviews,
  getAmenityIcon,
  categoryLabel,
  priceLabel,
}: HiddenPdfViewProps) {
  const features = toList(stay?.features);
  const rules = toList(stay?.rules);
  const includes = toList(stay?.priceIncludes);
  const excludes = toList(stay?.priceExcludes);

  const cover = getImageUrl(stay?.photos?.coverUrl || stay?.photos?.galleryUrls?.[0] || "");
  const rest = (stay?.photos?.galleryUrls || [])
    .map((u: string) => getImageUrl(u))
    .filter((u: string) => u && u !== cover);

  /* 1, 2 or 4 frames beside the cover — never 3, which would leave a hole in
     the second row. A 5th photo is dropped rather than shrunk further. */
  const side: string[] = rest.slice(0, rest.length >= 4 ? 4 : rest.length >= 2 ? 2 : 1);
  const sideCols = side.length === 4 ? 2 : 1;
  const sideRows = side.length === 1 ? 1 : 2;
  const sideW = side.length ? SHEET - COVER_W : 0;
  const tileW = Math.floor(sideW / sideCols) - GUTTER;
  const tileH = Math.floor((BAND_H - GUTTER * (sideRows - 1)) / sideRows);

  const regular = num(stay?.regularPrice);
  const discounted = num(stay?.finalPrice ?? stay?.discountPrice);
  const headline = discounted && regular && discounted < regular ? discounted : regular;

  /* Show the capacity fields this listing actually has rather than a fixed set —
     a camper van has berths and a activity has a duration, and blank cells in a
     rate strip read as missing data. */
  const facts = [
    { k: "Guests", v: stay?.guestCapacity },
    { k: "Group size", v: stay?.personCapacity },
    { k: "Seats", v: stay?.seatingCapacity },
    { k: "Sleeps", v: stay?.sleepingCapacity },
    { k: "Bedrooms", v: stay?.numberOfRooms },
    { k: "Beds", v: stay?.numberOfBeds },
    { k: "Bathrooms", v: stay?.numberOfBathrooms },
    { k: "Type", v: stay?.stayType },
    { k: "Duration", v: stay?.timeDuration },
  ]
    .filter((f) => f.v !== undefined && f.v !== null && String(f.v).trim() !== "")
    .slice(0, 4);

  const place = [stay?.city, stay?.state].filter(Boolean).join(", ");
  const ref = String(stay?._id || "")
    .slice(-8)
    .toUpperCase();
  const hostName = vendor?.brandName || vendor?.personName || "";

  return (
    <div style={{ display: "none" }}>
      <div
        ref={pdfRef}
        style={{
          width: PDF_PAGE_WIDTH,
          background: C.paper,
          color: C.ink,
          fontFamily: SANS,
          // html2canvas paints computed styles verbatim; without this a print
          // stylesheet or the browser's own colour adjustment could drop the
          // dark bands to white and take the reversed type with them.
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* ── Masthead ─────────────────────────────────────────────────── */}
        <div style={{ background: C.ink, padding: `26px ${PAD}px 24px` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid rgba(59,217,218,0.28)`,
              paddingBottom: 18,
            }}
          >
            <img
              src={logoSrc("horizontal", "white")}
              alt="TravelHomes"
              style={{ height: 24, width: 111, display: "block" }}
            />
            <div style={{ textAlign: "right" }}>
              <div style={{ ...label, color: C.cyan }}>Listing brief</div>
              {ref && (
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: C.onDark,
                    letterSpacing: "0.08em",
                    marginTop: 5,
                  }}
                >
                  REF {ref}
                </div>
              )}
            </div>
          </div>

          <h1
            style={{
              fontFamily: SERIF,
              fontSize: 33,
              fontWeight: 400,
              lineHeight: 1.14,
              color: C.paper,
              margin: "22px 0 0",
            }}
          >
            {stay?.name}
          </h1>

          <div
            style={{
              marginTop: 12,
              fontFamily: SANS,
              fontSize: 12,
              color: C.onDark,
              letterSpacing: "0.02em",
            }}
          >
            {place}
            {place && categoryLabel ? (
              <span style={{ color: "rgba(195,214,215,0.45)", padding: "0 10px" }}>|</span>
            ) : null}
            {categoryLabel && <span style={{ textTransform: "capitalize" }}>{categoryLabel}</span>}
          </div>
        </div>

        {/* ── Photo mosaic, full bleed ─────────────────────────────────────
            A wide cover beside a stack of frames rather than one letterbox
            strip: at 486x339 the cover sits near 3:2, so a portrait or square
            photo keeps its subject instead of being sliced through the middle. */}
        <div style={{ display: "flex", width: SHEET, height: BAND_H, overflow: "hidden" }}>
          <img
            src={cover}
            alt=""
            crossOrigin="anonymous"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              display: "block",
              flexShrink: 0,
              width: side.length ? COVER_W : SHEET,
              height: BAND_H,
              objectFit: "cover",
            }}
          />
          {side.length > 0 && (
            <div style={{ width: sideW, height: BAND_H, display: "flex", flexWrap: "wrap" }}>
              {side.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  crossOrigin="anonymous"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    display: "block",
                    flexShrink: 0,
                    width: tileW,
                    height: tileH,
                    objectFit: "cover",
                    marginLeft: GUTTER,
                    marginBottom: sideRows > 1 && i < sideCols ? GUTTER : 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Rate strip ───────────────────────────────────────────────── */}
        <div
          className="pdf-avoid"
          style={{
            background: C.wash,
            borderBottom: `1px solid ${C.rule}`,
            padding: `20px ${PAD}px 22px`,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div style={{ width: 210, flexShrink: 0 }}>
            <div style={label}>Starting from</div>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 32,
                lineHeight: 1.05,
                color: C.ink,
                marginTop: 8,
              }}
            >
              {headline ? formatINR(headline) : "On request"}
              {headline && (
                <span style={{ fontFamily: SANS, fontSize: 12, color: C.muted, fontWeight: 500 }}>
                  {" "}
                  / {priceLabel}
                </span>
              )}
            </div>
            {discounted && regular && discounted < regular && (
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  color: C.muted,
                  marginTop: 6,
                  textDecoration: "line-through",
                }}
              >
                {formatINR(regular)}
              </div>
            )}
          </div>

          {facts.map((f) => (
            <div
              key={f.k}
              style={{
                flex: 1,
                minWidth: 0,
                borderLeft: `1px solid ${C.rule}`,
                paddingLeft: 18,
                paddingBottom: 4,
              }}
            >
              <div style={label}>{f.k}</div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 16,
                  fontWeight: 600,
                  color: C.ink,
                  marginTop: 7,
                  textTransform: "capitalize",
                }}
              >
                {String(f.v)}
              </div>
            </div>
          ))}
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div style={{ padding: `2px ${PAD}px 28px` }}>
          {stay?.description && (
            <Section title="Overview">
              <div style={body} dangerouslySetInnerHTML={{ __html: stay.description }} />
            </Section>
          )}

          {features.length > 0 && (
            <Section title="Amenities">
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {features.map((f, i) => {
                  const Icon = getAmenityIcon(f);
                  return (
                    <div
                      key={i}
                      style={{
                        width: "50%",
                        display: "flex",
                        alignItems: "center",
                        paddingBottom: 11,
                        paddingRight: 16,
                        boxSizing: "border-box",
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span style={{ ...body, lineHeight: 1.4, marginLeft: 11 }}>{f}</span>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {(includes.length > 0 || excludes.length > 0) && (
            <Section title="What the rate covers">
              <div style={{ display: "flex" }}>
                {[
                  { heading: "Included", items: includes, mark: "+", tone: C.deep },
                  { heading: "Not included", items: excludes, mark: "—", tone: "#B23B3B" },
                ]
                  .filter((col) => col.items.length > 0)
                  .map((col, ci) => (
                    <div
                      key={col.heading}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingLeft: ci === 0 ? 0 : 24,
                        marginLeft: ci === 0 ? 0 : 24,
                        borderLeft: ci === 0 ? "none" : `1px solid ${C.rule}`,
                      }}
                    >
                      <div style={{ ...label, color: col.tone, marginBottom: 10 }}>
                        {col.heading}
                      </div>
                      {col.items.map((item, i) => (
                        <div key={i} style={{ display: "flex", paddingBottom: 7 }}>
                          <span
                            style={{
                              fontFamily: MONO,
                              fontSize: 11,
                              color: col.tone,
                              width: 14,
                              flexShrink: 0,
                            }}
                          >
                            {col.mark}
                          </span>
                          <span style={{ ...body, fontSize: 12.5, lineHeight: 1.5 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </Section>
          )}

          {rules.length > 0 && (
            <Section title="House rules">
              {rules.map((rule, i) => (
                <div key={i} style={{ display: "flex", paddingBottom: 8 }}>
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 5,
                      background: C.deep,
                      flexShrink: 0,
                      marginTop: 8,
                      marginRight: 13,
                    }}
                  />
                  <span style={{ ...body, fontSize: 12.5, lineHeight: 1.5 }}>{rule}</span>
                </div>
              ))}
            </Section>
          )}

          {allReviews.length > 0 && (
            <Section title="Guest reviews">
              {allReviews.slice(0, 3).map((r, i) => (
                <div
                  key={i}
                  className="pdf-avoid"
                  style={{
                    borderLeft: `2px solid ${C.cyan}`,
                    paddingLeft: 16,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ ...body, fontSize: 12.5, fontStyle: "italic", lineHeight: 1.6 }}>
                    {r.review}
                  </div>
                  <div style={{ ...label, marginTop: 8 }}>
                    {r.name}
                    {r.date ? ` · ${r.date}` : ""}
                  </div>
                </div>
              ))}
            </Section>
          )}
        </div>

        {/* ── Host colophon ────────────────────────────────────────────── */}
        {vendor && (
          <div
            className="pdf-avoid"
            style={{ background: C.ink, padding: `24px ${PAD}px`, display: "flex" }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 46,
                background: C.deep,
                color: C.paper,
                fontFamily: SERIF,
                fontSize: 21,
                lineHeight: "46px",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              {(hostName || "V")[0].toUpperCase()}
            </div>
            <div style={{ marginLeft: 18, flex: 1, minWidth: 0 }}>
              <div style={{ ...label, color: C.cyan }}>Hosted by</div>
              <div
                style={{
                  fontFamily: SERIF,
                  fontSize: 19,
                  color: C.paper,
                  marginTop: 5,
                  lineHeight: 1.2,
                }}
              >
                {hostName || "Verified host"}
              </div>
            </div>
            <div style={{ textAlign: "right", fontFamily: SANS, fontSize: 11.5, color: C.onDark }}>
              {vendor.email && (
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}
                >
                  <Mail className="w-3 h-3" />
                  <span style={{ marginLeft: 8 }}>{vendor.email}</span>
                </div>
              )}
              {vendor.phone && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    marginTop: 7,
                  }}
                >
                  <Phone className="w-3 h-3" />
                  <span style={{ marginLeft: 8 }}>{vendor.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HiddenPdfView;
