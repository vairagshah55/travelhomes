import React, { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SlArrowRight } from "react-icons/sl";
import Section from "../Section";
import ArticleCard from "../ArticleCard";
import { ArticlesSkeleton } from "./skeletons";
import { ScrollReveal, staggerContainer, staggerItem } from "./ScrollReveal";

type BlogDTO = {
  _id: string; title: string; slug: string;
  coverImage?: string; createdAt?: string;
};

const FALLBACK_ARTICLES = [
  { image: "https://api.builder.io/api/v1/image/assets/TEMP/a933039ae4e0adbd39f8a1351e83163112e5f000?width=610", title: "Experience Goa Like Never Before: Unique Adventures Await!" },
  { image: "https://api.builder.io/api/v1/image/assets/TEMP/a933039ae4e0adbd39f8a1351e83163112e5f000?width=610", title: "Experience Goa Like Never Before: Unique Adventures Await!" },
  { image: "https://api.builder.io/api/v1/image/assets/TEMP/6f516751df2e054cd8cb29b5de7bd06d58094484?width=610", title: "Experience Goa Like Never Before: Unique Adventures Await!" },
  { image: "https://api.builder.io/api/v1/image/assets/TEMP/dd0f73b9c2f07283655340bce9ea8febcd86a500?width=610", title: "Experience Goa Like Never Before: Unique Adventures Await!" },
];

interface LatestArticlesProps {
  latestBlogs: BlogDTO[];
  loadingBlogs?: boolean;
}

export function LatestArticles({ latestBlogs, loadingBlogs = false }: LatestArticlesProps) {
  const navigate = useNavigate();
  const articlesRef = useRef<HTMLDivElement>(null);

  if (loadingBlogs) {
    return <ScrollReveal><div className="py-8 md:py-12"><ArticlesSkeleton /></div></ScrollReveal>;
  }

  return (
    <ScrollReveal>
      <Section
        title="Stories from the Road"
        subtitle="Tips, guides and tales from India's best journeys"
        className="py-8 px-4 md:py-12"
        rightContent={
          <Button
            variant="outline"
            onClick={() => navigate("/blogs")}
            className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200 px-5 h-10 font-medium text-sm hover:shadow-md active:scale-[0.98]"
          >
            <span className="mr-2">Read all articles</span>
            <SlArrowRight className="w-3.5 h-3.5" />
          </Button>
        }
      >
        <div ref={articlesRef} className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <motion.div
            className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
          >
            {latestBlogs.length > 0
              ? latestBlogs.map((b) => (
                  <motion.div key={b._id} variants={staggerItem} className="w-[280px] flex-shrink-0 md:w-auto md:flex-shrink">
                    <Link to={`/blogsDetials?slug=${b.slug}`} className="block">
                      <ArticleCard image={b.coverImage || "/placeholder.svg"} title={b.title} />
                    </Link>
                  </motion.div>
                ))
              : FALLBACK_ARTICLES.map((article, i) => (
                  <motion.div key={i} variants={staggerItem} className="w-[280px] flex-shrink-0 md:w-auto md:flex-shrink">
                    <ArticleCard {...article} />
                  </motion.div>
                ))}
          </motion.div>
        </div>
      </Section>
    </ScrollReveal>
  );
}
