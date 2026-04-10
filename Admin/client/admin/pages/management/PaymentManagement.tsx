import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, MoreHorizontal, Bell, Loader2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminSidebar from "../../components/AdminSidebar";
import PaymentDetailsPopup from "@/components/PaymentDetailsPopup";
import AdminProfileDropdown from "@/admin/components/AdminProfileDropdown";
import AdminHeader from "@/admin/components/AdminHeader";
import { paymentService } from "@/services/api";
import Pagination from "@/components/Pagination";

interface PaymentData {
  _id: string;
  paymentId: string;
  businessName: string;
  personName: string;
  servicesId: string;
  servicesNames: string;
  status: string;
  amount?: string;
  paymentMode?: string;
  transactionId?: string;
}

const PaymentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "payment-received" | "vendor" | "refund-status"
  >("payment-received");
  const [activeServiceType, setActiveServiceType] = useState("camper-van");
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(
    null,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // New state for API-backed data
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("paymentId");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const handleTabChange = (
    tabId: "payment-received" | "vendor" | "refund-status",
  ) => {
    setActiveTab(tabId);
    // Reset service type based on new tab
    if (tabId === "payment-received") {
      setActiveServiceType("camper-van");
    } else {
      setActiveServiceType("pending");
    }
  };

  // Map UI select values to backend sort fields (no UI change)
  const mapSortValue = (val: string) => {
    if (val === "unique-stay") return "businessName";
    if (val === "activity") return "personName";
    return "paymentId"; // default for "camper-van" or others
  };

  // Fetch payments from API whenever filters change
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = {
          tab: activeTab,
          serviceType: activeServiceType,
          search: searchTerm || undefined,
          sortBy: mapSortValue(sortBy),
          sortDir: "asc" as const,
        };
        const response = await paymentService.getPayments(params);
        if (response && response.data) {
          setPayments(response.data);
        } else if (Array.isArray(response)) {
          setPayments(response as any);
        } else {
          setPayments([]);
        }
      } catch (err: any) {
        console.error("Error fetching payments", err);
        setError(typeof err === "string" ? err : "Failed to fetch payments.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
    setCurrentPage(1);
  }, [activeTab, activeServiceType, searchTerm, sortBy]);

  const tabs = [
    { id: "payment-received", label: "Payment Received" },
    { id: "vendor", label: "Vendor" },
    { id: "refund-status", label: "Refund Status" },
  ];

  const getServiceTypes = () => {
    if (activeTab === "payment-received") {
      return [
        { id: "camper-van", label: "Camper Van" },
        { id: "unique-stay", label: "Unique Stay" },
        { id: "activity", label: "Activity" },
      ];
    } else if (activeTab === "vendor" || activeTab === "refund-status") {
      return [
        { id: "pending", label: "Pending" },
        { id: "paid", label: "Paid" },
      ];
    }
    return [];
  };

  const serviceTypes = useMemo(getServiceTypes, [activeTab]);

  const handleViewPayment = (payment: PaymentData) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-orange-100 text-orange-600";
      case "paid":
        return "bg-green-100 text-green-600";
      case "refunded":
        return "bg-blue-100 text-blue-600";
      case "processing":
        return "bg-yellow-100 text-yellow-600";
      case "requested":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-orange-100 text-orange-600";
    }
  };

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
        <AdminHeader Headtitle={"Payments"} setMobileSidebarOpen={setMobileOpen}/>

        {/* Main Content */}
        <div className="flex-1 p-5 pr-0 ">
          <div className="bg-white rounded-3xl border border-gray-200 h-full">
            {/* Content Header */}
            <div className="p-5 border-b border-gray-200 rounded-t-3xl">
              <h2 className="text-xl font-bold text-gray-900">
                Payment Details
              </h2>
            </div>

            <div className="p-5 flex flex-col gap-7">
              {/* Tabs */}
              <div className="flex  max-md:flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as any)}
                    className={`px-4 py-3 text-base font-bold transition-colors relative ${
                      activeTab === tab.id ? "text-black" : "text-gray-400"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Service Type Filter */}
              <div className="inline-flex  max-md:flex-wrap items-center p-0.5 border border-gray-200 rounded-full bg-white shadow-sm w-fit">
                {serviceTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setActiveServiceType(type.id)}
                    className={`px-4 py-3 text-sm font-semibold rounded-full transition-colors ${
                      activeServiceType === type.id
                        ? "bg-black text-white"
                        : "text-black hover:bg-gray-50"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Search and Filters */}
              <div className="flex items-center justify-between  max-md:flex-wrap">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search"
                    className="pl-10 border-gray-300 rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-4  max-md:flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Sort By</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40 border-gray-300">
                        <SelectValue placeholder="select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="camper-van">Camper Van</SelectItem>
                        <SelectItem value="unique-stay">Unique Stay</SelectItem>
                        <SelectItem value="activity">Activity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-gray-200 rounded-xl overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 ">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-bold text-gray-700">
                        Payment ID
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700">
                        Business Name
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700">
                        Person Name
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700 w-40">
                        Services ID
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700 w-40">
                        Services Names
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700 w-32">
                        Status
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700 w-40">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage,
                      )
                      .map((payment) => (
                        <tr key={payment._id} className="border-t border-gray-100">
                        <td className="px-4 py-4">
                          <span className="text-sm font-bold text-black">
                            {payment.paymentId}
                          </span>
                        </td>
                        <td className="text-sm px-3 py-4 text-gray-600">
                          {payment.businessName}
                        </td>
                        <td className="text-sm px-3 py-4 text-gray-600">
                          {payment.personName}
                        </td>
                        <td className="text-sm px-3 py-4 text-black">
                          {payment.servicesId}
                        </td>
                        <td className="px-3 py-4">
                          <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-sm">
                            {payment.servicesNames}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`px-3 py-1 rounded-lg text-sm ${getStatusColor(payment.status)}`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="text-gray-400 hover:text-gray-600">
                                <MoreHorizontal className="w-5 h-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border-gray-200">
                              <DropdownMenuItem
                                onClick={() => handleViewPayment(payment)}
                                className="cursor-pointer"
                              >
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {(!loading && payments.length === 0) && (
                      <tr>
                        <td className="px-4 py-6 text-gray-500" colSpan={7}>No records</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {  error &&
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {/* Error State */}
                <p>{error}</p>
                <Button
                  variant="outline"
                  className="mt-2 text-red-700 border-red-300"
                  // onClick={() => {
                  //   // Retry fetching payments
                  //   setError(null);
                  //   setLoading(true); 
                  //   setTimeout(() => setLoading(false), 500);
                  // }}              
                >
                  Try Again
                </Button>
              </div>}
              
            {loading && 
              <div className="w-full flex justify-center items-center py-10">
                {/* Loading State */}
                <Loader2 className="w-8 h-8 animate-spin text-dashboard-primary" />
                <span className="ml-2 text-dashboard-primary">Loading...</span>
              </div>}

              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(payments.length / itemsPerPage))}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Popup */}
      {showPaymentDetails && selectedPayment && (
        <PaymentDetailsPopup
          isOpen={showPaymentDetails}
          onClose={() => setShowPaymentDetails(false)}
          payment={selectedPayment}
        />
      )}
    </div>
    
  );
};

export default PaymentManagement;
