import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const UniqueStaysSkeleton = () => {
  return (
    <section className="w-full px-4 md:px-10">
      {/* Title */}
      <div className="mb-6">
        <div className="h-7 w-48 bg-gray-300 rounded animate-pulse mb-2" />
        <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Cards */}
      <div className="flex gap-5 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="min-w-[260px] bg-white rounded-xl"
          >
            {/* Image */}
            <div className="relative">
              <div className="h-[180px] w-full bg-gray-300 rounded-xl animate-pulse" />

              {/* Heart icon placeholder */}
              <div className="absolute top-3 right-3 h-6 w-6 bg-gray-200 rounded-full animate-pulse" />
            </div>

            {/* Content */}
            <div className="mt-3 space-y-2">
              {/* Title + rating */}
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-gray-300 rounded animate-pulse" />
                <div className="h-4 w-10 bg-gray-300 rounded animate-pulse" />
              </div>

              {/* Location */}
              <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />

              {/* Price */}
              <div className="flex gap-2 items-center mt-2">
                <div className="h-4 w-12 bg-gray-300 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 mt-20 py-6">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <Skeleton className="col-span-2 row-span-2 h-[320px] rounded-xl" />
        <Skeleton className="h-[150px] rounded-xl" />
        <Skeleton className="h-[150px] rounded-xl" />
        <Skeleton className="h-[150px] rounded-xl" />
        <Skeleton className="h-[150px] rounded-xl" />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-5 w-20" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Overview */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* Amenities */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-20 mb-4" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full mb-2" />
            ))}
          </div>

          {/* Owner */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        {/* Right Price Card */}
        <div>
          <Skeleton className="h-[280px] rounded-xl" />
        </div>
      </div>

      {/* More Unique Stays */}
      <div className="mt-16">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-xl" />
          ))}
        </div>
      </div>

    </div>
  );
};


export default UniqueStaysSkeleton;
