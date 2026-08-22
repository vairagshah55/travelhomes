import { useState } from "react";
import { Clock } from "lucide-react";

import { logoSrc } from "@/lib/brand";
import { cn, getImageUrl } from "@/lib/utils";

/**
 * Shared article pieces for /blogs and /blogsDetials.
 *
 * These types and components previously lived only in `pages/blogs/Blogs.tsx`,
 * and the detail page had its own parallel, worse versions — its related-post
 * cards passed `art.coverImage` straight to `<img src>` without `getImageUrl`,
 * so every uploaded cover (they're base64 data URLs) rendered broken there while
 * rendering fine on the index. One implementation now serves both.
 */

export type BlogDTO = {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  description?: string;
  content?: string;
  coverImage?: string;
  authorName?: string;
  authorImg?: string;
  authorRole?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: "draft" | "published";
  /* Per-article SEO, authored in the CMS Blogs tab. Read by /blogsDetials via
     `useDocumentMeta` — before that these were stored and never used. */
  metaTitle?: string;
  metaKeywords?: string;
  metaDescription?: string;
};

export type Article = {
  id: string;
  href: string;
  title: string;
  category: string;
  description: string;
  author: string;
  authorImg?: string;
  authorRole: string;
  image?: string;
  date?: Date;
  readMinutes: number;
};

export const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** ~200 wpm over the body copy, tags stripped. Always at least a minute. */
export function readingMinutes(html?: string, fallback?: string): number {
  const text = String(html || fallback || "").replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Tags stripped, entities decoded, whitespace collapsed. */
export function plainText(html?: string): string {
  const withoutTags = String(html || "").replace(/<[^>]*>/g, " ");
  /* A textarea decodes entities without executing anything it is handed. */
  let decoded = withoutTags;
  if (typeof document !== "undefined") {
    const scratch = document.createElement("textarea");
    scratch.innerHTML = withoutTags;
    decoded = scratch.value;
  }
  return decoded.replace(/\s+/g, " ").trim();
}

/**
 * Meta-description-length summary of a post body.
 *
 * Cut on the last word boundary before the limit, so the snippet doesn't end
 * mid-word — search engines render it verbatim.
 */
export function excerptFrom(html?: string, limit = 160): string {
  const text = plainText(html);
  if (text.length <= limit) return text;
  const clipped = text.slice(0, limit);
  const lastSpace = clipped.lastIndexOf(" ");
  const cut = lastSpace > limit * 0.6 ? clipped.slice(0, lastSpace) : clipped;
  return cut.trimEnd() + "…";
}

export function initialsOf(name?: string): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "TH";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function toArticle(b: BlogDTO): Article {
  const created = b.createdAt ? new Date(b.createdAt) : undefined;
  return {
    id: b._id,
    href: `/blogsDetials?slug=${b.slug}`,
    title: b.title,
    category: (b.category || "").trim() || "Journal",
    description: (b.description || "").trim(),
    author: (b.authorName || "").trim() || "TravelHomes",
    authorImg: b.authorImg,
    authorRole: (b.authorRole || "").trim(),
    image: b.coverImage,
    date: created && !Number.isNaN(created.getTime()) ? created : undefined,
    readMinutes: readingMinutes(b.content, b.description),
  };
}

/* ── Rich text ───────────────────────────────────────────────────────────── */

/** Attributes worth keeping. Everything else — including `style`, `class` and
    every `on*` handler — is dropped. */
const ALLOWED_ATTRS = new Set(["href", "src", "alt", "title", "colspan", "rowspan"]);
const BANNED_TAGS = ["script", "style", "iframe", "object", "embed", "link", "meta", "form", "input"];

/**
 * Prepare admin-authored blog HTML for rendering.
 *
 * Two problems, one pass:
 *
 * 1. **It wasn't being rendered at all.** The detail page put the content in a
 *    `<p className="whitespace-pre-line">`, so a post whose body is real HTML
 *    (`why-spoken-english-is-important-for-students` is 1,054 characters of
 *    `<span>`/`<br>`) displayed its markup as literal text to the reader. It
 *    also wrapped it in `prose`, but `@tailwindcss/typography` isn't installed
 *    here — that class has never done anything.
 *
 * 2. **The stored markup carries pasted inline styling** — `style="color:
 *    rgb(0,0,0); font-size: medium"` on nearly every span, from whatever editor
 *    the author drafted in. Left in, it overrides the page's own type scale and
 *    pins text to pure black regardless of surface. Stripping `style` hands
 *    typography back to the stylesheet.
 *
 * Dropping `style`, `class` and `on*` also removes the usual injection vectors,
 * which matters because `dangerouslySetInnerHTML` is how this has to render.
 * `DOMParser` does not execute anything it parses. Deliberately no new
 * dependency: `dompurify` is present in the tree but only transitively, and
 * relying on someone else's transitive dep is its own bug waiting to happen.
 */
export function sanitizeArticleHtml(html?: string): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return "";

  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.body.querySelectorAll(BANNED_TAGS.join(",")).forEach((el) => el.remove());

  doc.body.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (!ALLOWED_ATTRS.has(name)) {
        el.removeAttribute(attr.name);
        return;
      }
      // `javascript:` / `data:` URLs on href or src.
      if ((name === "href" || name === "src") && /^\s*(javascript|data):/i.test(attr.value)) {
        // Keep genuine inline images — covers are stored as base64 data URLs.
        if (!(name === "src" && /^\s*data:image\//i.test(attr.value))) {
          el.removeAttribute(attr.name);
        }
      }
    });
    if (el.tagName === "A") {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
  });

  return doc.body.innerHTML;
}

