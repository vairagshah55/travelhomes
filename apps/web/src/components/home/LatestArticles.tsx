import React, { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SlArrowRight } from "react-icons/sl";
import Section from "../Section";
import ArticleCard from "../ArticleCard";
import { ArticlesSkeleton } from "./skeletons";
import { ScrollReveal, staggerContainer, staggerItem } from "./ScrollReveal";
import { getImageUrl } from "@/lib/utils";

/**
 * "Stories from the Road" — the four newest published posts, from
 * `GET /api/blogs?status=published&limit=4` in `pages/Index.tsx`.
 *
 * ── Two things this was doing ─────────────────────────────────────────────
 *
 * 1. **It invented articles.** With no published posts it rendered four
 *    hardcoded Unsplash photos under invented headlines ("Experience Goa Like
 *    Never Before", "Top 10 Campervan Trips Through the Himalayas"). They were
 *    not links and there was nothing behind them — a visitor clicking one got
 *    nothing, and the CMS had no way to remove them. An empty journal now hides
 *    the section, which is the honest state: nothing published, nothing shown.
 *
 * 2. **Covers uploaded through the CMS didn't load.** `b.coverImage` went
 *    straight to `<img src>`, but stored covers are relative paths that need
 *    `VITE_API_BASE_URL_MEDIA` prefixed — the same bug the article pages fixed
 *    with `getImageUrl`. Every card here fell back to its 📰 error state while
 *    the identical cover rendered fine on /blogs.
 */

type BlogDTO = {
  _id: string;
  title: string;
  slug: string;
  coverImage?: string;
  createdAt?: string;
};

interface LatestArticlesProps {
  latestBlogs: BlogDTO[];
  loadingBlogs?: boolean;
}

export function LatestArticles({ latestBlogs, loadingBlogs = false }: LatestArticlesProps) {
  const navigate = useNavigate();
  const articlesRef = useRef<HTMLDivElement>(null);

  if (loadingBlogs) {
    return (
      <ScrollReveal>
        <div className="py-8 md:py-12">
          <ArticlesSkeleton />
        </div>
      </ScrollReveal>
    );
  }

  // Nothing published (or the fetch failed) — drop the section rather than
  // leaving a heading over an empty rail.
  if (!latestBlogs.length) return null;

  return (
    <ScrollReveal>
      <Section
        title="Stories from the Road"
        subtitle="Tips, guides and tales from India's best journeys"
        className="py-8 md:py-12"
        rightContent={
          <Button
            variant="outline"
            onClick={() => navigate("/blogs")}
            className="rounded-full border-[#0a1c1c] text-[#0a1c1c] hover:bg-[#0a1c1c] hover:text-white transition-all duration-200 px-4 md:px-5 h-9 md:h-10 font-medium text-[13px] md:text-sm hover:shadow-md active:scale-[0.98]"
          >
            <span className="mr-2">
              Read all<span className="hidden sm:inline"> articles</span>
            </span>
            <SlArrowRight className="w-3.5 h-3.5" />
          </Button>
        }
      >
        <div ref={articlesRef} className="overflow-x-auto scrollbar-hide snap-rail rail-bleed">
          <motion.div
            className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
          >
            {latestBlogs.map((b) => (
              <motion.div
                key={b._id}
                variants={staggerItem}
                className="snap-start w-[74vw] max-w-[300px] flex-shrink-0 md:w-auto md:max-w-none md:flex-shrink"
              >
                <Link to={`/blogsDetials?slug=${b.slug}`} className="block">
                  <ArticleCard image={getImageUrl(b.coverImage)} title={b.title} />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>
    </ScrollReveal>
  );
}
