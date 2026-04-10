import React from "react";
import { X, Loader2, AlertCircle, Building2, User, FileText, MapPin, Mail, Phone, Calendar, CreditCard } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface VendorDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: any | null;
  isLoading?: boolean;
  error?: string | null;
}

export default function VendorDetailsPopup({
  isOpen,
  onClose,
  vendor,
  isLoading,
  error,
}: VendorDetailsPopupProps) {
  if (!isOpen) return null;

  // Extract Business Details
  const brandName = vendor?.brandName || vendor?.business?.brandName || vendor?.businessName || "N/A";
  const legalCompanyName = vendor?.legalCompanyName || vendor?.business?.legalCompanyName || vendor?.companyName || "N/A";
  const gstNumber = vendor?.gstNumber || vendor?.business?.gstNumber || "N/A";
  const businessEmail = vendor?.businessEmail || vendor?.business?.email || vendor?.email || "N/A";
  const businessPhone = vendor?.businessPhone || vendor?.business?.phone || vendor?.phoneNumber || vendor?.phone || "N/A";
  
  const businessAddress = [
    vendor?.businessLocality || vendor?.business?.locality || vendor?.locality,
    vendor?.businessCity || vendor?.business?.city || vendor?.city,
    vendor?.businessState || vendor?.business?.state || vendor?.state,
    vendor?.businessPincode || vendor?.business?.pincode || vendor?.pincode
  ].filter(Boolean).join(", ") || vendor?.businessAddress || vendor?.address || "N/A";

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "N/A";
    
    try {
        // Handle YYYY-MM-DD specifically to avoid timezone shifts
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            // Construct date in local time to avoid UTC shift
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; 
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    } catch (e) {
        return dateString;
    }
  };

  // Extract Personal Details
  const firstName = vendor?.firstName || vendor?.personal?.firstName || "";
  const lastName = vendor?.lastName || vendor?.personal?.lastName || "";
  const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : (vendor?.personName || vendor?.name || "N/A");
  
  const dateOfBirthRaw = vendor?.dateOfBirth || vendor?.personal?.dateOfBirth || "N/A";
  const dateOfBirth = formatDate(dateOfBirthRaw);
  const maritalStatus = vendor?.maritalStatus || vendor?.personal?.maritalStatus || "N/A";
  
  const personalAddress = [
    vendor?.personalLocality || vendor?.personal?.locality,
    vendor?.personalCity || vendor?.personal?.city,
    vendor?.personalState || vendor?.personal?.state,
    vendor?.personalPincode || vendor?.personal?.pincode
  ].filter(Boolean).join(", ") || vendor?.personalAddress || vendor?.address || "N/A";

  const idProofType = vendor?.idProof || vendor?.personal?.idProof || vendor?.idType || "N/A";
  const idPhotos = vendor?.idPhotos || vendor?.personal?.idPhotos || (vendor?.idPhoto ? [vendor.idPhoto] : []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <div className="p-6 md:p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors z-10"
          >
            <X size={18} className="text-gray-600" />
          </button>

          <div className="space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900 font-geist">Vendor Details</h2>
              <p className="text-sm text-gray-500 mt-1">Vendor ID: {vendor?.vendorId || vendor?._id || "N/A"}</p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-gray-500 font-medium">Fetching vendor details...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="bg-red-50 p-4 rounded-full">
                  <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Error Loading Details</h3>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Business Details Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="text-blue-600" size={20} />
                    <h3 className="text-lg font-bold text-gray-900 font-geist">Business Details</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Brand Name</p>
                        <p className="font-medium text-gray-900">{brandName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Legal Company Name</p>
                        <p className="font-medium text-gray-900">{legalCompanyName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">GST Number</p>
                        <p className="font-medium text-gray-900">{gstNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Business Email</p>
                        <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            <p className="font-medium text-gray-900 break-all">{businessEmail}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Business Phone</p>
                        <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            <p className="font-medium text-gray-900">{businessPhone}</p>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Business Address</p>
                        <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-gray-400 mt-1" />
                            <p className="font-medium text-gray-900">{businessAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Personal Details Section */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="text-blue-600" size={20} />
                    <h3 className="text-lg font-bold text-gray-900 font-geist">Personal Details</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
                        <p className="font-medium text-gray-900">{fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date of Birth</p>
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <p className="font-medium text-gray-900">{dateOfBirth}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Marital Status</p>
                        <p className="font-medium text-gray-900">{maritalStatus}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Personal Address</p>
                        <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-gray-400 mt-1" />
                            <p className="font-medium text-gray-900">{personalAddress}</p>
                        </div>
                      </div>
                      
                      {/* ID Proof Section */}
                      <div className="md:col-span-2 pt-4 border-t border-gray-200 mt-2">
                        <div className="flex items-center gap-2 mb-3">
                            <CreditCard size={16} className="text-gray-500" />
                            <h4 className="font-semibold text-gray-700">Identity Proof</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ID Type</p>
                                <p className="font-medium text-gray-900">{idProofType}</p>
                            </div>
                        </div>

                        {idPhotos && idPhotos.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ID Photos</p>
                                <div className="flex flex-wrap gap-3">
                                    {idPhotos.map((photo: string, index: number) => (
                                        <div key={index} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-white">
                                            <img 
                                                src={getImageUrl(photo)} 
                                                alt={`ID Proof ${index + 1}`} 
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            />
                                            <a 
                                                href={getImageUrl(photo)} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                            >
                                                <FileText className="text-white drop-shadow-md" size={20} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
