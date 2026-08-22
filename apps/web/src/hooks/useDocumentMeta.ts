import { useEffect } from "react";

/**
 * Per-page <head> management for content the CMS owns per record.
 *
 * `components/SEOMeta.tsx` handles the *route-level* case: one SEO record per
 * path, fetched from `/api/settings/seo`. That's wrong for a blog post — every
 * article shared the single "Blog Details" record, so the per-article
 * `metaTitle` / `metaDescription` / `metaKeywords` the CMS has always collected
 * (see `AdminCMS/tabs/BlogsTab.tsx`, the SEO section) were written to Mongo and
 * never read by anything. This hook is how a page applies meta it derives from
 * the record it's rendering.
 *
 * Everything it touches is undone on unmount — the previous value restored, or
 * the tag removed if the hook created it. Without that, an article's
 * description would linger onto the next route, because `SEOMeta.updateMeta`
 * skips empty values and so never clears a stale tag.
 */

export type DocumentMeta = {
  title?: string;
  description?: string;
  keywords?: string;
  /** Absolute http(s) URL. A crawler can't fetch a `data:` or relative one. */
  image?: string;
  canonical?: string;
  /** Open Graph object type — "article" for a post, "website" otherwise. */
  ogType?: string;
  /** Schema.org object, serialised into a ld+json script. */
  jsonLd?: unknown;
  /** Pass false while the record is still loading, to avoid a half-built head. */
  enabled?: boolean;
};

/** Reverses one mutation. Collected during the effect, drained on cleanup. */
type Undo = () => void;

const JSONLD_ATTR = "data-th-jsonld";

/** Set `content` on the matching tag, creating it if absent. */
function applyMeta(
  attr: "name" | "property",
  key: string,
  content: string | undefined,
  undo: Undo[],
) {
  if (!content) return;

  const existing = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (existing) {
    const previous = existing.getAttribute("content");
    undo.push(() => {
      if (previous === null) existing.removeAttribute("content");
      else existing.setAttribute("content", previous);
    });
    existing.setAttribute("content", content);
    return;
  }

  const created = document.createElement("meta");
  created.setAttribute(attr, key);
  created.setAttribute("content", content);
  document.head.appendChild(created);
  undo.push(() => created.remove());
}

function applyCanonical(href: string | undefined, undo: Undo[]) {
  if (!href) return;

  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (existing) {
    const previous = existing.getAttribute("href");
    undo.push(() => {
      if (previous === null) existing.removeAttribute("href");
      else existing.setAttribute("href", previous);
    });
    existing.setAttribute("href", href);
    return;
  }

  const created = document.createElement("link");
  created.rel = "canonical";
  created.href = href;
  document.head.appendChild(created);
  undo.push(() => created.remove());
}

/* `textContent`, never `innerHTML` — a title containing `</script>` would break
   out of the block otherwise, and blog copy is author-supplied. */
function applyJsonLd(serialised: string, undo: Undo[]) {
  if (!serialised) return;

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute(JSONLD_ATTR, "true");
  script.textContent = serialised;
  document.head.appendChild(script);
  undo.push(() => script.remove());
}

export function useDocumentMeta({
  title,
  description,
  keywords,
  image,
  canonical,
  ogType = "website",
  jsonLd,
  enabled = true,
}: DocumentMeta) {
  /* Serialised here so the effect can depend on a primitive. A plain object
     literal from the caller is a new identity every render, which would make
     the effect re-run — and re-append the ld+json — on each one. */
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    if (!enabled) return;

    const undo: Undo[] = [];

    if (title) {
      const previousTitle = document.title;
      undo.push(() => {
        document.title = previousTitle;
      });
      document.title = title;
    }

    applyMeta("name", "description", description, undo);
    applyMeta("name", "keywords", keywords, undo);

    applyMeta("property", "og:title", title, undo);
    applyMeta("property", "og:description", description, undo);
    applyMeta("property", "og:image", image, undo);
    applyMeta("property", "og:type", ogType, undo);
    applyMeta("property", "og:url", canonical, undo);

    applyMeta("name", "twitter:card", image ? "summary_large_image" : "summary", undo);
    applyMeta("name", "twitter:title", title, undo);
    applyMeta("name", "twitter:description", description, undo);
    applyMeta("name", "twitter:image", image, undo);

    applyCanonical(canonical, undo);
    applyJsonLd(jsonLdText, undo);

    /* LIFO, so a tag touched twice lands back on its original value. */
    return () => {
      for (let i = undo.length - 1; i >= 0; i--) undo[i]();
    };
  }, [title, description, keywords, image, canonical, ogType, jsonLdText, enabled]);
}

export default useDocumentMeta;
