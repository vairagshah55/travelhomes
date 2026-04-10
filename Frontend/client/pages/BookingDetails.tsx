import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Bell,
  Plus,
  Menu,
  ChevronDown,
  ArrowUpDown,
  Users,
  X,
  Loader2,
  Car,
  Home,
  MapPin,
  CheckCircle,
  Printer,
  Pencil,
  Trash2,
  Ban,
  Camera,
  MoreHorizontal,
  Circle,
  MapPinOff,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "@/components/Navigation";
import ProfileDropdown from "@/components/ProfileDropdown";
import MobileVendorNav from "@/components/MobileVendorNav";
import { DashboardHeader } from "@/components/Header";
import { bookingDetailsApi, bookingsApi, offersApi, activitiesApi, type BookingDetailDTO } from "@/lib/api";
import toast from 'react-hot-toast';
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";
import { formatDate } from "@/utils/formateTime";
import { max } from "date-fns";

// Utility functions for date filtering
// Supports multiple formats:
// - "dd/mm/yyyy, hh:mm am/pm"
// - "yyyy-mm-dd hh:mm" (24h)
// - "yyyy-mm-dd"
const parseBookingDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  try {
    // Case 1: dd/mm/yyyy, hh:mm am/pm
    if (dateStr.includes('/')) {
      const [datePart, timePart] = dateStr.split(', ');
      const [day, month, year] = datePart.split('/');
      
      if (timePart) {
        const [time, period] = timePart.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        if (period?.toLowerCase() === 'pm' && hour24 !== 12) hour24 += 12;
        if (period?.toLowerCase() === 'am' && hour24 === 12) hour24 = 0;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minutes));
      }
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Case 2: yyyy-mm-dd hh:mm OR yyyy-mm-dd
    const [ymd, hm] = dateStr.split(/[T ]/); // split by space or T
    if (/\d{4}-\d{2}-\d{2}/.test(ymd)) {
      const [year, month, day] = ymd.split('-');
      if (hm && /\d{2}:\d{2}/.test(hm)) {
        const [hours, minutes] = hm.split(':');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
      }
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Fallback to Date parsing
    return new Date(dateStr);
  } catch {
    return new Date();
  }
};

const isDateInRange = (date: Date, range: string): boolean => {
  if (range === 'all') return true;
  if (isNaN(date.getTime())) return false;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  switch (range) {
    case 'today':
      return date >= today && date < tomorrow;
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Sunday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7); // Next Sunday (exclusive)
      return date >= weekStart && date < weekEnd;
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return date >= monthStart && date < nextMonth;
    default:
      return true;
  }
};

const categorizeBooking = (booking: BookingDetailDTO): 'upcoming' | 'past' | 'cancelled' => {
  if (booking.status === 'cancelled') return 'cancelled';
  
  const checkInDate = parseBookingDate(booking.checkIn);
  const now = new Date();
  
  // Set time to 00:00:00 for date-only comparison to include today in upcoming
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const bookingDate = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
  
  return bookingDate >= today ? 'upcoming' : 'past';
};

// Sample booking data with varied dates and service types
const staticBookingsData: BookingDetailDTO[] = [
  // Future bookings (upcoming)
  {
    id: "CV042W4",
    clientName: "Badal Singh",
    serviceName: "Van Service",
    servicePrice: "₹ 2500",
    checkIn: "25/12/2024, 10:30 am",
    checkOut: "25/12/2024, 6:30 pm",
    guests: 4,
    status: "pending",
    statusColor: "bg-status-orange-bg text-status-orange-text",
    location: "Jamshedpur → Ranchi",
    serviceType: "van",
  } as any,
  {
    id: "CV042E4",
    clientName: "Priya Sharma",
    serviceName: "Luxury Villa",
    servicePrice: "₹ 8500 / night",
    checkIn: "28/12/2024, 2:00 pm",
    checkOut: "30/12/2024, 11:00 am",
    guests: 6,
    status: "confirmed",
    statusColor: "bg-status-purple-bg text-status-purple-text",
    location: "Goa Beach Resort",
    serviceType: "unique-stays",
  } as any,
  {
    id: "CV042F5",
    clientName: "Rahul Kumar",
    serviceName: "Adventure Trek",
    servicePrice: "₹ 3500",
    checkIn: "1/1/2025, 6:00 am",
    checkOut: "3/1/2025, 6:00 pm",
    guests: 2,
    status: "confirmed",
    statusColor: "bg-status-purple-bg text-status-purple-text",
    location: "Himachal Pradesh",
    serviceType: "activity",
  } as any,
  
  // Today's bookings
  {
    id: "CV042G6",
    clientName: "Amit Patel",
    serviceName: "Airport Transfer",
    servicePrice: "₹ 1200",
    checkIn: `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}, 8:00 am`,
    checkOut: `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}, 10:00 am`,
    guests: 3,
    status: "active",
    statusColor: "bg-status-green-bg text-status-green-text",
    location: "Jamshedpur → Birsa Munda Airport",
    serviceType: "van",
  } as any,

  // Past bookings
  {
    id: "CV042H7",
    clientName: "Sunita Devi",
    serviceName: "Heritage Hotel",
    servicePrice: "₹ 4500 / night",
    checkIn: "15/11/2024, 3:00 pm",
    checkOut: "17/11/2024, 12:00 pm",
    guests: 2,
    status: "active",
    statusColor: "bg-status-green-bg text-status-green-text",
    location: "Rajasthan Palace",
    serviceType: "unique-stays",
  } as any,
  {
    id: "CV042I8",
    clientName: "Vikash Singh",
    serviceName: "City Tour",
    servicePrice: "₹ 2000",
    checkIn: "10/11/2024, 9:00 am",
    checkOut: "10/11/2024, 7:00 pm",
    guests: 5,
    status: "active",
    statusColor: "bg-status-green-bg text-status-green-text",
    location: "Delhi Sightseeing",
    serviceType: "activity",
  } as any,

  // Cancelled bookings
  {
    id: "CV042J9",
    clientName: "Neha Gupta",
    serviceName: "Beach Resort",
    servicePrice: "₹ 6000 / night",
    checkIn: "20/12/2024, 2:00 pm",
    checkOut: "22/12/2024, 11:00 am",
    guests: 4,
    status: "cancelled",
    statusColor: "bg-status-red-bg text-status-red-text",
    location: "Kerala Backwaters",
    serviceType: "unique-stays",
  } as any,
  {
    id: "CV042K0",
    clientName: "Ravi Yadav",
    serviceName: "Van Rental",
    servicePrice: "₹ 3000",
    checkIn: "18/12/2024, 7:00 am",
    checkOut: "18/12/2024, 9:00 pm",
    guests: 8,
    status: "cancelled",
    statusColor: "bg-status-red-bg text-status-red-text",
    location: "Jamshedpur → Kolkata",
    serviceType: "van",
  } as any,
];

// Booking Detail Modal Component
const BookingDetailModal = ({
  booking,
  isOpen,
  onClose,
}: {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 p-4">
      <div className="bg-white  dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <X size={16} className="text-gray-600 dark:text-gray-300" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-dashboard-heading dark:text-white font-geist mb-7">
          Booking Detail
        </h2>

        {/* Content */}
        <div className="space-y-9">
          {/* First Row */}
          <div className="grid grid-cols-3 gap-10">
            <div className="space-y-3">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist leading-[18px] tracking-[0.16px]">
                Booking ID
              </label>
              <div className="text-sm font-normal text-dashboard-text dark:text-gray-300 font-plus-jakarta leading-6 tracking-[0.2px]">
                {booking.id}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist leading-[18px] tracking-[0.16px]">
                Client Name
              </label>
              <div className="text-sm font-normal text-dashboard-text dark:text-gray-300 font-plus-jakarta leading-6 tracking-[0.2px]">
                {booking.clientName}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist leading-[18px] tracking-[0.16px]">
                Service Name
              </label>
              <div className="text-sm font-normal text-dashboard-text dark:text-gray-300 font-plus-jakarta leading-6 tracking-[0.2px]">
                {booking.serviceName}
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-3 gap-10">
            <div className="space-y-3">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist leading-[18px] tracking-[0.16px]">
                Check In
              </label>
              <div className="text-sm font-normal text-dashboard-text dark:text-gray-300 font-plus-jakarta leading-6 tracking-[0.2px]">
                {booking.checkIn}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist leading-[18px] tracking-[0.16px]">
                Check Out
              </label>
              <div className="text-sm font-normal text-dashboard-text dark:text-gray-300 font-poppins leading-6">
                {booking.checkOut}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist leading-[18px] tracking-[0.16px]">
                No. of Guest
              </label>
              <div className="text-sm font-normal text-dashboard-text dark:text-gray-300 font-plus-jakarta leading-6 tracking-[0.2px]">
                {booking.guests}
              </div>
            </div>
          </div>

          {/* Third Row - Location */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist leading-[18px] tracking-[0.16px]">
              Location
            </label>
            <div className="text-sm font-normal text-dashboard-text dark:text-gray-300 font-plus-jakarta leading-[31px] tracking-[0.2px]">
              {booking.location}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Booking Modal Component
const EditBookingModal = ({ booking, isOpen, onClose, onSubmit, loading }: {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, payload: Partial<BookingDetailDTO>) => void;
  loading: boolean;
}) => {
  const [form, setForm] = useState({
    serviceName: '',
    customerName: '',
    email: '',
    phone: '',
    checkInDate: '',
    checkInTime: '',
    checkOutDate: '',
    checkOutTime: '',
    locationFrom: '',
    locationTo: '',
    pickupLocation: '',
    servicePrice: '',
    guests: 1,
    status: 'pending' as 'pending' | 'confirmed' | 'active' | 'cancelled',
    serviceType: 'van' as 'van' | 'unique-stays' | 'activity',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (booking && isOpen) {
      const parseDateTime = (dateTimeStr: string) => {
        try {
          const [datePart, timePart] = (dateTimeStr || '').split(', ');
          const [day, month, year] = (datePart || '').split('/');
          const formattedDate = year && month && day ? `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}` : '';
          return { date: formattedDate, time: timePart || '' };
        } catch { return { date: '', time: '' }; }
      };
      const checkIn = parseDateTime(booking.checkIn || '');
      const checkOut = parseDateTime(booking.checkOut || '');
      const locationParts = booking.location?.split(' → ') || [''];
      setForm({
        serviceName: booking.serviceName || '',
        customerName: booking.clientName || '',
        email: booking.contactEmail || '',
        phone: booking.contactPhone || '',
        checkInDate: checkIn.date,
        checkInTime: checkIn.time,
        checkOutDate: checkOut.date,
        checkOutTime: checkOut.time,
        locationFrom: locationParts[0] || '',
        locationTo: locationParts[1] || '',
        pickupLocation: booking.pickupLocation || '',
        servicePrice: booking.servicePrice || '',
        guests: booking.guests || 1,
        status: booking.status || 'pending',
        serviceType: booking.serviceType || 'van',
      });
    }
  }, [booking, isOpen]);
  if (!isOpen || !booking) return null;
  const update = (k: string, v: any) => { setForm(prev => ({ ...prev, [k]: v })); if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' })); };
  const handleUpdateClick = async () => {
    const payload: Partial<BookingDetailDTO> = {
      clientName: form.customerName,
      serviceName: form.serviceName,
      servicePrice: form.servicePrice || '-',
      checkIn: `${form.checkInDate} ${form.checkInTime}`.trim(),
      checkOut: `${form.checkOutDate} ${form.checkOutTime}`.trim(),
      guests: form.guests || 1,
      status: form.status,
      location: `${form.locationFrom}${form.locationTo ? ` → ${form.locationTo}` : ''}`,
      contactEmail: form.email,
      contactPhone: form.phone,
      pickupLocation: form.pickupLocation,
      serviceType: form.serviceType,
    } as any;
    try { await onSubmit(booking.id, payload); onClose(); } catch {}
  };
  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-dashboard-heading dark:text-white font-geist">Edit Booking - {booking.id}</h2>
            <button onClick={onClose} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              <X size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white">Service Name</label>
              <input value={form.serviceName} onChange={(e)=>update('serviceName', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white">Customer Name</label>
              <input value={form.customerName} onChange={(e)=>update('customerName', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white">Check-in Date</label>
              <input type="date" value={form.checkInDate} onChange={(e)=>update('checkInDate', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white">Check-in Time</label>
              <input type="time" value={form.checkInTime} onChange={(e)=>update('checkInTime', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white">Check-out Date</label>
              <input type="date" value={form.checkOutDate} onChange={(e)=>update('checkOutDate', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white">Check-out Time</label>
              <input type="time" value={form.checkOutTime} onChange={(e)=>update('checkOutTime', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white">Number of Guests</label>
              <input type="text" min={1}  value={form.guests}   inputMode="numeric"
  onChange={(e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    update("guests", value);
  }}   placeholder="Enter guests" className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white">Status</label>
              <select value={form.status} onChange={(e)=>update('status', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-dashboard-text dark:text-white">Location</label>
            <input value={form.locationFrom} onChange={(e)=>update('locationFrom', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" />
          </div>
        </div>
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-6 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="px-6">Cancel</Button>
            <Button onClick={handleUpdateClick} disabled={loading} className="btn-primary rounded-full px-8 hover:scale-105 transition-transform">
              {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Updating...</>) : 'Update Booking'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Booking Modal (copied from Group version)
const CreateBookingModal = ({ isOpen, onClose, onSubmit, loading, availableServices }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<BookingDetailDTO>) => void;
  loading: boolean;
  availableServices: { name: string; type: string; vendorId?: string }[];
}) => {
  const [form, setForm] = useState({
    serviceName: '',
    customerName: '',
    email: '',
    phone: '',
    checkInDate: '',
    checkInTime: '',
    checkOutDate: '',
    checkOutTime: '',
    locationFrom: '',
    locationTo: '',
    pickupLocation: '',
    uploadedFile: null as File | null,
    servicePrice: "",
    guests: "",
    status: 'pending' as 'pending' | 'confirmed' | 'active' | 'cancelled',
    serviceType:  'van' as  'van' | 'unique-stays' | 'activity',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  if (!isOpen) return null;
  const update = (k: string, v: any) => {
    setForm(prev => {
      const newState = { ...prev, [k]: v };
      // Auto-update serviceType if serviceName is selected
      if (k === 'serviceName') {
        const selected = availableServices.find(s => s.name === v);
        if (selected) {
          newState.serviceType = selected.type as any;
        }
      }
      return newState;
    });
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }));
  };
  
  const locations = ['Jamshedpur','Delhi','Mumbai','Bangalore','Chennai','Kolkata','Hyderabad','Pune','Goa','Kerala'];
  const validateForm = () => {
    const newErrors: Record<string,string> = {};
    if (!form.serviceName.trim()) newErrors.serviceName = 'Service name is required';
    if (!form.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Please enter a valid email address';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[+]?[\d\s()-]{10,}$/.test(form.phone)) newErrors.phone = 'Please enter a valid phone number';
    if (!form.checkInDate) newErrors.checkInDate = 'Check-in date is required';
    if (!form.checkInTime) newErrors.checkInTime = 'Check-in time is required';
    if (!form.checkOutDate) newErrors.checkOutDate = 'Check-out date is required';
    if (!form.checkOutTime) newErrors.checkOutTime = 'Check-out time is required';
    if (!form.locationFrom.trim()) newErrors.locationFrom = 'Location from is required';
    if (form.checkInDate && form.checkOutDate) {
      const checkIn = new Date(form.checkInDate);
      const checkOut = new Date(form.checkOutDate);
      if (checkOut < checkIn) newErrors.checkOutDate = 'Check-out date must be after check-in date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleCreateClick = async () => {
    if (!validateForm()) return;
    
    const selectedService = availableServices.find(s => s.name === form.serviceName);

    const payload: Partial<BookingDetailDTO> = {
      clientName: form.customerName,
      serviceName: form.serviceName,
      servicePrice: form.servicePrice || '-',
      checkIn: `${form.checkInDate} ${form.checkInTime}`.trim(),
      checkOut: `${form.checkOutDate} ${form.checkOutTime}`.trim(),
      guests: form.guests || 1,
      status: form.status,
      location: `${form.locationFrom}${form.locationTo ? ` → ${form.locationTo}` : ''}`,
      contactEmail: form.email,
      contactPhone: form.phone,
      pickupLocation: form.pickupLocation,
      attachmentUrl: '',
      serviceType: form.serviceType,
      vendorId: selectedService?.vendorId,
    } as any;
    try {
      await onSubmit(payload);
      setShowSuccessAlert(true);
      setTimeout(() => { setShowSuccessAlert(false); onClose(); }, 1200);
    } catch (e) { /* no-op */ }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {showSuccessAlert && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                Booking created successfully!
              </AlertDescription>
            </Alert>
          </div>
        )}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-xl">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <X size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-2xl font-bold text-dashboard-heading dark:text-white font-geist">New Booking</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create a new booking with all the required details</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">
              Service Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'van', label: 'Van', icon: Car },
                { value: 'unique-stays', label: 'Unique Stays', icon: Home },
                { value: 'activity', label: 'Activity', icon: MapPin }
              ].map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" onClick={() => update('serviceType', value)} className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${form.serviceType === value ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500'}`}>
                  <Icon size={16} />{label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Service Name <span className="text-red-500">*</span></label>
            <select value={form.serviceName} onChange={e => update('serviceName', e.target.value)} className={`w-full h-12 rounded-lg border ${errors.serviceName ? 'border-red-500' : 'border-dashboard-stroke dark:border-gray-600'} bg-white dark:bg-gray-800 px-4`}>
              <option value="">Select a service</option>
              {availableServices.length === 0 && <option disabled>No services available</option>}
              {availableServices.map((s) => (<option key={s.name} value={s.name}>{s.name} ({s.type})</option>))}
            </select>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Customer Name <span className="text-red-500">*</span></label>
              <input value={form.customerName} onChange={e => update('customerName', e.target.value)} placeholder="Enter customer name" className={`w-full h-12 rounded-lg border ${errors.customerName ? 'border-red-500' : 'border-dashboard-stroke dark:border-gray-600'} bg-white dark:bg-gray-800 px-4`} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="customer@example.com" className={`w-full h-12 rounded-lg border ${errors.email ? 'border-red-500' : 'border-dashboard-stroke dark:border-gray-600'} bg-white dark:bg-gray-800 px-4`} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Phone <span className="text-red-500">*</span></label>
              <input type="text" value={form.phone}   onChange={(e) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // allow only numbers
    update("phone", value); 
  }} maxLength={12} placeholder="+91 98765 43210" className={`w-full h-12 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-dashboard-stroke dark:border-gray-600'} bg-white dark:bg-gray-800 px-4`} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Check-in Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.checkInDate} onChange={e => update('checkInDate', e.target.value)} className={`w-full h-12 rounded-lg border ${errors.checkInDate ? 'border-red-500' : 'border-dashboard-stroke dark:border-gray-600'} bg-white dark:bg-gray-800 px-4`} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Check-in Time <span className="text-red-500">*</span></label>
              <input type="time" value={form.checkInTime} onChange={e => update('checkInTime', e.target.value)} className={`w-full h-12 rounded-lg border ${errors.checkInTime ? 'border-red-500' : 'border-dashboard-stroke dark:border-gray-600'} bg-white dark:bg-gray-800 px-4`} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Check-out Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.checkOutDate} onChange={e => update('checkOutDate', e.target.value)} className={`w-full h-12 rounded-lg border ${errors.checkOutDate ? 'border-red-500' : 'border-dashboard-stroke dark:border-gray-600'} bg-white dark:bg-gray-800 px-4`} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Check-out Time <span className="text-red-500">*</span></label>
              <input type="time" value={form.checkOutTime} onChange={e => update('checkOutTime', e.target.value)} className={`w-full h-12 rounded-lg border ${errors.checkOutTime ? 'border-red-500' : 'border-dashboard-stroke dark:border-gray-600'} bg-white dark:bg-gray-800 px-4`} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Location From <span className="text-red-500">*</span></label>
              <select value={form.locationFrom} onChange={e => update('locationFrom', e.target.value)} className={`w-full h-12 rounded-lg border ${errors.locationFrom ? 'border-red-500' : 'border-dashboard-stroke dark:border-gray-600'} bg-white dark:bg-gray-800 px-4`}>
                <option value="">Select departure location</option>
                {locations.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Location To</label>
              <select value={form.locationTo} onChange={e => update('locationTo', e.target.value)} className="w-full h-12 rounded-lg border border-dashboard-stroke dark:border-gray-600 bg-white dark:bg-gray-800 px-4">
                <option value="">Select destination (optional)</option>
                {locations.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Pickup Location</label>
              <input value={form.pickupLocation} onChange={e => update('pickupLocation', e.target.value)} placeholder="Enter pickup address" className="w-full h-12 rounded-lg border border-dashboard-stroke dark:border-gray-600 bg-white dark:bg-gray-800 px-4" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Service Price</label>
              <input type="text" value={form.servicePrice}   inputMode="numeric"
   onChange={(e) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // allow only numbers
    update("servicePrice", value);
  }} placeholder="₹ 0.00" className="w-full h-12 rounded-lg border border-dashboard-stroke dark:border-gray-600 bg-white dark:bg-gray-800 px-4" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-dashboard-text dark:text-white font-geist">Number of Guests</label>
              <input type="text" min={1} value={form.guests}  onChange={(e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    update("guests", value);
  }} placeholder="0"   inputMode="numeric"
 className="w-full h-12 rounded-lg border border-dashboard-stroke dark:border-gray-600 bg-white dark:bg-gray-800 px-4" />
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-6 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="px-6">Cancel</Button>
            <Button onClick={handleCreateClick} disabled={loading} className="btn-primary rounded-full px-8 hover:scale-105 transition-transform">
              {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Creating...</>) : 'Create Booking'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookingDetails = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token') || undefined;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeServiceType, setActiveServiceType] = useState<'all' | 'van' | 'unique-stays' | 'activity'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);
  const [bookings, setBookings] = useState<BookingDetailDTO[]>([]);
  const [availableServices, setAvailableServices] = useState<{ name: string; type: string }[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const handleToggleCollapse = () => setIsCollapsed(!isCollapsed);

  // Filter bookings based on active tab, time filter, and service type
  const filteredBookings = bookings.filter(booking => {
    // Stricter filter by vendor if user is a vendor
    if (user?.userType === 'vendor') {
      // Check if it's their booking by email OR if it belongs to their services
      let isTheirEmail = false;
      if (user.email) {
          isTheirEmail = 
            (booking.createdForEmail && booking.createdForEmail === user.email) || 
            (booking.contactEmail && booking.contactEmail === user.email);
      }
        
      const serviceNames = availableServices.map(s => s.name);
      const isTheirService = serviceNames.includes(booking.serviceName);
      
      // Also check vendorId if available on booking
      const isTheirVendorId = (booking as any).vendorId === user.id || (booking.service && booking.service.vendorId === user.id);

      // If it doesn't match either, hide it
      if (!isTheirEmail && !isTheirService && !isTheirVendorId) {
        return false;
      }
    }

    // First filter by tab category
    const category = categorizeBooking(booking);
    if (category !== activeTab) return false;

    // Then filter by time range
    const checkInDate = parseBookingDate(booking.checkIn);
    if (!isDateInRange(checkInDate, timeFilter)) return false;

    // Finally filter by service type
    const serviceType = (booking as any).serviceType || 'van';
    if (activeServiceType !== 'all' && serviceType !== activeServiceType) return false;

    return true;
  });

  const handleBookingClick = async (booking: any) => {
    if (user?.userType === 'vendor') {
        const serviceNames = availableServices.map(s => s.name);
        const isTheirService = serviceNames.includes(booking.serviceName);
        const isTheirEmail = user.email && ((booking.createdForEmail === user.email) || (booking.contactEmail === user.email));
        const isTheirVendorId = (booking as any).vendorId === user.id;

        if (!isTheirService && !isTheirEmail && !isTheirVendorId) {
            toast.error("Unauthorized access to this booking");
            return;
        }
   }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300)); // simulate fetch
    setSelectedBooking(booking);
    setIsModalOpen(true);
    setIsLoading(false);
  };

  // Fetch bookings from API on mount
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const offerParams: Record<string, any> = {};
        if (user?.userType === 'vendor' && user?.id) {
          offerParams.vendorId = user.id;
          offerParams.mine = true;
        }
        const resOffers = await offersApi.list(undefined, token, offerParams);
        
        let activityData = [];
        if (token && user?.userType === 'vendor') {
           const myActivities = await activitiesApi.myList(token);
           if (myActivities.success) activityData = myActivities.data;
        } else {
           const allActivities = await activitiesApi.list();
           if (allActivities.success) activityData = allActivities.data;
        }

        const services: { name: string; type: string; vendorId?: string }[] = [];
        if (resOffers.success) {
          const offers = resOffers.data;
          // filtering is already done by API with { mine: true }
          
          services.push(...offers.map(o => ({ 
            name: o.name, 
            type: o.category?.toLowerCase() === 'stay' || o.category?.toLowerCase() === 'unique-stays' ? 'unique-stays' : 'van',
            vendorId: o.vendorId
          })));
        }
        
        if (activityData.length > 0) {
          services.push(...activityData.map((a: any) => ({ name: a.title, type: 'activity', vendorId: a.vendorId })));
        }
        
        setAvailableServices(services);
      } catch (e) {
        console.error("Failed to fetch resources", e);
      }
    };

    const load = async () => {
      try {
        setIsLoading(true);
        const params: Record<string, any> = { mine: true };
        if (user?.userType === 'vendor' && user?.email) {
          params.vendorEmail = user.email;
          if (user.id) params.vendorId = user.id;
        }
        const res = await bookingDetailsApi.list(token, params);
        let items = (res as any)?.data || [];
        // console.log('Fetched bookings:', items, res);
        setBookings(items);
      } catch (e: any) {
        console.error('Failed to load bookings', e);
        toast.error(e?.message || 'Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };
    if (user || token) {
      load();
      fetchResources();
    }
  }, [token, user]);

  const handleCreate = async (payload: Partial<BookingDetailDTO>) => {
    setCreating(true);
    try {
      const res = await bookingDetailsApi.create(payload, token);
      if ((res as any)?.success && (res as any).data) {
        setBookings(prev => [(res as any).data, ...prev]);
        toast.success('Booking created successfully!');
      } else {
        const fallback = { id: `NEW-${Date.now()}`, statusColor: 'bg-status-purple-bg text-status-purple-text', ...payload } as BookingDetailDTO;
        setBookings(prev => [fallback, ...prev]);
        toast.success('Booking created successfully!');
      }
      setIsCreateOpen(false);
    } catch (e: any) {
      const fallback = { id: `NEW-${Date.now()}`, statusColor: 'bg-status-purple-bg text-status-purple-text', ...payload } as BookingDetailDTO;
      setBookings(prev => [fallback, ...prev]);
      toast.error(e?.message || 'Failed to create booking');
      setIsCreateOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handlePrintInvoice = async (code: string) => {
    try {
      const res = await bookingDetailsApi.invoice(code, token);
      if (res?.success) {
        const data = (res as any).data.printData || (res as any).data.invoiceData || {};
        const win = window.open('', '_blank');
        if (!win) return toast.error('Popup blocked! Please allow popups for this site.');
        const logo = `${location.origin}/placeholder.svg`;
        const html = `
          <html>
            <head>
              <title>Invoice ${data.bookingId || code}</title>
              <style>
                body{font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;padding:40px;color:#333;line-height:1.6}
                .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:40px;border-bottom:3px solid #2563eb;padding-bottom:20px}
                .brand{display:flex;align-items:center;gap:15px}
                .brand img{height:50px}
                .company-info{text-align:right;color:#666}
                h1{font-size:28px;margin:0;color:#2563eb;font-weight:700}
                .invoice-info{background:#f8fafc;padding:20px;border-radius:8px;margin:20px 0}
                .invoice-details{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin:30px 0}
                .detail-section{background:white;padding:20px;border-radius:8px;border:1px solid #e2e8f0}
                .detail-title{font-weight:700;color:#1e293b;margin-bottom:10px;font-size:16px}
                table{width:100%;border-collapse:collapse;margin-top:20px;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
                th{background:#2563eb;color:white;padding:15px;text-align:left;font-weight:600}
                td{border:1px solid #e2e8f0;padding:15px;text-align:left}
                tr:nth-child(even){background:#f8fafc}
                .total-section{background:#2563eb;color:white;padding:20px;border-radius:8px;margin-top:30px;text-align:center}
                .footer{margin-top:40px;text-align:center;color:#666;font-size:14px;border-top:1px solid #e2e8f0;padding-top:20px}
                .status-badge{display:inline-block;padding:5px 15px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase}
                .status-pending{background:#fef3c7;color:#92400e}
                .status-confirmed{background:#ddd6fe;color:#5b21b6}
                .status-active{background:#d1fae5;color:#065f46}
                .status-cancelled{background:#fee2e2;color:#991b1b}
                @media print{body{padding:20px}}
              </style>
            </head>
            <body>
              <div class="header">
                <div class="brand">
                  <img src="${logo}" alt="Travel Homes Logo" />
                  <div>
                    <h1>Travel Homes</h1>
                    <div style="color:#666;font-size:14px">Your Travel Partner</div>
                  </div>
                </div>
                <div class="company-info">
                  <div><strong>Travel Homes Pvt. Ltd.</strong></div>
                  <div>Jamshedpur, Jharkhand, India</div>
                  <div>Phone: +91 98765 43210</div>
                  <div>Email: support@travelhomes.com</div>
                </div>
              </div>
              <div class="invoice-info">
                <h2 style="margin:0;color:#1e293b">INVOICE</h2>
                <div style="display:flex;justify-content:space-between;margin-top:10px">
                  <div>
                    <strong>Invoice #:</strong> ${data.invoiceNumber || `INV-${data.bookingId || code}`}<br/>
                    <strong>Booking ID:</strong> ${data.bookingId || code}
                  </div>
                  <div style="text-align:right">
                    <strong>Date:</strong> ${new Date(data.generatedAt || Date.now()).toLocaleDateString()}<br/>
                    <strong>Time:</strong> ${new Date(data.generatedAt || Date.now()).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div class="invoice-details">
                <div class="detail-section">
                  <div class="detail-title">Customer Information</div>
                  <div><strong>Name:</strong> ${data.clientName || ''}</div>
                  <div><strong>Email:</strong> ${data.contactEmail || 'N/A'}</div>
                  <div><strong>Phone:</strong> ${data.contactPhone || 'N/A'}</div>
                </div>
                <div class="detail-section">
                  <div class="detail-title">Booking Information</div>
                  <div><strong>Service:</strong> ${data.serviceName || ''}</div>
                  <div><strong>Status:</strong> <span class="status-badge status-${data.status}">${data.status}</span></div>
                  <div><strong>Guests:</strong> ${data.guests || ''}</div>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Service Details</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>${data.serviceName || ''}</strong><br/>
                      <small style="color:#666">${data.location || 'Location not specified'}</small>
                    </td>
                    <td>${data.checkIn || ''}</td>
                    <td>${data.checkOut || ''}</td>
                    <td><strong>${data.servicePrice || ''}</strong></td>
                  </tr>
                </tbody>
              </table>
              ${data.pickupLocation ? `<div class="detail-section" style="margin-top:20px"><div class="detail-title">Additional Information</div><div><strong>Pickup Location:</strong> ${data.pickupLocation}</div></div>` : ''}
              <div class="total-section">
                <h3 style="margin:0">Total Amount: ${data.servicePrice || '-'}</h3>
                <div style="margin-top:10px;font-size:14px">All prices are inclusive of applicable taxes</div>
              </div>
              <div class="footer">
                <p><strong>Thank you for choosing Travel Homes!</strong></p>
                <p>For any queries, please contact us at support@travelhomes.com or +91 98765 43210</p>
                <p style="margin-top:20px;font-size:12px">This is a computer-generated invoice and does not require a signature.</p>
              </div>
              <script>
                window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); } }
              </script>
            </body>
          </html>`;
        win.document.write(html);
        win.document.close();
        toast.success('Invoice generated successfully!');
      } else {
        toast.error('Failed to generate invoice');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to generate invoice');
    }
  };

  const handleEdit = (booking: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBooking(booking);
    setIsEditOpen(true);
  };

  const handleUpdate = async (id: string, payload: Partial<BookingDetailDTO>) => {
    setUpdating(true);
    // Use _id if available on the editingBooking
    const updateId = editingBooking?._id || id;
    try {
      const res = await bookingDetailsApi.update(updateId, payload, token);
      if ((res as any)?.success && (res as any).data) {
        setBookings(prev => prev.map(b => (b._id === updateId || b.id === id) ? { ...b, ...(res as any).data } : b));
        toast.success('Booking updated successfully!');
        setIsEditOpen(false);
        setEditingBooking(null);
      } else {
        toast.error('Failed to update booking');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update booking');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (booking: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete booking ${booking.id}?`)) {
      try {
        const deleteId = booking._id || booking.id;
        const res = await bookingDetailsApi.remove(deleteId, token);
        if ((res as any)?.success) {
          setBookings(prev => prev.filter(b => b._id !== deleteId && b.id !== booking.id));
          toast.success('Booking deleted successfully!');
        } else {
          toast.error('Failed to delete booking');
        }
      } catch (e: any) {
        toast.error(e?.message || 'Failed to delete booking');
      }
    }
  };

  const handleCancel = async (booking: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (!booking?.id) {
      toast.error("Invalid booking ID");
      return;
    }

    if (window.confirm(`Are you sure you want to cancel booking ${booking.id}?`)) {
      try {
        // Only send the status update to the backend
        const payload: Partial<BookingDetailDTO> = { 
          status: 'cancelled'
        };
        
        const updateId = booking._id || booking.id;
        const res = await bookingDetailsApi.update(updateId, payload, token);
        
        if ((res as any)?.success) {
          setBookings(prev => prev.map(b => 
            (b._id === booking._id || b.id === booking.id) 
              ? { ...b, status: 'cancelled', statusColor: 'bg-status-red-bg text-status-red-text' } 
              : b
          ));
          toast.success('Booking cancelled successfully!');
        } else {
          toast.error((res as any)?.message || 'Failed to cancel booking');
        }
      } catch (err: any) {
        console.error('Cancel Error:', err);
        toast.error(err?.message || 'Failed to cancel booking');
      }
    }
  };

  return (
    <div className="flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader Headtitle={"Bookings Deatils"} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-white dark:bg-gray-800 m-2 lg:m-5 rounded-2xl lg:rounded-3xl">
          {/* Tabs and CTA */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-8 gap-4 border-b pb-4 lg:pb-6 border-dashboard-stroke dark:border-gray-700">
            <div className="flex gap-2 lg:gap-6 overflow-x-auto scrollbar-hide w-full lg:w-auto">
              {[
                { key: "upcoming", label: "Upcoming Bookings" },
                { key: "past", label: "Past Bookings" },
                { key: "cancelled", label: "Cancelled Bookings" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`pb-3 px-3 font-bold text-sm sm:text-sm lg:text-lg relative whitespace-nowrap transition-colors ${
                    activeTab === key
                      ? "text-dashboard-primary dark:text-white border-b-2 border-dashboard-primary"
                      : "text-gray-400 hover:text-dashboard-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="w-full lg:w-auto">
              <Button
                disabled={isCreating}
                onClick={() => setIsCreateOpen(true)}
                className="btn-primary w-full lg:w-auto hover:scale-105 rounded-full px-4 lg:px-6 group"
              >
                {isCreating ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <Plus
                    className="mr-2 group-hover:rotate-90 transition-transform duration-300"
                    size={18}
                  />
                )}
                New Booking
              </Button>
            </div>
          </div>

          {/* Filters */}
     
           <div className="mb-6 space-y-4">
            {/* Time Filter */}
              <div className="flex justify-between">
            <div className="flex flex-wrap gap-3">
              {/* <span className="text-sm font-medium text-dashboard-text dark:text-white">Time Filter:</span> */}
              {[
                { key: 'all', label: 'All Time' },
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' }
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={timeFilter === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFilter(key as 'all' | 'today' | 'week' | 'month')}
                  className={`rounded-full ${timeFilter === key ? 'btn-primary' : 'border-dashboard-stroke dark:border-gray-600'}`}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Service Type Filter */}
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'all', label: 'All Services', icon: MapPin },
                // { key: 'van', label: 'Camper Van', icon: Car },
                // { key: 'unique-stays', label: 'Unique Stays', icon: Home },
                // { key: 'activity', label: 'Activity', icon: MapPin }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={activeServiceType === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveServiceType(key as any)}
                  className={`rounded-full flex items-center gap-2 ${activeServiceType === key ? 'btn-primary' : 'border-dashboard-stroke dark:border-gray-600'}`}
                >
                  {Icon && <Icon size={16} />}
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Booking Table */}
          <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
            <div className="overflow-x-auto scrollbar-hide">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700 border-b border-dashboard-stroke dark:border-gray-600">
                    {[
                      "Booking ID",
                      "Client Name",
                      "Service Name",
                      "Check In",
                      "Check Out",
                      "No. of Guest",
                      "Action",
                    ].map((title, i) => (
                      <TableHead
                        key={i}
                        className="h-12 px-4 text-left font-bold text-sm text-dashboard-title dark:text-white font-plus-jakarta"
                      >
                        {["Check In", "Check Out"].includes(title) ? (
                          <div className="flex items-center gap-2">
                            {title}
                            <ArrowUpDown size={16} />
                          </div>
                        ) : (
                          title
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
     <div className="flex w-full items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dashboard-primary"></div>
                <span className="ml-2 ">Loading bookings...</span>
              </div>
            )}
                    {!isLoading && filteredBookings.length === 0 && (
                      <div className="flex w-full items-center justify-center h-64">
                        <div className="text-center">
                          <MapPinOff size={48} className="mx-auto mb-4 text-gray-400" />  
                          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No bookings found</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or create a new booking.</p>
                        </div>
                      </div>
                    )}
             {
                  filteredBookings.map((booking, index) => (
                    <TableRow
                      key={booking.id ?? index}
                      onClick={() => handleBookingClick(booking)}
                      onMouseEnter={() => setHoveredRow(index)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`transition-all duration-200 cursor-pointer ${
                        hoveredRow === index
                          ? "shadow-md bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      } ${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-800/50"}`}
                    >
                      <TableCell className="px-4">
                        <div
                          className={`font-bold text-sm font-plus-jakarta ${
                            hoveredRow === index
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-dashboard-primary dark:text-white"
                          }`}
                        >
                          {booking.id}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 text-sm text-dashboard-body dark:text-gray-300">
                        {booking.clientName}
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge
                          className={`${booking.statusColor} border-0 text-sm px-3 py-1 rounded-lg transition-transform ${
                            hoveredRow === index ? "scale-110" : ""
                          }`}
                        >
                          {booking.serviceName}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 text-sm text-dashboard-body dark:text-gray-300">
                   {formatDate(booking.checkIn)}
                      </TableCell>
                      <TableCell className="px-4 text-sm text-dashboard-body dark:text-gray-300">
                        {formatDate(booking.checkOut)}
                      </TableCell>
                      <TableCell className="px-4 text-sm text-dashboard-body dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Users size={18} />
                          {booking.guests}
                        </div>
                      </TableCell>
                    <TableCell className="px-4 text-sm text-dashboard-body dark:text-gray-300">
  <DropdownMenu>
    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end">

      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(booking, e); }}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>

      {booking.status !== 'cancelled' && (
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCancel(booking, e); }}>
          <Ban className="mr-2 h-4 w-4" />
          Cancel
        </DropdownMenuItem>
      )}

      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePrintInvoice(booking.id); }}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </DropdownMenuItem>

      <DropdownMenuItem 
        className="text-red-600 focus:text-red-600"
        onClick={(e) => { e.stopPropagation(); handleDelete(booking, e); }}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>

    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
       </div>
        </main>
      </div>

      {/* Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isLoading={isLoading}
      />

      {/* Create Booking Modal */}
      <CreateBookingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        loading={creating}
        availableServices={availableServices}
      />

      {/* Edit Booking Modal */}
      <EditBookingModal
        booking={editingBooking}
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingBooking(null); }}
        onSubmit={handleUpdate}
        loading={updating}
      />

      <div className="fixed top-0 right-0">
        <MobileVendorNav />
      </div>

      {/* Toast Notifications */}
    
    </div>
  );
};

export default BookingDetails;
