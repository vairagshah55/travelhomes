import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ── Shimmer base block ────────────────────────────────────────────────────── */
function Shim({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
    </div>
  );
}

/* ── Section header ────────────────────────────────────────────────────────── */
export function SectionHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Shim className="h-7 w-44 rounded-lg" />
      <Shim className="h-4 w-64 rounded-md" />
    </div>
  );
}

/* ── Card grid (offers / top-rated) ───────────────────────────────────────── */
export function CardGridSkeleton({ cols = 4, count = 4 }: { cols?: number; count?: number }) {
  return (
    <div className="space-y-6">
      <SectionHeaderSkeleton />
      <div className={cn("grid gap-5", {
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4": cols === 4,
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3": cols === 3,
        "grid-cols-1 sm:grid-cols-2":               cols === 2,
      })}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
            {/* Image */}
            <Shim className="h-48 w-full rounded-none" />
            {/* Body */}
            <div className="p-3 space-y-2">
              <div className="flex items-start justify-between">
                <Shim className="h-4 w-28 rounded-md" />
                <Shim className="h-4 w-10 rounded-md" />
              </div>
              <Shim className="h-3 w-36 rounded-md" />
              <div className="flex items-center gap-2 pt-1">
                <Shim className="h-4 w-14 rounded-md" />
                <Shim className="h-3 w-20 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Horizontal card row (mobile-friendly) ────────────────────────────────── */
export function CardRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-6">
      <SectionHeaderSkeleton />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-64 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
            <Shim className="h-44 w-full rounded-none" />
            <div className="p-3 space-y-2">
              <Shim className="h-4 w-28 rounded-md" />
              <Shim className="h-3 w-36 rounded-md" />
              <Shim className="h-4 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Testimonials row ─────────────────────────────────────────────────────── */
export function TestimonialsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Shim className="h-7 w-44 rounded-lg" />
          <Shim className="h-4 w-52 rounded-md" />
        </div>
        <div className="flex gap-3">
          <Shim className="h-11 w-11 rounded-full" />
          <Shim className="h-11 w-11 rounded-full" />
        </div>
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-72 rounded-2xl bg-white dark:bg-gray-900 shadow-sm p-5 space-y-4">
            {/* Stars */}
            <div className="flex gap-1">
              {[...Array(5)].map((_, j) => <Shim key={j} className="h-4 w-4 rounded" />)}
            </div>
            {/* Text lines */}
            <div className="space-y-1.5">
              <Shim className="h-3 w-full rounded" />
              <Shim className="h-3 w-full rounded" />
              <Shim className="h-3 w-3/4 rounded" />
            </div>
            {/* Avatar + name */}
            <div className="flex items-center gap-3 pt-2">
              <Shim className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="space-y-1.5">
                <Shim className="h-3 w-24 rounded" />
                <Shim className="h-2.5 w-16 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Articles grid ────────────────────────────────────────────────────────── */
export function ArticlesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Shim className="h-7 w-52 rounded-lg" />
          <Shim className="h-4 w-60 rounded-md" />
        </div>
        <Shim className="h-10 w-36 rounded-full" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
            <Shim className="h-44 w-full rounded-none" />
            <div className="p-3 space-y-2">
              <Shim className="h-4 w-full rounded" />
              <Shim className="h-3 w-3/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Destinations grid ────────────────────────────────────────────────────── */
export function DestinationsSkeleton() {
  return (
    <div className="space-y-6">
      <Shim className="h-7 w-52 rounded-lg" />
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
        <div className="flex flex-col gap-4">
          <Shim className="h-52 w-full" />
        </div>
        <Shim className="h-80 w-full" />
        <Shim className="h-80 w-full" />
        <div className="flex flex-col gap-4">
          <Shim className="h-44 w-full" />
          <div className="space-y-2">
            <Shim className="h-3 w-full rounded" />
            <Shim className="h-3 w-3/4 rounded" />
          </div>
        </div>
      </div>
      {/* Mobile */}
      <div className="flex gap-4 overflow-hidden lg:hidden">
        {[...Array(4)].map((_, i) => <Shim key={i} className="flex-shrink-0 w-52 h-44" />)}
      </div>
    </div>
  );
}

/* ── FAQ section ──────────────────────────────────────────────────────────── */
export function FAQSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col lg:flex-row gap-12">
      {/* Left */}
      <div className="lg:w-4/12 space-y-5">
        <Shim className="h-8 w-64 rounded-lg" />
        <Shim className="h-4 w-80 rounded" />
        <Shim className="h-4 w-72 rounded" />
        <Shim className="h-12 w-full rounded-full mt-4" />
      </div>
      {/* Right */}
      <div className="lg:w-7/12 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm p-4 space-y-2">
            <Shim className="h-5 w-3/4 rounded" />
            <Shim className="h-3 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
