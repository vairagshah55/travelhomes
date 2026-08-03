import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { useStaff, useRoles } from "@/hooks/admin/useStaff";
import { useFeatureAccess } from "@/hooks/admin/useFeatureAccess";
import { ADMIN_FEATURES } from "@/lib/adminPermissions";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Inactive";
  joinDate: string;
  avatar?: string;
}

interface StaffRole {
  id: string;
  name: string;
  features: string[];
}

// ---------------------------------------------------------------------------
// Permission matrix type used inside AddRoleModal
// ---------------------------------------------------------------------------

type FeatureKey =
  | "Dashboard"
  | "Management"
  | "Payments"
  | "Listing"
  | "Vendor"
  | "User"
  | "Bookings"
  | "Analytics"
  | "Help Desk"
  | "CMS"
  | "Marketing"
  | "Plugins"
  | "Staff"
  | "Roles"
  | "CRM"
  | "Settings";

type PermissionMatrix = Record<FeatureKey, { view: boolean; full: boolean }>;

// Every row the admin SPA gates on must appear here — `lib/adminPermissions.ts`
// is the list of features routes ask for, and a feature with no row is one no
// role can ever be granted. Bookings (/admin/management/booking) and Roles
// (/admin/staff/roles) were missing, so those two areas were unreachable for
// every staff account regardless of what was ticked.
const EMPTY_MATRIX: PermissionMatrix = {
  Dashboard: { view: false, full: false },
  Management: { view: false, full: false },
  Payments: { view: false, full: false },
  Listing: { view: false, full: false },
  Vendor: { view: false, full: false },
  User: { view: false, full: false },
  Bookings: { view: false, full: false },
  Analytics: { view: false, full: false },
  "Help Desk": { view: false, full: false },
  CMS: { view: false, full: false },
  Marketing: { view: false, full: false },
  Plugins: { view: false, full: false },
  Staff: { view: false, full: false },
  Roles: { view: false, full: false },
  CRM: { view: false, full: false },
  Settings: { view: false, full: false },
};

// ---------------------------------------------------------------------------
// FEATURE_MAPPING — used in handleAddRole to convert UI labels to API slugs.
// Every FeatureKey must appear here: the API only accepts slugs from
// AdminRole.AVAILABLE_FEATURES, so an unmapped label fails validation.
// ---------------------------------------------------------------------------

const FEATURE_MAPPING: Record<FeatureKey, string> = {
  Dashboard: "view_dashboard",
  Management: "access_management",
  Payments: "manage_payments",
  Listing: "manage_inventory",
  Vendor: "manage_vendors",
  User: "manage_users",
  Bookings: "access_bookings",
  Analytics: "view_analytics",
  "Help Desk": "support_tickets",
  CMS: "manage_cms",
  Marketing: "manage_marketing",
  Plugins: "manage_plugins",
  Staff: "manage_staff",
  Roles: "manage_roles",
  CRM: "manage_crm",
  Settings: "manage_settings",
};

const REVERSE_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(FEATURE_MAPPING).map(([label, slug]) => [slug, label]),
);

// ---------------------------------------------------------------------------
// AddStaffModal — shadcn Dialog shell, form state kept local
// ---------------------------------------------------------------------------

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (staffData: {
    staffName: string;
    staffNumber: string;
    email: string;
    role: string;
    password: string;
  }) => void;
  roles: StaffRole[];
  isSubmitting?: boolean;
}

const EMPTY_STAFF_FORM = {
  staffName: "",
  staffNumber: "",
  email: "",
  role: "",
  password: "",
};

