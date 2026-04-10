import React, { useEffect, useMemo, useState } from "react";
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
import VendorDetailsPopup from "@/components/VendorDetailsPopup";
import Pagination from "@/components/Pagination";
import { Search, Filter, MoreHorizontal, Eye, Trash2, Loader2, Plus, X } from "lucide-react";
import AdminSidebar from "@/admin/components/AdminSidebar";
import AdminHeader from "@/admin/components/AdminHeader";
import { vendorService } from "@/services/api";

interface Vendor {
  _id: string;
  vendorId: string;
  photo: string;
  brandName: string;
  personName: string;
  listedServices: number;
  location: string;
  status: string;
  action: string ;
}

const VendorManagement = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all-vendors");
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("brandName");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
   const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Vendor>>({
    vendorId: "",
    photo: "",
    brandName: "",
    personName: "",
    listedServices: 0,
    location: "",
    action: "",
  });


  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  // Fetch vendors on tab change
  useEffect(() => {
    setCurrentPage(1);
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await vendorService.getVendors(activeTab);
        setVendors(Array.isArray(list) ? list : []);
      } catch (err: any) {
        setError(typeof err === 'string' ? err : 'Failed to fetch vendors.');
        console.error('Error fetching vendors:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, [activeTab]);

  // Derived list with search + sort + filters
  const filteredSortedVendors = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = vendors;
    if (term) {
      list = list.filter((v) =>
        [v.brandName, v.personName, v.location, v.vendorId]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(term))
      );
    }

    if (activeFilters.length > 0) {
      const locationFilter = activeFilters.find(f => f.startsWith('location:'))?.split(':')[1];
      const statusFilter = activeFilters.find(f => f.startsWith('status:'))?.split(':')[1];
      const serviceFilter = activeFilters.find(f => f.startsWith('service:'))?.split(':')[1];
      const dateFromFilter = activeFilters.find(f => f.startsWith('dateFrom:'))?.split(':')[1];
      const dateToFilter = activeFilters.find(f => f.startsWith('dateTo:'))?.split(':')[1];

      if (locationFilter && locationFilter !== 'all') {
          list = list.filter(v => v.location?.toLowerCase() === locationFilter.toLowerCase());
      }
      
      if (statusFilter && statusFilter !== 'all') {
            list = list.filter(v => v.status?.toLowerCase() === statusFilter.toLowerCase());
      }
      
      if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter).getTime();
          list = list.filter(v => {
              const created = (v as any).createdAt ? new Date((v as any).createdAt).getTime() : 0;
              return created >= fromDate;
          });
      }
      
      if (dateToFilter) {
            const toDate = new Date(dateToFilter).getTime();
            // Add 1 day to include the end date fully
            const toDateInclusive = toDate + 86400000; 
            list = list.filter(v => {
              const created = (v as any).createdAt ? new Date((v as any).createdAt).getTime() : 0;
              return created < toDateInclusive;
          });
      }
    }

    const sortKey = sortBy as keyof Vendor;
    return [...list].sort((a, b) => {
      const av = String(a[sortKey] ?? '').toLowerCase();
      const bv = String(b[sortKey] ?? '').toLowerCase();
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
  }, [vendors, searchTerm, sortBy, activeFilters]);

  const tabs = [
    { id: "all-vendors", label: "All Vendors" },
    { id: "pending-vendors", label: "Pending Vendors" },
    { id: "approved", label: "Approved" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
    { id: "banned", label: "Banned" },
    { id: "kyc-unverified", label: "KYC Unverified" },
  ];


 const handleAddVendor = () => {
    setFormData({
      vendorId: "",
      photo: "",
      brandName: "",
      personName: "",
      listedServices: 0,
      location: "",
      action: "",
    });
    setShowAddVendorModal(true);
  };

  // Save vendor to database and update local state
  const handleSaveVendor = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.brandName?.trim()) {
        setError('Brand Name is required');
        return;
      }
      if (!formData.personName?.trim()) {
        setError('Person Name is required');
        return;
      }
      if (!formData.location?.trim()) {
        setError('Location is required');
        return;
      }

      // Prepare vendor data for API
      const vendorData = {
        vendorId: String(formData.vendorId || `V-${Date.now()}`),
        photo: String(formData.photo || ""),
        brandName: String(formData.brandName || "").trim(),
        personName: String(formData.personName || "").trim(),
        listedServices: Number((formData as any).listedServices || 0),
        location: String(formData.location || "").trim(),
        status: "pending",
      };

      // Call API to create vendor
      console.log('Sending vendor data:', vendorData);
      const response = await vendorService.createVendor(vendorData);
      console.log('Create vendor response:', response);
      
      // If successful, refresh the vendors list
      const refreshedList = await vendorService.getVendors(activeTab);
      console.log('Refreshed list response:', refreshedList);
      setVendors(Array.isArray(refreshedList) ? refreshedList : []);
      
      // Close modal and reset form
      setShowAddVendorModal(false);
      setFormData({
        vendorId: "",
        photo: "",
        brandName: "",
        personName: "",
        listedServices: 0,
        location: "",
        action: "",
      });

      console.log('Vendor created successfully:', response);
    } catch (err: any) {
      console.error('Full error object:', err);
      let errorMessage = 'Failed to create vendor.';
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error) {
        errorMessage = err.error;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      console.error('Error creating vendor:', err);
    } finally {
      setLoading(false);
    }
  };



  const handleView = async (vendor: Vendor) => {
    try {
      setLoading(true);
      // Fetch full vendor details to ensure all fields like business/personal are enriched
      const res = await vendorService.getVendor(vendor._id || vendor.vendorId);
      setSelectedVendor(res?.data || res || vendor);
      setShowVendorDetails(true);
    } catch (err) {
      console.error('Failed to fetch vendor details:', err);
      // Fallback to basic vendor data from list
      setSelectedVendor(vendor);
      setShowVendorDetails(true);
    } finally {
      setLoading(false);
      setShowActionMenu(null);
    }
  };

  const handleBan = async (vendor: Vendor) => {
    try {
      setLoading(true);
      await vendorService.updateVendorStatus(vendor._id, 'banned');
      // refresh list
      const refreshed = await vendorService.getVendors(activeTab);
      setVendors(Array.isArray(refreshed) ? refreshed : []);
    } catch (err) {
      console.error('Failed to update vendor status', err);
      setError('Failed to update vendor status');
    } finally {
      setLoading(false);
      setShowActionMenu(null);
    }
  };

  const handleDelete = async (vendor: Vendor) => {
    if (!window.confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      await vendorService.deleteVendor(vendor._id);
      // refresh list
      const refreshed = await vendorService.getVendors(activeTab);
      setVendors(Array.isArray(refreshed) ? refreshed : []);
    } catch (err) {
      console.error('Failed to delete vendor', err);
      setError('Failed to delete vendor');
    } finally {
      setLoading(false);
      setShowActionMenu(null);
    }
  };

  const handleApplyFilters = (filters: any) => {
    console.log("Applied filters:", filters);
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredSortedVendors.length / itemsPerPage);
  const paginatedVendors = filteredSortedVendors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar */}
      <div className="fixed">
        <AdminSidebar
          showMobileSidebar={mobileOpen}
          setShowMobileSidebar={setMobileOpen}
        />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden ml-60 max-lg:ml-0">
        {/* Top Header */}
        <AdminHeader Headtitle={"Management"} setMobileSidebarOpen={setMobileOpen} />

        {/* Page Content */}
        <main className="flex-1 pr-5 pb-5 ">
          {/* Content Header */}
          <div className="flex justify-between bg-white rounded-t-3xl border-b border-[#EAECF0] p-5 mb-0">
            <h2 className="text-xl font-bold text-[#101828] font-geist tracking-tight">
              Vendor Management
            </h2>

              {/* <Button
                              className="bg-dashboard-primary text-white rounded-full px-4 py-2 flex items-center gap-2"
                               onClick={handleAddVendor}
                            >
                              <Plus size={16} />
                              <span>Add Vender</span>
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
                    <SelectItem value="brandName">Name</SelectItem>
                    <SelectItem value="createdAt">Date</SelectItem>
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
              <Table>
                <TableHeader className="bg-[#F2F4F7]">
                  <TableRow>
                    <TableHead className="font-bold text-[#334054] font-plus-jakarta">
                      Vendor ID
                    </TableHead>
                    <TableHead className="font-bold text-[#334054] font-plus-jakarta">
                      Photo
                    </TableHead>
                    <TableHead className="font-bold text-[#334054] font-plus-jakarta">
                      Brand Name
                    </TableHead>
                    <TableHead className="font-bold text-[#334054] font-plus-jakarta">
                      Person Name
                    </TableHead>
                    <TableHead className="font-bold text-[#334054] font-plus-jakarta">
                      Listed Services
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
                   {/* Loading State */}
                   {!loading && paginatedVendors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No vendors found.
                      </TableCell>
                    </TableRow> 
                  )}
                  {paginatedVendors.map((vendor) => (
                    <TableRow
                      key={vendor._id}
                      className="border-b border-[#F2F4F7]"
                    >
                      <TableCell className="py-4">
                        <button
                          onClick={() => handleView(vendor)}
                          className="font-bold text-[#0066FF] underline font-plus-jakarta hover:text-[#0052CC] transition-colors"
                        >
                          {vendor.vendorId}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={vendor.photo} />
                          <AvatarFallback>
                            {vendor.personName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="text-[#485467] font-poppins">
                        {vendor.brandName}
                      </TableCell>
                      <TableCell className="text-[#485467] font-poppins">
                        {vendor.personName}
                      </TableCell>
                      <TableCell className="text-[#485467] font-poppins">
                        {vendor.listedServices}
                      </TableCell>
                      <TableCell className="text-[#485467] font-poppins">
                        {vendor.location}
                      </TableCell>
                      <TableCell>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowActionMenu(
                                showActionMenu === vendor._id ? null : vendor._id,
                              )
                            }
                            className="text-[#667085] hover:text-[#485467]"
                          >
                            <MoreHorizontal size={20} />
                          </button>

                          {/* Action Menu Dropdown */}
                          {showActionMenu === vendor._id && (
                            <div className="absolute right-0 top-8 bg-white border border-[#F8F8F8] rounded-xl shadow-lg p-1 z-10 w-48">
                              <button
                                className="flex items-center gap-2 w-full px-3 py-3 text-left hover:bg-[#F2F4F7] rounded-lg transition-colors"
                                onClick={() => handleView(vendor)}
                              >
                                <Eye size={18} className="text-black" />
                                <span className="text-sm font-poppins text-[#2A2A2A]">
                                  View
                                </span>
                              </button>
                              {/* <button
                                className="flex items-center gap-2 w-full px-3 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                onClick={() => handleBan(vendor)}
                              >
                                <Trash2 size={18} className="text-[#D30000]" />
                                <span className="text-sm font-poppins text-[#D30000]">
                                  Ban
                                </span>
                              </button> */}
                               <button
                                className="flex items-center gap-2 w-full px-3 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                onClick={() => handleDelete(vendor)}
                              >
                                <Trash2 size={18} className="text-[#D30000]" />
                                <span className="text-sm font-poppins text-[#D30000]">
                                  Delete
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>  
               {loading && (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-dashboard-primary" />
                <span className="ml-2 text-dashboard-primary">Loading...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
                <p>{error}</p>
              </div>
            )}
            </div>
            
            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Add Vendor Modal */}
{showAddVendorModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Vendor</h2>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Form Inputs */}
      <div className="space-y-4">
        <Input
          placeholder="Vendor ID"
          value={formData.vendorId}
          onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
          disabled={loading}
        />
        <Input
          placeholder="Photo URL"
          value={formData.photo}
          onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
          disabled={loading}
        />
        <Input
          placeholder="Brand Name *"
          value={formData.brandName}
          onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
          disabled={loading}
          required
        />
        <Input
          placeholder="Person Name *"
          value={formData.personName}
          onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
          disabled={loading}
          required
        />
        <Input
          placeholder="Listed Services"
          value={formData.listedServices}
          onChange={(e) => setFormData({ ...formData, listedServices: e.target.value })}
          disabled={loading}
          type="number"
        />
        <Input
          placeholder="Location *"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          disabled={loading}
          required
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end mt-6 gap-3">
        <Button
          variant="outline"
          onClick={() => setShowAddVendorModal(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          className="bg-dashboard-primary text-white flex items-center gap-2"
          onClick={handleSaveVendor}
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Saving...' : 'Save Vendor'}
        </Button>
      </div>

      {/* Close Button (Top Right) */}
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        onClick={() => setShowAddVendorModal(false)}
      >
        ×
      </button>
    </div>
  </div>
)}


      {/* Vendor Details Popup */}
      <VendorDetailsPopup
        isOpen={showVendorDetails}
        onClose={() => setShowVendorDetails(false)}
        vendor={selectedVendor}
      />

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

export default VendorManagement;
