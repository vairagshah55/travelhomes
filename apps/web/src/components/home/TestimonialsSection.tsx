import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SlArrowLeft, SlArrowRight } from "react-icons/sl";
import Section from "../Section";
import TestimonialCard from "../TestimonialCard";
import { useAutoHorizontalScroll } from "../useAutoHorizontalScroll";
import { testimonialsApi, PublicTestimonial } from "@/lib/testimonials";
import { getImageUrl } from "@/lib/utils";
import { TestimonialsSkeleton } from "./skeletons";
import { ScrollReveal } from "./ScrollReveal";

interface TestimonialsSectionProps {
  homepageSections: Record<string, boolean>;
  testimonials: PublicTestimonial[];
  /** Called after a new review is submitted so React Query re-fetches. */
  refetchTestimonials: () => void;
  user: any;
}

export function TestimonialsSection({ homepageSections, testimonials, refetchTestimonials, user }: TestimonialsSectionProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating]       = useState(5);
  const [reviewText, setReviewText]           = useState("");
  const { scrollRef, scrollLeft, scrollRight } = useAutoHorizontalScroll({ delay: 5000 });

  if (!homepageSections["testimonials"]) return null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await testimonialsApi.create({
        userName: `${user?.firstName} ${user?.lastName}`,
        rating: reviewRating,
        content: reviewText,
        avatar: user?.photo,
        email: user?.email,
      });
      refetchTestimonials();
      setShowReviewModal(false);
      setReviewText("");
      setReviewRating(5);
    } catch {}
  };

  const isLoading = testimonials.length === 0;

  return (
    <ScrollReveal>
      {isLoading ? (
        <div className="py-8 md:py-10 px-4"><TestimonialsSkeleton /></div>
      ) : (
        <Section
          title="What Travelers Say"
          subtitle="Real experiences from our community"
          className="py-8 md:py-10 px-4 bg-[#F7F8FA] text-black"
          rightContent={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollLeft}
                className="h-10 w-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
              >
                <SlArrowLeft className="w-3.5 h-3.5 text-gray-600" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollRight}
                className="h-10 w-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
              >
                <SlArrowRight className="w-3.5 h-3.5 text-gray-600" />
              </Button>
            </div>
          }
        >
          {/* Testimonial cards */}
          <motion.div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-hidden gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={t.id ?? i}
                className="flex-shrink-0 snap-center w-full md:w-1/3 lg:w-1/4 px-2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <TestimonialCard userName={t.userName} rating={t.rating} content={t.content} avatar={t.avatar} />
              </motion.div>
            ))}
          </motion.div>

          {/* Write a review CTA */}
          <div className="flex justify-center mt-10">
            <Button
              onClick={() => setShowReviewModal(true)}
              className="bg-[#FF385C] hover:bg-[#E31C5F] text-white rounded-full px-8 h-11 transition-all duration-200 font-medium flex items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <span>Write a Review</span>
              <SlArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Section>
      )}

      {/* ── Review modal ── */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="bg-white text-black dark:bg-gray-900 dark:text-white rounded-2xl sm:rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add your review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-5">
            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-100 flex-shrink-0">
                <img src={getImageUrl(user?.photo) || "/user-avatar.svg"} alt={user?.email || "Guest"} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">{user?.firstName || "Guest"}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rating</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <motion.button
                    type="button"
                    key={n}
                    onClick={() => setReviewRating(n)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.92 }}
                    className={`w-8 h-8 rounded-full border text-sm font-semibold transition-colors duration-150 flex items-center justify-center ${
                      reviewRating >= n
                        ? "bg-[#FF385C] text-white border-[#FF385C] shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 hover:border-[#FF385C]"
                    }`}
                  >
                    {n}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Text area */}
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience..."
              required
              className="min-h-[120px] resize-none border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-[#222222] focus:border-[#222222] rounded-xl text-sm"
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReviewModal(false)}
                className="rounded-full border-gray-200 text-gray-700 hover:bg-gray-50 px-5 h-10 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-[#FF385C] hover:bg-[#E31C5F] text-white px-5 h-10 text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                Submit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ScrollReveal>
  );
}
