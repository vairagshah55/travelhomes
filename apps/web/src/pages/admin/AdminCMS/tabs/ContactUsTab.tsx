import React from "react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import { getImageUrl } from "@/lib/adminUtils";
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  image: string;
}

interface ContactUsTabProps {
  contactInfo: ContactInfo;
  setContactInfo: React.Dispatch<React.SetStateAction<ContactInfo>>;
  loadingContacts: boolean;
}

/**
 * Contact-info editor: support email/phone/address fields + a contact-page
 * hero image. State stays in the parent because other tabs (HomePage etc.)
 * read the loading flag while initial data loads.
 */
export function ContactUsTab({
  contactInfo,
  setContactInfo,
  loadingContacts,
}: ContactUsTabProps) {
  const handleContactImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await cmsService.uploadMedia({
        page: "Contact Us",
        section: "Main Image",
        file,
      });
      if (res?.data?.url) {
        setContactInfo((prev) => ({ ...prev, image: res.data.url }));
      }
    } catch (err) {
      console.error("Contact image upload failed", err);
    }
  };

  const handleSaveContactInfo = async () => {
    try {
      await cmsService.upsertContact(contactInfo);
      toast.success("Contact info saved successfully!");
    } catch (err) {
      console.error("Failed to save contact info", err);
      toast.error("Failed to save contact info");
    }
  };

  return (
    <div className="border border-dashboard-stroke rounded-xl bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Contact Us</h3>
        <button
          onClick={handleSaveContactInfo}
          className="px-5 py-2 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium hover:bg-dashboard-primary/90 transition-colors"
        >
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <div className="rounded-xl overflow-hidden border bg-gray-50 h-48 flex items-center justify-center">
            {loadingContacts ? (
              <UniqueStaysSkeleton />
            ) : contactInfo.image ? (
              <img
                src={getImageUrl(contactInfo.image)}
                className="w-full h-full object-cover"
                alt="Contact Page"
              />
            ) : (
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683"
                className="w-full h-full object-cover"
                alt="Contact Page"
              />
            )}
          </div>

          <label className="mt-3 w-full block">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleContactImageChange}
            />
            <div className="w-full bg-[#1E3A8A] text-white py-2 rounded-full text-sm text-center cursor-pointer hover:bg-[#2D4DA8]">
              Change Photo
            </div>
          </label>
        </div>

        <div className="col-span-8 grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={contactInfo.email}
              onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
              placeholder="Enter your email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={contactInfo.phone}
              onChange={(e) => {
                const onlyNums = e.target.value.replace(/\D/g, "");
                setContactInfo({ ...contactInfo, phone: onlyNums });
              }}
              placeholder="Enter phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={contactInfo.address}
              onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
              placeholder="Address / Locality"
              className="w-full px-3 mt-1 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="col-span-4">
            <input
              type="text"
              value={contactInfo.state}
              onChange={(e) => setContactInfo({ ...contactInfo, state: e.target.value })}
              placeholder="State"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="col-span-4">
            <input
              type="text"
              value={contactInfo.city}
              onChange={(e) => setContactInfo({ ...contactInfo, city: e.target.value })}
              placeholder="City"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="col-span-4">
            <input
              type="text"
              value={contactInfo.pincode}
              onChange={(e) => {
                const onlyNums = e.target.value.replace(/\D/g, "");
                setContactInfo({ ...contactInfo, pincode: onlyNums });
              }}
              placeholder="Pincode"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUsTab;
