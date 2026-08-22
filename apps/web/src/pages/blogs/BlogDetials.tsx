import React, { useEffect, useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Check, Link2, Newspaper, RefreshCw } from "lucide-react";
import { FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  ArticleMeta,
  Byline,
  CategoryChip,
  Cover,
  hasReadableContent,
  sanitizeArticleHtml,
  toArticle,
  type BlogDTO,
} from "@/components/site/article";
import { CONTAINER, Notice, RetryButton, Shimmer } from "@/components/site/kit";
import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * /blogsDetials — a single story.
 *
 * ── What this page was doing ──────────────────────────────────────────────
 *
 * • Two loading states, both saying **"Fetching blog content…"** — one as an
 *   early `return`, one further down that was unreachable dead code.
 * • `{error && <div className="text-red-600">{error.message}</div>}`, which put
 *   the raw thrown message (`HTTP 404`) on screen for the reader.
 * • The body was `<p className="whitespace-pre-line">{blog.content}</p>` inside
 *   a `prose` wrapper. `@tailwindcss/typography` is not installed here, so
 *   `prose` styled nothing — and posts whose body is HTML displayed their own
 *   tags as literal text. See `sanitizeArticleHtml` for the fix.
 * • Related-post covers used `art.coverImage` raw instead of `getImageUrl()`,
 *   so uploaded covers (base64 data URLs) broke here while working on /blogs.
 * • The related list included the article you were already reading.
 * • No 404 state: an unknown slug rendered a blank page under a breadcrumb.
 *
 * Layout is a centred measure (~68ch) so the body actually reads, with the
 * header, cover and related grid on the wider page container.
 */

/** ~68 characters — the readable measure for long-form body copy. */
const MEASURE = "mx-auto w-full max-w-[720px]";

/**
 * Typography for admin-authored HTML, via arbitrary child selectors.
 *
 * Hand-rolled because `@tailwindcss/typography` isn't a dependency of this repo
 * and adding one for a single page isn't worth it. Everything below is a class,
 * not an inline style, per CONVENTIONS.md Rule 1.
 */
const ARTICLE_PROSE = cn(
  "text-[17px] leading-[1.75] text-th-text-secondary",
  "[&>*+*]:mt-6",
  "[&_p]:text-[17px] [&_p]:leading-[1.75]",
  "[&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-[27px] [&_h2]:leading-snug [&_h2]:tracking-[-0.01em] [&_h2]:text-th-text-primary",
  "[&_h3]:mt-10 [&_h3]:font-display [&_h3]:text-[21px] [&_h3]:leading-snug [&_h3]:text-th-text-primary",
  "[&_h4]:mt-8 [&_h4]:text-[17px] [&_h4]:font-bold [&_h4]:text-th-text-primary",
  "[&_strong]:font-semibold [&_strong]:text-th-text-primary",
  "[&_a]:font-medium [&_a]:text-th-accent [&_a]:underline [&_a]:decoration-th-brand-border-soft [&_a]:underline-offset-4 hover:[&_a]:decoration-th-accent",
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:mt-2 [&_li]:pl-1.5",
  "[&_li]:marker:text-th-accent",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-th-brand [&_blockquote]:pl-6 [&_blockquote]:font-display [&_blockquote]:text-[21px] [&_blockquote]:leading-relaxed [&_blockquote]:text-th-text-primary",
  "[&_img]:rounded-th-2xl [&_img]:w-full",
  "[&_hr]:border-th-border",
  "[&_code]:rounded-th-sm [&_code]:bg-th-surface-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[14.5px]",
  "[&_table]:w-full [&_table]:text-[15px] [&_th]:border-b [&_th]:border-th-border [&_th]:p-2 [&_th]:text-left [&_td]:border-b [&_td]:border-th-border [&_td]:p-2",
);

/* ── Share row ───────────────────────────────────────────────────────────── */

const shareBtn =
  "inline-flex h-10 items-center gap-2 rounded-th-full border border-th-border bg-th-surface-0 px-4 text-[13.5px] font-semibold text-th-text-secondary outline-none transition-[border-color,color,background-color] duration-150 hover:border-th-border-hover hover:text-th-text-primary focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]";

