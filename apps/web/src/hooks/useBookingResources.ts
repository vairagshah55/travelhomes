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
      const resOffers = await offersApi.list(undefined, token, params);

      let activityData: any[] = [];
      if (token && user!.userType === "vendor") {
        const my = await activitiesApi.myList(token);
        if (my.success) activityData = my.data;
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
