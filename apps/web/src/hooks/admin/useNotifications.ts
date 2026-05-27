import { useQuery } from "@tanstack/react-query";
import { notificationsService } from "@/services/api";
import { adminKeys } from "./queryKeys";

/**
 * Admin notification unread count for the header bell, polled every 60s.
 * Replaces the header's inline fetch + setInterval; errors are swallowed by
 * React Query (we never want header polling to surface a toast).
 */
export function useNotificationCount() {
  return useQuery({
    queryKey: adminKeys.notifications("unread-count"),
    queryFn: notificationsService.getUnreadCount,
    refetchInterval: 60_000,
    // header polling should never throw a visible error
    retry: false,
  });
}

export default useNotificationCount;