const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  roles,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState(EMPTY_STAFF_FORM);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) setFormData(EMPTY_STAFF_FORM);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // Modal stays open until mutation onSuccess calls onClose
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && !isSubmitting && onClose()}>
      <DialogContent className="w-full max-w-2xl rounded-xl p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black font-geist text-2xl font-bold">
            Add New Account
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-dashboard-title font-plus-jakarta text-base">Staff Name</label>
              <input
                type="text"
                placeholder="Enter Your Name"
                value={formData.staffName}
                onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-dashboard-title font-plus-jakarta text-base">
                Staff Number
              </label>
              <input
                type="text"
                placeholder="Enter Your Number"
                value={formData.staffNumber}
                onChange={(e) => setFormData({ ...formData, staffNumber: e.target.value })}
                className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-dashboard-title font-plus-jakarta text-base">Email</label>
              <input
                type="email"
                placeholder="Enter Your Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-dashboard-title font-plus-jakarta text-base">
                Role Assign
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary appearance-none bg-white"
                required
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-dashboard-title font-plus-jakarta text-base">Password</label>
              <input
                type="password"
                placeholder="Set a Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary"
                minLength={8}
                required
              />
              <p className="text-xs text-dashboard-neutral-07">At least 8 characters.</p>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-tpl-primary text-white rounded-full font-geist text-base font-medium tracking-tight hover:bg-tpl-primary-hover transition-colors w-full md:w-auto disabled:opacity-60"
            >
              {isSubmitting ? "Adding…" : "Add"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// AddRoleModal — shadcn Dialog shell, permission matrix state kept local
// ---------------------------------------------------------------------------

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roleData: { roleName: string; features: PermissionMatrix }) => void;
  isSubmitting?: boolean;
}

const EMPTY_ROLE_FORM = { roleName: "", features: EMPTY_MATRIX };

