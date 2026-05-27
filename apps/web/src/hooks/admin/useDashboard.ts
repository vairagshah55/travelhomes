import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/api";
import { adminKeys } from "./queryKeys";

/**
 * Dashboard overview (stats + graphs + latest tickets), polled every 60s.
 * Replaces the raw fetch + setInterval that lived in AdminDashboard, and routes
 * auth through the shared axios interceptor.
 */
export function useDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: dashboardService.getOverview,
    refetchInterval: 60_000,
  });
}

export default useDashboard;
