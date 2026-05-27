import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminStaffService, adminRolesService } from "@/services/api";
import { adminKeys } from "./queryKeys";

// ---------------------------------------------------------------------------
// Shared param types
// ---------------------------------------------------------------------------

export interface StaffParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "Active" | "Inactive";
  role?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface RolesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Response shapes returned from the API (partial — only fields we use)
// ---------------------------------------------------------------------------

export interface StaffMemberRaw {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Inactive";
  joinDate: string;
  avatar?: string;
}

export interface StaffListResponse {
  success: boolean;
  staff?: StaffMemberRaw[];
  data?: StaffMemberRaw[];
  pagination?: { totalPages: number; total: number; page: number; limit: number };
}

export interface RoleRaw {
  _id: string;
  name: string;
  features: string[];
}

export interface RolesListResponse {
  success: boolean;
  roles?: RoleRaw[];
  data?: RoleRaw[];
  pagination?: { totalPages: number; total: number; page: number; limit: number };
}

// ---------------------------------------------------------------------------
// useStaff — staff list + create/delete/toggle mutations
// ---------------------------------------------------------------------------

/**
 * Mirrors the useVendors pattern:
 *  - useQuery over adminStaffService.getStaff with paged params
 *  - mutations toast on success/error and invalidate the whole staff namespace
 */
export function useStaff(params: StaffParams = {}) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminKeys.staff() });

  const query = useQuery<StaffListResponse>({
    queryKey: adminKeys.staff(params),
    queryFn: () =>
      adminStaffService.getStaff({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        sortBy: params.sortBy ?? "createdAt",
        sortOrder: params.sortOrder ?? "desc",
        ...(params.search ? { search: params.search } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.role ? { role: params.role } : {}),
      }),
  });

  const createStaff = useMutation({
    mutationFn: (payload: Parameters<typeof adminStaffService.create>[0]) =>
      adminStaffService.create(payload),
    onSuccess: () => {
      toast.success("Staff account created successfully.");
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.message || err?.error || "Failed to create staff account."),
  });

  const updateStaff = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      adminStaffService.update(id, payload),
    onSuccess: () => {
      toast.success("Staff updated successfully.");
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.message || err?.error || "Failed to update staff."),
  });

  const deleteStaff = useMutation({
    mutationFn: (id: string) => adminStaffService.remove(id),
    onSuccess: () => {
      toast.success("Staff account deleted.");
      invalidate();
    },
    onError: () => toast.error("Failed to delete staff."),
  });

  const toggleStaffStatus = useMutation({
    mutationFn: (id: string) => adminStaffService.toggleStatus(id),
    onSuccess: () => {
      toast.success("Staff status updated.");
      invalidate();
    },
    onError: () => toast.error("Failed to update staff status."),
  });

  return { query, createStaff, updateStaff, deleteStaff, toggleStaffStatus };
}

// ---------------------------------------------------------------------------
// useRoles — roles list + create/delete/toggle mutations
// ---------------------------------------------------------------------------

export function useRoles(params: RolesParams = {}) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminKeys.roles() });

  const query = useQuery<RolesListResponse>({
    queryKey: adminKeys.roles(params),
    queryFn: () =>
      adminRolesService.getRoles({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        sortBy: params.sortBy ?? "createdAt",
        sortOrder: params.sortOrder ?? "desc",
        ...(params.search ? { search: params.search } : {}),
        ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      }),
  });

  const createRole = useMutation({
    mutationFn: (payload: Parameters<typeof adminRolesService.create>[0]) =>
      adminRolesService.create(payload),
    onSuccess: () => {
      toast.success("Role created successfully.");
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.message || err?.error || "Failed to create role."),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      adminRolesService.update(id, payload),
    onSuccess: () => {
      toast.success("Role updated successfully.");
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.message || err?.error || "Failed to update role."),
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => adminRolesService.remove(id),
    onSuccess: () => {
      toast.success("Role deleted.");
      invalidate();
    },
    onError: () => toast.error("Failed to delete role."),
  });

  const toggleRoleStatus = useMutation({
    mutationFn: (id: string) => adminRolesService.toggleStatus(id),
    onSuccess: () => {
      toast.success("Role status updated.");
      invalidate();
    },
    onError: () => toast.error("Failed to update role status."),
  });

  return { query, createRole, updateRole, deleteRole, toggleRoleStatus };
}
