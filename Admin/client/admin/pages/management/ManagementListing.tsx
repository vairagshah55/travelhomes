import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Edit, Trash2, MoreHorizontal, Eye, XCircle, CheckCircle, Filter, User, X } from "lucide-react";
import ViewDetailsPopup from "@/components/ViewDetailsPopup";
import VendorDetailsPopup from "@/components/VendorDetailsPopup";
import Pagination from "@/components/Pagination";
import ManagementForm, { Offer } from "@/components/ManagementForm";
import ListingFilterPopup from "@/components/ListingFilterPopup";
import RejectReasonPopup from "@/components/RejectReasonPopup";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { offersService, vendorService } from "@/services/api";
import AdminSidebar from "@/admin/components/AdminSidebar";
import AdminHeader from "@/admin/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";

const ManagementListing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // State for offers
  const [offersTab, setOffersTab] = useState<"pending" | "approved" | "cancelled" | "modified" | "rejected">("pending");
  const [offers, setOffers] = useState<any[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  
  // State for form/modals
  const [showManagementForm, setShowManagementForm] = useState(false);
  const [showViewDetailsPopup, setShowViewDetailsPopup] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [viewOffer, setViewOffer] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [rejectOffer, setRejectOffer] = useState<any | null>(null);
  const [rejectAction, setRejectAction] = useState<"cancelled" | "rejected">("rejected");
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [sortBy, setSortBy] = useState<string>("default");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for vendor details
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [isVendorLoading, setIsVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState<string | null>(null);

  // Fetch offers when tab changes
  useEffect(() => {
    setCurrentPage(1);
    fetchOffers();
  }, [offersTab]);

  const fetchOffers = async () => {
    try {
      setOffersLoading(true);
      const res = await offersService.list(offersTab);
      setOffers(res?.data || []);
    } catch (e) {
      console.error("Failed to load offers", e);
      toast({
        title: "Error",
        description: "Failed to load listings.",
        variant: "destructive",
      });
    } finally {
      setOffersLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedOffer(null);
    setIsEditing(false);
    setShowManagementForm(true);
  };

  const mapOfferToForm = (offer: any): Offer => {
      return {
        _id: offer._id,
        name: offer.name || "",
        category: offer.category || "",
        regularPrice: offer.regularPrice || "",
        finalPrice: offer.finalPrice || "",
        locality: offer.locality || "",
        city: offer.city || "",
        state: offer.state || "",
        pincode: offer.pincode || "",
        description: offer.description || "",
        features: offer.features || "",
        status: offer.status
    };
  }

  const handleEdit = (offer: any) => {
    const formData = mapOfferToForm(offer);
    setSelectedOffer(formData);
    setIsEditing(true);
    setShowManagementForm(true);
  };

  const handleView = (offer: any) => {
    setViewOffer(offer);
    setShowViewDetailsPopup(true);
  };

  const handleDeleteClick = (offer: any) => {
    const formData = mapOfferToForm(offer);
    setSelectedOffer(formData);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!selectedOffer?._id) return;
    
    try {
      setIsSubmitting(true);
      await offersService.remove(selectedOffer._id);
      
      setOffers((prev) => prev.filter((x) => x._id !== selectedOffer._id));
      
      toast({
        title: "Deleted",
        description: "Listing deleted successfully",
      });
      setShowDeleteConfirmation(false);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to delete listing",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (data: Partial<Offer>) => {
    try {
      setIsSubmitting(true);
      
      const idToUpdate = data._id || (isEditing && selectedOffer?._id);
      
      if (idToUpdate) {
        await offersService.update(idToUpdate, data);
        toast({
          title: "Updated",
          description: "Listing updated successfully",
        });
      } else {
        await offersService.create(data);
        toast({
          title: "Created",
          description: "Listing created successfully",
        });
      }
      
      setShowManagementForm(false);
      fetchOffers(); // Refresh list
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to save listing",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (offer: any, status: "pending" | "approved" | "cancelled" | "rejected") => {
    if (status === "cancelled" || status === "rejected") {
      setRejectOffer(offer);
      setRejectAction(status);
      setShowRejectPopup(true);
      return;
    }

    try {
      await offersService.setStatus(offer._id, status);
      
      // If we're filtering by status, remove it from the list. 
      // Or if we want to keep it and update status:
      // setOffers((prev) => prev.map(x => x._id === offer._id ? { ...x, status } : x));
      
      // Based on current behavior (tabs), we should probably remove it if it doesn't match the tab
      if (offersTab !== status) {
          setOffers((prev) => prev.filter((x) => x._id !== offer._id));
      } else {
          // In case we are viewing 'all' or something similar, update it
          setOffers((prev) => prev.map(x => x._id === offer._id ? { ...x, status } : x));
      }

      toast({
        title: "Status Updated",
        description: `Listing marked as ${status}`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleRejectSubmit = async (reason: string) => {
    if (!rejectOffer) return;

    try {
      setIsSubmitting(true);
      await offersService.setStatus(rejectOffer._id, rejectAction, reason);
      
      if (offersTab !== rejectAction) {
        setOffers((prev) => prev.filter((x) => x._id !== rejectOffer._id));
      } else {
        setOffers((prev) => prev.map(x => x._id === rejectOffer._id ? { ...x, status: rejectAction } : x));
      }

      toast({
        title: "Status Updated",
        description: `Listing marked as ${rejectAction === 'cancelled' ? 'Deactivated' : 'Rejected'}`,
      });
      setShowRejectPopup(false);
      setRejectOffer(null);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Failed to update listing status",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyFilters = (filters: any) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  const handleVendorClick = async (vendorId: string) => {
    if (!vendorId || vendorId === "-") return;
    
    try {
      setIsVendorLoading(true);
      setVendorError(null);
      setShowVendorDetails(true);
      // Pass the vendorId to show at least that if loading fails
      setSelectedVendor({ vendorId }); 
      
      const res = await vendorService.getVendor(vendorId);
      setSelectedVendor(res?.data || res);
    } catch (e: any) {
      console.error("Failed to load vendor details", e);
      setVendorError(typeof e === 'string' ? e : e.message || "Failed to load vendor details.");
      // Keep showVendorDetails as true so the dialog stays open
    } finally {
      setIsVendorLoading(false);
    }
  };

  const filteredOffers = offers.filter((offer) => {
    // Brand Name -> Match name (fuzzy)
    if (activeFilters.brandName && !offer.name?.toLowerCase().includes(activeFilters.brandName.toLowerCase())) {
        return false;
    }
    // Person Name -> Match vendor name? offer.vendorId is ID. 
    // Assuming for now we ignore or match name as well? 
    // Let's match against offer.name too just in case, or maybe specific field if available.
    // Since we don't have vendor name populated, we'll skip for now or try to match if offer has user details.
    
    // Service Name -> Category
    if (activeFilters.serviceName && activeFilters.serviceName !== offer.category) {
        return false;
    }
    // Location -> City/Locality
    if (activeFilters.location) {
        const loc = activeFilters.location.toLowerCase();
        const city = (offer.city || "").toLowerCase();
        const locality = (offer.locality || "").toLowerCase();
        if (!city.includes(loc) && !locality.includes(loc)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "price-low-high") {
        return (Number(a.finalPrice) || 0) - (Number(b.finalPrice) || 0);
    } else if (sortBy === "price-high-low") {
        return (Number(b.finalPrice) || 0) - (Number(a.finalPrice) || 0);
    } else if (sortBy === "name-a-z") {
        return (a.name || "").localeCompare(b.name || "");
    }
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / itemsPerPage));
  const paginatedOffers = filteredOffers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        <AdminHeader Headtitle={"Management"} setMobileSidebarOpen={setMobileOpen} />

        <main className="flex-1 pr-5 pb-5">
          {/* Content Header */}
          <div className="bg-white rounded-t-3xl border-b border-[#EAECF0] p-5 mb-0 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#101828] font-geist tracking-tight">
              Listing Management
            </h2>
            
            {/* <Button 
              onClick={handleAddNew}
              className="bg-[#131313] text-white rounded-full px-4 py-2 flex items-center gap-2 hover:bg-[#2A2A2A]"
            >
              <Plus size={16} />
              <span>Add New</span>
            </Button> */}
          </div>

          <div className="bg-white rounded-b-3xl p-5 space-y-8">
            {/* Listing Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  {(["pending", "approved", "cancelled" , "modified"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setOffersTab(t)}
                      className={`px-4 py-2 capitalize rounded-full text-sm transition-colors ${
                        offersTab === t 
                          ? "bg-dashboard-primary text-white" 
                          : "text-dashboard-primary hover:bg-gray-50 border border-gray-200"
                      }`}
                    >
                      {/* {t.charAt(0).toUpperCase() + t.slice(1)} */}
                      {t === "cancelled" ? "Deactivated" : t}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Sort By</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                            <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                            <SelectItem value="name-a-z">Name: A-Z</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>

                  {Object.entries(activeFilters).map(([key, value]) => {
                     if (!value) return null;
                     return (
                        <div key={key} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm border border-gray-200">
                            <span className="capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}: {String(value)}</span>
                            <button onClick={() => {
                                const newFilters = { ...activeFilters };
                                delete newFilters[key];
                                setActiveFilters(newFilters);
                            }} className="ml-1">
                                <X size={14} className="text-gray-500 hover:text-red-500" />
                            </button>
                        </div>
                     )
                  })}

                  <Button
                    variant="outline"
                    className="h-10 px-5 border-[#D0D5DD] rounded-full flex items-center gap-2"
                    onClick={() => setShowFilterPopup(true)}
                  >
                    <Filter size={16} className="text-gray-600" />
                    <span className="font-poppins text-gray-600">Filters</span>
                  </Button>
                </div>
              </div>

              <div className="border border-dashboard-stroke rounded-xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-1 px-4 py-3 text-sm font-bold text-gray-700">
                  <div className=" text-center col-span-1">Vendor ID</div>
                  <div className=" text-center col-span-4">Name</div>
                  <div className=" text-center col-span-2">Category</div>
                  <div className=" text-center col-span-2">Price</div>
                  <div className=" text-center col-span-2">Location</div>
                  <div className=" text-center col-span-1 ">Actions</div>
                </div>
                
                {offersLoading ? (
                  <div className="p-12 text-center text-dashboard-body flex gap-3 items-center justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-gray-600" />
                    <span>Loading...</span>
                  </div>
                ) : filteredOffers.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        {offers.length === 0 ? "No listings found" : "No listings match your filters"}
                    </div>
                ) : (
                  paginatedOffers.map((o, idx) => (
                    <div
                      key={o._id || idx}
                      className={`grid grid-cols-12 gap-3  items-center hover:bg-gray-50 transition-colors ${
                        idx !== paginatedOffers.length - 1 ? "border border-gray-100" : ""
                      }`}
                    >
                      <div 
                        className="text-sm col-span-1 text-center  hover:underline cursor-pointer border-r px-4 py-4 h-full font-medium text-blue-600"
                        onClick={() => handleVendorClick(o.vendorId)}
                      >
                        {o.vendorId || "-"}
                      </div>
                      <div className="col-span-4 text-center  border-r px-4 py-4 h-full flex items-center gap-3">
                        {o.photos?.coverUrl ? (
                          <img
                            src={getImageUrl(o.photos.coverUrl)}
                            alt="cover"
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0" />
                        )}
                        <div className="font-medium  text-sm">{o.name}</div>
                      </div>
                      <div className="col-span-2 text-center  border-r px-4 py-4 h-full text-sm">{o.category}</div>
                      <div className="col-span-2 text-center  border-r px-4 py-4 h-full font-medium text-sm">₹{o.regularPrice ?? "-"}</div>
                      <div className="col-span-2 text-center  border-r px-4 py-4 h-full text-sm text-gray-600">
                        {[o.locality, o.city, o.state]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div className="col-span-1 text-center  border-r px-6  py-4 h-full flex items-center justify-end gap-2">
                        {/* Action Buttons Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(o)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(o)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {o.status !== "approved" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(o, "approved")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {o.status !== "pending" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(o, "pending")}>
                                <Loader2 className="mr-2 h-4 w-4" />
                                Mark Pending
                              </DropdownMenuItem>
                            )}
                            {o.status !== "cancelled" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(o, "cancelled")}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel
                                </DropdownMenuItem>
                            )}
                          {o.status === "cancelled" &&
                          <DropdownMenuItem onClick={() => handleDeleteClick(o)} className="text-red-600 focus:text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>} 
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </main>
      </div>

      <ManagementForm
        isOpen={showManagementForm}
        onClose={() => setShowManagementForm(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedOffer || undefined}
        isLoading={isSubmitting}
      />
      
      <ViewDetailsPopup
        isOpen={showViewDetailsPopup}
        onClose={() => setShowViewDetailsPopup(false)}
        listingData={viewOffer}
        onApprove={
            viewOffer?.status !== 'approved'
            ? () => {
                if (viewOffer) {
                    handleStatusChange(viewOffer, "approved");
                    setShowViewDetailsPopup(false);
                }
            }
            : undefined
        }
        onReject={
            viewOffer?.status !== 'rejected' && viewOffer?.status !== 'cancelled'
            ? () => {
                if (viewOffer) {
                    handleStatusChange(viewOffer, "rejected");
                    setShowViewDetailsPopup(false);
                }
            }
            : undefined
        }
      />

      <ListingFilterPopup
        isOpen={showFilterPopup}
        onClose={() => setShowFilterPopup(false)}
        onApplyFilters={handleApplyFilters}
      />

      <RejectReasonPopup
        isOpen={showRejectPopup}
        onClose={() => {
            setShowRejectPopup(false);
            setRejectOffer(null);
        }}
        onSubmit={handleRejectSubmit}
        isLoading={isSubmitting}
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDelete}
        title="Delete Listing"
        message={`Are you sure you want to delete the listing "${selectedOffer?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isSubmitting}
      />

      <VendorDetailsPopup
        isOpen={showVendorDetails}
        onClose={() => {
          setShowVendorDetails(false);
          setSelectedVendor(null);
          setVendorError(null);
        }}
        vendor={selectedVendor}
        isLoading={isVendorLoading}
        error={vendorError}
      />
    </div>
  );
};

export default ManagementListing;