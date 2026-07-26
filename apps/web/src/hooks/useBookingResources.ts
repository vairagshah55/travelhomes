import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { offersApi, activitiesApi } from "@/lib/api";

export type BookingServiceOption = {
  name: string;
  type: "camper-van" | "unique-stay" | "activity";
};

/** Sentinel the UI shows when a vendor has nothing bookable yet. */
export const NO_SERVICE_SENTINEL = "No Service Available";

/**
 * The vendor's bookable services (offers + activities), shared by the bookings
 * calendar and the New Booking page. Both call this with the same query key, so
 * navigating between them reuses one cached fetch instead of re-requesting.
 *
 * Only *approved* offers and *published* activities are bookable. A service
 * still awaiting admin review (or one that was cancelled/deactivated) must not
 * be selectable, otherwise a vendor can take bookings against a listing that
 * isn't live.
 */
export function useBookingResources() {
  const { user, token: authToken } = useAuth();
  const token = authToken ?? undefined;

  return useQuery<{ names: string[]; services: BookingServiceOption[] }>({
    queryKey: ["bookings", "resources", user?.id, token],
    enabled: !!user,
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (user!.userType === "vendor" && user!.id) {
        params.vendorId = user!.id;
        params.mine = true;
      }
      // `mine=true` scopes to the caller's own offers; `status` narrows that to
      // the approved ones (the server applies the status filter on top of the
      // owner scope). Without it the dropdown also listed pending, cancelled
      // and deactivated services.
      const resOffers = await offersApi.list("approved", token, params);

      let activityData: any[] = [];
      if (token && user!.userType === "vendor") {
        const my = await activitiesApi.myList(token);
        // The vendor's own list returns every draft/archived activity too —
        // there's no server-side status filter on this endpoint, so narrow here.
        if (my.success) activityData = my.data.filter((a) => a.status === "published");
      } else {
        const all = await activitiesApi.list();
        if (all.success) activityData = all.data;
      }

      const names: string[] = [];
      const services: BookingServiceOption[] = [];
      if (resOffers.success) {
        // No client-side re-filter by vendorId here: `mine=true` already scopes
        // the response to the caller's own offers, and an offer's `vendorId` is
        // the Vendor code (e.g. "VD8178") while `user.id` is the Register
        // ObjectId — comparing them dropped every service, which is why the
        // Service Name dropdown showed "No services yet".
        for (const o of resOffers.data) {
          names.push(o.name);
          const t = (o.serviceType || "").toLowerCase();
          services.push({
            name: o.name,
            type:
              t === "unique-stay" ? "unique-stay" : t === "activity" ? "activity" : "camper-van",
          });
        }
      }
      for (const a of activityData) {
        names.push(a.title);
        services.push({ name: a.title, type: "activity" });
      }

      return { names: names.length > 0 ? names : [NO_SERVICE_SENTINEL], services };
    },
  });
}
