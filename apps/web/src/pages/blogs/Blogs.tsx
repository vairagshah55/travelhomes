import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  ArticleMeta,
  Byline,
  CategoryChip,
  Cover,
  toArticle,
  type Article,
  type BlogDTO,
} from "@/components/site/article";
import {
  ActionButton,
  CONTAINER,
  Eyebrow,
  Notice,
  RetryButton,
  Shimmer,
} from "@/components/site/kit";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PAGE_SIZE, pageWindow } from "./pagination";

/**
 * Editorial index for /blogs.
 *
 * Shape: typographic masthead → filter bar → one featured story → a uniform
 * grid. The imagery belongs to the stories, so the page doesn't open with a
 * stock hero photo competing with the first cover.
 *
 * ── Filtering and paging ─────────────────────────────────────────────────
 * Both are server-side. They used to be client-side, because `GET /api/blogs`
 * took only `status` and `limit` (capped at 50): this page fetched the first 50
 * published posts and filtered them in the browser, so the 51st article onwards
 * was unreachable on the site while sitting there published in the CMS. The
 * endpoint now takes `page`, `search` and `category` and returns `pagination`,
 * and the filter pills read their counts from `GET /api/blogs/categories` —
 * counts computed from one page would have said "3" for a category holding 30.
 *
 * Styling follows CONVENTIONS.md: `th-*` tokens, Tailwind classes, CSS hover.
 * The local `Notice` and skeleton pieces now come from `components/site/kit`,
 * shared with /about, /contact and /hostwithus.
 *
 * ── Accent colour ────────────────────────────────────────────────────────
 * This page used `text-th-brand` for the eyebrow, card-title hover and "Read
 * story". `--th-brand` is the logo cyan (#3bd9da), which measures ~1.7:1 as ink
 * on white — it looked washed out because it *was* failing WCAG AA. Accent text
 * is now `text-th-accent` (#128086, ~4.9:1). Cyan stays as a fill (the active
 * filter pill, the eyebrow dot), which is the pairing the design system signs
 * off on.
 */

/* ── Featured ───────────────────────────────────────────────────────────── */

const FeaturedCard = ({ article }: { article: Article }) => (
  <Link
    to={article.href}
    className="group block overflow-hidden rounded-th-3xl border border-th-border bg-th-surface-0 shadow-th-sm transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-th-border-hover hover:shadow-th-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]"
  >
    <div className="grid lg:grid-cols-2">
      <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[380px]">
        <Cover src={article.image} alt={article.title} />
        <span className="absolute left-4 top-4 inline-flex items-center rounded-th-full bg-black/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-th-text-inverse backdrop-blur-sm">
          Featured
        </span>
      </div>

      <div className="flex flex-col justify-center gap-5 p-6 sm:p-9 lg:p-11">
        <div className="flex flex-wrap items-center gap-3">
          <CategoryChip label={article.category} />
          <ArticleMeta article={article} />
        </div>

        <div className="space-y-3">
          <h2 className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em] text-th-text-primary transition-colors duration-200 group-hover:text-th-accent sm:text-[32px]">
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
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[13.5px] font-semibold text-th-accent">
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

        <h3 className="line-clamp-2 text-[17px] font-bold leading-snug tracking-[-0.01em] text-th-text-primary transition-colors duration-200 group-hover:text-th-accent">
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

/** Mirrors ArticleCard's real geometry so the grid doesn't reflow on load.
    `Shimmer` replaces the flat `animate-pulse` blocks — same footprint, but it
    sweeps, and it stops sweeping under `prefers-reduced-motion`. */
const CardSkeleton = () => (
  <div className="overflow-hidden rounded-th-2xl border border-th-border bg-th-surface-0">
    <Shimmer className="aspect-[16/10] w-full" />
    <div className="space-y-3 p-5">
      <Shimmer className="h-4 w-24 rounded-th-full" />
      <Shimmer className="h-4 w-full rounded-th-sm" />
      <Shimmer className="h-4 w-4/5 rounded-th-sm" />
      <div className="flex items-center gap-3 pt-3">
        <Shimmer className="h-9 w-9 rounded-full" />
        <Shimmer className="h-3 w-28 rounded-th-sm" />
      </div>
    </div>
  </div>
);

