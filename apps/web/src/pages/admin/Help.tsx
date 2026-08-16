import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/admin/AdminLayout";
import LogoWebsite from "@/components/admin/LogoWebsite";
import { useAuth } from "@/contexts/AdminAuthContext";
import { helpDeskService } from "@/services/api";
import { CARD } from "@/components/admin/adminUI";

const Help = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    subject: "",
    email: "",
    message: "",
  });

  const handleInputChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!formData.subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    // The server requires a description — send the validation error up front
    // instead of round-tripping for a 422.
    if (!formData.message.trim()) {
      toast.error("Please describe the issue");
      return;
    }

    setSubmitting(true);
    try {
      await helpDeskService.createItem({
        name: formData.name.trim() || undefined,
        email: formData.email.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        subject: formData.subject.trim(),
        description: formData.message.trim(),
        category: "vendor-help",
      });
      toast.success("Ticket submitted");
      setFormData({ name: "", phoneNumber: "", subject: "", email: "", message: "" });
    } catch (err: any) {
      toast.error(err?.message || err?.error || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const greetingName = user?.name?.split(" ")[0] || "there";

  return (
    <AdminLayout
      title="Help"
      subtitle="Guides for running the admin panel, plus how to reach support."
    >
      <main className={`px-4 sm:px-6 lg:px-10 py-6 ${CARD} `}>
        <div className="flex w-full justify-center items-center my-5">
          <LogoWebsite />
        </div>
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-10 px-2">
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-semibold text-tpl-dark dark:text-white font-poppins leading-tight mb-6">
              👋🏻 Hi {greetingName}, how can we help?
            </h1>
          </div>

          {/* Ticket Form */}
          <div className="bg-tpl-gray-2 dark:bg-white/5 rounded-xl px-4 sm:px-6 py-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-tpl-dark dark:text-white font-poppins mb-5">
              Raise a Ticket
            </h2>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm sm:text-base text-tpl-dark-4 dark:text-tpl-dark-6 font-plus-jakarta mb-2">
                    Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="rounded-lg w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base text-tpl-dark-4 dark:text-tpl-dark-6 font-plus-jakarta mb-2">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    className="rounded-lg w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm sm:text-base text-tpl-dark-4 dark:text-tpl-dark-6 font-plus-jakarta mb-2">
                    Subject *
                  </label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    className="rounded-lg w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base text-tpl-dark-4 dark:text-tpl-dark-6 font-plus-jakarta mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="rounded-lg w-full"
                  />
                </div>
              </div>

              {/* Description (the ticket body) — previously mislabelled "City". */}
              <div>
                <label className="block text-sm sm:text-base text-tpl-dark-4 dark:text-tpl-dark-6 font-plus-jakarta mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder="Describe your issue…"
                  className="min-h-[140px] rounded-lg resize-none w-full"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-tpl-primary text-white px-6 sm:px-10 py-3 rounded-full hover:bg-tpl-primary/90 font-geist disabled:opacity-60 disabled:cursor-not-allowed"
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
