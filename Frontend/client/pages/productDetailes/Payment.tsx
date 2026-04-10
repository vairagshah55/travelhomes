import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { X, Download } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { downloadDetailsAsPDF } from "@/utils/pdfGenerator";
import { LocationDropdown } from "@/components/LocationDropdown";
import { GuestDropdown } from "@/components/GuestDropdown";
import { CalendarDropdown } from "@/components/CalendarDropdown";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/lib/utils";

export default function PaymentPage() {
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7002';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, isAuthenticated } = useAuth();
  const { service, type, checkInDate, checkOutDate, guests } = location.state || {};

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (user) {
      console.log(user);
      setFormData(prev => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email || "",
        phone: user.phoneNumber || "",
        city: user.city || "",
        state: user.state || "",
      }));
    }
  }, [user?.firstName, user?.lastName, user?.email, user?.phoneNumber, user?.city, user?.state]);

  // Sync state when location state changes (e.g. after recovery)
  useEffect(() => {
    if (service) {
      setEditableBookingData({
        location: service?.city ? `${service.city}, ${service.state}` : "Mumbai, Maharashtra",
        guests: guests || { adults: 2, children: 0, infants: 0, pet: 0 },
        checkInDate: checkInDate ? new Date(checkInDate) : new Date(),
        checkOutDate: checkOutDate ? new Date(checkOutDate) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });
    }
  }, [service, checkInDate, checkOutDate, guests]);

  const locationRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const checkoutCalendarRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [isEditingBookingDetails, setIsEditingBookingDetails] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [tempLocationSearch, setTempLocationSearch] = useState("");
  const [editableBookingData, setEditableBookingData] = useState({
    location: service?.city ? `${service.city}, ${service.state}` : "Mumbai, Maharashtra",
    guests: guests || { adults: 2, children: 0, infants: 0, pet: 0 },
    checkInDate: checkInDate ? new Date(checkInDate) : new Date(),
    checkOutDate: checkOutDate ? new Date(checkOutDate) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  });

  const calculateDays = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const totalGuests = (editableBookingData.guests.adults || 0) + (editableBookingData.guests.children || 0);
  const days = Math.max(1, calculateDays(editableBookingData.checkInDate, editableBookingData.checkOutDate));
  const pricePerNight = Number(service?.regularPrice) || 600;
  
  let basePrice = pricePerNight * days;
  if (type === 'activity') {
     basePrice = pricePerNight * Math.max(1, totalGuests);
  }

  const gst = Math.round(basePrice * 0.18);
  const totalAmount = basePrice + gst + 50; // + cleaning fee

  const [bookingData, setBookingData] = useState({
    bookingId: `BK-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    tripType: type === "van" ? "Camper Van" : type === "activity" ? "Activity" : "Unique Stay",
    bookingType: "Vacation Rental",
    guestName: formData.name || "Guest Name",
    guestPhone: formData.phone || "N/A",
    guestEmail: formData.email || "N/A",
    checkInDate: editableBookingData.checkInDate.toLocaleDateString(),
    checkOutDate: editableBookingData.checkOutDate.toLocaleDateString(),
    numberOfNights: days,
    location: service?.city || "Unknown Location",
    propertyName: service?.name || "Service Name",
    address: `${formData.address1}, ${formData.address2}, ${formData.city}, ${formData.state}, ${formData.pincode}` || "Address not provided",
    description: service?.description || "No description",
    notes: "Please arrive before 2 PM. Late checkout available upon request.",
    perNightRate: pricePerNight,
    totalNights: days,
    basePrice: basePrice,
    discount: 0,
    cleaningFee: 50,
    serviceFee: 0,
    gst: gst,
    totalAmount: totalAmount,
    amountPaid: totalAmount, // Full payment
    remainingAmount: 0,
    advancePaid: totalAmount / 2,
    billingDate: new Date().toLocaleDateString(),
    serviceId: service?._id,
    userId: user?.id
  });

  // Update bookingData when editable changes or form changes
  useEffect(() => {
    const totalGuests = (editableBookingData.guests.adults || 0) + (editableBookingData.guests.children || 0);
    const d = Math.max(1, calculateDays(editableBookingData.checkInDate, editableBookingData.checkOutDate));
    
    let bp = pricePerNight * d;
    if (type === 'activity') {
        bp = pricePerNight * Math.max(1, totalGuests);
    }

    const g = Math.round(bp * 0.18);
    const tot = bp + g + 50;
    setBookingData(prev => ({
      ...prev,
      checkInDate: editableBookingData.checkInDate.toLocaleDateString(),
      checkOutDate: editableBookingData.checkOutDate.toLocaleDateString(),
      numberOfNights: d,
      totalNights: d,
      basePrice: bp,
      gst: g,
      totalAmount: tot,
      amountPaid: tot,
      guestName: formData.name,
      guestPhone: formData.phone,
      guestEmail: formData.email,
      address: `${formData.address1}, ${formData.address2}, ${formData.city}, ${formData.state}, ${formData.pincode}`,
      userId: user?.id
    }));
  }, [editableBookingData, formData, pricePerNight, user, type]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };
  const [inputDisabled, setInputesEnable] = useState(false);
  
  // Proceed Logic
  const handleProceedClick = async () => {
    if (!isAuthenticated) {
        sessionStorage.setItem('pending_booking', JSON.stringify({
            service,
            type,
            checkInDate: editableBookingData.checkInDate,
            checkOutDate: editableBookingData.checkOutDate,
            guests: editableBookingData.guests
        }));
        sessionStorage.setItem('auth_redirect', location.pathname);
        navigate('/login');
        return;
    }
    handlePayment();
  };

  // Recover state if missing (e.g. after auth redirect)
  useEffect(() => {
    if (!service) {
        const stored = sessionStorage.getItem('pending_booking');
        if (stored) {
            const parsed = JSON.parse(stored);
            navigate(".", { replace: true, state: parsed });
            sessionStorage.removeItem('pending_booking');
        }
    }
  }, [service, navigate]);


  const handleProceed = () => {
    setShowSuccess(true);
    setInputesEnable(true);
  }
  const handleClose = () => setShowSuccess(false);
  // const navigate = useNavigate(); // Already defined
  const [data, setData] = useState([]);


  const handleDownloadPDF = () => {
    const pdfData = {
      "Booking ID": bookingData.bookingId,
      "Trip Type": bookingData.tripType,
      "Booking Type": bookingData.bookingType,
      "Guest Name": bookingData.guestName,
      "Guest Phone": bookingData.guestPhone,
      "Guest Email": bookingData.guestEmail,
      "Property Name": bookingData.propertyName,
      "Location": bookingData.location,
      "Check-in Date": bookingData.checkInDate,
      "Check-out Date": bookingData.checkOutDate,
      "Number of Nights": bookingData.numberOfNights,
      "Base Price": `₹${bookingData.basePrice}`,
      "Discount": `₹${bookingData.discount}`,
      "Cleaning Fee": `₹${bookingData.cleaningFee}`,
      "Service Fee": `₹${bookingData.serviceFee}`,
      "GST (18%)": `₹${bookingData.gst}`,
      "Total Amount": `₹${bookingData.totalAmount}`,
      "Amount Paid": `₹${bookingData.amountPaid}`,
      "Remaining Amount": `₹${bookingData.remainingAmount}`,
      "Billing Date": bookingData.billingDate,
    };

    downloadDetailsAsPDF(
      pdfData,
      `Booking-${bookingData.bookingId}.pdf`,
      "Booking Confirmation"
    );
  };

  // Populate country list on mount
  useEffect(() => {
    fetch("/countries_states_cities.json") // remove ../../.. for public/ path
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Failed to load countries:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationRef.current &&
        !locationRef.current.contains(event.target as Node)
      ) {
        setShowLocationDropdown(false);
      }

      if (
        guestRef.current &&
        !guestRef.current.contains(event.target as Node)
      ) {
        setShowGuestDropdown(false);
      }
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendarDropdown(false);
      }
      if (
        checkoutCalendarRef.current &&
        !checkoutCalendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendarDropdown(false);
      }

    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

    const loadRazorpay = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };
  
    const handlePayment = async () => {
      if (!formData.name || !formData.name.trim()) {
        toast.error("Please enter your name");
        return;
      }
      if (!formData.email || !formData.email.trim()) {
        toast.error("Please enter your email");
        return;
      }
      if (!formData.phone || !formData.phone.trim()) {
        toast.error("Please enter your phone number");
        return;
      }

      const res = await loadRazorpay();
  
      if (!res) {
        toast.error("Razorpay SDK failed to load");
        return;
      }
  
      // 1️⃣ Create order from backend
      const orderResult = await axios.post(
        `${VITE_API_BASE_URL}/api/payments/razor/create-order`,
        { amount: bookingData.amountPaid } // ₹500
      );
  
      const { id, amount, currency } = orderResult.data;
  
      // 2️⃣ Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZOR_KEY, // public key
        amount: amount,
        currency: currency,
        name: "Travel Homes",
        description: "Test Transaction",
        order_id: id,
        handler: async function (response) {
          try {
            const bookingPayload = {
            ...bookingData,
            clientName: formData.name,
            clientEmail: formData.email,
            clientPhone: formData.phone,
            serviceName: type === "van" ? "camper-van" : type === "activity" ? "activity" : "unique-stay",
            numberOfGuests: editableBookingData.guests.adults + editableBookingData.guests.children,
            checkInDate: editableBookingData.checkInDate,
            checkOutDate: editableBookingData.checkOutDate,
            totalAmount: bookingData.amountPaid,
            baseAmount: bookingData.basePrice,
            bookingStatus: "confirmed",
            paymentDetails: {
                amount: bookingData.amountPaid,
                currency: "INR",
                paymentMethod: "razorpay",
                transactionId: response.razorpay_payment_id,
                paymentStatus: "completed",
                paidAt: new Date()
            }
          };

          console.log('Sending booking payload:', bookingPayload);

          const verifyResult = await axios.post(
            `${VITE_API_BASE_URL}/api/payments/razor/verify-payment`,
            { 
              razorpay_signature: response.razorpay_signature,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              booking: bookingPayload
             } 
          );
            console.log('Payment verification response:', verifyResult.data);
            if(verifyResult.data.success){
              console.log('Payment successful! Opening success dialog');
              setShowSuccess(true);
              setInputesEnable(true); 
            } else {
              console.error('Payment verification failed:', verifyResult.data);
              toast.error('Payment verification failed: ' + (verifyResult.data.message || 'Unknown error'));
            }
          } catch (error) {
            console.error('Error in payment handler:', error);
            toast.error('Error processing payment: ' + (error.response?.data?.message || error.message));
          }
          /*
          response.razorpay_payment_id
          response.razorpay_order_id
          response.razorpay_signature
          */
  
          // Send to backend for verification
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#3399cc",
        },
      };
  
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    };
  
  return (
    <>
      {/* Fixed Header */}
      <div className="fixed w-full z-50">
        <Header />
      </div>

      {/* Main Section */}
      <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white px-4 md:px-10 pt-28 pb-20">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
          {/* Left Section */}
          <section className="w-full lg:w-7/12 shadow-md border border-gray-200 dark:border-gray-800 p-6 rounded-[10px] bg-white dark:bg-[#0E0E10]">
            <div className="flex justify-between">
              <h2 className="text-xl md:text-2xl font-semibold mb-6 text-[#1C2939] dark:text-white">
                Booking Details
              </h2>
              <Button
                size="sm"
                onClick={() => {
                  if (!isEditingBookingDetails) {
                    setIsEditingBookingDetails(true);
                  } else {
                    setIsEditingBookingDetails(false);
                    setBookingData({
                      ...bookingData,
                      location: editableBookingData.location,
                      checkInDate: editableBookingData.checkInDate.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }),
                      checkOutDate: editableBookingData.checkOutDate.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }),
                    });
                  }
                }}
                className="w-fit px-8 rounded-[8px] bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black transition-colors"
              >
                {!isEditingBookingDetails ? "Edit" : "Save"}
              </Button>

            </div>
            {isEditingBookingDetails ? (
              <div className="space-y-4 mb-6">
                <div ref={calendarRef} className="relative">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                  <button
                    onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-left bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-gray-400 transition-colors"
                  >
                    {editableBookingData.checkInDate.toLocaleDateString()} - {editableBookingData.checkOutDate.toLocaleDateString()}
                  </button>
                  {showCalendarDropdown && (
                    <CalendarDropdown
                      onClose={() => setShowCalendarDropdown(false)}
                      onSelect={(range) => {
                        setEditableBookingData({
                          ...editableBookingData,
                          checkInDate: range.start,
                          checkOutDate: range.end,
                        });
                        setShowCalendarDropdown(false);
                      }}
                      selectedRange={{
                        start: editableBookingData.checkInDate,
                        end: editableBookingData.checkOutDate,
                      }}
                    />
                  )}
                </div>

                <div ref={guestRef} className="relative">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Guests</label>
                  <button
                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-left bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-gray-400 transition-colors"
                  >
                    Adults: {editableBookingData.guests.adults}, Children: {editableBookingData.guests.children}, Infants: {editableBookingData.guests.infants}
                  </button>
                  {showGuestDropdown && (
                    <GuestDropdown
                      guests={editableBookingData.guests}
                      onUpdate={(guests) =>
                        setEditableBookingData({
                          ...editableBookingData,
                          guests,
                        })
                      }
                      onClose={() => setShowGuestDropdown(false)}
                    />
                  )}
                </div>

                <div ref={locationRef} className="relative">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                  <input
                    type="text"
                    value={tempLocationSearch}
                    onChange={(e) => setTempLocationSearch(e.target.value)}
                    placeholder="Search location..."
                    onClick={() => setShowLocationDropdown(true)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-gray-400 transition-colors"
                  />
                  {showLocationDropdown && (
                    <LocationDropdown
                      searchQuery={tempLocationSearch}
                      onSelect={(location) => {
                        setEditableBookingData({
                          ...editableBookingData,
                          location,
                        });
                        setTempLocationSearch("");
                        setShowLocationDropdown(false);
                      }}
                      onClose={() => setShowLocationDropdown(false)}
                    />
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap justify-between text-sm mb-4">
                  <p className="flex flex-col">
                    Date:{" "}
                    <span className="font-medium text-xs text-gray-500 dark:text-gray-300">
                      {editableBookingData.checkInDate.toLocaleDateString()} – {editableBookingData.checkOutDate.toLocaleDateString()}
                    </span>
                  </p>
                  <p className="flex flex-col">
                    Guest:{" "}
                    <span className="font-medium text-xs text-gray-500 dark:text-gray-300">
                      {editableBookingData.guests.adults + editableBookingData.guests.children}
                    </span>
                  </p>
                </div>

                <p className="mb-6 flex flex-col">
                  Location:{" "}
                  <span className="font-medium text-xs text-gray-600 dark:text-gray-300">
                    {editableBookingData.location}
                  </span>
                </p>
              </>
            )}

            <h3 className="font-semibold mb-4 text-lg">Enter your details</h3>

            <div className="space-y-4">
              {/* Name & Phone */}
              <div className="flex flex-col sm:flex-row gap-4">
             <Input
  placeholder="Name"
  value={formData.name}
  onChange={(e) => handleChange("name", e.target.value)}
  className="border-gray-400 rounded-[10px]"
/>

              <Input
  placeholder="Phone Number"
  value={formData.phone}
  maxLength={10}
  onChange={(e) =>
    handleChange("phone", e.target.value.replace(/\D/g, ""))
  }
  className="border-gray-400 rounded-[10px]"
/>

              </div>

              {/* Email */}
         <Input
  placeholder="Email"
  value={formData.email}
  onChange={(e) => handleChange("email", e.target.value)}
  className="border-gray-400 rounded-[10px]"
/>


              {/* Address */}
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-lg">Address</h3>
                <Input
                  placeholder="Address Line 1"
                  disabled={inputDisabled}
                  value={formData.address1}
                  onChange={(e) => handleChange("address1", e.target.value)}
                  className="border-gray-400 rounded-[10px]"
                />
                <Input
                  placeholder="Address Line 2"
                  disabled={inputDisabled}
                  value={formData.address2}
                  onChange={(e) => handleChange("address2", e.target.value)}
                  className="border-gray-400 rounded-[10px] mt-2"
                />

                <div className="flex justify-between items-center gap-4 mt-3">
                  <select
                    className="border w-full border-gray-200 rounded-lg px-3 py-2"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                  >
                    <option value="" disabled={inputDisabled} className="text-gray-300">
                      Select State
                    </option>
                    {data
                      .find((c: any) => c.name === "India")
                      ?.states?.map((state: any, idx: number) => (
                        <option key={idx} value={state.name} disabled={inputDisabled}>
                          {state.name}
                        </option>
                      ))}
                  </select>

                  <select
                    className="border w-full border-gray-200 rounded-lg px-3 py-2"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    disabled={!formData.state}
                  >
                    <option value="" disabled={inputDisabled} className="text-gray-300">
                      Select City
                    </option>
                    {data
                      .find((country: any) => country.name === "India")
                      ?.states.find((state: any) => state.name === formData.state)
                      ?.cities.map((city: any, idx: number) => (
                        <option key={idx} value={city.name} disabled={inputDisabled}>
                          {city.name}
                        </option>
                      ))}
                  </select>

                  <div className="w-full">

                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="Pincode"
                      disabled={inputDisabled}
                      value={formData.pincode}
                      onChange={(e) => handleChange("pincode", e.target.value)}
                      className="w-full border-gray-400 rounded-[10px]"
                    />
                  </div>
                </div>
              </div>

              {/* Proceed Button */}
              {/* <Button
                onClick={handleProceed}
                className="w-fit px-6 py-2 rounded-[10px] mt-6 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black transition-colors"
              >
                Proceed
              </Button> */}
            </div>
          </section>

          {/* Right Section - Price Details */}
          <aside className="w-full lg:w-5/12">
            <div className="shadow-md border border-gray-200 dark:border-gray-800 p-6 rounded-[10px] bg-white dark:bg-[#0E0E10]">
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <img
                  src={getImageUrl(service?.photos?.coverUrl) || "payment.jpg"}
                  alt="Property"
                  className="w-28 h-28 rounded-[10px] object-cover"
                />
                <div className="text-center sm:text-left">
                  <span className="text-xs text-gray-400">{bookingData.tripType}</span>
                  <h4 className="font-semibold text-lg text-black dark:text-white">
                    {bookingData.propertyName}
                  </h4>
                  <p className="text-gray-500 text-sm mt-2 flex items-center justify-center sm:justify-start gap-1">
                    <span className="text-black dark:text-yellow-400">★</span>
                    4.8 · {service?.reviews?.length || 0} reviews
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2 text-sm">
                <h3 className="font-medium text-base">Price details</h3>

                <div className="flex justify-between text-gray-500">
                  <p>₹{pricePerNight} × {bookingData.numberOfNights} nights</p>
                  <p>₹{bookingData.basePrice}</p>
                </div>
                {/* <div className="flex justify-between text-gray-500">
                  <p>Long-stay discount</p>
                  <p>–₹100</p>
                </div> */}
                <div className="flex justify-between text-gray-500">
                  <p>Cleaning fee</p>
                  <p>₹{bookingData.cleaningFee}</p>
                </div>
                <div className="flex justify-between text-gray-500">
                  <p>Service fee</p>
                  <p>₹{bookingData.serviceFee}</p>
                </div>
                 <div className="flex justify-between text-gray-500">
                  <p>GST (18%)</p>
                  <p>₹{bookingData.gst}</p>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 flex justify-between font-semibold text-black dark:text-white">
                  <p>Total (INR)</p>
                  <p>₹{bookingData.totalAmount}</p>
                </div>
              </div>

              <Button
                onClick={handleProceedClick}
                className="w-full relative z-10 px-6 py-3 rounded-[10px] mt-6 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black transition-colors"
              >
                {isAuthenticated ? "Proceed to Payment" : "Login to Proceed"}
              </Button>
            </div>
          </aside>
        </div>
      </main>

      {/* Success Dialog */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[100] px-4">
          <div className="bg-white dark:bg-[#0E0E10] rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md p-6 text-center relative">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-black dark:hover:text-white"
            >
              <X size={18} />
            </button>

            {/* Success Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 rounded-full p-4">
                <div className="bg-green-500 text-white w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold">
                  ✓
                </div>
              </div>
            </div>

            {/* Message */}
            <h2 className="text-xl font-semibold mb-1">Congrats!!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Your payment is successful
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Lorem ipsum dolor sit amet consectetur. Nulla cursus scelerisque
              massa sed bibendum.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button
                onClick={() => navigate("/")}
                className="rounded-full w-full bg-white border border-gray-300 text-black px-5 py-2 hover:bg-gray-100"
              >
                Home
              </Button>
              <Button
                onClick={() => {
                    navigate("/user-trips");
                }}
                className="rounded-full w-full bg-black text-white px-5 py-2 hover:bg-gray-800"
              >
                View My Trips
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Dialog */}
      {showBookingDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[100] overflow-y-auto scrollbar-hide">
          <div className="bg-white border max-h-[650px] dark:bg-[#0E0E10] rounded-sm shadow-xl w-full max-w-2xl mx-auto p-5 relative my-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowBookingDetails(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black dark:hover:text-white"
            >
              <X size={20} />
            </button>

            {/* Header with Logo */}
            <div className=" text-center dark:border-gray-800">
              <div className="flex justify-center mb-2">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/ef12e49186360c5f295a30497de96e3fcb05f7d8?width=160"
                  alt="Travel Homes Logo"
                  className="h-12 object-contain"
                />
              </div>
              <h2 className="text-lg font-semibold text-black dark:text-white mb-1">
                Booking Confirmation
              </h2>
              <p className="text-gray-500 text-sm dark:text-gray-400">
                Booking ID: {bookingData.bookingId}
              </p>
            </div>

            {/* Content */}
            <div className="space-y-2  p-3 max-h-[calc(100vh-330px)] overflow-y-auto scrollbar-hide">
              {/* Trip & Booking Type */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    TRIP TYPE
                  </p>
                  <p className="text-sm font-semibold text-black dark:text-white mt-1">
                    {bookingData.tripType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    BOOKING TYPE
                  </p>
                  <p className="text-sm font-semibold text-black dark:text-white mt-1">
                    {bookingData.bookingType}
                  </p>
                </div>
              </div>

              {/* Guest Information */}
              <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-black dark:text-white mb-3">
                  Guest Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium text-black dark:text-white">
                      {bookingData.guestName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="font-medium text-black dark:text-white">
                      {bookingData.guestPhone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium text-black dark:text-white break-all">
                      {bookingData.guestEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Property & Location */}
              <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-black dark:text-white mb-3">
                  Property Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Property:</span>
                    <p className="font-medium text-black dark:text-white">
                      {bookingData.propertyName}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Location:</span>
                    <p className="font-medium text-black dark:text-white">
                      {bookingData.location}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Description:</span>
                    <p className="font-medium text-black dark:text-white">
                      {bookingData.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-black dark:text-white mb-3">
                  Billing Address
                </h3>
                <p className="text-sm text-black dark:text-white">
                  {bookingData.address}
                </p>
              </div>

              {/* Dates */}
              <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-black dark:text-white mb-3">
                  Stay Duration
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                    <span className="font-medium text-black dark:text-white">
                      {bookingData.checkInDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
                    <span className="font-medium text-black dark:text-white">
                      {bookingData.checkOutDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Number of Nights:
                    </span>
                    <span className="font-medium text-black dark:text-white">
                      {bookingData.numberOfNights}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-black dark:text-white mb-3">
                  Price Breakdown
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>
                      ₹{bookingData.perNightRate} × {bookingData.totalNights} nights
                    </span>
                    <span>₹{bookingData.basePrice}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Long-stay discount</span>
                    <span>₹{bookingData.discount}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Cleaning fee</span>
                    <span>₹{bookingData.cleaningFee}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Service fee</span>
                    <span>₹{bookingData.serviceFee}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>GST (18%)</span>
                    <span>₹{bookingData.gst}</span>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-black dark:text-white mb-3">
                  Payment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-semibold text-black dark:text-white">
                    <span>Total Amount:</span>
                    <span>₹{bookingData.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Advance Paid:</span>
                    <span>₹{bookingData.advancePaid}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Amount Paid:</span>
                    <span>₹{bookingData.amountPaid}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-black dark:text-white">
                    <span>Remaining Amount:</span>
                    <span>₹{bookingData.remainingAmount}</span>
                  </div>
                </div>
              </div>

              {/* Billing & Notes */}
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-3">
                  Additional Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Billing Date:</span>
                    <span className="font-medium text-black dark:text-white">
                      {bookingData.billingDate}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Notes:</p>
                    <p className="text-black dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded">
                      {bookingData.notes}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex  p-3 flex-col sm:flex-row gap-3 border-gray-200 dark:border-gray-800">
              <Button
                onClick={handleDownloadPDF}
                className="flex-1 rounded-lg bg-green-600 text-white px-4 py-2 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download PDF
              </Button>
              <Button
                onClick={() => window.print()}
                className="flex-1 rounded-lg bg-white border border-gray-300 text-black px-4 py-2 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
              >
                Print
              </Button>
              <Button
                onClick={() => setShowBookingDetails(false)}
                className="flex-1 rounded-lg bg-black text-white px-4 py-2 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
