import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { paymentService } from "@/services/api";
import { adminKeys } from "./queryKeys";

export interface PaymentData {
  _id: string;
  paymentId: string;
  businessName: string;
  personName: string;
  servicesId: string;
  servicesNames: string;
  status: string;
  amount?: string;
  paymentMode?: string;
  transactionId?: string;
}

export interface PaymentParams {
  tab: string;
  serviceType?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

/**
 * Payments list + delete mutation, routed through the shared axios service
 * (auth via interceptor) and React Query. All queries are server-side filtered
 * by tab/serviceType/search/sortBy/sortDir. The delete mutation toasts and
 * invalidates the whole payments namespace so every active variant refreshes.
 */
export function usePayments(params: PaymentParams) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminKeys.payments() });

  const query = useQuery<PaymentData[]>({
    queryKey: adminKeys.payments(params),
    queryFn: async () => {
      const response = await paymentService.getPayments(params);
      if (response && response.data) return response.data as PaymentData[];
      if (Array.isArray(response)) return response as PaymentData[];
      return [];
    },
  });

  const deletePayment = useMutation({
    mutationFn: (id: string) => paymentService.deletePayment(id),
    onSuccess: () => {
      toast.success("Payment deleted successfully.");
      invalidate();
    },
    onError: () => toast.error("Failed to delete payment."),
  });

  return { query, deletePayment };
}

export default usePayments;
