import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookingService } from "@/services/api";
import { adminKeys } from "./queryKeys";

export interface Booking {
  _id: string;
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  serviceType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  location: string;
  specialRequests?: string;
}

export interface BookingQueryParams {
  tab: string;
  serviceType?: string;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

/**
 * Booking list + delete/status mutations, all routed through the shared axios
 * service (auth via interceptor) and React Query. Bookings are fetched
 * server-side: every param (tab, serviceType, search, sortBy, sortDir) is
 * included in the query key so any change triggers a fresh fetch. Mutations
 * toast and invalidate the whole bookings namespace so all open tabs refresh.
 */
export function useBookings(params: BookingQueryParams) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminKeys.bookings() });

  const query = useQuery<Booking[]>({
    queryKey: adminKeys.bookings(params),
    queryFn: async () => {
      const response = await bookingService.getBookings(params);
      if (response && Array.isArray(response.data)) return response.data;
      if (Array.isArray(response)) return response as Booking[];
      return [];
    },
  });

  const deleteBooking = useMutation({
    mutationFn: (id: string) => bookingService.deleteBooking(id),
    onSuccess: () => {
      toast.success("Booking deleted successfully.");
      invalidate();
    },
    onError: () => toast.error("Failed to delete booking."),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      bookingService.updateBookingStatus(id, status),
    onSuccess: () => {
      toast.success("Booking status updated.");
      invalidate();
    },
    onError: () => toast.error("Failed to update booking status."),
  });

  return { query, deleteBooking, setStatus };
}

export default useBookings;
