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

export const StayDetailsSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 mt-20 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4 md:gap-0">
        <div>
          <Skeleton className="h-6 w-32 sm:w-40 mb-2 bg-gray-200" />
          <Skeleton className="h-4 w-24 sm:w-28 bg-gray-200" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-16 sm:w-20 rounded-md bg-gray-200" />
          <Skeleton className="h-9 w-16 sm:w-20 rounded-md bg-gray-200" />
          <Skeleton className="h-9 w-20 sm:w-24 rounded-md bg-gray-200" />
        </div>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
        <Skeleton className="col-span-2 row-span-2 h-40 sm:h-[320px] rounded-xl bg-gray-200" />
        <Skeleton className="h-32 sm:h-[150px] rounded-xl bg-gray-200" />
        <Skeleton className="h-32 sm:h-[150px] rounded-xl bg-gray-200" />
        <Skeleton className="h-32 sm:h-[150px] rounded-xl bg-gray-200" />
        <Skeleton className="h-32 sm:h-[150px] rounded-xl bg-gray-200" />
      </div>

      {/* Tabs */}
      <div className="flex gap-3 sm:gap-6 mb-8 flex-wrap">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-5 w-16 sm:w-20" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview */}
          <div>
            <Skeleton className="h-6 w-28 sm:w-32 mb-4 bg-gray-200" />
            <Skeleton className="h-4 w-full mb-2 bg-gray-200" />
            <Skeleton className="h-4 w-5/6 bg-gray-200" />
          </div>

          {/* Amenities */}
          <div>
            <Skeleton className="h-6 w-28 sm:w-32 mb-4 bg-gray-200" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-20 sm:w-24 bg-gray-200" />
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <Skeleton className="h-6 w-28 sm:w-32 mb-4 bg-gray-200" />
            <Skeleton className="h-10 w-16 sm:w-20 mb-4 bg-gray-200" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full mb-2 bg-gray-200" />
            ))}
          </div>

          {/* Owner */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full bg-gray-200" />
            <div>
              <Skeleton className="h-4 w-28 sm:w-32 mb-2 bg-gray-200" />
              <Skeleton className="h-4 w-20 sm:w-24 bg-gray-200" />
            </div>
          </div>
        </div>

        {/* Right Price Card */}
        <div>
          <Skeleton className="h-[280px] rounded-xl bg-gray-200" />
        </div>
      </div>

      {/* More Unique Stays */}
      <div className="mt-16">
        <Skeleton className="h-6 w-32 sm:w-40 mb-6 bg-gray-200" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-52 sm:h-[220px] rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UniqueStaysSkeleton;