import React from "react";
import { Search, SlidersHorizontal, X, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRAND_VARS, SELECT_ITEM } from "@/components/shared/Panel";
import { motion, AnimatePresence } from "framer-motion";

export interface ToolbarBulkAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface AdminToolbarProps {
  // Search
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;

  // Sort
  sortOptions?: Array<{ value: string; label: string }>;
  sortValue?: string;
  onSortChange?: (v: string) => void;

  // Filter trigger
  onFilterOpen?: () => void;
  filterActiveCount?: number;

  // Bulk actions — shown only when selectedCount > 0
  selectedCount?: number;
  bulkActions?: ToolbarBulkAction[];
  onClearSelection?: () => void;

  // Right-side primary action — e.g. "Add User"
  primaryAction?: React.ReactNode;

  className?: string;
}

/**
 * Standard management-page toolbar: search + sort + filter trigger on the left,
 * a primary action on the right, and an animated bulk-action bar that slides in
 * when rows are selected. Replaces the ad-hoc search/sort/filter rows duplicated
 * across the management pages.
 */
export function AdminToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  sortOptions,
  sortValue,
  onSortChange,
  onFilterOpen,
  filterActiveCount = 0,
  selectedCount = 0,
  bulkActions,
  onClearSelection,
  primaryAction,
  className = "",
}: AdminToolbarProps) {
  const hasSelection = selectedCount > 0 && !!bulkActions?.length;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-wrap items-center gap-2 rounded-lg bg-app-accent-soft px-3 py-2"
          >
            <span className="text-[13px] font-semibold text-app-accent">
              {selectedCount} selected
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {bulkActions!.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 h-8 text-[13px] font-medium transition-colors ${
                    action.variant === "danger"
                      ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                      : "text-app-fg hover:bg-app-surface-2"
                  }`}
                >
                  {action.icon && <action.icon size={15} />}
                  {action.label}
                </button>
              ))}
            </div>
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-app-fg-muted hover:text-app-fg"
                aria-label="Clear selection"
              >
                <X size={14} /> Clear
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-fg-subtle"
            />
            <Input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full sm:w-64 pl-9 text-sm"
              aria-label={searchPlaceholder}
            />
          </div>

          {/* Sort */}
          {sortOptions?.length && onSortChange ? (
            <Select value={sortValue} onValueChange={onSortChange}>
              <SelectTrigger className="h-10 w-44 text-sm rounded-full border-app-border bg-app-surface-2">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              {/* Radix portals this to <body>, outside any page root, so it needs
                  its own BRAND_VARS; SELECT_ITEM works around the duplicated
                  `--accent` token that renders highlighted rows white-on-white.
                  See the note on SELECT_ITEM in components/shared/Panel.tsx. */}
              <SelectContent style={BRAND_VARS}>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className={SELECT_ITEM}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {/* Filter trigger */}
          {onFilterOpen && (
            <button
              onClick={onFilterOpen}
              className="relative inline-flex items-center gap-2 h-10 px-4 rounded-full border border-app-border bg-app-surface-2 text-[13px] font-medium text-app-fg hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-2"
              aria-label={
                filterActiveCount > 0 ? `Filters, ${filterActiveCount} active` : "Filters"
              }
            >
              <SlidersHorizontal size={15} />
              Filters
              {filterActiveCount > 0 && (
                <span className="grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-app-accent text-app-accent-fg text-[10px] font-bold leading-none">
                  {filterActiveCount}
                </span>
              )}
            </button>
          )}
        </div>

        {primaryAction && <div className="flex items-center gap-2">{primaryAction}</div>}
      </div>
    </div>
  );
}

export default AdminToolbar;
