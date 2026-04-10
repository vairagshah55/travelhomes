import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import AdminSidebar from "../components/AdminSidebar";
import AdminProfileDropdown from "../components/AdminProfileDropdown";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Search,
  Filter,
  X,
  MoreHorizontal,
  Upload,
  User,
  Eye,
  Plus,
  Phone,
  Mail,
} from "lucide-react";
import AdminHeader from "../components/AdminHeader";

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

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (staffData: any) => void;
  roles: StaffRole[];
}

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roleData: any) => void;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  roles,
}) => {
  const [formData, setFormData] = useState({
    staffName: "",
    staffNumber: "",
    email: "",
    role: "",
    password: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      staffName: "",
      staffNumber: "",
      email: "",
      role: "",
      password: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-black font-geist text-2xl font-bold">
            Add New Account
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-dashboard-title font-plus-jakarta text-base">
                Staff Name
              </label>
              <input
                type="text"
                placeholder="Enter Your Name"
                value={formData.staffName}
                onChange={(e) =>
                  setFormData({ ...formData, staffName: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, staffNumber: e.target.value })
                }
                className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-dashboard-title font-plus-jakarta text-base">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter Your Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
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
              <label className="text-dashboard-title font-plus-jakarta text-base">
                Password
              </label>
              <input
                type="password"
                placeholder="Set a Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-8 py-3 bg-black text-white rounded-full font-geist text-base font-medium tracking-tight hover:bg-gray-800 transition-colors w-full md:w-auto"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddRoleModal: React.FC<AddRoleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    roleName: "",
    features: {
      Dashboard: { view: false, full: false },
      Management: { view: false, full: false },
      Payments: { view: false, full: false },
      Listing: { view: false, full: false },
      Vendor: { view: false, full: false },
      User: { view: false, full: false },
      Analytics: { view: false, full: false },
      "Help Desk": { view: false, full: false },
      CMS: { view: false, full: false },
      Marketing: { view: false, full: false },
      Plugins: { view: false, full: false },
      Staff: { view: false, full: false },
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pass full formData.features object so parent can extract permissions
    onSubmit({
      roleName: formData.roleName,
      features: formData.features,
    });

    setFormData({
      roleName: "",
      features: {
        Dashboard: { view: false, full: false },
        Management: { view: false, full: false },
        Payments: { view: false, full: false },
         Listing: { view: false, full: false },
      Vendor: { view: false, full: false },
      User: { view: false, full: false },
        Analytics: { view: false, full: false },
        "Help Desk": { view: false, full: false },
        CMS: { view: false, full: false },
        Marketing: { view: false, full: false },
        Plugins: { view: false, full: false },
        Staff: { view: false, full: false },
      },
    });
    onClose();
  };

  const handleFeatureChange = (
    feature: string,
    type: "view" | "full",
    checked: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: {
          ...prev.features[feature as keyof typeof prev.features],
          [type]: checked,
        },
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-black font-geist text-2xl font-bold">
            Add New Role
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-base">
              Role Name
            </label>
            <input
              type="text"
              placeholder="Accountant"
              value={formData.roleName}
              onChange={(e) =>
                setFormData({ ...formData, roleName: e.target.value })
              }
              className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-base">
              Features
            </label>
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
              {Object.keys(formData.features).map((feature) => (
                <div
                  key={feature}
                  className="grid grid-cols-3 px-3 py-3.5 border-b border-gray-100 last:border-0"
                >
                  <div className="text-dashboard-body font-poppins text-base">
                    {feature}
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={
                        formData.features[
                          feature as keyof typeof formData.features
                        ].view
                      }
                      onChange={(e) =>
                        handleFeatureChange(feature, "view", e.target.checked)
                      }
                      className="w-5 h-5 border border-dashboard-gray-300 rounded text-dashboard-primary focus:ring-dashboard-primary"
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={
                        formData.features[
                          feature as keyof typeof formData.features
                        ].full
                      }
                      onChange={(e) =>
                        handleFeatureChange(feature, "full", e.target.checked)
                      }
                      className="w-5 h-5 border border-dashboard-gray-300 rounded text-dashboard-primary focus:ring-dashboard-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-8 py-3 bg-black text-white rounded-full font-geist text-base font-medium tracking-tight hover:bg-gray-800 transition-colors"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DropdownMenu = ({ id, openId, setOpenId, onDelete }: any) => (
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
          <button className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-50">
            <Eye size={18} className="text-dashboard-body" />
            <span className="text-dashboard-body font-poppins text-sm">
              View
            </span>
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-50">
            <Edit2 size={18} className="text-dashboard-body" />
            <span className="text-dashboard-body font-poppins text-sm">
              Edit
            </span>
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

const DropdownRoleMenu = ({ id, openId, setOpenId, onDelete }: any) => (
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
          <button className="flex items-center gap-3 w-full px-3 py-3 hover:bg-gray-50">
            <Eye size={18} className="text-dashboard-body" />
            <span className="text-dashboard-body font-poppins text-sm">
              View
            </span>
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

const StaffList = ({ staffMembers, setStaffMembers, setShowStaffModal, deleteStaff, staffDropdownOpen, setStaffDropdownOpen }: any) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);

    React.useEffect(() => {
        const fetchStaff = async () => {
          setLoading(true);
          try {
            const api = (await import('../../services/api')).adminStaffService;
            const res = await api.getStaff({
              page: currentPage,
              limit: 10,
              sortBy: 'createdAt',
              sortOrder: 'desc',
            });
            // res: { success, data, pagination }
            setStaffMembers(
              (res?.staff || res?.data || []).map((s: any) => ({
                id: s._id,
                name: s.name,
                email: s.email,
                phone: s.phone,
                role: s.role,
                status: s.status,
                joinDate: new Date(s.joinDate).toISOString().split('T')[0],
              }))
            );
            setTotalPages(res?.pagination?.totalPages || 1);
          } catch (e) {
            console.error('Failed to load staff', e);
          } finally {
            setLoading(false);
          }
        };
        fetchStaff();
    }, [currentPage, setStaffMembers]);

    return (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-dashboard-heading font-geist text-xl font-bold tracking-tight leading-tight">
            List of Staff
          </h3>
          <button
            onClick={() => setShowStaffModal(true)}
            className="px-5 py-2.5 bg-black text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-gray-800 transition-colors"
          >
            + Add New Account
          </button>
        </div>

        <div className="border border-dashboard-stroke flex flex-col gap-2 rounded-xl overflow-scroll">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left font-plus-jakarta">
                <tr>
                  <th className="px-4 py-3 font-bold">Staff Name</th>
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="px-4 py-3 font-bold">Staff Number</th>
                  <th className="px-4 py-3 font-bold">Role Assign</th>
                  <th className="px-4 py-3 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center">Loading...</td>
                  </tr>
                ) : staffMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center">No staff found</td>
                  </tr>
                ) : (
                  staffMembers.map((staff: any) => (
                    <tr key={staff.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium">{staff.name}</td>
                      <td className="px-4 py-3 text-gray-600">{staff.email}</td>
                      <td className="px-4 py-3 text-gray-600">{staff.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{staff.role}</td>
                      <td className="px-4 py-3 text-center flex justify-center">
                        <DropdownMenu id={staff.id} openId={staffDropdownOpen} setOpenId={setStaffDropdownOpen} onDelete={() => deleteStaff(staff.id)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50">Previous</button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
    );
};

const RolesList = ({ staffRoles, setStaffRoles, setShowRoleModal, deleteRole, roleDropdownOpen, setRoleDropdownOpen }: any) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);

    const formatFeatureName = (feature: string) => {
      // Map back from snake_case to Title Case if possible, or just format
      const REVERSE_MAPPING: Record<string, string> = {
        "view_dashboard": "Dashboard",
        "access_management": "Management",
        "manage_payments": "Payments",
        "view_analytics": "Analytics",
        "support_tickets": "Help Desk",
        "manage_cms": "CMS",
        "manage_marketing": "Marketing",
        "manage_plugins": "Plugins",
        "manage_staff": "Staff"
      };
      return REVERSE_MAPPING[feature] || feature.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    React.useEffect(() => {
        const fetchRoles = async () => {
          setLoading(true);
          try {
            const api = (await import('../../services/api')).adminRolesService;
            const res = await api.getRoles({ page: currentPage, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
            const list = res?.roles || res?.data || [];
            setStaffRoles(list.map((r: any) => ({ id: r._id, name: r.name, features: r.features || [] })));
            setTotalPages(res?.pagination?.totalPages || 1);
          } catch (e) {
            console.error('Failed to load roles', e);
          } finally {
            setLoading(false);
          }
        };
        fetchRoles();
    }, [currentPage, setStaffRoles]);

    return (
      <div className="space-y-4">
        <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-dashboard-heading font-geist text-xl font-bold tracking-tight leading-tight">
              Roles
            </h3>
            <button
              onClick={() => setShowRoleModal(true)}
              className="px-5 py-2.5 bg-black text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-gray-800 transition-colors"
            >
              + Add New Role
            </button>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left font-plus-jakarta">
                <tr>
                  <th className="px-4 py-3 font-bold w-2/12">Role Name</th>
                  <th className="px-4 py-3 font-bold w-8/12">Features</th>
                  <th className="px-4 py-3 font-bold w-2/12 text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center">Loading...</td>
                  </tr>
                ) : staffRoles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center">No roles found</td>
                  </tr>
                ) : (
                  staffRoles.map((role: any) => (
                    <tr key={role.id} className="border-t">
                      <td className="px-4 py-3 font-plus-jakarta font-bold">
                        {role.name}
                      </td>
                      <td className="px-4 py-3 text-dashboard-body">
                        {(role.features || []).map(formatFeatureName).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-center relative">
                        <DropdownRoleMenu
                          id={role.id}
                          openId={roleDropdownOpen}
                          setOpenId={setRoleDropdownOpen}
                          onDelete={() => deleteRole(role.id)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

const AdminStaff = () => {
  const location = useLocation();
  const activeTab = location.pathname.includes("/roles") ? "roles" : "staff";

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  const [staffRoles, setStaffRoles] = useState<StaffRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<StaffRole[]>([]);

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);
  const [staffDropdownOpen, setStaffDropdownOpen] = useState<string | null>(
    null,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch available roles for the dropdown
  useEffect(() => {
    const fetchAvailableRoles = async () => {
      try {
        const api = (await import('../../services/api')).adminRolesService;
        // Fetch all active roles (limit 100 to be safe)
        const res = await api.getAllRoles({ 
          limit: 100, 
          isActive: true,
          sortBy: 'name',
          sortOrder: 'asc' 
        });
        const list = res?.roles || res?.data || [];
        setAvailableRoles(list.map((r: any) => ({ 
          id: r._id, 
          name: r.name, 
          features: r.features || [] 
        })));
      } catch (e) {
        console.error('Failed to fetch available roles', e);
      }
    };
    
    if (showStaffModal) {
      fetchAvailableRoles();
    }
  }, [showStaffModal]);

  const handleAddStaff = async (staffData: any) => {
    try {
      const nameParts = (staffData.staffName || '').trim().split(' ');
      const firstName = nameParts[0] || 'Staff';
      const lastName = nameParts.slice(1).join(' ') || '.';
      
      const res = await (await import('../../services/api')).adminStaffService.create({
        firstName,
        lastName,
        email: staffData.email,
        phone: staffData.staffNumber,
        role: staffData.role,
        status: 'Active',
        password: staffData.password
      });
      // Server returns { success, data }
      const created = res?.staff || res?.data;
      if (created) {
        setStaffMembers((prev) => [
          ...prev,
          {
            id: created._id,
            name: created.name,
            email: created.email,
            phone: created.phone,
            role: created.role,
            status: created.status,
            joinDate: new Date(created.joinDate).toISOString().split('T')[0],
          },
        ]);
      }
    } catch (e) {
      console.error('Failed to create staff', e);
      toast.error('Failed to create staff');
    }
  };

  const handleAddRole = async (roleData: any) => {
    try {
      const api = (await import('../../services/api')).adminRolesService;

      const FEATURE_MAPPING: Record<string, string> = {
        "Dashboard": "view_dashboard",
        "Management": "access_management",
        "Payments": "manage_payments",
        "Analytics": "view_analytics",
        "Help Desk": "support_tickets",
        "CMS": "manage_cms",
        "Marketing": "manage_marketing",
        "Plugins": "manage_plugins",
        "Staff": "manage_staff"
      };

      // Build permissions array from modal selections
      const permissions = Object.entries(roleData.features || {}).map(([key, perms]: any) => {
        const feature = FEATURE_MAPPING[key] || key.toLowerCase().replace(/ /g, '_');
        return {
          feature,
          canView: !!perms?.view || !!perms?.full,
          canEdit: !!perms?.full,
          canDelete: !!perms?.full,
          canCreate: !!perms?.full,
        };
      });

      const res = await api.create({
        name: roleData.roleName,
        features: permissions.filter(p => p.canView).map(p => p.feature),
        permissions,
        isActive: true,
      });
      const created = res?.role || res?.data;
      if (created) {
        setStaffRoles(prev => [...prev, { id: created._id, name: created.name, features: created.features || [] }]);
      }
    } catch (e) {
      console.error('Failed to create role', e);
      toast.error('Failed to create role');
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      await (await import('../../services/api')).adminStaffService.remove(id);
      setStaffMembers((prev) => prev.filter((staff) => staff.id !== id));
    } catch (e) {
      console.error('Failed to delete staff', e);
      toast.error('Failed to delete staff');
    }
  };

  const deleteRole = async (id: string) => {
    try {
      const api = (await import('../../services/api')).adminRolesService;
      await api.remove(id);
      setStaffRoles((prev) => prev.filter((role) => role.id !== id));
    } catch (e) {
      console.error('Failed to delete role', e);
      toast.error('Failed to delete role');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <div className="fixed">
     
           <AdminSidebar
             showMobileSidebar={mobileOpen}
             setShowMobileSidebar={setMobileOpen}
             />
             </div>
           {/* Main Content */}
           <div className="flex-1 flex flex-col overflow-x-hidden ml-60 max-lg:ml-0">
        {/* Top Header */}
        <AdminHeader
          Headtitle={"Staff "}
          setMobileSidebarOpen={setMobileOpen}
        />

        {/* Main Content */}
        <div className="flex-1 px-5 py-6">
            {activeTab === "staff" && (
                <StaffList 
                    staffMembers={staffMembers} 
                    setStaffMembers={setStaffMembers} 
                    setShowStaffModal={setShowStaffModal}
                    deleteStaff={deleteStaff}
                    staffDropdownOpen={staffDropdownOpen}
                    setStaffDropdownOpen={setStaffDropdownOpen}
                />
            )}
            {activeTab === "roles" && (
                <RolesList 
                    staffRoles={staffRoles}
                    setStaffRoles={setStaffRoles}
                    setShowRoleModal={setShowRoleModal}
                    deleteRole={deleteRole}
                    roleDropdownOpen={roleDropdownOpen}
                    setRoleDropdownOpen={setRoleDropdownOpen}
                />
            )}
        </div>
      </div>

      <AddStaffModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        onSubmit={handleAddStaff}
        roles={availableRoles}
      />

      <AddRoleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSubmit={handleAddRole}
      />
    </div>
  );
};

export default AdminStaff;