/** Featured-slot placeholder. The featured story is the tallest thing on the
    page, so without one the grid skeleton snapped down the moment data landed. */
const FeaturedSkeleton = () => (
  <div className="overflow-hidden rounded-th-3xl border border-th-border bg-th-surface-0">
    <div className="grid lg:grid-cols-2">
      <Shimmer className="aspect-[16/10] w-full lg:aspect-auto lg:min-h-[380px]" />
      <div className="space-y-4 p-6 sm:p-9 lg:p-11">
        <Shimmer className="h-5 w-28 rounded-th-full" />
        <Shimmer className="h-8 w-full rounded-th-sm" />
        <Shimmer className="h-8 w-3/4 rounded-th-sm" />
        <Shimmer className="h-4 w-full rounded-th-sm" />
        <Shimmer className="h-4 w-5/6 rounded-th-sm" />
        <div className="flex items-center gap-3 pt-6">
          <Shimmer className="h-11 w-11 rounded-full" />
          <Shimmer className="h-3.5 w-32 rounded-th-sm" />
        </div>
      </div>
    </div>
  </div>
);

/* ── Pager ──────────────────────────────────────────────────────────────── */

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

type BlogListResponse = { success: boolean; data: BlogDTO[]; pagination?: Pagination };

type CategoryFacet = { name: string; count: number };

const pageBtn =
  "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-th-full border border-th-border bg-th-surface-0 px-3 text-[13.5px] font-semibold tabular-nums text-th-text-secondary outline-none transition-[border-color,color,background-color] duration-150 hover:border-th-border-hover hover:text-th-text-primary focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)] disabled:pointer-events-none disabled:opacity-40";

const Pager = ({
  page,
  totalPages,
  onChange,
  busy,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
  busy?: boolean;
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-th-border pt-8"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1 || busy}
        className={pageBtn}
      >
        <ChevronLeft size={15} strokeWidth={2.4} aria-hidden />
        Prev
      </button>

      {pageWindow(page, totalPages).map((entry, i) =>
        entry === "gap" ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-th-text-muted">
            …
          </span>
        ) : (
          <button
            key={entry}
            type="button"
            onClick={() => onChange(entry)}
            disabled={busy}
            aria-current={entry === page ? "page" : undefined}
            aria-label={`Page ${entry}`}
            className={cn(
              pageBtn,
              entry === page &&
                "border-th-brand bg-th-brand text-th-brand-fg hover:text-th-brand-fg",
            )}
          >
            {entry}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages || busy}
        className={pageBtn}
      >
        Next
        <ChevronRight size={15} strokeWidth={2.4} aria-hidden />
      </button>
    </nav>
  );
};

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Blog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  /* The server does the matching now, so an un-debounced box would fire one
     request per keystroke and the replies could land out of order. */
  const query = useDebouncedValue(search.trim(), 300);

  /* A filter change invalidates the page number — page 4 of "Road trips" is
     usually past the end of that narrower set. */
  useEffect(() => {
    setPage(1);
  }, [query, category]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<BlogListResponse, Error>({
    queryKey: ["blogs", "published", { query, category, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: "published",
        limit: String(PAGE_SIZE),
        page: String(page),
      });
      if (query) params.set("search", query);
      if (category) params.set("category", category);

      const res = await fetch(`${API_BASE_URL}/api/blogs?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as BlogListResponse;
    },
    /* Holds the page you're reading on screen while the next one loads, rather
       than collapsing back to skeletons on every pager click. */
    placeholderData: keepPreviousData,
  });

  /* Facet counts come from the whole archive. Derived from the current page,
     they'd have labelled a category holding 30 posts "3". */
  const { data: facets } = useQuery<{ data: CategoryFacet[]; total: number }, Error>({
    queryKey: ["blogs", "categories", "published"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/blogs/categories?status=published`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = (await res.json()) as { data?: CategoryFacet[]; total?: number };
      return { data: payload.data ?? [], total: payload.total ?? 0 };
    },
    staleTime: 5 * 60 * 1000,
  });

  const articles = useMemo(() => (data?.data ?? []).map(toArticle), [data]);
  const categories = facets?.data ?? [];
  const matched = data?.pagination?.total ?? articles.length;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const archiveTotal = facets?.total ?? matched;

  const isFiltering = !!query || !!category;

  /* The featured slot is the newest story in the current view, and only on the
     first page — a "Featured" banner on page 4 of an archive is just
     mislabelling whatever happened to sort first. */
  const showFeatured = page === 1;
  const [featured, ...rest] = articles;
  const gridArticles = showFeatured ? rest : articles;

  const clearFilters = () => {
    setSearch("");
    setCategory(null);
  };

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <div className={cn(CONTAINER, "relative py-14 md:py-20")}>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Eyebrow className="mb-4">The Journal</Eyebrow>
              {/* `font-display` (DM Serif Display), matching the masthead voice
                  on /about, /contact and /hostwithus. */}
              <h1 className="font-display text-[38px] leading-[1.05] tracking-[-0.03em] text-th-text-primary sm:text-[52px]">
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
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-th-text-placeholder transition-colors group-focus-within:text-th-accent"
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

      <main className={cn(CONTAINER, "flex-1 py-10 md:py-14")}>
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
                <span className="ml-1.5 tabular-nums opacity-70">{archiveTotal}</span>
              </button>

              {categories.map(({ name, count }) => (
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
                  <span className="font-semibold text-th-text-primary tabular-nums">{matched}</span>{" "}
                  of {archiveTotal}
                </>
              ) : (
                <>
                  <span className="font-semibold text-th-text-primary tabular-nums">
                    {archiveTotal}
                  </span>{" "}
                  {archiveTotal === 1 ? "article" : "articles"}
                </>
              )}
            </p>
          </div>
        )}

        {/* ── Body ──
            The skeleton mirrors the loaded layout — one featured slot above a
            three-up grid — so the page doesn't visibly re-arrange itself the
            moment the articles land. */}
        {isLoading ? (
          <div className="space-y-10">
            <FeaturedSkeleton />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : isError ? (
          <Notice
            icon={RefreshCw}
            title="Couldn't load the journal"
            body="The articles didn't come back from the server. Check your connection and try again."
            action={<RetryButton onClick={() => void refetch()} busy={isFetching} />}
          />
        ) : matched === 0 && !isFiltering ? (
          <Notice
            icon={Newspaper}
            title="No stories published yet"
            body="The journal is being written. Check back soon for travel guides and host know-how."
          />
        ) : matched === 0 ? (
          <Notice
            icon={Search}
            title={query ? `No results for "${query}"` : "Nothing in this category"}
            body="Try a different keyword, or browse everything we've published."
            action={
              <ActionButton
                type="button"
                onClick={clearFilters}
                className="h-10 px-5 text-[13.5px]"
              >
                <X size={15} aria-hidden /> Clear filters
              </ActionButton>
            }
          />
        ) : (
          <>
            {/* Dimmed, not replaced, while the next page is in flight — the
                page you're on stays readable instead of flashing to skeletons. */}
            <div
              aria-busy={isFetching}
              className={cn(
                "space-y-10 transition-opacity duration-200",
                isFetching && "opacity-60",
              )}
            >
              {showFeatured && featured && <FeaturedCard article={featured} />}

              {gridArticles.length > 0 && (
                <section>
                  <h2 className="mb-5 text-[13px] font-bold uppercase tracking-[0.1em] text-th-text-muted">
                    {isFiltering ? "More results" : showFeatured ? "Latest articles" : "Articles"}
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {gridArticles.map((article, i) => (
                      <ArticleCard key={article.id} article={article} index={i} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            <Pager page={page} totalPages={totalPages} onChange={goToPage} busy={isFetching} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