const ShareRow = ({ title }: { title: string }) => {
  const [copied, setCopied] = React.useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed the sheet, or the gesture wasn't trusted. Fall through
        // to copying rather than surfacing an error for a cancelled action.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const openShare = (href: string) =>
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=520");

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="mr-1 text-[13px] font-semibold text-th-text-muted">Share</span>

      <button type="button" onClick={share} className={shareBtn}>
        {copied ? (
          <Check size={15} strokeWidth={2.4} aria-hidden className="text-th-success" />
        ) : (
          <Link2 size={15} strokeWidth={2.2} aria-hidden />
        )}
        {copied ? "Copied" : "Copy link"}
      </button>

      <button
        type="button"
        aria-label="Share on LinkedIn"
        onClick={() =>
          openShare(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
          )
        }
        className={cn(shareBtn, "w-10 justify-center px-0")}
      >
        <FaLinkedin size={16} aria-hidden />
      </button>

      <button
        type="button"
        aria-label="Share on X"
        onClick={() =>
          openShare(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`,
          )
        }
        className={cn(shareBtn, "w-10 justify-center px-0")}
      >
        <FaXTwitter size={15} aria-hidden />
      </button>
    </div>
  );
};

/* ── Skeleton ────────────────────────────────────────────────────────────── */

/** Mirrors the loaded article's geometry, so nothing jumps when data lands. */
const ArticleSkeleton = () => (
  <div className={cn(CONTAINER, "py-10 md:py-14")}>
    <div className={MEASURE}>
      <Shimmer className="h-5 w-28 rounded-th-full" />
      <div className="mt-6 space-y-3">
        <Shimmer className="h-9 w-full rounded-th-sm" />
        <Shimmer className="h-9 w-4/5 rounded-th-sm" />
      </div>
      <div className="mt-6 space-y-2.5">
        <Shimmer className="h-4 w-full rounded-th-sm" />
        <Shimmer className="h-4 w-3/4 rounded-th-sm" />
      </div>
      <div className="mt-8 flex items-center gap-3">
        <Shimmer className="h-11 w-11 rounded-full" />
        <div className="space-y-2">
          <Shimmer className="h-3.5 w-32 rounded-th-sm" />
          <Shimmer className="h-3 w-24 rounded-th-sm" />
        </div>
      </div>
    </div>
    <Shimmer className="mx-auto mt-10 aspect-[16/9] w-full max-w-4xl rounded-th-3xl" />
    <div className={cn(MEASURE, "mt-10 space-y-3")}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Shimmer key={i} className={cn("h-4 rounded-th-sm", i % 4 === 3 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  </div>
);

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function BlogDetailsPage() {
  const { slug: slugFromParams } = useParams<{ slug: string }>();
  const location = useLocation();

  /* The index links here as `/blogsDetials?slug=…`, but a `/:slug` route param
     is supported too. Read from `location`, not `window`, so it re-derives on
     client-side navigation between two stories. */
  const slug = useMemo(
    () => slugFromParams || new URLSearchParams(location.search).get("slug") || undefined,
    [slugFromParams, location.search],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const {
    data: blog = null,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<BlogDTO | null, Error>({
    queryKey: ["blog", "detail", slug],
    enabled: !!slug,
    retry: false,
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/blogs/${encodeURIComponent(slug!)}`);
      // 404 is "no such story", not a transport failure — resolve it so the
      // page can show a proper not-found rather than the error state.
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return ((await res.json()) as { success: boolean; data: BlogDTO }).data ?? null;
    },
  });

  const { data: latest = [] } = useQuery<BlogDTO[]>({
    queryKey: ["blog", "latest", 8],
    queryFn: async () => {
      const r = await fetch(`${API_BASE_URL}/api/blogs?status=published&limit=8`);
      if (!r.ok) return [];
      return ((await r.json()) as { success: boolean; data: BlogDTO[] }).data || [];
    },
  });

  const article = blog ? toArticle(blog) : null;
  const bodyHtml = useMemo(() => sanitizeArticleHtml(blog?.content), [blog?.content]);
  const showBody = hasReadableContent(bodyHtml);

  /* Never recommend the story being read, and cap at three. */
  const related = useMemo(
    () =>
      latest
        .filter((b) => b.slug !== blog?.slug)
        .slice(0, 3)
        .map(toArticle),
    [latest, blog?.slug],
  );

  return (
    <div className="flex min-h-screen flex-col bg-th-surface-0">
      <Header />

      {isLoading ? (
        <main className="flex-1">
          <ArticleSkeleton />
        </main>
      ) : isError ? (
        <main className={cn(CONTAINER, "flex-1 py-20")}>
          <Notice
            icon={RefreshCw}
            title="Couldn't load this story"
            body="The article didn't come back from the server. Check your connection and try again."
            action={<RetryButton onClick={() => void refetch()} busy={isFetching} />}
          />
        </main>
      ) : !article ? (
        <main className={cn(CONTAINER, "flex-1 py-20")}>
          <Notice
            icon={Newspaper}
            title="We couldn't find that story"
            body="It may have been unpublished or the link may be incomplete. The rest of the journal is still here."
            action={
              <Link
                to="/blogs"
                className="inline-flex h-10 items-center gap-2 rounded-th-full bg-th-brand px-5 text-[13.5px] font-semibold text-th-brand-fg outline-none transition-colors hover:bg-th-brand-hover focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]"
              >
                <ArrowLeft size={15} aria-hidden />
                Back to the journal
              </Link>
            }
          />
        </main>
      ) : (
        <main className="flex-1">
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className={cn(CONTAINER, "pt-8 md:pt-12")}>
            <nav aria-label="Breadcrumb" className={MEASURE}>
              <Link
                to="/blogs"
                className="group inline-flex items-center gap-1.5 rounded-th-sm text-[13px] font-semibold text-th-text-muted outline-none transition-colors hover:text-th-accent focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]"
              >
                <ArrowLeft
                  size={14}
                  strokeWidth={2.4}
                  aria-hidden
                  className="transition-transform duration-200 motion-safe:group-hover:-translate-x-0.5"
                />
                The Journal
              </Link>
            </nav>

            <header className={cn(MEASURE, "mt-7")}>
              <div className="flex flex-wrap items-center gap-3">
                <CategoryChip label={article.category} />
                <ArticleMeta article={article} />
              </div>

              <h1 className="mt-5 font-display text-[34px] leading-[1.1] tracking-[-0.025em] text-th-text-primary sm:text-[44px]">
                {article.title}
              </h1>

              {/* Standfirst. Suppressed when the CMS has echoed the title into
                  the description, which several existing posts do. */}
              {article.description &&
                article.description.trim().toLowerCase() !== article.title.trim().toLowerCase() && (
                  <p className="mt-5 text-[18px] leading-relaxed text-th-text-muted">
                    {article.description}
                  </p>
                )}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-th-border pt-6">
                <Byline article={article} size="lg" />
                <ShareRow title={article.title} />
              </div>
            </header>
          </div>

          {/* ── Cover ──────────────────────────────────────────────────── */}
          <div className={cn(CONTAINER, "mt-10")}>
            <div className="mx-auto max-w-4xl overflow-hidden rounded-th-3xl border border-th-border bg-th-surface-1">
              <div className="aspect-[16/9]">
                <Cover src={article.image} alt={article.title} zoomOnHover={false} />
              </div>
            </div>
          </div>

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div className={cn(CONTAINER, "py-12 md:py-16")}>
            <div className={MEASURE}>
              {showBody ? (
                /* Cleaned in `sanitizeArticleHtml`: banned tags removed, every
                   attribute outside a small allowlist stripped (including the
                   pasted inline `style` colours), `on*` handlers gone. */
                <div
                  className={ARTICLE_PROSE}
                  dangerouslySetInnerHTML={{ __html: bodyHtml }}
                />
              ) : (
                <p className="rounded-th-2xl border border-dashed border-th-border bg-th-surface-1 px-6 py-10 text-center text-[14.5px] text-th-text-muted">
                  The full text of this story isn't available yet.
                </p>
              )}

              <div className="mt-12 border-t border-th-border pt-8">
                <ShareRow title={article.title} />
              </div>
            </div>
          </div>

          {/* ── Related ────────────────────────────────────────────────── */}
          {related.length > 0 && (
            <section className="border-t border-th-border bg-th-surface-1 py-14 md:py-20">
              <div className={CONTAINER}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h2 className="font-display text-[26px] leading-snug tracking-[-0.01em] text-th-text-primary sm:text-[32px]">
                    Keep reading
                  </h2>
                  <Link
                    to="/blogs"
                    className="group inline-flex items-center gap-1.5 rounded-th-sm text-[14px] font-semibold text-th-accent outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]"
                  >
                    All articles
                    <ArrowUpRight
                      size={15}
                      strokeWidth={2.4}
                      aria-hidden
                      className="transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                    />
                  </Link>
                </div>

                <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      to={r.href}
                      className="group flex h-full flex-col overflow-hidden rounded-th-2xl border border-th-border bg-th-surface-0 shadow-th-sm outline-none transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-1 hover:border-th-border-hover hover:shadow-th-lg focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Cover src={r.image} alt={r.title} />
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <CategoryChip label={r.category} />
                          <ArticleMeta article={r} />
                        </div>
                        <h3 className="line-clamp-2 text-[16.5px] font-bold leading-snug tracking-[-0.01em] text-th-text-primary transition-colors duration-200 group-hover:text-th-accent">
                          {r.title}
                        </h3>
                        <div className="mt-auto border-t border-th-border pt-4">
                          <Byline article={r} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      )}

      <Footer />
    </div>
  );
}
