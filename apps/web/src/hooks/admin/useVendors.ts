import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { vendorService } from "@/services/api";
import { adminKeys } from "./queryKeys";

export interface Vendor {
  _id: string;
  vendorId: string;
  photo: string;
  brandName: string;
  personName: string;
  listedServices: number;
  location: string;
  status: string;
  createdAt?: string;
  action?: string;
}

/**
 * Vendor list + create/status/delete mutations, all routed through the shared
 * axios service (auth via interceptor) and React Query. Every mutation toasts
 * and invalidates the whole vendors namespace so any active tab refreshes.
 */
export function useVendors(tab: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: adminKeys.vendors() });

  const query = useQuery<Vendor[]>({
    queryKey: adminKeys.vendors({ tab }),
    queryFn: async () => {
      const list = await vendorService.getVendors(tab);
      return Array.isArray(list) ? list : [];
    },
  });

  const createVendor = useMutation({
    mutationFn: (payload: Record<string, unknown>) => vendorService.createVendor(payload),
    onSuccess: () => {
      toast.success("Vendor created successfully.");
      invalidate();
    },
    onError: (err: any) => toast.error(err?.message || err?.error || "Failed to create vendor."),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      vendorService.updateVendorStatus(id, status),
    onSuccess: (_d, { status }) => {
      toast.success(status === "banned" ? "Vendor banned successfully." : "Vendor status updated.");
      invalidate();
    },
    onError: () => toast.error("Failed to update vendor status."),
  });

  const deleteVendor = useMutation({
    mutationFn: (id: string) => vendorService.deleteVendor(id),
    onSuccess: () => {
      toast.success("Vendor deleted successfully.");
      invalidate();
    },
    onError: () => toast.error("Failed to delete vendor."),
  });

  return { query, createVendor, setStatus, deleteVendor };
}

export default useVendors;
