import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import LogoWebsite from "@/components/admin/LogoWebsite";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
}

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("guest");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    subject: "",
    email: "",
    city: "",
  });
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

  const handleSubmit = async () => {
    if (!formData.subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    // The "city" field is labelled "City" in the UI but uses a Textarea —
    // it's the ticket description body. Phone is appended since the helpdesk
    // ticketBody DTO doesn't have a dedicated phone field.
    const messageParts = [formData.city.trim(), formData.phoneNumber.trim() && `Phone: ${formData.phoneNumber.trim()}`]
      .filter(Boolean)
      .join("\n\n");

    setSubmitting(true);
    try {
      const token =
        localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const res = await fetch("/api/admin/helpdesk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim() || undefined,
          email: formData.email.trim() || undefined,
          subject: formData.subject.trim(),
          message: messageParts || undefined,
          category: "vendor-help",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.error?.message || data?.message || "Failed to submit ticket";
        toast.error(msg);
        return;
      }
      toast.success("Ticket submitted");
      setFormData({ name: "", phoneNumber: "", subject: "", email: "", city: "" });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: "guest", label: "Guest" },
    { id: "booking", label: "Booking" },
    { id: "common", label: "Common Questions" },
    { id: "locations", label: "Locations" },
  ];

  return (
    <AdminLayout title="Help">
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
                    disabled={submitting}
                    className="bg-dashboard-primary text-white dark:text-black px-6 sm:px-10 py-3 rounded-full hover:bg-gray-500 font-geist disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting…" : "Submit"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
    </AdminLayout>
  );
};

export default Help;
