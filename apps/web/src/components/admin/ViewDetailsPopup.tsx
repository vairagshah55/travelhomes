import React from "react";
import { X, Loader2 } from "lucide-react";
import { getImageUrl } from "@/lib/adminUtils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatINR } from "@/utils/formatCurrency";

interface ViewDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  listingData?: any;
  /** While the full listing is being fetched, show the loader (the row passed
   *  in is only a summary, so we wait for all details before rendering). */
  isLoading?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

/* ── Small presentational helpers ─────────────────────────────────────────── */
const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</h4>
    <p className="text-sm text-gray-800 break-words">{value}</p>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3 border-t border-gray-100 pt-6">
    <h3 className="text-base font-bold text-gray-900">{title}</h3>
    {children}
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
    {items.map((item, idx) => (
      <li key={idx}>{item}</li>
    ))}
  </ul>
);

/* ── Value helpers ────────────────────────────────────────────────────────── */
const has = (v: any) => v !== undefined && v !== null && v !== "";
const uniq = (arr: string[]) => Array.from(new Set(arr));

const toArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((v) => String(v)).filter(Boolean);
  if (typeof val === "string") {
    if (val.includes("\n"))
      return val
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [String(val)];
};

const getPhotos = (data: any): string[] => {
  const photoSource = data?.photos || data?.images;
  if (!photoSource) return [];
  let extracted: string[] = [];
  if (photoSource.coverUrl || photoSource.galleryUrls) {
    if (photoSource.coverUrl) extracted.push(photoSource.coverUrl);
    if (Array.isArray(photoSource.galleryUrls))
      extracted = [...extracted, ...photoSource.galleryUrls];
  } else if (Array.isArray(photoSource)) {
    extracted = photoSource;
  } else if (typeof photoSource === "object") {
    Object.values(photoSource).forEach((val) => {
      if (typeof val === "string") extracted.push(val);
      if (Array.isArray(val)) val.forEach((v) => typeof v === "string" && extracted.push(v));
    });
  }
  return extracted.filter(Boolean).map((p) => getImageUrl(p));
};

const DISCOUNT_SLOTS: [string, string][] = [
  ["firstUser", "First User"],
  ["festival", "Festival"],
  ["weekly", "Weekly"],
  ["special", "Special"],
];

