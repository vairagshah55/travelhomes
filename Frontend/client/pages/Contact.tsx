import React, { useEffect, useState } from "react";
import toast from 'react-hot-toast';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PhoneIcon } from "lucide-react";
import { MdOutlineMail } from "react-icons/md";
import { FiMapPin } from "react-icons/fi";
import { cmsPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

const Contact = () => {
  const [contactInfo, setContactInfo] = useState({
    email: "support@travelhomes.com",
    phone: "+91 - 872XXXXXXX",
    address: "123 Avenue Lane, Suite 100, Bucks, Los Angeles",
    city: "",
    state: "",
    pincode: "",
    image: "",
  });

  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  useEffect(() => {
    cmsPublicApi
      .getContact()
      .then((data) => {
        if (data) {
          setContactInfo((prev) => ({
            ...prev,
            ...data,
          }));
        }
      })
      .catch((err) => console.error("Failed to fetch contact info", err));
  }, []);

  const validate = (email: string, phone: string) => {
    const newErrors: { email?: string; phone?: string } = {};
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation: Allow +, -, spaces, and digits, min 10 chars
    const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/; // Basic allowed chars
    const digits = phone.replace(/\D/g, ''); // Extract digits
    if (phone && (!phoneRegex.test(phone) || digits.length < 10)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    return newErrors;
  };

  return (
 <div className=" h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">

  <Header variant="transparent" className="fixed top-0 w-full z-50" />

  {/* Contact Section */}

  <section className="px-4 sm:px-6 lg:px-10 mt-20 py-10 lg:py-20">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 max-w-7xl mx-auto items-center">

      {/* Contact Form */}
      <div className="bg-white dark:bg-black rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 w-full">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
          Let's Connect!
        </h2>

        <p className="mb-6 text-sm text-gray-500 dark:text-white">
          Or just reach out manually at{" "}
          <span className="font-medium text-black dark:text-white">
            {contactInfo.email || "support@travelhomes.com"}
          </span>
        </p>

        <form className="space-y-5">

          {/* Name */}
          <div className="flex flex-col md:flex-row gap-4">
            <input
              name="firstName"
              required
              type="text"
              placeholder="First Name"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm"
            />

            <input
              name="lastName"
              type="text"
              placeholder="Last Name"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm"
            />
          </div>

          {/* Email */}
          <input
            name="email"
            required
            type="email"
            placeholder="E-mail"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm"
          />

          {/* Phone */}
          <input
            name="phone"
            type="tel"
            placeholder="Phone Number"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm"
          />

          {/* Message */}
          <textarea
            name="message"
            required
            placeholder="Message"
            rows={4}
            maxLength={1000}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm"
          />

          {/* Counter */}
          <div className="flex justify-end text-xs text-gray-400">
            <span>0/1000</span>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-medium transition"
          >
            Send Message
          </button>

        </form>
      </div>

      {/* Image */}
      <div className="rounded-2xl overflow-hidden shadow-xl w-full h-[300px] sm:h-[400px] lg:h-[550px]">
        <img
          src={
            contactInfo.image
              ? getImageUrl(contactInfo.image)
              : "/contact.jpg"
          }
          alt="Contact Us"
          className="object-cover w-full h-full"
        />
      </div>

    </div>
  </section>

  {/* Contact Info Section */}
  <section className="px-4 sm:px-6 lg:px-10 py-12 lg:py-16 bg-white dark:bg-black">

    <div className=" max-w-7xl mx-auto items-cente text-start mb-10">
      <button className="px-5 py-1.5 border border-gray-300 rounded-full text-sm mb-3">
        Reach Out to Us
      </button>

      <h3 className="text-2xl md:text-3xl font-semibold">
        We’d love to hear from you!
      </h3>
    </div>

    {/* Cards */}
    <div className=" max-w-7xl mx-auto items-cente grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

      {/* Email */}
      <div className="p-6 border rounded-xl shadow-md hover:shadow-lg transition">
        <div className="text-3xl mb-3"><MdOutlineMail/></div>
        <h4 className="font-bold mb-1">Email</h4>

        <p className="text-sm text-gray-500 mb-2 dark:text-white">
          We will connect with you in real time!
        </p>

        <p className="text-sm font-medium break-all">
          {contactInfo.email || "support@travelhomes.com"}
        </p>
      </div>

      {/* Phone */}
      <div className="p-6 border rounded-xl shadow-md hover:shadow-lg transition">
        <div className="text-3xl mb-3"><PhoneIcon/></div>
        <h4 className="font-bold mb-1">Call</h4>

        <p className="text-sm text-gray-500 mb-2 dark:text-white">
          We will connect with you in real time!
        </p>

        <p className="text-sm font-medium">
          {contactInfo.phone || "+91 - 872XXXXXXX"}
        </p>
      </div>

      {/* Address */}
      <div className="p-6 border rounded-xl shadow-md hover:shadow-lg transition">
        <div className="text-3xl mb-3"><FiMapPin/></div>
        <h4 className="font-bold mb-1">Address</h4>

        <p className="text-sm text-gray-500 mb-2 dark:text-white">
          We will connect with you in real time!
        </p>

        <p className="text-sm font-medium">
          {contactInfo.address
            ? `${contactInfo.address}${contactInfo.city ? `, ${contactInfo.city}` : ""}${contactInfo.state ? `, ${contactInfo.state}` : ""}${contactInfo.pincode ? ` - ${contactInfo.pincode}` : ""}`
            : "123 Avenue Lane, Suite 100, Bucks, Los Angeles"}
        </p>
      </div>

    </div>
  </section>

  <Footer />

</div>
  );
};

export default Contact;


