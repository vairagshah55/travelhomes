import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { offersService } from "@/services/api";
import { adminKeys } from "./queryKeys";

/**
 * Shape of a listing/offer as returned by the API and read by the admin pages.
 * Fields mirror what ManagementListing, ViewDetailsPopup, and ManagementForm use.
 */
export interface Offer {
  _id: string;
  vendorId?: string;
  /** Display name of the listing. */
  name: string;
  title?: string;
  category?: string;
  regularPrice?: string | number;
  finalPrice?: string | number;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  description?: string;
  features?: string;
  rules?: string;
  priceIncludes?: string;
  priceExcludes?: string;
  seatingCapacity?: string | number;
  sleepingCapacity?: string | number;
  timeDuration?: string;
  /** The overall status value stored on the server. */
  status?: string;
  /** Photos object — may contain a `coverUrl` key. */
  photos?: { coverUrl?: string; [key: string]: unknown };
  /** Flat cover image URL (alternative to photos.coverUrl). */
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Tab key → API status mapping.
 *
 * Tabs:   "pending" | "approved" | "rejected" | "deactivated"
 * API:    'pending' | 'approved' | 'cancelled'  (rejected is passed as-is even
 *         though the service type doesn't enumerate it; the current page did the
 *         same via `as any`).
 *
 * "deactivated" (tab) maps to "cancelled" (API status).
 */
function tabToStatus(tab: string): "pending" | "approved" | "cancelled" | "rejected" {
  if (tab === "deactivated") return "cancelled";
  return tab as "pending" | "approved" | "cancelled" | "rejected";
}

/**
 * Listings list + create / update / setStatus / delete mutations.
 *
 * Every mutation toasts (sonner) and invalidates the full listings namespace so
 * any active tab refreshes, mirroring the useVendors pattern.
 */
export function useListings(tab: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminKeys.listings() });

  const query = useQuery<Offer[]>({
    queryKey: adminKeys.listings({ tab }),
    queryFn: async () => {
      const status = tabToStatus(tab);
      // offersService.list returns { success, count, data }; unwrap .data.
      const res = await offersService.list(status as any);
      const data = res?.data ?? res;
      return Array.isArray(data) ? data : [];
    },
  });

  const createListing = useMutation({
    mutationFn: (payload: Record<string, unknown>) => offersService.create(payload),
    onSuccess: () => {
      toast.success("Listing created successfully.");
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.message || err?.error || "Failed to create listing."),
  });

  const updateListing = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      offersService.update(id, payload),
    onSuccess: () => {
      toast.success("Listing updated successfully.");
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.message || err?.error || "Failed to update listing."),
  });

  const setStatus = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "pending" | "approved" | "cancelled";
      reason?: string;
    }) => offersService.setStatus(id, status, reason),
    onSuccess: (_d, { status }) => {
      const label =
        status === "approved"
          ? "Listing approved."
          : status === "pending"
            ? "Listing marked as pending."
            : "Listing deactivated.";
      toast.success(label);
      invalidate();
    },
    onError: () => toast.error("Failed to update listing status."),
  });

  const deleteListing = useMutation({
    mutationFn: (id: string) => offersService.remove(id),
    onSuccess: () => {
      toast.success("Listing deleted successfully.");
      invalidate();
    },
    onError: () => toast.error("Failed to delete listing."),
  });

  return { query, createListing, updateListing, setStatus, deleteListing };
}

export default useListings;
