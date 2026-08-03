import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Newspaper, RefreshCw, Search, X } from "lucide-react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { API_BASE_URL } from "@/lib/api";
import { cn, getImageUrl } from "@/lib/utils";

/**
 * Editorial index for /blogs.
 *
 * Shape: typographic masthead → filter bar → one featured story → a uniform
 * grid. The imagery belongs to the stories, so the page doesn't open with a
 * stock hero photo competing with the first cover.
 *
 * Filtering is client-side on purpose: `GET /api/blogs` takes only `status` and
 * `limit` (max 50), so there's nothing to query by category or keyword. One
 * fetch of the published set covers it at this volume — revisit if the archive
 * outgrows 50 posts, at which point the endpoint needs real paging.
 *
 * Styling follows CONVENTIONS.md: `th-*` tokens, Tailwind classes, CSS hover.
 */

type BlogDTO = {
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
};

type Article = {
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

const FALLBACK_COVER = "/blog1.jpg";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** ~200 wpm over the body copy, tags stripped. Always at least a minute. */
function readingMinutes(html?: string, fallback?: string): number {
  const text = String(html || fallback || "").replace(/<[^>]*>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function initialsOf(name?: string): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "TH";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function toArticle(b: BlogDTO): Article {
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

/* ── Pieces ─────────────────────────────────────────────────────────────── */

/** Cover with a stable aspect ratio and a graceful failure. Uploaded covers are
    base64 data URLs today and file paths tomorrow — `getImageUrl` handles both,
    and a dead one falls back rather than showing a broken-image glyph. */
const Cover = ({ src, alt, className }: { src?: string; alt: string; className?: string }) => {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? FALLBACK_COVER : getImageUrl(src)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        "h-full w-full object-cover transition-transform duration-500 ease-th-out",
        "group-hover:scale-[1.04]",
        className,
      )}
    />
  );
};

const CategoryChip = ({ label }: { label: string }) => (
  <span className="inline-flex items-center rounded-th-full bg-th-accent-subtle px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-th-brand">
    {label}
  </span>
);

const MetaDot = () => (
  <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-th-text-placeholder" />
);

const Byline = ({ article, size = "sm" }: { article: Article; size?: "sm" | "lg" }) => {
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

const ArticleMeta = ({ article }: { article: Article }) => (
  <div className="flex items-center gap-2 text-[12px] text-th-text-muted">
    {article.date && (
      <time dateTime={article.date.toISOString()}>{dateFormatter.format(article.date)}</time>
    )}
    {article.date && <MetaDot />}
    <span className="inline-flex items-center gap-1">
      <Clock size={12} strokeWidth={2} />
      {article.readMinutes} min read
    </span>
  </div>
);

/* ── Featured ───────────────────────────────────────────────────────────── */

const FeaturedCard = ({ article }: { article: Article }) => (
  <Link
    to={article.href}
    className="group block overflow-hidden rounded-th-3xl border border-th-border bg-th-surface-0 shadow-th-sm transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-th-border-hover hover:shadow-th-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]"
  >
    <div className="grid lg:grid-cols-2">
      <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[380px]">
        <Cover src={article.image} alt={article.title} />
        <span className="absolute left-4 top-4 inline-flex items-center rounded-th-full bg-th-text-primary/85 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-th-text-inverse backdrop-blur-sm">
          Featured
        </span>
      </div>

      <div className="flex flex-col justify-center gap-5 p-6 sm:p-9 lg:p-11">
        <div className="flex flex-wrap items-center gap-3">
          <CategoryChip label={article.category} />
          <ArticleMeta article={article} />
        </div>

        <div className="space-y-3">
          <h2 className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-th-text-primary transition-colors duration-200 group-hover:text-th-brand sm:text-[32px]">
            {article.title}
          </h2>
          {article.description && (
            <p className="line-clamp-3 text-[15px] leading-relaxed text-th-text-muted">
              {article.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-th-border pt-5">
          <Byline article={article} size="lg" />
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[13.5px] font-semibold text-th-brand">
            Read story
            <ArrowUpRight
              size={16}
              strokeWidth={2.4}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>
      </div>
    </div>
  </Link>
);

/* ── Grid card ──────────────────────────────────────────────────────────── */

const ArticleCard = ({ article, index }: { article: Article; index: number }) => (
  /* `animate`, not `whileInView`. A scroll-triggered reveal starts at opacity 0
     and depends on an IntersectionObserver firing — when it doesn't, the entire
     grid is present in the DOM but invisible, which is worse than having no
     animation at all. This plays once on mount and always ends visible. */
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: Math.min(index, 5) * 0.05, ease: [0.22, 1, 0.36, 1] }}
  >
    <Link
      to={article.href}
      className="group flex h-full flex-col overflow-hidden rounded-th-2xl border border-th-border bg-th-surface-0 shadow-th-sm transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-1 hover:border-th-border-hover hover:shadow-th-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Cover src={article.image} alt={article.title} />
      </div>

      {/* flex-1 + mt-auto footer keeps every card in a row the same height
          without the fixed h-[450px] that used to clip long titles. */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <CategoryChip label={article.category} />
          <ArticleMeta article={article} />
        </div>

        <h3 className="line-clamp-2 text-[17px] font-bold leading-snug tracking-[-0.01em] text-th-text-primary transition-colors duration-200 group-hover:text-th-brand">
          {article.title}
        </h3>

        {article.description && (
          <p className="line-clamp-2 text-[13.5px] leading-relaxed text-th-text-muted">
            {article.description}
          </p>
        )}

        <div className="mt-auto border-t border-th-border pt-4">
          <Byline article={article} />
        </div>
      </div>
    </Link>
  </motion.div>
);

/* ── States ─────────────────────────────────────────────────────────────── */

const CardSkeleton = () => (
  <div className="overflow-hidden rounded-th-2xl border border-th-border bg-th-surface-0">
    <div className="aspect-[16/10] animate-pulse bg-th-surface-2" />
    <div className="space-y-3 p-5">
      <div className="h-4 w-24 animate-pulse rounded-th-full bg-th-surface-2" />
      <div className="h-4 w-full animate-pulse rounded-th-sm bg-th-surface-2" />
      <div className="h-4 w-4/5 animate-pulse rounded-th-sm bg-th-surface-2" />
      <div className="flex items-center gap-3 pt-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-th-surface-2" />
        <div className="h-3 w-28 animate-pulse rounded-th-sm bg-th-surface-2" />
      </div>
    </div>
  </div>
);

const Notice = ({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  action?: React.ReactNode;
}) => (
  <div className="rounded-th-2xl border border-dashed border-th-border bg-th-surface-1 px-6 py-16 text-center">
    <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-th-accent-subtle text-th-brand">
      <Icon size={22} strokeWidth={2} />
    </span>
    <h3 className="text-[16px] font-bold text-th-text-primary">{title}</h3>
    <p className="mx-auto mt-1.5 max-w-md text-[13.5px] leading-relaxed text-th-text-muted">
      {body}
    </p>
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Blog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const {
    data: articles = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<Article[], Error>({
    queryKey: ["blogs", "published"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/blogs?status=published&limit=50`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = (await res.json()) as { success: boolean; data: BlogDTO[] };
      return (payload.data || []).map(toArticle);
    },
  });

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    articles.forEach((a) => counts.set(a.category, (counts.get(a.category) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [articles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (category && a.category !== category) return false;
      if (!q) return true;
      return [a.title, a.description, a.author, a.category].join(" ").toLowerCase().includes(q);
    });
  }, [articles, search, category]);

  const isFiltering = !!search.trim() || !!category;
  const [featured, ...rest] = filtered;
  const clearFilters = () => {
    setSearch("");
    setCategory(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-th-surface-0">
      <Header />

      {/* ── Masthead ──────────────────────────────────────────────────────
          Typographic rather than a stock photo: the covers below are the
          page's imagery, and a full-bleed unrelated photo just competed with
          the featured story for attention. */}
      <section className="relative overflow-hidden border-b border-th-border bg-th-surface-1">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full bg-th-accent-subtle blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-th-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-th-logo" />
                The Journal
              </p>
              <h1 className="text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-th-text-primary sm:text-[46px]">
                Stories from the road
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-th-text-muted sm:text-[16px]">
                Travel guides, host know-how and the ideas shaping how people explore — written by
                the TravelHomes team and the community around it.
              </p>
            </div>

            {/* Search */}
            <div className="w-full md:w-[300px]">
              <label htmlFor="blog-search" className="sr-only">
                Search articles
              </label>
              <div className="group relative">
                <Search
                  size={17}
                  strokeWidth={2}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-th-text-placeholder transition-colors group-focus-within:text-th-brand"
                />
                <input
                  id="blog-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search articles…"
                  className="h-12 w-full rounded-th-full border border-th-border bg-th-surface-0 pl-11 pr-10 text-[14px] text-th-text-primary outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-th-text-placeholder focus:border-th-brand focus:ring-4 focus:ring-[color:var(--th-ring)]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-th-text-muted transition-colors hover:bg-th-surface-2 hover:text-th-text-primary"
                  >
                    <X size={14} strokeWidth={2.4} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 md:py-14">
        {/* ── Filter bar ── */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-3 border-b border-th-border pb-6">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={cn(
                  "h-9 rounded-th-full px-4 text-[13px] font-semibold transition-colors duration-150 outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]",
                  !category
                    ? "bg-th-brand text-th-brand-fg"
                    : "bg-th-surface-1 text-th-text-secondary hover:bg-th-surface-2",
                )}
              >
                All
                <span className="ml-1.5 tabular-nums opacity-70">{articles.length}</span>
              </button>

              {categories.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name === category ? null : name)}
                  className={cn(
                    "h-9 max-w-[220px] truncate rounded-th-full px-4 text-[13px] font-semibold transition-colors duration-150 outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]",
                    name === category
                      ? "bg-th-brand text-th-brand-fg"
                      : "bg-th-surface-1 text-th-text-secondary hover:bg-th-surface-2",
                  )}
                >
                  {name}
                  <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
                </button>
              ))}
            </div>

            <p className="shrink-0 text-[13px] text-th-text-muted">
              {isFiltering ? (
                <>
                  <span className="font-semibold text-th-text-primary tabular-nums">
                    {filtered.length}
                  </span>{" "}
                  of {articles.length}
                </>
              ) : (
                <>
                  <span className="font-semibold text-th-text-primary tabular-nums">
                    {articles.length}
                  </span>{" "}
                  {articles.length === 1 ? "article" : "articles"}
                </>
              )}
            </p>
          </div>
        )}

        {/* ── Body ── */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <Notice
            icon={RefreshCw}
            title="Couldn't load the journal"
            body="The articles didn't come back from the server. Check your connection and try again."
            action={
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="inline-flex h-10 items-center gap-2 rounded-th-full bg-th-brand px-5 text-[13.5px] font-semibold text-th-brand-fg transition-colors hover:bg-th-brand-hover disabled:opacity-60"
              >
                <RefreshCw size={15} className={cn(isFetching && "animate-spin")} />
                {isFetching ? "Retrying…" : "Try again"}
              </button>
            }
          />
        ) : articles.length === 0 ? (
          <Notice
            icon={Newspaper}
            title="No stories published yet"
            body="The journal is being written. Check back soon for travel guides and host know-how."
          />
        ) : filtered.length === 0 ? (
          <Notice
            icon={Search}
            title={search ? `No results for "${search.trim()}"` : "Nothing in this category"}
            body="Try a different keyword, or browse everything we've published."
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-10 items-center gap-2 rounded-th-full bg-th-brand px-5 text-[13.5px] font-semibold text-th-brand-fg transition-colors hover:bg-th-brand-hover"
              >
                <X size={15} /> Clear filters
              </button>
            }
          />
        ) : (
          <div className="space-y-10">
            {/* The featured slot is the newest story in the current view — it
                stays meaningful while a filter is applied instead of pinning
                an article that's been filtered out. */}
            {featured && <FeaturedCard article={featured} />}

            {rest.length > 0 && (
              <section>
                <h2 className="mb-5 text-[13px] font-bold uppercase tracking-[0.1em] text-th-text-muted">
                  {isFiltering ? "More results" : "Latest articles"}
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((article, i) => (
                    <ArticleCard key={article.id} article={article} index={i} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