const ViewDetailsPopup: React.FC<ViewDetailsPopupProps> = ({
  isOpen,
  onClose,
  listingData,
  isLoading,
  onApprove,
  onReject,
}) => {
  if (!isOpen) return null;

  if (isLoading || !listingData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl w-full max-w-5xl mx-4 relative max-h-[90vh] flex flex-col items-center justify-center p-20">
          <Loader2 className="h-12 w-12 animate-spin text-[#0d9488] mb-4" />
          <p className="text-gray-600">Loading listing details…</p>
        </div>
      </div>
    );
  }

  const d = listingData;
  const photos = getPhotos(d);

  const rules = toArray(d.rules || d.rulesAndRegulations || d.policies?.rules);
  const features = toArray(d.features || d.amenities || d.requirements);
  const expectations = toArray(d.expectations);
  const includes = uniq([...toArray(d.priceIncludes), ...toArray(d.included)]);
  const excludes = uniq([...toArray(d.priceExcludes), ...toArray(d.excluded)]);

  // Caravan pricing block
  const perKmInc = toArray(d.perKmIncludes);
  const perKmExc = toArray(d.perKmExcludes);
  const perDayInc = toArray(d.perDayIncludes);
  const perDayExc = toArray(d.perDayExcludes);
  const hasCaravanPricing =
    has(d.perKmCharge) ||
    has(d.perDayCharge) ||
    perKmInc.length > 0 ||
    perKmExc.length > 0 ||
    perDayInc.length > 0 ||
    perDayExc.length > 0;

  // Address
  const address =
    typeof d.address === "string" && d.address
      ? d.address
      : [d.locality, d.city, d.state, d.pincode, d.country || "India"].filter(Boolean).join(", ");

  // Prices
  const regPrice = d.regularPrice ?? d.pricing?.basePrice ?? d.price;
  const finPrice = d.finalPrice ?? d.discountPrice ?? d.salePrice ?? d.discountedPrice;
  const perNightOrPerson = d.category?.toLowerCase() === "activity" ? "Per Person" : "Per Night";

  // Property / capacity details (render only what's present)
  const propertyDetails = (
    [
      ["Seating Capacity", d.seatingCapacity],
      ["Sleeping Capacity", d.sleepingCapacity],
      ["Guest Capacity", d.guestCapacity ?? d.personCapacity ?? d.maxParticipants],
      ["No. of Beds", d.numberOfBeds],
      ["No. of Rooms", d.numberOfRooms],
      ["No. of Bathrooms", d.numberOfBathrooms],
      ["Stay Type", d.stayType],
      ["Duration", d.timeDuration || d.duration],
    ] as [string, any][]
  ).filter(([, v]) => has(v));

  // Active discount slots (real schema shape: discounts.{firstUser,festival,…})
  const activeDiscounts = DISCOUNT_SLOTS.map(([key, label]) => ({
    key,
    label,
    ...(d.discounts?.[key] || {}),
  })).filter((x) => x.enabled);

  const createdAt = d.createdAt ? new Date(d.createdAt).toLocaleDateString() : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl relative h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          <X size={18} className="text-gray-600" />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          {/* Header */}
          <div className="border-b border-gray-200 pb-4 mb-6 pr-10">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-[#0d9488]">Listing Details</h2>
              {has(d.status) && <StatusBadge status={d.status} />}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
              {has(d.vendorId) && <span>Vendor ID: {d.vendorId}</span>}
              {createdAt && <span>Created: {createdAt}</span>}
              {has(d._id) && <span>ID: {d._id}</span>}
            </div>
          </div>

          <div className="space-y-8 font-plus-jakarta text-[#2A2A2A]">
            {/* Name & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-100 pb-6">
              <Field label="Name" value={d.name || d.title || "N/A"} />
              <Field label="Category" value={d.category || "N/A"} />
            </div>

            {/* Description */}
            {has(d.description) && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Description</h3>
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {d.description}
                </p>
              </div>
            )}

            {/* Rejection reason */}
            {has(d.rejectionReason) && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h4 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">
                  Rejection / Cancellation Reason
                </h4>
                <p className="text-sm text-red-800">{d.rejectionReason}</p>
              </div>
            )}

            {/* Business Details */}
            {(d.businessDetails || d.brandName || d.businessEmail || d.businessName) && (
              <Section title="Business Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field
                    label="Business Name"
                    value={d.businessDetails?.name || d.brandName || d.businessName || "N/A"}
                  />
                  <Field
                    label="Email"
                    value={d.businessDetails?.email || d.businessEmail || d.email || "N/A"}
                  />
                  <Field
                    label="Phone"
                    value={
                      d.businessDetails?.phone ||
                      d.businessPhone ||
                      d.phone ||
                      d.phoneNumber ||
                      "N/A"
                    }
                  />
                  <Field
                    label="GST Number"
                    value={d.businessDetails?.gst || d.gstNumber || "N/A"}
                  />
                  {(d.businessDetails?.address || d.businessAddress) && (
                    <div className="md:col-span-2">
                      <Field
                        label="Business Address"
                        value={d.businessDetails?.address || d.businessAddress}
                      />
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Personal Details */}
            {(d.personalDetails || d.personName || d.firstName) && (
              <Section title="Personal Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field
                    label="Full Name"
                    value={
                      d.personalDetails?.name ||
                      d.personName ||
                      (d.firstName ? `${d.firstName} ${d.lastName || ""}` : "N/A")
                    }
                  />
                  <Field
                    label="Date of Birth"
                    value={
                      d.personalDetails?.dob || d.dateOfBirth
                        ? new Date(d.personalDetails?.dob || d.dateOfBirth).toLocaleDateString()
                        : "N/A"
                    }
                  />
                  <Field
                    label="Marital Status"
                    value={
                      <span className="capitalize">
                        {d.personalDetails?.maritalStatus || d.maritalStatus || "N/A"}
                      </span>
                    }
                  />
                  {(d.personalDetails?.idProof || d.idProof) && (
                    <Field
                      label="ID Proof"
                      value={
                        <a
                          href={getImageUrl(d.personalDetails?.idProof || d.idProof)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0d9488] hover:underline"
                        >
                          View Document
                        </a>
                      }
                    />
                  )}
                  {(d.personalDetails?.address || d.personalAddress) && (
                    <div className="md:col-span-2">
                      <Field
                        label="Personal Address"
                        value={d.personalDetails?.address || d.personalAddress}
                      />
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Property / capacity details */}
            {propertyDetails.length > 0 && (
              <Section title="Property & Capacity">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {propertyDetails.map(([label, value]) => (
                    <Field key={label} label={label} value={String(value)} />
                  ))}
                </div>
              </Section>
            )}

            {/* Caravan pricing */}
            {hasCaravanPricing && (
              <Section title="Caravan Pricing">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {has(d.perDayCharge) && (
                    <Field label="Per Day Charge" value={`₹${d.perDayCharge}`} />
                  )}
                  {has(d.perKmCharge) && (
                    <Field label="Per Km Charge" value={`₹${d.perKmCharge}`} />
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  {perDayInc.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Per Day Includes
                      </h4>
                      <BulletList items={perDayInc} />
                    </div>
                  )}
                  {perDayExc.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Per Day Excludes
                      </h4>
                      <BulletList items={perDayExc} />
                    </div>
                  )}
                  {perKmInc.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Per Km Includes
                      </h4>
                      <BulletList items={perKmInc} />
                    </div>
                  )}
                  {perKmExc.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Per Km Excludes
                      </h4>
                      <BulletList items={perKmExc} />
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Rules */}
            {rules.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Rules &amp; Regulation</h3>
                <BulletList items={rules} />
              </div>
            )}

            {/* Photos */}
            {photos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Uploaded Photos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-96">
                  <div
                    className="h-full bg-gray-100 rounded-lg bg-cover bg-center cursor-pointer hover:opacity-95 transition-opacity border border-gray-200"
                    style={{ backgroundImage: `url(${photos[0]})` }}
                    onClick={() => window.open(photos[0], "_blank")}
                  />
                  <div className="grid grid-cols-2 gap-4 h-full">
                    {photos.slice(1, 5).map((photo, index) => (
                      <div
                        key={index}
                        className="bg-gray-100 rounded-lg bg-cover bg-center cursor-pointer hover:opacity-95 transition-opacity border border-gray-200"
                        style={{ backgroundImage: `url(${photo})` }}
                        onClick={() => window.open(photo, "_blank")}
                      />
                    ))}
                  </div>
                </div>
                {photos.length > 5 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                    {photos.slice(5).map((photo, index) => (
                      <div
                        key={index + 5}
                        className="h-32 bg-gray-100 rounded-lg bg-cover bg-center cursor-pointer hover:opacity-95 transition-opacity border border-gray-200"
                        style={{ backgroundImage: `url(${photo})` }}
                        onClick={() => window.open(photo, "_blank")}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">
                  {d.category ? `${d.category} Features` : "Features"}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">{features.join(", ")}</p>
              </div>
            )}

            {/* Expectations (activities) */}
            {expectations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">What to Expect</h3>
                <BulletList items={expectations} />
              </div>
            )}

            {/* Address */}
            {has(address) && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Address</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{address}</p>
              </div>
            )}

            {/* Includes / Excludes */}
            {includes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Above price includes</h3>
                <BulletList items={includes} />
              </div>
            )}
            {excludes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900">Above price excludes</h3>
                <BulletList items={excludes} />
              </div>
            )}

            {/* Pricing */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-[#f0fdfa] p-4 rounded-lg border border-teal-100">
              {has(regPrice) && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Regular Price
                  </h3>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatINR(Number(regPrice))}{" "}
                    <span className="font-normal text-gray-500">{perNightOrPerson}</span>
                  </p>
                </div>
              )}
              {has(finPrice) && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Final Price
                  </h3>
                  <p className="text-lg font-bold text-[#0d9488]">{formatINR(Number(finPrice))}</p>
                </div>
              )}
            </div>

            {/* Discounts (real schema: discounts.{firstUser,festival,weekly,special}) */}
            {activeDiscounts.length > 0 && (
              <Section title="Discount Offers">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeDiscounts.map((disc) => (
                    <div key={disc.key} className="rounded-lg border border-gray-200 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">{disc.label}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#0d9488] bg-[#0d94881f] px-2 py-0.5 rounded-full">
                          {disc.type || "percentage"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          label="Value"
                          value={
                            has(disc.value)
                              ? disc.type === "fixed"
                                ? `₹${disc.value}`
                                : `${disc.value}%`
                              : "—"
                          }
                        />
                        <Field
                          label="Final Price"
                          value={has(disc.finalPrice) ? `₹${disc.finalPrice}` : "—"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        {(onReject || onApprove) && (
          <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-white rounded-b-xl">
            {onReject && (
              <Button variant="destructive" onClick={onReject} className="rounded-full px-6">
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
        )}
      </div>
    </div>
  );
};

export default ViewDetailsPopup;
