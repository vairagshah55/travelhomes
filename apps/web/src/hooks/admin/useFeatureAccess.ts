import { useMemo } from "react";
import { useAuth } from "@/contexts/AdminAuthContext";

export interface FeatureAccess {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * The four action grants the signed-in admin holds on a feature.
 *
 * `AdminProtectedRoute` decides whether a page opens at all (view), but a role
 * can hold *view* on an area without *edit/create/delete* — the role matrix's
 * "View Access" column. Without this, a view-only staff member still saw every
 * Add / Edit / Delete affordance and only found out the grant was missing when
 * the API answered 403.
 *
 * The server is still the enforcement point (`requireFeature` maps the HTTP
 * method to the flag); this only keeps the UI from offering what would be
 * refused.
 *
 *   const access = useFeatureAccess(ADMIN_FEATURES.users);
 *   ...
 *   primaryAction={access.canCreate ? <AddButton/> : undefined}
 */
export function useFeatureAccess(feature: string | string[]): FeatureAccess {
  const { can } = useAuth();
  const key = Array.isArray(feature) ? feature.join("|") : feature;

  return useMemo(
    () => ({
      canView: can(feature, "view"),
      canCreate: can(feature, "create"),
      canEdit: can(feature, "edit"),
      canDelete: can(feature, "delete"),
    }),
    // `feature` may be a fresh array literal each render; key on its contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [can, key],
  );
}

export default useFeatureAccess;
