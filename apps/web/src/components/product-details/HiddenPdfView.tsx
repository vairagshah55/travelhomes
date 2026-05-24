import React from "react";
import { MapPin, Mail, Phone } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface HiddenPdfViewProps {
  pdfRef: React.RefObject<HTMLDivElement>;
  stay: any;
  vendor: any;
  allReviews: Array<{ name: string; date: string; review: string }>;
  /** Page-local mapper from feature label to icon component. */
  getAmenityIcon: (name: string) => React.ComponentType<{ className?: string }>;
  /** Category label shown next to location. */
  categoryLabel: string;
  /** Price unit ("night" | "day" | "person"). */
  priceLabel: string;
}

/**
 * Off-screen PDF-friendly replica of a product detail page. Captured by
 * html2pdf via `pdfRef` when the user clicks Share → Download PDF. Lives
 * inside a `display: none` wrapper in the parent so it is never visible.
 */
export function HiddenPdfView({
  pdfRef,
  stay,
  vendor,
  allReviews,
  getAmenityIcon,
  categoryLabel,
  priceLabel,
}: HiddenPdfViewProps) {
  return (
    <div style={{ display: "none" }}>
      <div ref={pdfRef} className="w-[800px] bg-white text-black font-sans p-8 mx-auto">
        <h1 className="text-3xl font-bold mb-2">{stay?.name}</h1>
        <div className="flex items-center gap-4 mb-6 text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {stay?.city}, {stay?.state}
          </div>
          {categoryLabel && (
            <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium capitalize">
              {categoryLabel}
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[500px] mb-8 rounded-xl overflow-hidden">
          <div className="col-span-2 row-span-2">
            <img
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
              src={getImageUrl(stay?.photos?.coverUrl || stay?.photos?.galleryUrls?.[0] || "")}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="col-span-1 row-span-1">
              <img
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
                src={getImageUrl(stay?.photos?.galleryUrls?.[i] || stay?.photos?.coverUrl || "")}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-10">
            <section>
              <h2 className="text-2xl font-bold mb-4 border-b pb-2">Overview</h2>
              <div
                className="text-gray-800 leading-relaxed text-lg"
                dangerouslySetInnerHTML={{ __html: stay?.description || "" }}
              />
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 border-b pb-2">Amenities</h2>
              <div className="grid grid-cols-2 gap-4">
                {stay?.features?.map((f: string, i: number) => {
                  const Icon = getAmenityIcon(f);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-900" />
                      <span className="text-gray-800">{f}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {stay?.priceIncludes && stay.priceIncludes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-green-800">
                  Price Includes
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {stay.priceIncludes.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="font-bold text-green-600">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {stay?.priceExcludes && stay.priceExcludes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-red-800">
                  Price Excludes
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {stay.priceExcludes.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="font-bold text-red-600">✗</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {stay?.rules && stay.rules.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">Policies</h2>
                <ul className="space-y-2 list-disc pl-5 text-gray-800">
                  {stay.rules.map((rule: string, i: number) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              </section>
            )}

            {allReviews.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">Reviews</h2>
                <div className="grid grid-cols-1 gap-6">
                  {allReviews.slice(0, 3).map((r, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-bold">{r.name}</p>
                      <p className="text-sm text-gray-500 mb-2">{r.date}</p>
                      <p className="text-gray-700">{r.review}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="col-span-1">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
              <p className="text-gray-500 mb-1">Starting from</p>
              <p className="text-3xl font-bold mb-4">
                ₹{stay?.regularPrice}{" "}
                <span className="text-base font-normal text-gray-600">/ {priceLabel}</span>
              </p>
              <div className="w-full h-px bg-gray-200 my-4" />
              <p className="text-sm text-gray-500">
                Prices may vary based on dates and guests.
              </p>
            </div>

            {vendor && (
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-lg mb-4">Hosted by</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {(vendor.brandName || vendor.personName || "V")[0]}
                  </div>
                  <div>
                    <p className="font-bold">{vendor.brandName || vendor.personName}</p>
                    <p className="text-sm text-gray-500">Verified Host</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  {vendor.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" /> {vendor.email}
                    </p>
                  )}
                  {vendor.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" /> {vendor.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-gray-500">
          <p>Generated from Travelhomes</p>
          <p className="text-sm mt-1">{window.location.href}</p>
        </div>
      </div>
    </div>
  );
}

export default HiddenPdfView;
