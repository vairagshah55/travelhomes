import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FiltersPopup from "@/components/FiltersPopup";
import {
  Bell,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  LogOut,
  Grid3X3,
  FileTextIcon,
  CreditCard,
  BarChart3,
  ThumbsUp,
  Box,
  Settings,
  Zap,
  TrendingUp,
  Users2,
  Menu,
  X,
  Eye,
  Trash2,
  Edit,
  Plus,
  Loader2,
} from "lucide-react";
import AdminSidebar from "@/admin/components/AdminSidebar";
import AdminProfileDropdown from "@/admin/components/AdminProfileDropdown";
import AdminHeader from "@/admin/components/AdminHeader";
import { useToast } from "@/hooks/use-toast";
import Pagination from "@/components/Pagination";
import { formatDate } from "@/lib/formateTime";

interface User {
  _id: string;
  userId: string;
  photo: string;
  name: string;
  userSince: string;
  bookedServices: string;
  location: string;
  email: string;
  phone: string;
  status: string;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toast } = useToast();

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const [activeTab, setActiveTab] = useState("all-users");
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("userSince");
  const [users, setUsers] = useState<User[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const ITEMS_PER_PAGE = 10;

const [currentPage, setCurrentPage] = useState(1);

 // Derived list with search + sort + filters
  const filteredSortedUsers = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = users;

    // Apply active filters
    if (activeFilters.length > 0) {
      const filterObj = activeFilters.reduce(
        (acc, filter) => {
          const [key, value] = filter.split(":");
          if (key && value && value !== "all") {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      list = list.filter((u) => {
        if (
          filterObj.location &&
          filterObj.location !== "all" &&
          u.location !== filterObj.location
        )
          return false;
        if (
          filterObj.service &&
          filterObj.service !== "all" &&
          !u.bookedServices?.includes(filterObj.service)
        )
          return false;
        if (
          filterObj.status &&
          filterObj.status !== "all" &&
          u.status !== filterObj.status
        )
          return false;

        if (filterObj.dateFrom || filterObj.dateTo) {
          const userDate = new Date(u.userSince);
          if (!isNaN(userDate.getTime())) {
            if (filterObj.dateFrom) {
              const fromDate = new Date(filterObj.dateFrom);
              fromDate.setHours(0, 0, 0, 0);
              if (userDate < fromDate) return false;
            }
            if (filterObj.dateTo) {
              const toDate = new Date(filterObj.dateTo);
              toDate.setHours(23, 59, 59, 999);
              if (userDate > toDate) return false;
            }
          }
        }
        return true;
      });
    }

    if (term) {
      list = list.filter((u) =>
        [u.name, u.email, u.phone, u.location, u.userId]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term)),
      );
    }
    const sortKey = sortBy as keyof User;
    return [...list].sort((a, b) => {
      if (sortKey === "userSince") {
        const dateA = new Date(a.userSince).getTime();
        const dateB = new Date(b.userSince).getTime();
        return dateB - dateA; // Descending: Newest first
      }

      const av = String(a[sortKey] ?? "").toLowerCase();
      const bv = String(b[sortKey] ?? "").toLowerCase();
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
  }, [users, searchTerm, sortBy, activeFilters]);

useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, sortBy, activeFilters, activeTab]);
const totalPages = Math.ceil(
  filteredSortedUsers.length / ITEMS_PER_PAGE,
);