/** True when there's actually something to render after cleaning. */
export function hasReadableContent(html?: string): boolean {
  return String(html || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim().length > 0;
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

/**
 * Cover with a stable aspect ratio and a graceful failure. Uploaded covers are
 * base64 data URLs today and file paths tomorrow — `getImageUrl` handles both.
 * A missing or dead cover degrades to a branded placeholder rather than the
 * browser's broken-image glyph (the old fallback was `/blog1.jpg`, a file that
 * doesn't exist in the repo, so it swapped one broken image for another).
 */
export const Cover = ({
  src,
  alt,
  className,
  zoomOnHover = true,
}: {
  src?: string;
  alt: string;
  className?: string;
  zoomOnHover?: boolean;
}) => {
  const [failed, setFailed] = useState(false);
  const usable = !!getImageUrl(src) && !failed;

  if (!usable) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("grid h-full w-full place-items-center bg-th-surface-2", className)}
      >
        <img
          src={logoSrc("mark", "black")}
          alt=""
          aria-hidden
          draggable={false}
          className="h-10 w-10 opacity-15"
        />
      </div>
    );
  }

  return (
    <img
      src={getImageUrl(src)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        "h-full w-full object-cover",
        zoomOnHover &&
          "transition-transform duration-500 ease-th-out motion-safe:group-hover:scale-[1.04]",
        className,
      )}
    />
  );
};

/** `max-w` + truncate because categories are free text: one existing post is
    filed under "Olympiad Preparation Strategy", which wrapped the chip onto two
    lines and pushed the card's meta row out of alignment. */
export const CategoryChip = ({ label }: { label: string }) => (
  <span
    title={label}
    className="inline-flex max-w-[190px] items-center truncate rounded-th-full bg-th-accent-subtle px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-th-accent"
  >
    {label}
  </span>
);

export const MetaDot = () => (
  <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-th-text-placeholder" />
);

export const Byline = ({ article, size = "sm" }: { article: Article; size?: "sm" | "lg" }) => {
  const [failed, setFailed] = useState(false);
  const avatar = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const showAvatar = article.authorImg && !failed;

  return (
    <div className="flex items-center gap-3">
      {showAvatar ? (
        <img
          src={getImageUrl(article.authorImg)}
          alt=""
          onError={() => setFailed(true)}
          className={cn(avatar, "shrink-0 rounded-full object-cover ring-1 ring-th-border")}
        />
      ) : (
        <span
          className={cn(
            avatar,
            "grid shrink-0 place-items-center rounded-full bg-th-brand text-[12px] font-bold text-th-brand-fg",
          )}
        >
          {initialsOf(article.author)}
        </span>
      )}
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-semibold text-th-text-primary",
            size === "lg" ? "text-[14.5px]" : "text-[13.5px]",
          )}
        >
          {article.author}
        </p>
        {article.authorRole && (
          <p className="truncate text-[12px] text-th-text-muted">{article.authorRole}</p>
        )}
      </div>
    </div>
  );
};

export const ArticleMeta = ({ article }: { article: Article }) => (
  <div className="flex items-center gap-2 text-[12px] text-th-text-muted">
    {article.date && (
      <time dateTime={article.date.toISOString()}>{dateFormatter.format(article.date)}</time>
    )}
    {article.date && <MetaDot />}
    <span className="inline-flex items-center gap-1">
      <Clock size={12} strokeWidth={2} aria-hidden />
      {article.readMinutes} min read
    </span>
  </div>
);
