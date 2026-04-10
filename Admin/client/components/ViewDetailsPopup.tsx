import React from "react";
import { X, Loader2, Check, Minus } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ViewDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  listingData?: any;
  onApprove?: () => void;
  onReject?: () => void;
}

const ViewDetailsPopup: React.FC<ViewDetailsPopupProps> = ({
  isOpen,
  onClose,
  listingData,
  onApprove,
  onReject,
}) => {
  if (!isOpen) return null;

  if (!listingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl w-full max-w-5xl mx-4 relative max-h-[90vh] flex flex-col items-center justify-center p-20">
          <Loader2 className="h-12 w-12 animate-spin text-gray-500 mb-4" />
          <p className="text-gray-600">Loading listing details...</p>
        </div>
      </div>
    );
  }

  // Helper to extract photos
  const getPhotos = (data: any): string[] => {
    // Check 'photos' or 'images'
    const photoSource = data?.photos || data?.images;
    if (!photoSource) return [];
    
    let extracted: string[] = [];
    
    // Handle Schema structure { coverUrl, galleryUrls }
    if (photoSource.coverUrl || photoSource.galleryUrls) {
        if (photoSource.coverUrl) extracted.push(photoSource.coverUrl);
        if (Array.isArray(photoSource.galleryUrls)) {
            extracted = [...extracted, ...photoSource.galleryUrls];
        }
    } 
    // Handle simple array
    else if (Array.isArray(photoSource)) {
        extracted = photoSource;
    } 
    // Handle object with values
    else if (typeof photoSource === 'object') {
        Object.values(photoSource).forEach(val => {
            if (typeof val === 'string') extracted.push(val);
            if (Array.isArray(val)) {
                val.forEach(v => {
                    if (typeof v === 'string') extracted.push(v);
                });
            }
        });
    }
    
    return extracted.filter(Boolean).map(p => getImageUrl(p));
  };

  const photos = getPhotos(listingData);

  // Helper for arrays (features, rules, etc)
  const toArray = (val: any) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
          // Try to detect if it's newline separated or comma separated
          if (val.includes('\n')) return val.split('\n').map(s => s.trim()).filter(Boolean);
          return val.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [String(val)];
  };

  const rules = toArray(listingData.rules || listingData.rulesAndRegulations || listingData.policies?.rules);
  const includes = toArray(listingData.priceIncludes || listingData.included || listingData.perDayIncludes || listingData.perKmIncludes);
  const excludes = toArray(listingData.priceExcludes || listingData.excluded || listingData.perDayExcludes || listingData.perKmExcludes);
  const features = toArray(listingData.features || listingData.amenities || listingData.requirements);
  
  // Format Address
  const address = listingData.address && typeof listingData.address === 'string' 
    ? listingData.address 
    : [
      listingData.locality || listingData.address?.locality, 
      listingData.city || listingData.address?.city, 
      listingData.state || listingData.address?.state, 
      listingData.pincode || listingData.address?.pincode,
      listingData.country || listingData.address?.country || "India"
    ].filter(Boolean).join(", ");

  // Capacity fallbacks
  const capacity = listingData.seatingCapacity || listingData.guestCapacity || listingData.personCapacity || listingData.maxParticipants || listingData.capacity;
  
  // Price fallbacks
  const regPrice = listingData.regularPrice || listingData.pricing?.basePrice || listingData.price;
  const finPrice = listingData.finalPrice || listingData.discountPrice || listingData.salePrice || listingData.discountedPrice;
  const dur = listingData.timeDuration || listingData.duration;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl relative h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <X size={18} className="text-gray-600" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          
          {/* Header */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-blue-600 font-geist">
              Details
            </h2>
          </div>

          <div className="space-y-8 font-plus-jakarta text-[#2A2A2A]">
            
            {/* Row 1: Name & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-100 pb-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Name</h3>
                    <p className="text-sm">{listingData.name || listingData.title || "N/A"}</p>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Category</h3>
                    <p className="text-sm">{listingData.category}</p>
                </div>
            </div>

            {/* Row 2: Description */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Description</h3>
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {listingData.description}
                </p>
            </div>

            {/* Business Details */}
            {(listingData.businessDetails || listingData.brandName || listingData.businessEmail) && (
                <div className="space-y-4 border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-bold text-gray-900">Business Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Business Name</h4>
                            <p className="text-sm">{listingData.businessDetails?.name || listingData.brandName || listingData.businessName || "N/A"}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Email</h4>
                            <p className="text-sm">{listingData.businessDetails?.email || listingData.businessEmail || listingData.email || "N/A"}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Phone</h4>
                            <p className="text-sm">{listingData.businessDetails?.phone || listingData.businessPhone || listingData.phone || listingData.phoneNumber || "N/A"}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">GST Number</h4>
                            <p className="text-sm">{listingData.businessDetails?.gst || listingData.gstNumber || "N/A"}</p>
                        </div>
                        {(listingData.businessDetails?.address || listingData.businessAddress) && (
                            <div className="col-span-1 md:col-span-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Business Address</h4>
                                <p className="text-sm">{listingData.businessDetails?.address || listingData.businessAddress}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Personal Details */}
            {(listingData.personalDetails || listingData.personName || listingData.firstName) && (
                <div className="space-y-4 border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-bold text-gray-900">Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Full Name</h4>
                            <p className="text-sm">{listingData.personalDetails?.name || listingData.personName || (listingData.firstName ? `${listingData.firstName} ${listingData.lastName || ''}` : "N/A")}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Date of Birth</h4>
                            <p className="text-sm">
                                {listingData.personalDetails?.dob || listingData.dateOfBirth
                                    ? new Date(listingData.personalDetails?.dob || listingData.dateOfBirth).toLocaleDateString() 
                                    : "N/A"}
                            </p>
                        </div>
                         <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Marital Status</h4>
                            <p className="text-sm capitalize">{listingData.personalDetails?.maritalStatus || listingData.maritalStatus || "N/A"}</p>
                        </div>
                         {(listingData.personalDetails?.idProof || listingData.idProof) && (
                             <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">ID Proof</h4>
                                <a 
                                    href={getImageUrl(listingData.personalDetails?.idProof || listingData.idProof)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    View Document
                                </a>
                            </div>
                         )}
                         {(listingData.personalDetails?.address || listingData.personalAddress) && (
                            <div className="col-span-1 md:col-span-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Personal Address</h4>
                                <p className="text-sm">{listingData.personalDetails?.address || listingData.personalAddress}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Row 3: Rules & Regulation */}
            {rules.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-900">Rules & Regulation</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                        {rules.map((rule: string, idx: number) => (
                            <li key={idx}>{rule}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Row 4: Photos */}
            {photos.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900">Uploaded Photos</h3>
                    
                    {/* Design: 1 Large Left, 4 Small Right (Grid 2x2) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96">
                        {/* Large Image */}
                        <div 
                            className="h-full bg-gray-100 rounded-lg bg-cover bg-center cursor-pointer hover:opacity-95 transition-opacity border border-gray-200"
                            style={{ backgroundImage: `url(${photos[0]})` }}
                            onClick={() => window.open(photos[0], '_blank')}
                        />
                        
                        {/* Grid of smaller images */}
                        <div className="grid grid-cols-2 gap-4 h-full">
                            {photos.slice(1, 5).map((photo, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-100 rounded-lg bg-cover bg-center cursor-pointer hover:opacity-95 transition-opacity border border-gray-200"
                                    style={{ backgroundImage: `url(${photo})` }}
                                    onClick={() => window.open(photo, '_blank')}
                                />
                            ))}
                            {/* Placeholders if less than 5 images to keep grid structure? No, just empty. */}
                        </div>
                    </div>

                    {/* Remaining Images - if more than 5 */}
                    {photos.length > 5 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                            {photos.slice(5).map((photo, index) => (
                                <div
                                    key={index + 5}
                                    className="h-32 bg-gray-100 rounded-lg bg-cover bg-center cursor-pointer hover:opacity-95 transition-opacity border border-gray-200"
                                    style={{ backgroundImage: `url(${photo})` }}
                                    onClick={() => window.open(photo, '_blank')}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Row 5: Features */}
            {features.length > 0 && (
                <div className="space-y-2">
                     <h3 className="text-sm font-bold text-gray-900">{listingData.category} Features</h3>
                     <p className="text-sm text-gray-700 leading-relaxed">
                        {features.join(', ')}
                     </p>
                </div>
            )}

            {/* Row 6: Capacity & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {capacity !== undefined && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-1">Capacity</h3>
                        <p className="text-sm text-gray-700">
                            {capacity}
                        </p>
                    </div>
                )}
                {dur && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-1">Duration</h3>
                        <p className="text-sm text-gray-700">
                            {dur}
                        </p>
                    </div>
                )}
            </div>

            {/* Row 7: Address */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Address</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                    {address}
                </p>
            </div>

            {/* Row 8: Regular Price */}
            {regPrice && (
                 <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-900">Regular Price</h3>
                    <p className="text-sm text-gray-700">
                        ₹{regPrice} {listingData.category?.toLowerCase() === 'activity' ? 'Per Person' : 'Per Night'}
                    </p>
                </div>
            )}

            {/* Row 9: Excludes */}
             {excludes.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-900">Above price excludes</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                        {excludes.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Row 10: Includes */}
            {includes.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-900">Above price includes</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                        {includes.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Row 11: Discount / Final Price */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div>
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Discount Name</h3>
                     <p className="text-sm font-semibold text-gray-900">{listingData.discountName || "N/A"}</p>
                </div>
                <div>
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Discount Type</h3>
                     <p className="text-sm font-semibold text-gray-900">{listingData.discountType || "N/A"}</p>
                </div>
                 <div>
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Discount Percentage</h3>
                     <p className="text-sm font-semibold text-gray-900">{listingData.discountPercentage ? `${listingData.discountPercentage}%` : "N/A"}</p>
                </div>
                 <div>
                     <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Final Price</h3>
                     <p className="text-lg font-bold text-blue-600">
                        ₹{finPrice || regPrice || "-"}
                     </p>
                </div>
            </div>

          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-white rounded-b-xl">
            {onReject && (
                <Button 
                    variant="destructive" 
                    onClick={onReject}
                    className="rounded-full px-6"
                >
                    Reject
                </Button>
            )}
            {onApprove && (
                <Button 
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
                    onClick={onApprove}
                >
                    Approve
                </Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ViewDetailsPopup;