const paginatedUsers = React.useMemo(() => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  return filteredSortedUsers.slice(start, end);
}, [filteredSortedUsers, currentPage]);


 
  // API state

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<User>>({
    name: "",
    email: "",
    phone: "",
    location: "",
    userSince: new Date().getFullYear().toString(),
    bookedServices: "0",
    status: "active",
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  // Fetch users based on active tab
  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = "";
      let endpoint = `${API_BASE_URL}/api/users`;

      if (activeTab === "subscribers") {
        endpoint = `${API_BASE_URL}/api/subscribers`;
      } else if (activeTab !== "all-users") {
        const statusMap: Record<string, string> = {
          "active-users": "active",
          "inactive-users": "inactive",
          "banned-users": "banned",
          "unverified-email": "unverified-email",
          "unverified-mobile": "unverified-mobile",
        };
        const status = statusMap[activeTab];
        if (status) {
          query = `?status=${status}`;
          endpoint += query;
        }
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to fetch users");
      }

      let usersList = responseData.data || [];

      if (activeTab === "subscribers") {
        usersList = usersList.map((sub: any) => ({
          _id: sub._id,
          userId: "SUB",
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.email}`,
          name: "Subscriber",
          email: sub.email,
          phone: "-",
          location: "-",
          bookedServices: "0",
          userSince: sub.createdAt || sub.subscribedAt || new Date().toISOString(),
          status: sub.status,
        }));
      }

      setUsers(usersList);
    } catch (err: any) {
      const msg =
        typeof err === "string"
          ? err
          : err?.message || "Failed to fetch users. Please try again.";
      setError(msg);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "all-users", label: "All Users" },
    { id: "active-users", label: "Active Users" },
    { id: "inactive-users", label: "InActive Users" },
    { id: "banned-users", label: "Banned Users" },
    { id: "unverified-email", label: "Unverified Email" },
    { id: "unverified-mobile", label: "Unverified Mobile" },
    { id: "subscribers", label: "Subscribers" },
  ];

  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowUserDetails(true);
    setShowActionMenu(null);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      userSince: user.userSince,
      bookedServices: user.bookedServices,
      status: user.status,
    });
    setShowEditUserModal(true);
    setShowActionMenu(null);
  };

  const handleDelete = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      toast({
        title: "Success",
        description: "User deleted successfully.",
        variant: "default",
      });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete user.",
        variant: "destructive",
      });
      console.error("Error deleting user:", err);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setShowActionMenu(null);
    }
  };

  const handleAddUser = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      location: "",
      userSince: new Date().getFullYear().toString(),
      bookedServices: "0",
      status: "active",
    });
    setShowAddUserModal(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add user");
      }

      toast({
        title: "Success",
        description: "User added successfully.",
        variant: "default",
      });
      setShowAddUserModal(false);
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add user.",
        variant: "destructive",
      });
      console.error("Error adding user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/users/${selectedUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      toast({
        title: "Success",
        description: "User updated successfully.",
        variant: "default",
      });
      setShowEditUserModal(false);
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update user.",
        variant: "destructive",
      });
      console.error("Error updating user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (filters: string[]) => {
    setActiveFilters(filters);
  };

  const getServiceBadgeColor = (service: string) => {
    switch (service) {
      case "XYX":
        return "bg-[#FFF2E2] text-[#B86B00]";
      case "XYZ":
        return "bg-[#F6E0FD] text-[#B127DC]";
      default:
        return "bg-gray-100 text-gray-600";
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
          Headtitle={"Management"}
          setMobileSidebarOpen={setMobileOpen}
        />
        {/* Page Content */}
        <main className="flex-1 pr-5 pb-5 ">
          {/* Content Header */}
          <div className="bg-white rounded-t-3xl border-b border-[#EAECF0] p-5 mb-0 flex justify-between items-center">
            <h2 className="text-sm font-bold text-[#101828] font-geist tracking-tight">
              User Management
            </h2>
            {/* <Button
              className="bg-dashboard-primary text-white rounded-full px-4 py-2 flex items-center gap-2"
              onClick={handleAddUser}
            >
              <Plus size={16} />
              <span>Add User</span>
            </Button> */}
          </div>

          <div className="bg-white rounded-b-3xl p-5 space-y-8">
            {/* Tabs */}
            <div className="border-b border-[#EAEAEA]">
              <div className="flex items-center overflow-x-auto  max-md:flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-base font-bold font-plus-jakarta transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-[#0B0907] border-b-2 border-[#131313]"
                        : "text-[#6B6B6B] hover:text-[#0B0907]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center justify-between  max-md:flex-wrap">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#485467]"
                  />
                  <Input
                    placeholder="Search"
                    className="pl-10 w-64 h-10 border-[#B0B0B0] rounded-lg font-plus-jakarta text-[#2E2E2E]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3  max-md:flex-wrap">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32 h-10 border-[#D0D5DD]">
                    <SelectValue
                      placeholder="Sort By"
                      className="text-[#667085] font-poppins"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="userSince">Date</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                  </SelectContent>
                </Select>

                {activeFilters.map((filter) => {
                    const [key, value] = filter.split(":");
                    if (!value || value === "all") return null;
                     return (
                        <div key={filter} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm border border-gray-200">
                            <span className="capitalize text-gray-700">{key}: {value}</span>
                            <button onClick={() => {
                                setActiveFilters(prev => prev.filter(f => f !== filter));
                            }} className="ml-1">
                                <X size={14} className="text-gray-500 hover:text-red-500" />
                            </button>
                        </div>
                     )
                  })}

                <Button
                  variant="outline"
                  className="h-10 px-5 border-[#D0D5DD] rounded-[30px]"
                  onClick={() => setShowFiltersPopup(true)}
                >
                  <Filter size={18} className="mr-2" />
                  <span className="font-poppins text-[#485467]">Filters</span>
                </Button>
              </div>
            </div>

            {/* Table */}

            <div className="border border-[#EAECF0] rounded-xl overflow-scroll">
              {activeTab === "subscribers" ? (
                <div className="w-full bg-white">
                  {!loading && !error && filteredSortedUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No subscribers found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      <div className="px-6 py-3 bg-[#F2F4F7] flex justify-between">
                         <span className="font-bold text-[#334054] font-plus-jakarta">Email</span>
                         <span className="font-bold text-[#334054] font-plus-jakarta">Date</span>
                      </div>
                      {paginatedUsers.map((user) => (
                        <div key={user._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                          <span className="text-[#485467] font-poppins font-medium">{user.email}</span>
                          <span className="text-sm text-gray-400 font-poppins">{formatDate(user.userSince)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
              <Table>
                <TableHeader className="bg-[#F2F4F7]">
                  <TableRow>
                    <TableHead className="font-bold text-[#334054] font-plus-jakarta">
                      User ID
                    </TableHead>
                    <TableHead className="font-bold text-[#334054] font-plus-jakarta">
                      Photo
                    </TableHead>
                    <TableHead className="font-bold text-[#334054] font-plus-jakarta">
                      Name
                    </TableHead>
                    <TableHead className="font-bold text-[#334054] font-plus-jakarta">
                      User Since
                    </TableHead>
                    <TableHead className="font-bold text-[#334054] font-plus-jakarta">
                      Booked Services
                    </TableHead>
                    <TableHead className="font-bold text-[#334054] font-plus-jakarta">
                      Location
                    </TableHead>
                    <TableHead className="font-bold text-[#334054] font-plus-jakarta w-40">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {!loading && !error && filteredSortedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-gray-500"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => (

                      <TableRow
                        key={user._id}
                        className="border-b border-[#F2F4F7]"
                      >
                        <TableCell className="text-sm font-bold text-[#131313] font-plus-jakarta py-4">
                          {user.userId}
                        </TableCell>
                        <TableCell>
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.photo} />
                            <AvatarFallback>
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="text-sm text-[#485467] font-poppins">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-sm text-[#485467] font-poppins">
                        {formatDate(user.userSince)}
                        </TableCell>
                        <TableCell className="text-sm text-[#485467] font-poppins">
                          {user.bookedServices || "0"}
                        </TableCell>
                        <TableCell className="text-sm text-[#485467] font-poppins">
                          {user.location}
                        </TableCell>
                        <TableCell>
                          <div className="relative ">
                            <button
                              onClick={() =>
                                setShowActionMenu(
                                  showActionMenu === user._id ? null : user._id,
                                )
                              }
                              className="text-[#667085] hover:text-[#485467]"
                            >
                              <MoreHorizontal size={20} />
                            </button>

                            {/* Action Menu Dropdown */}
                            {showActionMenu === user._id && (
                              <div className="absolute right-0 top-8 bg-white border border-[#F8F8F8] rounded-xl shadow-lg p-1 z-10 w-48">
                                <button
                                  className="flex items-center gap-2 w-full px-3 py-3 text-left hover:bg-[#F2F4F7] rounded-lg transition-colors"
                                  onClick={() => handleView(user)}
                                >
                                  <Eye size={18} className="text-black" />
                                  <span className="text-sm font-poppins text-[#2A2A2A]">
                                    View
                                  </span>
                                </button>
                                <button
                                  className="flex items-center gap-2 w-full px-3 py-3 text-left hover:bg-[#F2F4F7] rounded-lg transition-colors"
                                  onClick={() => handleEdit(user)}
                                >
                                  <Edit size={18} className="text-[#0066FF]" />
                                  <span className="text-sm font-poppins text-[#0066FF]">
                                    Edit
                                  </span>
                                </button>
                                <button
                                  className="flex items-center gap-2 w-full px-3 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowDeleteConfirm(true);
                                  }}
                                >
                                  <Trash2
                                    size={18}
                                    className="text-[#D30000]"
                                  />
                                  <span className="text-sm font-poppins text-[#D30000]">
                                    Banned USers
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              )}
              <div className="pt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {/* Error State */}
                  <p>{error}</p>
                  <Button
                    variant="outline"
                    className="mt-2 text-red-700 border-red-300"
                    onClick={fetchUsers}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {loading && (
                <div className="w-full flex justify-center items-center py-10">
                  {/* Loading State */}
                  <Loader2 className="w-8 h-8 animate-spin text-dashboard-primary" />
                  <span className="ml-2 text-dashboard-primary">
                    Loading...
                  </span>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* User Details Popup */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-3xl mx-4 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowUserDetails(false)}
              className="absolute top-4 right-4 w-6 h-6 bg-[#E5E5E5] rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <X size={16} className="text-black" />
            </button>

            {/* Header */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-[#131313] font-geist">
                User Details
              </h2>
            </div>

            {/* User Details Content */}
            <div className="space-y-9">
              {/* First Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#212121] font-geist leading-[18px] tracking-[0.16px]">
                    User ID
                  </h3>
                  <p className="text-sm text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.2px]">
                    {selectedUser.userId}
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#212121] font-geist leading-[18px] tracking-[0.16px]">
                    Name
                  </h3>
                  <p className="text-sm text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.2px]">
                    {selectedUser.name}
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#212121] font-geist leading-[18px] tracking-[0.16px]">
                    User Since
                  </h3>
                  <p className="text-sm text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.2px]">
                    {formatDate(selectedUser.userSince)}
                  </p>
                </div>
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#212121] font-geist leading-[18px] tracking-[0.16px]">
                    Booked Services
                  </h3>
                  <p className="text-sm text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.2px]">
                    {selectedUser.bookedServices || "0"}
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#212121] font-geist leading-[18px] tracking-[0.16px]">
                    Location
                  </h3>
                  <p className="text-sm text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.2px]">
                    {selectedUser.location}
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#212121] font-geist leading-[18px] tracking-[0.16px]">
                    Status
                  </h3>
                  <p className="text-sm text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.2px]">
                    {selectedUser.status}
                  </p>
                </div>
              </div>

              {/* Third Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#212121] font-geist leading-[18px] tracking-[0.16px]">
                    Email
                  </h3>
                  <p className="text-sm text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.2px]">
                    {selectedUser.email}
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#212121] font-geist leading-[18px] tracking-[0.16px]">
                    Phone
                  </h3>
                  <p className="text-sm text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.2px]">
                    {selectedUser.phone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl mx-4 relative">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-4 right-4 w-6 h-6 bg-[#E5E5E5] rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <X size={16} className="text-black" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#131313] font-geist">
                Add New User
              </h2>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#344054]">
                    Name
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter name"
                    required
                    className="w-full border-[#D0D5DD] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#344054]">
                    Email
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter email"
                    required
                    className="w-full border-[#D0D5DD] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#344054]">
                    Phone
                  </label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="Enter phone number"
                    className="w-full border-[#D0D5DD] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#344054]">
                    Location
                  </label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="Enter location"
                    required
                    className="w-full border-[#D0D5DD] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#344054]">
                    User Since
                  </label>
                  <Input
                    name="userSince"
                    value={formData.userSince}
                    onChange={handleFormChange}
                    placeholder="Enter year"
                    className="w-full border-[#D0D5DD] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#344054]">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="w-full border-[#D0D5DD] rounded-lg">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                      <SelectItem value="unverified-email">
                        Unverified Email
                      </SelectItem>
                      <SelectItem value="unverified-mobile">
                        Unverified Mobile
                      </SelectItem>
                      <SelectItem value="subscriber">Subscriber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-full px-5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-dashboard-primary text-white rounded-full px-5"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add User"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl mx-4 relative">
            <button
              onClick={() => setShowEditUserModal(false)}
              className="absolute top-4 right-4 w-6 h-6 bg-[#E5E5E5] rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <X size={16} className="text-black" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#131313] font-geist">
                Edit User
              </h2>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#344054]">
                    Name
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter name"
                    required
                    className="w-full border-[#D0D5DD] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#344054]">
                    Email
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter email"
                    required
                    className="w-full border-[#D0D5DD] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#344054]">
                    Phone
                  </label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="Enter phone number"
                    className="w-full border-[#D0D5DD] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#344054]">
                    Location
                  </label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="Enter location"
                    required
                    className="w-full border-[#D0D5DD] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#344054]">
                    User Since
                  </label>
                  <Input
                    name="userSince"
                    value={formData.userSince}
                    onChange={handleFormChange}
                    placeholder="Enter year"
                    className="w-full border-[#D0D5DD] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#344054]">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="w-full border-[#D0D5DD] rounded-lg">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                      <SelectItem value="unverified-email">
                        Unverified Email
                      </SelectItem>
                      <SelectItem value="unverified-mobile">
                        Unverified Mobile
                      </SelectItem>
                      <SelectItem value="subscriber">Subscriber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditUserModal(false)}
                  className="rounded-full px-5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-dashboard-primary text-white rounded-full px-5"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update User"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete this user? This action cannot be
                undone.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-full px-5"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-700 rounded-full px-5"
                onClick={() => handleDelete(selectedUser._id)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Popup */}
      <FiltersPopup
        isOpen={showFiltersPopup}
        onClose={() => setShowFiltersPopup(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={activeFilters}
      />
    </div>
  );
};

export default UserManagement;
