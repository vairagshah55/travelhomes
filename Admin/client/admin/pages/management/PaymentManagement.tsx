import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, MoreHorizontal, AlertCircle } from "lucide-react";
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
import AdminLayout from "../../components/AdminLayout";
import PaymentDetailsPopup from "@/components/PaymentDetailsPopup";
import ConfirmationDialog from "@/components/ConfirmationDialog";
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
  const [activeTab, setActiveTab] = useState<"payment-received" | "vendor" | "refund-status">(
    "payment-received",
  );
  const [activeServiceType, setActiveServiceType] = useState("camper-van");
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("paymentId");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const handleTabChange = (tabId: "payment-received" | "vendor" | "refund-status") => {
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

  // Payments list — keyed by every filter that influences the request.
  const paymentsQuery = useQuery<PaymentData[]>({
    queryKey: ["payments", activeTab, activeServiceType, searchTerm || "", mapSortValue(sortBy)],
    queryFn: async () => {
      const params = {
        tab: activeTab,
        serviceType: activeServiceType,
        search: searchTerm || undefined,
        sortBy: mapSortValue(sortBy),
        sortDir: "asc" as const,
      };
      const response = await paymentService.getPayments(params);
      if (response && response.data) return response.data;
      if (Array.isArray(response)) return response as any;
      return [];
    },
  });
  const payments = paymentsQuery.data ?? [];
  const loading = paymentsQuery.isLoading;
  const error = paymentsQuery.error
    ? (paymentsQuery.error as Error).message || "Failed to fetch payments."
    : null;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeServiceType, searchTerm, sortBy]);

  const handleDeletePayment = (id: string) => {
    setConfirmDelete(id);
  };

  const doDeletePayment = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await paymentService.deletePayment(id);
      toast.success("Payment deleted.");
      paymentsQuery.refetch();
    } catch {
      toast.error("Failed to delete payment.");
    }
  };

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
    <AdminLayout title="Payments">
        <div className="flex-1">
          <div className="bg-white rounded-3xl border border-gray-200 h-full">
            {/* Content Header */}
            <div className="p-5 border-b border-gray-200 rounded-t-3xl">
              <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
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

                  <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
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
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="border-t border-gray-100 animate-pulse">
                          <td className="px-4 py-4"><div className="h-3.5 w-24 bg-gray-200 rounded" /></td>
                          <td className="px-3 py-4"><div className="h-3.5 w-32 bg-gray-200 rounded" /></td>
                          <td className="px-3 py-4"><div className="h-3.5 w-28 bg-gray-200 rounded" /></td>
                          <td className="px-3 py-4"><div className="h-3.5 w-20 bg-gray-200 rounded" /></td>
                          <td className="px-3 py-4"><div className="h-6 w-20 bg-gray-200 rounded-lg" /></td>
                          <td className="px-3 py-4"><div className="h-6 w-16 bg-gray-200 rounded-lg" /></td>
                          <td className="px-3 py-4"><div className="h-5 w-5 bg-gray-200 rounded" /></td>
                        </tr>
                      ))
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-400">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="4" y="10" width="40" height="28" rx="4" stroke="#D1D5DB" strokeWidth="2"/>
                              <path d="M4 18h40" stroke="#D1D5DB" strokeWidth="2"/>
                              <path d="M14 28h8M14 32h5" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <p className="text-sm font-medium">No payment records found</p>
                            <p className="text-xs">Try adjusting your filters or search term</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      payments
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((payment, i) => (
                          <motion.tr
                            key={payment._id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.18 }}
                            className="border-t border-gray-100 hover:bg-gray-50/60 transition-colors"
                          >
                            <td className="px-4 py-4">
                              <span className="text-sm font-bold text-black">{payment.paymentId}</span>
                            </td>
                            <td className="text-sm px-3 py-4 text-gray-600">{payment.businessName}</td>
                            <td className="text-sm px-3 py-4 text-gray-600">{payment.personName}</td>
                            <td className="text-sm px-3 py-4 text-black">{payment.servicesId}</td>
                            <td className="px-3 py-4">
                              <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-sm">
                                {payment.servicesNames}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(payment.status)}`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-all">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border-gray-200">
                                  <DropdownMenuItem onClick={() => handleViewPayment(payment)} className="cursor-pointer">
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeletePayment(payment._id)}
                                    className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </motion.tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(payments.length / itemsPerPage))}
                onPageChange={setCurrentPage}
              />
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
      <ConfirmationDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDeletePayment}
        title="Delete payment record?"
        message="This payment record will be permanently removed. This cannot be undone."
        confirmText="Delete"
      />
    </AdminLayout>
  );
};

export default PaymentManagement;
