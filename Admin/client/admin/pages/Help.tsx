import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import LogoWebsite from "@/components/ui/LogoWebsite";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
}

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("guest");
  const [formData, setFormData] = useState({
    name: "Badal Singh",
    phoneNumber: "+91  52024 42423",
    subject: "",
    email: "Jpbadalsigh",
    city: "Badal Singh",
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    {
      id: "1",
      question:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      answer: "",
      isOpen: false,
    },
    {
      id: "2",
      question:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      answer:
        "Non, une fois votre devis établi, aucun coût supplémentaire ne s'ajoute. Nous nous engageons à une transparence totale...",
      isOpen: true,
    },
    {
      id: "3",
      question:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      answer: "",
      isOpen: false,
    },
    {
      id: "4",
      question:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      answer: "",
      isOpen: false,
    },
    {
      id: "5",
      question:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      answer: "",
      isOpen: false,
    },
  ]);

  const toggleFAQ = (id: string) => {
    setFaqItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, isOpen: !item.isOpen } : item,
      ),
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
  };

  const tabs = [
    { id: "guest", label: "Guest" },
    { id: "booking", label: "Booking" },
    { id: "common", label: "Common Questions" },
    { id: "locations", label: "Locations" },
  ];

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
        {/* Top Header */}
        <AdminHeader
          Headtitle={"PlugIns"}
          setMobileSidebarOpen={setMobileOpen}
        />

        <main className="px-4 sm:px-6 lg:px-10 bg-white rounded-lg">
          <div className="flex w-full justify-center items-center my-5">

              <LogoWebsite/>
          </div>
          <div className="max-w-5xl mx-auto w-full">
            {/* Header Section */}
            <div className="text-center mb-10 px-2">
              <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-semibold text-dashboard-heading font-poppins leading-tight mb-6">
                👋🏻 Hi Badal, how can we help?
              </h1>     
            </div>

           

            {/* Ticket Form */}
            <div className="bg-gray-100 dark:bg-black dark:text-white rounded-xl px-4 sm:px-6 py-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-dashboard-heading font-poppins mb-5">
                Raise a Ticket
              </h2>

              <div className="space-y-5">
                {/* Name and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm sm:text-base text-dashboard-title font-plus-jakarta mb-2">
                      Name
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="border-gray-400 rounded-lg w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base text-dashboard-title font-plus-jakarta mb-2">
                      Phone Number
                    </label>
                    <Input
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      className="border-gray-400 rounded-lg w-full"
                    />
                  </div>
                </div>

                {/* Subject and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm sm:text-base text-dashboard-title font-plus-jakarta mb-2">
                      Subject
                    </label>
                    <Input
                      value={formData.subject}
                      onChange={(e) =>
                        handleInputChange("subject", e.target.value)
                      }
                      className="border-gray-400 rounded-lg w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base text-dashboard-title font-plus-jakarta mb-2">
                      Email
                    </label>
                    <Input
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="border-gray-400 rounded-lg w-full"
                    />
                  </div>
                </div>

                {/* City Field */}
                <div>
                  <label className="block text-sm sm:text-base text-dashboard-title font-plus-jakarta mb-2">
                    City
                  </label>
                  <Textarea
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="min-h-[140px] border-gray-400 rounded-lg resize-none w-full"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    className="bg-dashboard-primary text-white dark:text-black px-6 sm:px-10 py-3 rounded-full hover:bg-gray-500 font-geist"
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>

       
      </div>
    </div>
  );
};

export default Help;
