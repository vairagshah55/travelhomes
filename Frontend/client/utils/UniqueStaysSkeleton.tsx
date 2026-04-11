import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const UniqueStaysSkeleton = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
      {/* Title */}
      <div className="mb-6">
        <div className="h-7 w-36 sm:w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 sm:w-80 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Cards */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[200px] sm:w-[260px] md:w-[280px] bg-white rounded-xl"
          >
            {/* Image */}
            <div className="relative">
              <div className="h-[150px] sm:h-[180px] w-full bg-gray-200 rounded-xl animate-pulse" />

              {/* Heart icon placeholder */}
              <div className="absolute top-3 right-3 h-6 w-6 bg-gray-200 rounded-full animate-pulse" />
            </div>

            {/* Content */}
            <div className="mt-3 space-y-2 px-2 sm:px-3">
              {/* Title + rating */}
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 sm:w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-8 sm:w-10 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Location */}
              <div className="h-3 w-32 sm:w-40 bg-gray-200 rounded animate-pulse" />

              {/* Price */}
              <div className="flex gap-2 items-center mt-2">
                <div className="h-4 w-10 sm:w-12 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const ShimmerBlock = ({ className = "" }: { className?: string }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
  </div>
);

export const StayDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-20 pb-6">
        {/* Back + Title */}
        <ShimmerBlock className="h-4 w-16 mb-5 rounded" />
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
          <div className="flex-1">
            <ShimmerBlock className="h-8 w-64 sm:w-80 mb-3 rounded-lg" />
            <ShimmerBlock className="h-4 w-40 sm:w-52 rounded" />
          </div>
          <div className="flex gap-3">
            <ShimmerBlock className="h-10 w-24 rounded-full" />
            <ShimmerBlock className="h-10 w-20 rounded-full" />
            <ShimmerBlock className="h-10 w-24 rounded-full" />
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-8 h-[250px] sm:h-[300px] lg:h-[400px]">
          <ShimmerBlock className="col-span-2 row-span-2 rounded-xl !rounded-lg" />
          <ShimmerBlock className="rounded-xl" />
          <ShimmerBlock className="rounded-xl" />
          <ShimmerBlock className="col-span-2 rounded-xl" />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 sm:gap-6 mb-8 border-b border-gray-100 dark:border-gray-800 pb-3">
          {[80, 72, 68, 76, 88, 64].map((w, i) => (
            <ShimmerBlock key={i} className="h-5 rounded" style={{ width: w }} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Overview */}
            <div>
              <ShimmerBlock className="h-6 w-28 mb-4 rounded" />
              <ShimmerBlock className="h-4 w-full mb-2.5 rounded" />
              <ShimmerBlock className="h-4 w-full mb-2.5 rounded" />
              <ShimmerBlock className="h-4 w-4/5 rounded" />
            </div>

            {/* Amenities */}
            <div>
              <ShimmerBlock className="h-6 w-28 mb-5 rounded" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <ShimmerBlock className="h-10 w-10 rounded-lg flex-shrink-0" />
                    <ShimmerBlock className="h-4 w-24 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <ShimmerBlock className="h-6 w-24 mb-5 rounded" />
              <div className="flex items-center gap-8 mb-6">
                <ShimmerBlock className="h-16 w-16 rounded-xl" />
                <div className="flex-1 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <ShimmerBlock className="h-3 w-20 rounded" />
                      <ShimmerBlock className="h-2 flex-1 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Owner */}
            <div className="flex items-center gap-4">
              <ShimmerBlock className="h-14 w-14 rounded-full flex-shrink-0" />
              <div>
                <ShimmerBlock className="h-4 w-32 mb-2 rounded" />
                <ShimmerBlock className="h-3 w-24 rounded" />
              </div>
            </div>
          </div>

          {/* Right Booking Card */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <ShimmerBlock className="h-8 w-36 rounded-lg" />
              <ShimmerBlock className="h-12 w-full rounded-xl" />
              <ShimmerBlock className="h-12 w-full rounded-xl" />
              <ShimmerBlock className="h-12 w-full rounded-xl" />
              <ShimmerBlock className="h-4 w-full rounded" />
              <ShimmerBlock className="h-4 w-3/4 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniqueStaysSkeleton;