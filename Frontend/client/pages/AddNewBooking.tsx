// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
//   Calendar,
//   Bell,
//   Menu,
//   ChevronDown,
//   Clock,
//   CheckCircle,
//   AlertCircle,
//   Upload,
// } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { ThemeToggle } from "@/components/ThemeToggle";
// import { Sidebar } from "@/components/Navigation";
// import ProfileDropdown from "@/components/ProfileDropdown";
// import MobileVendorNav from "@/components/MobileVendorNav";
// import { DashboardHeader } from "@/components/Header";

// const AddNewBooking = () => {
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [showSuccessAlert, setShowSuccessAlert] = useState(false);
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const [dragActive, setDragActive] = useState(false);

//   const handleToggleCollapse = () => {
//     setIsCollapsed(!isCollapsed);
//   };

//   const [formData, setFormData] = useState({
//     serviceName: "",
//     customerName: "",
//     email: "",
//     phone: "",
//     checkInDate: "",
//     checkInTime: "",
//     checkOutDate: "",
//     checkOutTime: "",
//     locationFrom: "",
//     locationTo: "",
//     pickupLocation: "",
//     uploadedFile: null as File | null,
//   });

//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const services = [
//     "Travel Package A",
//     "Travel Package B",
//     "Hotel Booking",
//     "Flight Booking",
//     "Car Rental",
//   ];

//   const locations = ["Jamshedpur", "Delhi", "Mumbai", "Bangalore", "Chennai"];

//   const handleInputChange = (field: string, value: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleDrag = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setDragActive(true);
//     } else if (e.type === "dragleave") {
//       setDragActive(false);
//     }
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);

//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       setFormData((prev) => ({
//         ...prev,
//         uploadedFile: e.dataTransfer.files[0],
//       }));
//     }
//   };

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setFormData((prev) => ({
//         ...prev,
//         uploadedFile: e.target.files![0],
//       }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors: Record<string, string> = {};

//     if (!formData.serviceName)
//       newErrors.serviceName = "Service name is required";
//     if (!formData.customerName.trim())
//       newErrors.customerName = "Customer name is required";
//     if (!formData.email.trim()) {
//       newErrors.email = "Email is required";
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//       newErrors.email = "Please enter a valid email address";
//     }
//     if (!formData.phone.trim()) {
//       newErrors.phone = "Phone number is required";
//     } else if (!/^[+]?[\d\s()-]{10,}$/.test(formData.phone)) {
//       newErrors.phone = "Please enter a valid phone number";
//     }
//     if (!formData.checkInDate)
//       newErrors.checkInDate = "Check-in date is required";
//     if (!formData.checkInTime)
//       newErrors.checkInTime = "Check-in time is required";
//     if (!formData.locationFrom)
//       newErrors.locationFrom = "Location from is required";
//     if (!formData.locationTo) newErrors.locationTo = "Location to is required";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!validateForm()) {
//       return;
//     }

//     setIsSubmitting(true);

//     // Simulate API call
//     try {
//       await new Promise((resolve) => setTimeout(resolve, 2000));
//       setShowSuccessAlert(true);
//       setTimeout(() => {
//         setShowSuccessAlert(false);
//         // Reset form
//         setFormData({
//           serviceName: "",
//           customerName: "",
//           email: "",
//           phone: "",
//           checkInDate: "",
//           checkInTime: "",
//           checkOutDate: "",
//           checkOutTime: "",
//           locationFrom: "",
//           locationTo: "",
//           pickupLocation: "",
//           uploadedFile: null,
//         });
//         setErrors({});
//       }, 3000);
//     } catch (error) {
//       console.error("Failed to submit booking:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta">
//       {/* Desktop Sidebar */}
//       <div className="hidden lg:block">
//         <Sidebar
//           isCollapsed={isCollapsed}
//           onToggleCollapse={handleToggleCollapse}
//         />
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col">
//         {/* Header */}
//         <DashboardHeader Headtitle={"Bookings"} />

//         {/* Content Area */}
//         {/* <div className="h-screen flex-1 flex flex-col pr-5 pb-5 overflow-auto scrollbar-hide"> */}
//         {/* Content Header */}

//         {/* Form Content */}
//         <div className="flex-1 p-5 bg-white dark:bg-gray-800 rounded-b-3xl overflow-y-auto scrollbar-hide">
//           <div className="flex items-center px-5 py-4  dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-3xl">
//             <h2 className="text-lg lg:text-xl font-bold text-dashboard-heading dark:text-white font-geist">
//               New Bookings
//             </h2>
//           </div>
//           {/* Success Alert */}
//           {showSuccessAlert && (
//             <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 animate-in slide-in-from-top-4 duration-300">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <AlertDescription className="text-green-700 dark:text-green-400">
//                 Booking created successfully! The customer will receive a
//                 confirmation email shortly.
//               </AlertDescription>
//             </Alert>
//           )}

//           {/* Booking Form */}
//           <form onSubmit={handleSubmit} className="space-y-5 ">
//             {/* Service Name - Full Width */}
//             <div className="form-field">
//               <Label htmlFor="serviceName" className="figma-label">
//                 Service Name
//               </Label>
//               <Select
//                 onValueChange={(value) =>
//                   handleInputChange("serviceName", value)
//                 }
//                 required
//               >
//                 <SelectTrigger className="figma-input text-gray-500 dark:text-gray-400 ">
//                   <SelectValue placeholder="Select" />
//                   {/* <ChevronDown size={18} className="text-gray-600 dark:text-gray-400" /> */}
//                 </SelectTrigger>
//                 <SelectContent>
//                   {services.map((service) => (
//                     <SelectItem key={service} value={service}>
//                       {service}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             {/* Name, Email, Phone - Responsive Row */}
//             <div className="flex flex-col lg:flex-row gap-5 ">
//               <div
//                 className={`form-field flex-1 ${errors.customerName ? "error" : ""}`}
//               >
//                 <Label htmlFor="customerName" className="figma-label">
//                   Name
//                 </Label>
//                 <Input
//                   id="customerName"
//                   value={formData.customerName}
//                   onChange={(e) => {
//                     handleInputChange("customerName", e.target.value);
//                     if (errors.customerName) {
//                       setErrors((prev) => ({ ...prev, customerName: "" }));
//                     }
//                   }}
//                   placeholder="Badal Singh"
//                   className={`figma-input ${errors.customerName ? "error" : ""}`}
//                   required
//                 />
//                 {errors.customerName && (
//                   <p className="error-message">{errors.customerName}</p>
//                 )}
//               </div>

//               <div
//                 className={`form-field w-full lg:w-64 ${errors.email ? "error" : ""}`}
//               >
//                 <Label htmlFor="email" className="figma-label">
//                   Email
//                 </Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   value={formData.email}
//                   onChange={(e) => {
//                     handleInputChange("email", e.target.value);
//                     if (errors.email) {
//                       setErrors((prev) => ({ ...prev, email: "" }));
//                     }
//                   }}
//                   placeholder="jpbadalsigh"
//                   className={`figma-input ${errors.email ? "error" : ""}`}
//                   required
//                 />
//                 {errors.email && (
//                   <p className="error-message">{errors.email}</p>
//                 )}
//               </div>

//               <div
//                 className={`form-field w-full lg:w-64 ${errors.phone ? "error" : ""}`}
//               >
//                 <Label htmlFor="phone" className="figma-label">
//                   Phone Number
//                 </Label>
//                 <Input
//                   id="phone"
//                   value={formData.phone}
//                   onChange={(e) => {
//                     handleInputChange("phone", e.target.value);
//                     if (errors.phone) {
//                       setErrors((prev) => ({ ...prev, phone: "" }));
//                     }
//                   }}
//                   placeholder="+91 52024 42423"
//                   className={`figma-input ${errors.phone ? "error" : ""}`}
//                   required
//                 />
//                 {errors.phone && (
//                   <p className="error-message">{errors.phone}</p>
//                 )}
//               </div>
//             </div>

//             {/* Date and Time - Equal Flex */}
//             <div className="flex flex-col lg:flex-row gap-5">
//               <div className="form-field flex-1">
//                 <Label htmlFor="checkInDate" className="figma-label">
//                   Checkin & Checkout Date
//                 </Label>
//                 <div className="relative">
//                   <Input
//                     id="checkInDate"
//                     type="date"
//                     value={formData.checkInDate}
//                     onChange={(e) =>
//                       handleInputChange("checkInDate", e.target.value)
//                     }
//                     className="figma-input"
//                     required
//                   />
//                   <Calendar
//                     size={18}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400 pointer-events-none"
//                   />
//                 </div>
//               </div>

//               <div className="form-field flex-1">
//                 <Label htmlFor="checkInTime" className="figma-label">
//                   Checkin & Checkout Time
//                 </Label>
//                 <div className="relative">
//                   <Input
//                     id="checkInTime"
//                     type="time"
//                     value={formData.checkInTime}
//                     onChange={(e) =>
//                       handleInputChange("checkInTime", e.target.value)
//                     }
//                     placeholder="9:30 AM - 7:45 PM"
//                     className="figma-input"
//                     required
//                   />
//                   <Clock
//                     size={18}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400 pointer-events-none"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Location From/To - 255px Width Each */}
//             <div className="flex flex-col lg:flex-row gap-5 lg:items-center">
//               <div className="form-field w-full lg:w-64">
//                 <Label htmlFor="locationFrom" className="figma-label">
//                   Location From
//                 </Label>
//                 <Select
//                   onValueChange={(value) =>
//                     handleInputChange("locationFrom", value)
//                   }
//                   required
//                 >
//                   <SelectTrigger className="figma-input">
//                     <SelectValue placeholder="Jamshedpur" />
//                     <ChevronDown
//                       size={18}
//                       className="text-gray-600 dark:text-gray-400"
//                     />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {locations.map((location) => (
//                       <SelectItem key={location} value={location}>
//                         {location}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="form-field w-full lg:w-64">
//                 <Label htmlFor="locationTo" className="figma-label">
//                   Location To
//                 </Label>
//                 <Select
//                   onValueChange={(value) =>
//                     handleInputChange("locationTo", value)
//                   }
//                   required
//                 >
//                   <SelectTrigger className="figma-input">
//                     <SelectValue placeholder="Jamshedpur" />
//                     <ChevronDown
//                       size={18}
//                       className="text-gray-600 dark:text-gray-400"
//                     />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {locations.map((location) => (
//                       <SelectItem key={location} value={location}>
//                         {location}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>

//             {/* Pickup Location - Full Width Textarea */}
//             <div className="form-field">
//               <Label htmlFor="pickupLocation" className="figma-label">
//                 Pickup Location
//               </Label>
//               <Textarea
//                 id="pickupLocation"
//                 value={formData.pickupLocation}
//                 onChange={(e) =>
//                   handleInputChange("pickupLocation", e.target.value)
//                 }
//                 placeholder="Badal Singh"
//                 className="min-h-[84px] border-dashboard-stroke dark:border-gray-600 rounded-lg px-3 py-4 text-sm font-plus-jakarta text-dashboard-neutral07 dark:text-gray-300 resize-none bg-white dark:bg-gray-800 hover:border-dashboard-primary focus:border-dashboard-primary transition-colors"
//               />
//             </div>

//             {/* Upload ID Section */}
//             <div className="form-field">
//               <Label className="figma-label font-medium">Upload ID</Label>

//               <div
//                 className={`upload-area p-6 flex flex-col items-center justify-center min-h-[182px] ${dragActive ? "active" : ""}`}
//                 onDragEnter={handleDrag}
//                 onDragLeave={handleDrag}
//                 onDragOver={handleDrag}
//                 onDrop={handleDrop}
//                 onClick={() => document.getElementById("file-upload")?.click()}
//               >
//                 <input
//                   id="file-upload"
//                   type="file"
//                   className="hidden"
//                   accept=".pdf,.doc,.docx,.csv,.xlsx"
//                   onChange={handleFileSelect}
//                 />

//                 <div className="flex flex-col items-center gap-3">
//                   <div className="w-20 h-20 flex items-center justify-center">
//                     <img
//                       src="https://api.builder.io/api/v1/image/assets/TEMP/991b35456b4010a2bef0b568b3cda63d07935d1b?width=148"
//                       alt="Document icon"
//                       className="w-full h-full object-contain"
//                     />
//                   </div>

//                   <p className="text-center text-xs text-dashboard-body dark:text-gray-400 font-plus-jakarta max-w-[263px]">
//                     {formData.uploadedFile ? (
//                       <span className="text-dashboard-primary font-medium">
//                         {formData.uploadedFile.name}
//                       </span>
//                     ) : (
//                       <>
//                         Drag and drop choose file to upload your files.
//                         <br />
//                         All pdf, doc, csv, xlsx types are supported
//                       </>
//                     )}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </form>
//         </div>

//         {/* Fixed Bottom Submit Section */}
//         {/* <div className=" border-dashboard-stroke dark:border-gray-700 bg-white dark:bg-gray-800 p-2 lg:p-3  shadow-lg"> */}
//         <div className="flex justify-end">
//           <Button
//             type="submit"
//             disabled={isSubmitting}
//             onClick={handleSubmit}
//             className="bg-dashboard-primary dark:text-black text-white hover:bg-gray-800 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 rounded-full px-10 h-12 font-geist font-medium"
//           >
//             {isSubmitting ? (
//               <div className="flex items-center gap-2">
//                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                 Submitting...
//               </div>
//             ) : (
//               "Submit"
//             )}
//           </Button>
//         </div>
//         {/* </div> */}
//         {/* </div> */}
//       </div>
//       <div className="fixed top-0 right-0">
//         {" "}
//         <MobileVendorNav />
//       </div>
//     </div>
//   );
// };

// export default AddNewBooking;
