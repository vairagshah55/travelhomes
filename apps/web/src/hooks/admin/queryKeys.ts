/**
 * Centralized React Query key factory for the admin app.
 *
 * Convention: ["admin", <entity>, <params?>]. The leading "admin" namespace lets
 * a single `invalidateQueries({ queryKey: adminKeys.users() })` clear every
 * user-list variant (all tabs/pages/filters) after a mutation, while the
 * params object keeps page-to-page navigation cached.
 *
 * Always spread params through these helpers so keys stay structurally stable
 * (React Query hashes by value, so object key order does not matter).
 */
export const adminKeys = {
  all: ["admin"] as const,

  dashboard: () => [...adminKeys.all, "dashboard"] as const,

  users: (params?: object) =>
    params ? ([...adminKeys.all, "users", params] as const) : ([...adminKeys.all, "users"] as const),

  vendors: (params?: object) =>
    params ? ([...adminKeys.all, "vendors", params] as const) : ([...adminKeys.all, "vendors"] as const),

  bookings: (params?: object) =>
    params ? ([...adminKeys.all, "bookings", params] as const) : ([...adminKeys.all, "bookings"] as const),

  payments: (params?: object) =>
    params ? ([...adminKeys.all, "payments", params] as const) : ([...adminKeys.all, "payments"] as const),

  listings: (params?: object) =>
    params ? ([...adminKeys.all, "listings", params] as const) : ([...adminKeys.all, "listings"] as const),

  staff: (params?: object) =>
    params ? ([...adminKeys.all, "staff", params] as const) : ([...adminKeys.all, "staff"] as const),

  roles: (params?: object) =>
    params ? ([...adminKeys.all, "roles", params] as const) : ([...adminKeys.all, "roles"] as const),

  notifications: (scope?: string) =>
    scope ? ([...adminKeys.all, "notifications", scope] as const) : ([...adminKeys.all, "notifications"] as const),
};

export default adminKeys;