const AddRoleModal: React.FC<AddRoleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<{
    roleName: string;
    features: PermissionMatrix;
  }>(EMPTY_ROLE_FORM);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) setFormData({ roleName: "", features: { ...EMPTY_MATRIX } });
  }, [isOpen]);

  const handleFeatureChange = (feature: FeatureKey, type: "view" | "full", checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: {
          ...prev.features[feature],
          [type]: checked,
        },
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ roleName: formData.roleName, features: formData.features });
    // Modal stays open until mutation onSuccess calls onClose
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && !isSubmitting && onClose()}>
      <DialogContent className="w-full max-w-2xl rounded-xl p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black font-geist text-2xl font-bold">
            Add New Role
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-base">Role Name</label>
            <input
              type="text"
              placeholder="Accountant"
              value={formData.roleName}
              onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
              className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary"
              required
            />
          </div>

          {/* Permission matrix — state shape preserved exactly */}
          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-base">Features</label>
            <div className="border border-dashboard-stroke rounded-xl overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-3 px-3 py-3">
                <div className="text-dashboard-title font-plus-jakarta text-sm font-bold">
                  Features Name
                </div>
                <div className="text-dashboard-title font-plus-jakarta text-sm font-bold text-center">
                  View Access
                </div>
                <div className="text-dashboard-title font-plus-jakarta text-sm font-bold text-center">
                  Full Access
                </div>
              </div>
              {(Object.keys(formData.features) as FeatureKey[]).map((feature) => (
                <div
                  key={feature}
                  className="grid grid-cols-3 px-3 py-3.5 border-b border-gray-100 last:border-0"
                >
                  <div className="text-dashboard-body font-poppins text-base">{feature}</div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.features[feature].view}
                      onChange={(e) => handleFeatureChange(feature, "view", e.target.checked)}
                      className="w-5 h-5 border border-dashboard-gray-300 rounded text-dashboard-primary focus:ring-dashboard-primary"
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.features[feature].full}
                      onChange={(e) => handleFeatureChange(feature, "full", e.target.checked)}
                      className="w-5 h-5 border border-dashboard-gray-300 rounded text-dashboard-primary focus:ring-dashboard-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-tpl-primary text-white rounded-full font-geist text-base font-medium tracking-tight hover:bg-tpl-primary-hover transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Saving…" : "Submit"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// DropdownMenu (staff rows) — View removed (no handler); Edit kept with icon
// only as a no-op stub clearly marked TODO; Delete wired to onDelete.
// Decision: removed the dead "View" item entirely; kept "Edit" icon-only as a
// visible affordance but disabled until an edit flow exists.
// ---------------------------------------------------------------------------

const DropdownMenu = ({
  id,
  openId,
  setOpenId,
  onDelete,
  canDelete,
}: {
  id: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onDelete: () => void;
  canDelete: boolean;
}) =>
  // Edit is inert and Delete is the only live item, so a role without delete
  // rights would open an empty menu.
  !canDelete ? null : (
    <div className="relative">
      <button
        onClick={() => setOpenId(openId === id ? null : id)}
        className="text-dashboard-body hover:text-dashboard-primary transition-colors"
      >
        <MoreHorizontal size={24} />
      </button>
      {openId === id && (
        <div className="absolute top-8 right-0 bg-white border border-dashboard-stroke rounded-lg shadow-lg z-10 w-48">
          <div className="py-1">
            {/* Edit — no edit flow implemented yet; button is present but inert */}
            <button
              disabled
              className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-50 opacity-40 cursor-not-allowed"
            >
              <Edit2 size={18} className="text-dashboard-body" />
              <span className="text-dashboard-body font-poppins text-sm">Edit</span>
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-50"
            >
              <Trash2 size={18} className="text-red-600" />
              <span className="text-red-600 font-poppins text-sm">Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

// ---------------------------------------------------------------------------
// DropdownRoleMenu — View removed (no handler); only Delete remains.
// ---------------------------------------------------------------------------

const DropdownRoleMenu = ({
  id,
  openId,
  setOpenId,
  onDelete,
  canDelete,
}: {
  id: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onDelete: () => void;
  canDelete: boolean;
}) =>
  !canDelete ? null : (
    <div className="relative inline-block">
      <button
        onClick={() => setOpenId(openId === id ? null : id)}
        className="text-dashboard-body hover:text-dashboard-primary transition-colors"
      >
        <MoreHorizontal size={24} />
      </button>
      {openId === id && (
        <div className="absolute top-8 right-0 bg-white border border-dashboard-stroke rounded-lg shadow-lg z-10 w-48">
          <div className="py-1">
            <button
              onClick={onDelete}
              className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-50"
            >
              <Trash2 size={18} className="text-red-600" />
              <span className="text-red-600 font-poppins text-sm">Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

// ---------------------------------------------------------------------------
// StaffList — uses useStaff hook; pagination controls page param
// ---------------------------------------------------------------------------

interface StaffListProps {
  setShowStaffModal: (v: boolean) => void;
  deleteStaff: (id: string) => void;
  staffDropdownOpen: string | null;
  setStaffDropdownOpen: (id: string | null) => void;
}

// A missing or malformed joinDate would make toISOString() throw and take the
// whole table down, so fall back to an empty cell instead.
const formatJoinDate = (raw: unknown): string => {
  const d = new Date(raw as string);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
};

const StaffList: React.FC<StaffListProps> = ({
  setShowStaffModal,
  deleteStaff,
  staffDropdownOpen,
  setStaffDropdownOpen,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const access = useFeatureAccess(ADMIN_FEATURES.staff);

  const { query } = useStaff({
    page: currentPage,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const rawList: StaffMember[] = (query.data?.staff ?? query.data?.data ?? []).map((s: any) => ({
    id: s._id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    role: s.role,
    status: s.status,
    joinDate: formatJoinDate(s.joinDate),
  }));

  const totalPages = query.data?.pagination?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-dashboard-heading font-geist text-xl font-bold tracking-tight leading-tight">
            List of Staff
          </h3>
          {access.canCreate && (
            <button
              onClick={() => setShowStaffModal(true)}
              className="px-5 py-2.5 bg-tpl-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-tpl-primary-hover transition-colors"
            >
              + Add New Account
            </button>
          )}
        </div>

        <div className="border border-dashboard-stroke flex flex-col gap-2 rounded-xl overflow-scroll">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left font-plus-jakarta">
                <tr>
                  <th className="px-4 py-3 font-bold">Staff Name</th>
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="px-4 py-3 font-bold">Staff Number</th>
                  <th className="px-4 py-3 font-bold">Role Assign</th>
                  <th className="px-4 py-3 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {query.isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center">
                      Loading…
                    </td>
                  </tr>
                ) : rawList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center">
                      No staff found
                    </td>
                  </tr>
                ) : (
                  rawList.map((staff) => (
                    <tr key={staff.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium">{staff.name}</td>
                      <td className="px-4 py-3 text-gray-600">{staff.email}</td>
                      <td className="px-4 py-3 text-gray-600">{staff.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{staff.role}</td>
                      <td className="px-4 py-3 text-center flex justify-center">
                        <DropdownMenu
                          id={staff.id}
                          openId={staffDropdownOpen}
                          setOpenId={setStaffDropdownOpen}
                          onDelete={() => deleteStaff(staff.id)}
                          canDelete={access.canDelete}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// RolesList — uses useRoles hook; pagination controls page param
// ---------------------------------------------------------------------------

interface RolesListProps {
  setShowRoleModal: (v: boolean) => void;
  deleteRole: (id: string) => void;
  roleDropdownOpen: string | null;
  setRoleDropdownOpen: (id: string | null) => void;
}

const formatFeatureName = (feature: string): string =>
  REVERSE_MAPPING[feature] ??
  feature
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const RolesList: React.FC<RolesListProps> = ({
  setShowRoleModal,
  deleteRole,
  roleDropdownOpen,
  setRoleDropdownOpen,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const access = useFeatureAccess(ADMIN_FEATURES.roles);

  const { query } = useRoles({
    page: currentPage,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const rawList: StaffRole[] = (query.data?.roles ?? query.data?.data ?? []).map((r: any) => ({
    id: r._id,
    name: r.name,
    features: r.features ?? [],
  }));

  const totalPages = query.data?.pagination?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-dashboard-heading font-geist text-xl font-bold tracking-tight leading-tight">
            Roles
          </h3>
          {access.canCreate && (
            <button
              onClick={() => setShowRoleModal(true)}
              className="px-5 py-2.5 bg-tpl-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-tpl-primary-hover transition-colors"
            >
              + Add New Role
            </button>
          )}
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left font-plus-jakarta">
              <tr>
                <th className="px-4 py-3 font-bold w-2/12">Role Name</th>
                <th className="px-4 py-3 font-bold w-8/12">Features</th>
                <th className="px-4 py-3 font-bold w-2/12 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center">
                    Loading…
                  </td>
                </tr>
              ) : rawList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center">
                    No roles found
                  </td>
                </tr>
              ) : (
                rawList.map((role) => (
                  <tr key={role.id} className="border-t">
                    <td className="px-4 py-3 font-plus-jakarta font-bold">{role.name}</td>
                    <td className="px-4 py-3 text-dashboard-body">
                      {role.features.map(formatFeatureName).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-center relative">
                      <DropdownRoleMenu
                        id={role.id}
                        openId={roleDropdownOpen}
                        setOpenId={setRoleDropdownOpen}
                        onDelete={() => deleteRole(role.id)}
                        canDelete={access.canDelete}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded border text-sm bg-white hover:bg-gray-100"
          >
            Prev
          </button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded border text-sm bg-white hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// AdminStaff — page root
// ---------------------------------------------------------------------------

const AdminStaff = () => {
  const location = useLocation();
  const activeTab = location.pathname.includes("/roles") ? "roles" : "staff";

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);
  const [staffDropdownOpen, setStaffDropdownOpen] = useState<string | null>(null);

  // Confirm dialog state — one shared slot for both staff and role deletions
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // Hooks for mutations and the roles dropdown in AddStaffModal
  const staffHook = useStaff();
  const rolesHook = useRoles({ limit: 100, isActive: true, sortBy: "name", sortOrder: "asc" });

  const availableRoles: StaffRole[] = (
    rolesHook.query.data?.roles ??
    rolesHook.query.data?.data ??
    []
  ).map((r: any) => ({ id: r._id, name: r.name, features: r.features ?? [] }));

  // -------------------------------------------------------------------------
  // Handle add staff — calls mutation; closes modal only on success
  // -------------------------------------------------------------------------

  const handleAddStaff = (staffData: {
    staffName: string;
    staffNumber: string;
    email: string;
    role: string;
    password: string;
  }) => {
    const nameParts = (staffData.staffName || "").trim().split(" ");
    const firstName = nameParts[0] || "Staff";
    const lastName = nameParts.slice(1).join(" ") || ".";

    staffHook.createStaff.mutate(
      {
        firstName,
        lastName,
        email: staffData.email,
        phone: staffData.staffNumber,
        role: staffData.role,
        status: "Active",
        password: staffData.password,
      },
      {
        onSuccess: () => setShowStaffModal(false),
        // onError is handled by the hook (toast); modal stays open
      },
    );
  };

  // -------------------------------------------------------------------------
  // Handle add role — builds API payload from permission matrix; closes on success
  // -------------------------------------------------------------------------

  const handleAddRole = (roleData: { roleName: string; features: PermissionMatrix }) => {
    const permissions = (
      Object.entries(roleData.features) as [FeatureKey, { view: boolean; full: boolean }][]
    ).map(([key, perms]) => {
      return {
        feature: FEATURE_MAPPING[key],
        canView: !!(perms.view || perms.full),
        canEdit: !!perms.full,
        canDelete: !!perms.full,
        canCreate: !!perms.full,
      };
    });

    rolesHook.createRole.mutate(
      {
        name: roleData.roleName,
        features: permissions.filter((p) => p.canView).map((p) => p.feature),
        permissions,
        isActive: true,
      },
      {
        onSuccess: () => setShowRoleModal(false),
      },
    );
  };

  // -------------------------------------------------------------------------
  // Confirm-delete helpers — open shared ConfirmModal
  // -------------------------------------------------------------------------

  const requestDeleteStaff = (id: string) => {
    setConfirmState({
      open: true,
      title: "Delete staff account?",
      description: "This staff member will lose access immediately. This cannot be undone.",
      onConfirm: () => {
        staffHook.deleteStaff.mutate(id, {
          onSuccess: () => setConfirmState((s) => ({ ...s, open: false })),
          onError: () => setConfirmState((s) => ({ ...s, open: false })),
        });
      },
    });
  };

  const requestDeleteRole = (id: string) => {
    setConfirmState({
      open: true,
      title: "Delete role?",
      description: "This role will be removed. Staff assigned to it may lose permissions.",
      onConfirm: () => {
        rolesHook.deleteRole.mutate(id, {
          onSuccess: () => setConfirmState((s) => ({ ...s, open: false })),
          onError: () => setConfirmState((s) => ({ ...s, open: false })),
        });
      },
    });
  };

  const isDeleting = staffHook.deleteStaff.isPending || rolesHook.deleteRole.isPending;

  return (
    <AdminLayout title="Staff">
      <div className="flex-1 px-5 py-6">
        {activeTab === "staff" && (
          <StaffList
            setShowStaffModal={setShowStaffModal}
            deleteStaff={requestDeleteStaff}
            staffDropdownOpen={staffDropdownOpen}
            setStaffDropdownOpen={setStaffDropdownOpen}
          />
        )}
        {activeTab === "roles" && (
          <RolesList
            setShowRoleModal={setShowRoleModal}
            deleteRole={requestDeleteRole}
            roleDropdownOpen={roleDropdownOpen}
            setRoleDropdownOpen={setRoleDropdownOpen}
          />
        )}
      </div>

      <AddStaffModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        onSubmit={handleAddStaff}
        roles={availableRoles}
        isSubmitting={staffHook.createStaff.isPending}
      />

      <AddRoleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSubmit={handleAddRole}
        isSubmitting={rolesHook.createRole.isPending}
      />

      <ConfirmModal
        open={confirmState.open}
        onClose={() => setConfirmState((s) => ({ ...s, open: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
};

export default AdminStaff;
