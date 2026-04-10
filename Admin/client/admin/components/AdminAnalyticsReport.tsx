import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import UserDetailsPopup from "@/components/UserDetailsPopup";
import FiltersPopup from "@/components/FiltersPopup";
import { analyticsService } from "@/services/api";

interface User {
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  userSince: string;
  bookedServices: string;
  status: string;
  // properties derived or missing in schema but needed for UI
  firstName?: string;
  lastName?: string;
  dob?: string;
  city?: string;
  state?: string;
  registrationDate?: string;
  lastActiveDate?: string;
  bookedService?: string;
  isVendor?: string;
}

const AdminAnalyticsReport = () => {
  const [activeTab, setActiveTab] = useState<
    "user" | "vendor" | "payment" | "offerings" | "bookings"
  >("user");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("camper-van");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [rows, setRows] = React.useState<any[]>([]);
  const [count, setCount] = React.useState(0);

  const totalPages = Math.ceil(count / limit);

  React.useEffect(() => {
    (async () => {
      try {
        const json = await analyticsService.getReport({
          tab: activeTab,
          search: searchTerm,
          sortBy,
          page,
          limit,
          filters: activeFilters.join(',')
        });
        const items = json?.data?.items || [];
        setRows(items);
        setCount(json?.data?.count || 0);
      } catch (e) {
        console.error('Failed to load analytics report', e);
      }
    })();
  }, [activeTab, searchTerm, sortBy, activeFilters, page, limit]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm, sortBy, activeFilters]);

  const handleUserClick = (user: any) => {
    if (activeTab === 'user' || activeTab === 'vendor') {
        setSelectedUser(user);
        setIsUserDetailsOpen(true);
    }
  };

  const handleRemoveFilter = (filter: string) => {
    setActiveFilters((prev) => prev.filter((f) => f !== filter));
  };

  const HeaderCell = ({ width, children }: { width?: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-2.5 px-3 py-3" style={{ width: width, minWidth: width }}>
      <span className="text-sm font-bold text-[#334054] leading-[21px] truncate">
        {children}
      </span>
    </div>
  );

  const Cell = ({ width, children, bold = false }: { width?: string; children: React.ReactNode; bold?: boolean }) => (
    <div className="flex items-center gap-2.5 px-3 py-3.5" style={{ width: width, minWidth: width }}>
      <span className={`text-sm ${bold ? "font-bold text-[#131313]" : "text-[#485467]"} leading-6 truncate`}>
        {children}
      </span>
    </div>
  );

  const renderHeaders = () => {
    switch (activeTab) {
      case "payment":
        return (
          <>
            <HeaderCell width="150px">Payment ID</HeaderCell>
            <HeaderCell width="200px">Business Name</HeaderCell>
            <HeaderCell width="150px">Person Name</HeaderCell>
            <HeaderCell width="150px">Service</HeaderCell>
            <HeaderCell width="100px">Amount</HeaderCell>
            <HeaderCell width="100px">Status</HeaderCell>
            <HeaderCell width="150px">Date</HeaderCell>
          </>
        );
      case "offerings":
        return (
          <>
            <HeaderCell width="150px">ID</HeaderCell>
            <HeaderCell width="200px">Brand Name</HeaderCell>
            <HeaderCell width="150px">Service Name</HeaderCell>
            <HeaderCell width="200px">Location</HeaderCell>
            <HeaderCell width="100px">Status</HeaderCell>
            <HeaderCell width="150px">Created At</HeaderCell>
          </>
        );
      case "bookings":
        return (
          <>
            <HeaderCell width="150px">Booking ID</HeaderCell>
            <HeaderCell width="200px">Client Name</HeaderCell>
            <HeaderCell width="150px">Service Name</HeaderCell>
            <HeaderCell width="100px">Status</HeaderCell>
            <HeaderCell width="150px">Check In</HeaderCell>
            <HeaderCell width="150px">Check Out</HeaderCell>
          </>
        );
      default:
        return (
          <>
            <HeaderCell width="120px">User ID</HeaderCell>
            <HeaderCell width="120px">First Name</HeaderCell>
            <HeaderCell width="120px">Last Name</HeaderCell>
            <HeaderCell width="220px">Email</HeaderCell>
            <HeaderCell width="140px">Mobile</HeaderCell>
            <HeaderCell width="100px">DOB</HeaderCell>
            <HeaderCell width="120px">Location</HeaderCell>
            <HeaderCell width="140px">Registration Date</HeaderCell>
            <HeaderCell width="140px">Last Active Date</HeaderCell>
            <HeaderCell width="140px">Booked Service</HeaderCell>
            <HeaderCell width="100px">Status</HeaderCell>
          </>
        );
    }
  };

  const renderRow = (item: any) => {
    switch (activeTab) {
      case "payment":
        return (
          <>
             <Cell width="150px text-sm" bold>{item.transactionId?.substring(0, 10) || item._id?.substring(0, 8)}...</Cell>
             <Cell width="200px">{item.businessName || '-'}</Cell>
             <Cell width="150px">{item.personName || '-'}</Cell>
             <Cell width="150px">{item.servicesNames?.join(', ') || item.serviceCategory || '-'}</Cell>
             <Cell width="100px">{item.currency || '$'} {item.amount}</Cell>
             <Cell width="100px">
                <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {item.status}
                </span>
             </Cell>
             <Cell width="150px">{new Date(item.paymentDate || item.createdAt || Date.now()).toLocaleDateString()}</Cell>
          </>
        );
      case "offerings":
        return (
          <>
             <Cell width="150px" bold>{item._id?.substring(0, 8)}...</Cell>
             <Cell width="200px">{item.brandName || '-'}</Cell>
             <Cell width="150px">{item.serviceName || '-'}</Cell>
             <Cell width="200px">{item.location || '-'}</Cell>
             <Cell width="100px">
                <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {item.status}
                </span>
             </Cell>
             <Cell width="150px">{new Date(item.createdAt || Date.now()).toLocaleDateString()}</Cell>
          </>
        );
      case "bookings":
        return (
          <>
             <Cell width="150px" bold>{item.bookingId || item._id?.substring(0, 8)}...</Cell>
             <Cell width="200px">{item.clientName || '-'}</Cell>
             <Cell width="150px">{item.serviceName || '-'}</Cell>
             <Cell width="100px">
                <span className={`px-2 py-1 rounded-full text-xs ${item.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {item.bookingStatus || item.status}
                </span>
             </Cell>
             <Cell width="150px">{item.checkInDate ? new Date(item.checkInDate).toLocaleDateString() : '-'}</Cell>
             <Cell width="150px">{item.checkOutDate ? new Date(item.checkOutDate).toLocaleDateString() : '-'}</Cell>
          </>
        );
      default:
        // User & Vendor
        return (
          <>
            <Cell width="120px"  bold>{item.userId || item._id?.substring(0,8)}</Cell>
            <Cell width="120px">{item.name?.split(' ')[0] || '-'}</Cell>
            <Cell width="120px">{item.name?.split(' ').slice(1).join(' ') || '-'}</Cell>
            <Cell width="220px" bold>{item.email}</Cell>
            <Cell width="140px">{item.phone || item.mobile || '-'}</Cell>
            <Cell width="100px">{item.dob || '-'}</Cell>
            <Cell width="120px">{item.location || item.city || '-'}</Cell>
            <Cell width="140px">{new Date(item.userSince || item.createdAt || Date.now()).toLocaleDateString()}</Cell>
            <Cell width="140px">{item.lastActiveDate || '-'}</Cell>
            <Cell width="140px">{item.bookedServices || '-'}</Cell>
            <Cell width="100px">{item.status || '-'}</Cell>
          </>
        );
    }
  };

  const TabButton = ({
    tab,
    label,
    isActive,
    onClick,
  }: {
    tab: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <div className="flex flex-col items-start gap-2.5 px-4 py-3">
      <button
        onClick={onClick}
        className={`font-semibold text-base leading-[22.4px] ${
          isActive ? "text-[#0B0907]" : "text-[#6B6B6B]"
        }`}
      >
        {label}
      </button>
      {isActive && <div className="h-0.5 w-full bg-[#131313]"></div>}
    </div>
  );

  return (
    <div className="flex flex-col gap-7 p-5">
      {/* Tab Navigation */}
      <div className="flex items-center max-md:flex-wrap overflow-x-hidden border-b border-[#EAECF0]">
        <TabButton
          tab="user"
          label="User"
          isActive={activeTab === "user"}
          onClick={() => setActiveTab("user")}
        />
        <TabButton
          tab="vendor"
          label="Vendor"
          isActive={activeTab === "vendor"}
          onClick={() => setActiveTab("vendor")}
        />
        <TabButton
          tab="payment"
          label="Payment"
          isActive={activeTab === "payment"}
          onClick={() => setActiveTab("payment")}
        />
        <TabButton
          tab="offerings"
          label="Offerings"
          isActive={activeTab === "offerings"}
          onClick={() => setActiveTab("offerings")}
        />
        <TabButton
          tab="bookings"
          label="Bookings"
          isActive={activeTab === "bookings"}
          onClick={() => setActiveTab("bookings")}
        />
      </div>

      {/* Search and Filters Section */}
      <div className="flex flex-col gap-4">
        {/* Search Bar and Controls */}
        <div className="flex items-center gap-5 max-md:flex-wrap">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-[255px] h-10">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#485467] h-5 w-5" />
              <Input
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-[#B0B0B0] rounded-lg text-[#2E2E2E] text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 max-md:flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#667085] font-normal">
                Sort By
              </span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[159px] h-10 border-[#D0D5DD] rounded-lg">
                  <SelectValue placeholder="Camper Van" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="camper-van">Camper Van</SelectItem>
                  <SelectItem value="unique-stay">Unique Stay</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => setIsFiltersOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 h-10 border-[#D0D5DD] rounded-[30px] text-[#485467] text-sm"
            >
              <Filter className="h-[18px] w-[18px]" />
              Filters
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex items-start gap-3 max-md:flex-wrap">
            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-[#E6E6E6] rounded-full px-3 py-2"
              >
                <span className="text-[15px] text-[#485467] leading-[18px] tracking-[-0.3px]">
                  {filter}
                </span>
                <button
                  onClick={() => handleRemoveFilter(filter)}
                  className="text-black hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex flex-col rounded-3xl border border-[#EAECF0] bg-white overflow-hidden">
        <div className="overflow-x-auto">
            <div className="min-w-max">
                {/* Table Header */}
                <div className="flex items-center bg-[#F2F4F7] border-b border-[#EAECF0]">
                    {renderHeaders()}
                </div>

                {/* Table Body */}
                <div className="flex flex-col">
                    {rows.length > 0 ? (
                        rows.map((item: any, index: number) => (
                            <div
                            key={index}
                            onClick={() => handleUserClick(item)}
                            className="text-sm flex items-center border-b border-[#F2F4F7] last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                            {renderRow(item)}
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No data found
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#EAECF0]">
            <span className="text-sm text-gray-700">
                Page {page} of {totalPages || 1}
            </span>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </div>

      {/* User Details Popup */}
      {selectedUser && (
        <UserDetailsPopup
          isOpen={isUserDetailsOpen}
          onClose={() => setIsUserDetailsOpen(false)}
          user={selectedUser}
        />
      )}

      {/* Filters Popup */}
      <FiltersPopup
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        onApplyFilters={(filters) => {
          setActiveFilters(filters);
          setIsFiltersOpen(false);
        }}
        currentFilters={activeFilters}
      />
    </div>
  );
};

export default AdminAnalyticsReport;
