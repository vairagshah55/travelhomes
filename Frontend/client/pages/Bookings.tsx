import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast, { Toaster } from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Bell,
  Plus,
  Menu,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Printer,
  Save,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Clock,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "@/components/Navigation";
import ProfileDropdown from "@/components/ProfileDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardHeader } from "@/components/Header";
import { offersApi, activitiesApi } from "@/lib/api";


// Types for our calendar data
interface BookingData {
  _id: string;
  bookingId: string;
  guestName: string;
  resourceName: string;
  startDate: Date;
  endDate: Date;
  totalDays: string;
  color: string;
  phoneNumber?: string;
  email?: string;
  adults: string;
  children: string;
  totalGuests: string;
  basePrice: string;
  extraCharges: string;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  paymentMethod: string;
  paymentStatus: string;
  status: 'Confirmed' | 'Checked-in' | 'Checked-out' | 'Cancelled';
  notes?: string;
  specialRequests?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  vendorId?: string;
  service?: { vendorId?: string };
  resource?: { vendorId?: string };
}

interface CalendarDate {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
}

interface NewBookingForm {
  guestName: string;
  resourceName: string;
  startDate: string;
  endDate: string;
  phoneNumber: string;
  email: string;
  adults: string;
  children: string;
  basePrice: string;
  extraCharges: string;
  paymentMethod: string;
  notes: string;
  specialRequests: string;
}

// API Base URL
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

// API Functions
const fetchBookings = async (month: number, year: number, token?: string, vendorId?: string, vendorEmail?: string): Promise<BookingData[]> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const qs = new URLSearchParams();
    qs.append('month', (month + 1).toString());
    qs.append('year', year.toString());
    if (vendorId) qs.append('vendorId', vendorId);
    if (vendorEmail) qs.append('vendorEmail', vendorEmail);
    
    const response = await fetch(`${API_BASE_URL}/calendarbooking?${qs.toString()}`, {
      headers
    });
    const data = await response.json();
    
    if (data.success) {
      return data.data.map((booking: any) => ({
        ...booking,
        startDate: new Date(booking.startDate),
        endDate: new Date(booking.endDate),
        createdAt: new Date(booking.createdAt),
        updatedAt: new Date(booking.updatedAt),
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

const createBooking = async (bookingData: NewBookingForm, token?: string, userEmail?: string): Promise<BookingData | null> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/calendarbooking`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...bookingData,
        totalAmount: bookingData.basePrice + bookingData.extraCharges,
        createdBy: userEmail || 'admin'
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        ...data.data,
        startDate: new Date(data.data.startDate),
        endDate: new Date(data.data.endDate),
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };
    }
    return null;
  } catch (error) {
    console.error('Error creating booking:', error);
    return null;
  }
};

const updateBooking = async (id: string, bookingData: Partial<BookingData>, token?: string): Promise<BookingData | null> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/calendarbooking/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(bookingData),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        ...data.data,
        startDate: new Date(data.data.startDate),
        endDate: new Date(data.data.endDate),
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };
    }
    return null;
  } catch (error) {
    console.error('Error updating booking:', error);
    return null;
  }
};

const updateBookingDates = async (id: string, startDate: Date, endDate: Date, action: string, token?: string): Promise<BookingData | null> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/calendarbooking/${id}/dates`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        action
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        ...data.data,
        startDate: new Date(data.data.startDate),
        endDate: new Date(data.data.endDate),
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };
    }
    return null;
  } catch (error) {
    console.error('Error updating booking dates:', error);
    return null;
  }
};

const deleteBooking = async (id: string, token?: string): Promise<boolean> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/calendarbooking/${id}`, {
      method: 'DELETE',
      headers
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error deleting booking:', error);
    return false;
  }
};

const generateInvoiceData = async (id: string, token?: string): Promise<any> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/calendarbooking/${id}/invoice`, {
      headers
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate invoice');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};

const printInvoice = async (booking: BookingData, token?: string) => {
  try {
    // Get fresh invoice data from server
    const invoiceData = await generateInvoiceData(booking._id, token);
    
    // Create invoice content
    const invoiceContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="text-align: center; color: #333;">INVOICE</h1>
        <div style="border-bottom: 2px solid #333; margin-bottom: 20px;"></div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h3>Travel Homes</h3>
            <p>Booking Management System</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Invoice Date:</strong> ${new Date(invoiceData.generatedAt).toLocaleDateString()}</p>
            <p><strong>Booking ID:</strong> ${invoiceData.bookingId}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3>Guest Details</h3>
          <p><strong>Name:</strong> ${invoiceData.guestName}</p>
          <p><strong>Phone:</strong> ${invoiceData.phoneNumber || 'N/A'}</p>
          <p><strong>Email:</strong> ${invoiceData.email || 'N/A'}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3>Booking Details</h3>
          <p><strong>Service:</strong> ${invoiceData.resourceName}</p>
          <p><strong>Check-in:</strong> ${new Date(invoiceData.startDate).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> ${new Date(invoiceData.endDate).toLocaleDateString()}</p>
          <p><strong>Duration:</strong> ${invoiceData.totalDays} days</p>
          <p><strong>Guests:</strong> ${invoiceData.adults} Adults, ${invoiceData.children} Children</p>
          <p><strong>Status:</strong> ${invoiceData.status}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Description</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">Base Price (${invoiceData.totalDays} days)</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${invoiceData.basePrice.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">Extra Charges</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${invoiceData.extraCharges.toLocaleString()}</td>
            </tr>
            <tr style="background-color: #f5f5f5; font-weight: bold;">
              <td style="border: 1px solid #ddd; padding: 12px;">Total Amount</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${invoiceData.totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">Paid Amount</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${invoiceData.paidAmount.toLocaleString()}</td>
            </tr>
            <tr style="color: ${invoiceData.pendingAmount > 0 ? 'red' : 'green'};">
              <td style="border: 1px solid #ddd; padding: 12px;">Pending Amount</td>
              <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">₹${invoiceData.pendingAmount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-bottom: 30px;">
          <p><strong>Payment Method:</strong> ${invoiceData.paymentMethod}</p>
          <p><strong>Payment Status:</strong> ${invoiceData.paymentStatus}</p>
        </div>

        ${invoiceData.notes ? `<div style="margin-bottom: 20px;"><h4>Notes:</h4><p>${invoiceData.notes}</p></div>` : ''}
        ${invoiceData.specialRequests ? `<div style="margin-bottom: 20px;"><h4>Special Requests:</h4><p>${invoiceData.specialRequests}</p></div>` : ''}

        <div style="text-align: center; margin-top: 50px; font-size: 12px; color: #666;">
          <p>Thank you for choosing Travel Homes!</p>
          <p>Generated on ${new Date(invoiceData.generatedAt).toLocaleString()}</p>
        </div>
      </div>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${invoiceData.bookingId}</title>
            <style>
              @media print {
                body { margin: 0; }
                @page { margin: 1cm; }
              }
            </style>
          </head>
          <body>
            ${invoiceContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  } catch (error) {
    console.error('Error printing invoice:', error);
    toast.error('Failed to generate invoice. Please try again.', {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: '#fff',
        fontWeight: '500',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
    });
  }
};

// Vehicle list
// const vehicleNames = []; // Dynamic now


// Month names
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Calendar utility functions
const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (month: number, year: number): number => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}/${month}`;
};

const formatDateRange = (startDate: Date, endDate: Date): string => {
  if (startDate.getTime() === endDate.getTime()) {
    return formatDate(startDate);
  }
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

// Get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Checked-in': return 'bg-green-100 text-green-800 border-green-200';
    case 'Checked-out': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

// Get booking color class
const getBookingColorClass = (status: string): string => {
  switch (status) {
    case 'Confirmed': return 'bg-blue-200 hover:bg-blue-300 border-blue-300';
    case 'Checked-in': return 'bg-green-200 hover:bg-green-300 border-green-300';
    case 'Checked-out': return 'bg-gray-200 hover:bg-gray-300 border-gray-300';
    case 'Cancelled': return 'bg-red-200 hover:bg-red-300 border-red-300';
    default: return 'bg-blue-200 hover:bg-blue-300 border-blue-300';
  }
};

// Check if date is booked
const isDateBooked = (date: number, month: number, year: number, bookings: BookingData[], resourceName: string): boolean => {
  const checkDate = new Date(year, month, date);
  checkDate.setHours(0, 0, 0, 0);

  return bookings.some(booking => {
    if (booking.resourceName !== resourceName || booking.status === 'Cancelled') return false;
    
    const startDate = new Date(booking.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(booking.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    return checkDate >= startDate && checkDate <= endDate;
  });
};



// Booking Block Component
const BookingBlock = ({
  booking,
  startCol,
  span,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  booking: BookingData;
  startCol: number;
  span: number;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}) => {
  const colorClass = getBookingColorClass(booking.status);

  return (
    <div
      className={`${colorClass} rounded-lg m-1 pointer-events-auto cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center px-3 group min-h-[44px] z-10 motion-calendar-booking`}
      style={{
        width: `${span * 60 - 8}px`,
      }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="flex items-center justify-between w-full text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800 truncate">
            {booking.guestName}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)} ${booking.status === 'Confirmed' ? 'motion-badge-confirmed' : String(booking.status).toLowerCase() === 'pending' ? 'motion-badge-pending' : ''}`}>
            {booking.status}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600 flex-shrink-0">
          <Calendar size={12} className="group-hover:rotate-12 transition-transform" />
          <span className="whitespace-nowrap">
            {formatDateRange(booking.startDate, booking.endDate)}
          </span>
        </div>
      </div>
      
      {/* Resize handles */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize bg-transparent hover:bg-black/20 rounded-l-lg"
        onMouseDown={(e) => e.stopPropagation()}
      />
      <div 
        className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize bg-transparent hover:bg-black/20 rounded-r-lg"
        onMouseDown={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// Calendar Grid Component
const CalendarGrid = ({
  currentMonth,
  currentYear,
  bookings,
  onBookingClick,
  onBookingDrag,
  onDateClick,
  selectedDate,
  vehicleNames,
}: {
  currentMonth: number;
  currentYear: number;
  bookings: BookingData[];
  onBookingClick: (booking: BookingData) => void;
  onBookingDrag: (bookingId: string, newStartDate: Date, newEndDate: Date) => void;
  onDateClick: (date: number, resourceName: string) => void;
  selectedDate: {date: number, resource: string} | null;
  vehicleNames: string[];
}) => {
  const [draggedBooking, setDraggedBooking] = useState<BookingData | null>(null);
  const [dragOverDate, setDragOverDate] = useState<{date: number, resource: string} | null>(null);

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const days = Array.from(
    { length: Math.min(daysInMonth, 30) },
    (_, i) => i + 1,
  );

  // Filter bookings for current month and calculate positions
  const monthlyBookings = bookings.filter((booking) => {
    const bookingStartMonth = booking.startDate.getMonth();
    const bookingStartYear = booking.startDate.getFullYear();
    const bookingEndMonth = booking.endDate.getMonth();
    const bookingEndYear = booking.endDate.getFullYear();
    
    // Show booking if it starts, ends, or spans through current month
    return (
      (bookingStartMonth === currentMonth && bookingStartYear === currentYear) ||
      (bookingEndMonth === currentMonth && bookingEndYear === currentYear) ||
      (bookingStartYear < currentYear || (bookingStartYear === currentYear && bookingStartMonth < currentMonth)) &&
      (bookingEndYear > currentYear || (bookingEndYear === currentYear && bookingEndMonth > currentMonth))
    );
  });

  const getBookingPosition = (booking: BookingData, vehicleIndex: number) => {
    // Only show bookings that belong to current month
    const bookingStartMonth = booking.startDate.getMonth();
    const bookingStartYear = booking.startDate.getFullYear();
    const bookingEndMonth = booking.endDate.getMonth();
    const bookingEndYear = booking.endDate.getFullYear();
    
    // Calculate start and end days for current month only
    let startDay = 1;
    let endDay = daysInMonth;
    
    // If booking starts in current month
    if (bookingStartMonth === currentMonth && bookingStartYear === currentYear) {
      startDay = booking.startDate.getDate();
    }
    
    // If booking ends in current month  
    if (bookingEndMonth === currentMonth && bookingEndYear === currentYear) {
      endDay = booking.endDate.getDate();
    }
    
    // Ensure boundaries
    startDay = Math.max(1, Math.min(startDay, daysInMonth));
    endDay = Math.max(1, Math.min(endDay, daysInMonth));
    
    const span = Math.max(1, endDay - startDay + 1);
    const startCol = startDay;

    return {
      vehicleIndex,
      startCol,
      span,
      top: vehicleIndex * 60 + 8,
      left: (startCol - 1) * 60 + 300,
    };
  };

  const handleDragStart = (booking: BookingData) => (e: React.DragEvent) => {
    setDraggedBooking(booking);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedBooking(null);
    setDragOverDate(null);
  };

  const handleDragOver = (date: number, resourceName: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate({date, resource: resourceName});
  };

  const handleDrop = (date: number, resourceName: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedBooking) return;

    const originalDays = Number(draggedBooking.totalDays || 1);
    const newStartDate = new Date(currentYear, currentMonth, date);
    const newEndDate = new Date(currentYear, currentMonth, date + originalDays - 1);

    onBookingDrag(draggedBooking._id, newStartDate, newEndDate);
    setDraggedBooking(null);
    setDragOverDate(null);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-x-auto overflow-y-hidden shadow-sm hover:shadow-md transition-shadow motion-calendar-shell">
      {/* Header Row */}
      <div className="flex bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 min-w-max">
        <div className="p-4 font-medium text-dashboard-primary dark:text-white border-r border-gray-200 dark:border-gray-600 w-[300px] flex-shrink-0">
          Service Name
        </div>
        {days.map((day) => (
          <div
            key={day}
            className="p-4 text-center font-medium text-dashboard-primary dark:text-white border-r border-gray-200 dark:border-gray-600 w-[60px] flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            {day.toString().padStart(2, "0")}
          </div>
        ))}
      </div>

      {/* Body Rows with overlays */}
      <div className="relative">
        {vehicleNames.map((vehicle, vehicleIndex) => (
          <div
            key={vehicleIndex}
            className={`flex ${vehicleIndex % 2 === 1 ? "bg-gray-50 dark:bg-gray-700/50" : "bg-white dark:bg-gray-800"} border-b border-gray-200 dark:border-gray-600 h-[60px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group min-w-max`}
          >
            <div className="text-[13px] p-4 font-medium text-dashboard-body dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 w-[300px] flex-shrink-0 flex items-center group-hover:text-dashboard-primary dark:group-hover:text-white transition-colors">
              {vehicle}
            </div>
            {days.map((day) => {
              const isBooked = isDateBooked(day, currentMonth, currentYear, bookings, vehicle);
              const isDragOver = dragOverDate?.date === day && dragOverDate?.resource === vehicle;
              
              const currentBooking = isBooked ? bookings.find(b => {
                const bookingDate = new Date(currentYear, currentMonth, day);
                bookingDate.setHours(0,0,0,0);
                const startDate = new Date(b.startDate);
                startDate.setHours(0,0,0,0);
                const endDate = new Date(b.endDate);
                endDate.setHours(0,0,0,0);
                return b.resourceName === vehicle && 
                       bookingDate >= startDate && 
                       bookingDate <= endDate &&
                       b.status !== 'Cancelled';
              }) : null;
              
              return (
                <div
                  key={day}
                  data-selected={selectedDate?.date === day && selectedDate?.resource === vehicle ? "true" : "false"}
                  data-booked={isBooked ? "true" : "false"}
                  className={`p-4 text-center border-r border-gray-200 dark:border-gray-600 w-[60px] flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer group relative
                    ${isBooked 
                      ? 'bg-red-50 text-red-800 hover:bg-red-100' 
                      : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                    ${isDragOver ? 'bg-blue-200 border-blue-400' : ''}
                  } motion-calendar-date`}
                  onClick={() => {
                    if (currentBooking) {
                      onBookingClick(currentBooking);
                    } else {
                      onDateClick(day, vehicle);
                    }
                  }}
                  onDragOver={handleDragOver(day, vehicle)}
                  onDrop={handleDrop(day, vehicle)}
                >
                  <span className={`text-xs transition-colors z-10 ${
                    isBooked 
                      ? 'font-semibold text-[8px] leading-tight break-words' 
                      : 'group-hover:text-dashboard-primary dark:group-hover:text-white'
                  }`}>
                    {isBooked ? currentBooking?.guestName : day.toString().padStart(2, "0")}
                  </span>
                  {isBooked && (
                    <div className="absolute inset-0 bg-red-200/30 rounded-sm" />
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Booking Overlays */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {monthlyBookings.map((booking) => {
            const vehicleIndex = vehicleNames.findIndex(
              (name) => name === booking.resourceName,
            );
            if (vehicleIndex === -1) return null;

            const position = getBookingPosition(booking, vehicleIndex);
            
            // Don't render if position is outside calendar bounds
            if (position.startCol < 1 || position.startCol > daysInMonth) return null;

            return (
              <div
                key={booking._id}
                className="absolute pointer-events-auto"
                style={{
                  top: `${position.top}px`,
                  left: `${position.left}px`,
                  zIndex: 10,
                }}
              >
                <BookingBlock
                  booking={booking}
                  startCol={position.startCol}
                  span={position.span}
                  onClick={() => onBookingClick(booking)}
                  onDragStart={handleDragStart(booking)}
                  onDragEnd={handleDragEnd}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Date Navigation Component
const DateNavigation = ({
  currentMonth,
  currentYear,
  onMonthChange,
  onYearChange,
}: {
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}) => {
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(11);
      onYearChange(currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(0);
      onYearChange(currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevMonth}
        className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <ChevronLeft size={16} />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="text-lg lg:text-xl font-bold text-dashboard-title font-plus-jakarta">
              {monthNames[currentMonth]}, {currentYear}
            </span>
            <ChevronDown size={20} className="text-dashboard-title" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="p-2">
            <div className="mb-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                Month
              </label>
              <div className="grid grid-cols-3 gap-1">
                {monthNames.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => onMonthChange(index)}
                    className={`p-2 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      index === currentMonth
                        ? "bg-dashboard-primary text-white"
                        : "text-dashboard-body dark:text-gray-300"
                    }`}
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                Year
              </label>
              <div className="grid grid-cols-2 gap-1">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => onYearChange(year)}
                    className={`p-2 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      year === currentYear
                        ? "bg-dashboard-primary text-white"
                        : "text-dashboard-body dark:text-gray-300"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextMonth}
        className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
};

const Bookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token') || undefined;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [vehicleNames, setVehicleNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        // Filter offers by vendor if user is a vendor
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

        const names: string[] = [];
        if (resOffers.success) {
          // Additional frontend filter to be sure
          let offers = resOffers.data;
          if (user?.userType === 'vendor' && user?.id) {
            offers = offers.filter(o => o.vendorId === user.id);
          }
          names.push(...offers.map((o) => o.name));
        }
        
        if (activityData.length > 0) {
          names.push(...activityData.map((a: any) => a.title));
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
        
        setVehicleNames(services.length > 0 ? services.map(s => s.name) : ["No Service Available"]);

        // setVehicleNames(names.length > 0 ? names : ["Default Service"]);
      } catch (e) {
        console.error("Failed to fetch resources", e);
      }
    };
    if (user) {
      fetchResources();
    }
  }, [token, user]);


  // Modal states
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [selectedDate, setSelectedDate] = useState<{date: number, resource: string} | null>(null);

  // Form state
  const [newBookingForm, setNewBookingForm] = useState<NewBookingForm>({
    guestName: '',
    resourceName: '',
    startDate: '',
    endDate: '',
    phoneNumber: '',
    email: '',
    adults: "",
    children: "",
    basePrice: "",
    extraCharges: "",
    paymentMethod: 'cash',
    notes: '',
    specialRequests: ''
  });

  // Load bookings when month/year changes
  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [currentMonth, currentYear, user, token]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const isVendor = user?.userType === 'vendor';
      let data = await fetchBookings(
        currentMonth, 
        currentYear, 
        token, 
        isVendor ? user?.id : undefined,
        isVendor ? user?.email : undefined
      );

      // Frontend filtering removed as backend now handles it correctly
      setBookings(data);

      // Add any missing resource names from bookings to the display list
      if (data.length > 0) {
        const bookedResources = Array.from(new Set(data.map(b => b.resourceName)));
        setVehicleNames(prev => {
          const combined = Array.from(new Set([...prev, ...bookedResources]));
          // Remove "Default Service" if we have real services
          const filtered = combined.filter(name => name !== "Default Service" || combined.length === 1);
          return filtered.length > 0 ? filtered : ["Default Service"];
        });
      }
    } catch (error) {
      showAlertMessage("error", "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const showAlertMessage = (type: "success" | "warning" | "error", message: string) => {
    switch (type) {
      case "success":
        toast.success(message, {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
            fontWeight: '500',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10B981',
          },
        });
        break;
      case "warning":
        toast(message, {
          duration: 4000,
          position: 'top-right',
          icon: '⚠️',
          style: {
            background: '#F59E0B',
            color: '#fff',
            fontWeight: '500',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)',
          },
        });
        break;
      case "error":
        toast.error(message, {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
            fontWeight: '500',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#EF4444',
          },
        });
        break;
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNewBooking = () => {
    if (selectedDate) {
      const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${selectedDate.date.toString().padStart(2, '0')}`;
      setNewBookingForm(prev => ({
        ...prev,
        resourceName: selectedDate.resource,
        startDate: dateStr,
        endDate: dateStr
      }));
    }
    setIsNewBookingModalOpen(true);
  };

  const handleBookingClick = (booking: BookingData) => {
    setSelectedBooking(booking);
    setIsEditBookingModalOpen(true);
  };

  const handleDateClick = (date: number, resourceName: string) => {
    const selectedDateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
    
    setSelectedDate({date, resource: resourceName});
    setNewBookingForm(prev => ({
      ...prev,
      resourceName: resourceName,
      startDate: selectedDateStr,
      endDate: selectedDateStr, // Same date for single day booking
    }));
    setIsNewBookingModalOpen(true);
  };

  const handleBookingDrag = async (bookingId: string, newStartDate: Date, newEndDate: Date) => {
    try {
      const updatedBooking = await updateBookingDates(bookingId, newStartDate, newEndDate, 'move', token);
      if (updatedBooking) {
        setBookings(prev => prev.map(b => b._id === bookingId ? updatedBooking : b));
        showAlertMessage("success", "Booking moved successfully");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to move booking";
      showAlertMessage("error", errorMessage);
    }
  };

  const handleCreateBooking = async () => {
    try {
      // Validate required fields
      if (!newBookingForm.guestName || !newBookingForm.resourceName || !newBookingForm.startDate || !newBookingForm.endDate) {
        showAlertMessage("error", "Please fill all required fields");
        return;
      }

      // Validate dates
      const startDate = new Date(newBookingForm.startDate);
      const endDate = new Date(newBookingForm.endDate);
      
      if (startDate > endDate) {
        showAlertMessage("error", "End date must be after or same as start date");
        return;
      }

      const newBooking = await createBooking(newBookingForm, token, user?.email);
      if (newBooking) {
        // Update bookings list to show color immediately
        setBookings(prev => [...prev, newBooking]);
        
        // Close modal and reset form
        setIsNewBookingModalOpen(false);
        setNewBookingForm({
          guestName: '',
          resourceName: '',
          startDate: '',
          endDate: '',
          phoneNumber: '',
          email: '',
          adults: "",
          children: "",
          basePrice: "",
          extraCharges: "",
          paymentMethod: 'cash',
          notes: '',
          specialRequests: ''
        });
        setSelectedDate(null);
        
        // Show success message
        showAlertMessage("success", "Booking created successfully");
        
        // Auto print invoice after successful booking creation
        setTimeout(() => {
          printInvoice(newBooking, token);
        }, 500);
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create booking";
      showAlertMessage("error", errorMessage);
    }
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      // Calculate total amount if base price or extra charges changed
      const baseAmount = Number(selectedBooking.basePrice || 0);
      const extraAmount = Number(selectedBooking.extraCharges || 0);
      const paidAmount = Number(selectedBooking.paidAmount || 0);
      const totalAmount = baseAmount + extraAmount;

      const updatedBookingData = {
        ...selectedBooking,
        totalAmount: String(totalAmount),
        pendingAmount: String(totalAmount - paidAmount)
      };
      
      const updatedBooking = await updateBooking(selectedBooking._id, updatedBookingData, token);
      if (updatedBooking) {
        // Update bookings list immediately
        setBookings(prev => prev.map(b => b._id === selectedBooking._id ? updatedBooking : b));
        
        // Close modal and clear selection
        setIsEditBookingModalOpen(false);
        setSelectedBooking(null);
        
        // Show success message
        showAlertMessage("success", "Booking updated successfully");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update booking";
      showAlertMessage("error", errorMessage);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    
    try {
      const success = await deleteBooking(bookingId, token);
      if (success) {
        setBookings(prev => prev.filter(b => b._id !== bookingId));
        setIsEditBookingModalOpen(false);
        setSelectedBooking(null);
        showAlertMessage("success", "Booking deleted successfully");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete booking";
      showAlertMessage("error", errorMessage);
    }
  };

  const handleSwitchToUser = () => {
    navigate("/user-profile");
  };

  const filteredBookings = bookings.filter(booking => {
    // If not a vendor, show all
    if (user?.userType !== 'vendor') return true;
    
    // If vendor, check if it's their booking by email OR if it belongs to their resources
    const isTheirBooking = booking.createdBy === user.email;
    const isTheirResource = vehicleNames.includes(booking.resourceName);
    
    // If we have resources loaded, prefer resource match, otherwise fallback to email
    if (vehicleNames.length > 0 && vehicleNames[0] !== "Default Service") {
      return isTheirResource || isTheirBooking;
    }
    
    return isTheirBooking;
  });

  return (
    <div className="flex h-screen bg-dashboard-bg dark:bg-gray-950 font-plus-jakarta motion-page-shell">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Header */}
        <DashboardHeader Headtitle="Bookings" />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 bg-white dark:bg-gray-900 rounded-2xl lg:rounded-3xl overflow-auto scrollbar-hide overflow-x-hidden m-2 lg:m-4 motion-surface-card">

          {/* Header with Date Navigation */}
          <div data-animate="section" className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-4 gap-4 motion-section-reveal">
            <DateNavigation
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={setCurrentMonth}
              onYearChange={setCurrentYear}
            />
            <Button
              onClick={handleNewBooking}
              className="rounded-xl px-5 h-10 font-semibold text-sm flex items-center gap-2 w-fit shadow-sm hover:shadow-md transition-all"
              style={{ background: '#3BD9DA', color: '#131313' }}
            >
              <Plus size={16} className="mr-1" />
              New Booking
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-scroll overflow-y-scroll mobile-table motion-calendar-month" key={`${currentYear}-${currentMonth}`}>
            {loading ? (
              <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
                <div className="h-6 w-6 motion-spinner" />
                <span className="text-sm">Loading bookings…</span>
              </div>
            ) : (
              <CalendarGrid
                currentMonth={currentMonth}
                currentYear={currentYear}
                bookings={filteredBookings}
                onBookingClick={handleBookingClick}
                onBookingDrag={handleBookingDrag}
                onDateClick={handleDateClick}
                selectedDate={selectedDate}
                vehicleNames={vehicleNames}
              />
            )}
          </div>

          {/* New Booking Modal */}
          <Dialog open={isNewBookingModalOpen} onOpenChange={setIsNewBookingModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide motion-modal-surface">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus size={20} />
                  New Booking
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Guest Name *</Label>
                  <Input
                    id="guestName"
                    value={newBookingForm.guestName}
                    onChange={(e) => setNewBookingForm(prev => ({...prev, guestName: e.target.value}))}
                    placeholder="Enter guest name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resourceName">Service Name *</Label>
                  <Select
                    value={newBookingForm.resourceName}
                    onValueChange={(value) => setNewBookingForm(prev => ({...prev, resourceName: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleNames.map((vehicle) => (
                        <SelectItem key={vehicle} value={vehicle}>
                          {vehicle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newBookingForm.startDate}
                    onChange={(e) => setNewBookingForm(prev => ({...prev, startDate: e.target.value}))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newBookingForm.endDate}
                    onChange={(e) => setNewBookingForm(prev => ({...prev, endDate: e.target.value}))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="text"
                    maxLength={12}
                    value={newBookingForm.phoneNumber}
                    onChange={(e) => {
                      const cleanedValue = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
                      setNewBookingForm(prev => ({...prev, phoneNumber: cleanedValue}))}}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newBookingForm.email}
                    onChange={(e) => setNewBookingForm(prev => ({...prev, email: e.target.value}))}
                    placeholder="Enter email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adults">Adults</Label>
                  <Input
                    id="adults"
                    type="text"
                    placeholder="0"
                    min="1"
                    value={newBookingForm.adults}
                    onChange={(e) =>{
                      const cleanedValue = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
                      setNewBookingForm(prev => ({...prev, adults: cleanedValue}))}
                    }
                      
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="children">Children</Label>
                  <Input
                    id="children"
                    type="text"
                    placeholder="0"
                    min="0"
                    value={newBookingForm.children}
                    onChange={(e) => {
                      const cleanedValue = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
                      setNewBookingForm(prev => ({...prev, children: cleanedValue}))
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price (₹)</Label>
                  <Input
                    id="basePrice"
                    type="text"
                    placeholder="₹ 0.00"
                    min="0"
                    value={newBookingForm.basePrice}
                    onChange={(e) => {
                      const cleanedValue = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
                      setNewBookingForm(prev => ({...prev, basePrice: cleanedValue}))
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extraCharges">Extra Charges (₹)</Label>
                  <Input
                    id="extraCharges"
                    type="text"
                    placeholder="₹ 0.00"
                    min="0"
                    value={newBookingForm.extraCharges}
                    onChange={(e) => {
                      const cleanedValue = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
                      setNewBookingForm(prev => ({...prev, extraCharges: cleanedValue}))
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={newBookingForm.paymentMethod}
                    onValueChange={(value) => setNewBookingForm(prev => ({...prev, paymentMethod: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <div className="p-2 bg-gray-100 rounded border">
                    ₹{(newBookingForm.basePrice + newBookingForm.extraCharges).toLocaleString()}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newBookingForm.notes}
                    onChange={(e) => setNewBookingForm(prev => ({...prev, notes: e.target.value}))}
                    placeholder="Enter any notes"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    value={newBookingForm.specialRequests}
                    onChange={(e) => setNewBookingForm(prev => ({...prev, specialRequests: e.target.value}))}
                    placeholder="Enter special requests"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsNewBookingModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBooking} className="bg-dashboard-primary">
                  <Save size={16} className="mr-2" />
                  Create Booking
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Booking Modal */}
          <Dialog open={isEditBookingModalOpen} onOpenChange={setIsEditBookingModalOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide motion-modal-surface">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit size={20} />
                  Edit Booking - {selectedBooking?.bookingId}
                </DialogTitle>
              </DialogHeader>
              
              {selectedBooking && (
                <div className="space-y-6">
                  {/* Booking Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Guest</p>
                        <p className="font-semibold">{selectedBooking.guestName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Service</p>
                        <p className="font-semibold">{selectedBooking.resourceName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-semibold">{selectedBooking.totalDays} days</p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Guest Name</Label>
                      <Input
                        value={selectedBooking.guestName}
                        onChange={(e) => setSelectedBooking(prev => prev ? {...prev, guestName: e.target.value} : null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        type="text"
                        placeholder="+91 7852469875"
                        maxLength={12}
                        value={selectedBooking.phoneNumber || ''}
                        onChange={(e) => {
                          const cleanedValue = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
                          setSelectedBooking(prev => prev ? {...prev, phoneNumber: cleanedValue} : null)}
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={selectedBooking.email || ''}
                        onChange={(e) => setSelectedBooking(prev => prev ? {...prev, email: e.target.value} : null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={selectedBooking.status}
                        onValueChange={(value: any) => setSelectedBooking(prev => prev ? {...prev, status: value} : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="Checked-in">Checked-in</SelectItem>
                          <SelectItem value="Checked-out">Checked-out</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Base Price (₹)</Label>
                      <Input
                        type="text"
                        placeholder="₹ 0.00"
                        value={selectedBooking.basePrice}
                        onChange={(e) =>{
                          const cleanedValue = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
                          setSelectedBooking(prev => prev ? {...prev, basePrice: cleanedValue} : null)}
                        } 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Extra Charges (₹)</Label>
                      <Input
                        type="text"
                        placeholder="₹ 0.00"
                        value={selectedBooking.extraCharges}
                        onChange={(e) => {
                          const cleanedValue = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
                          setSelectedBooking(prev => prev ? {...prev, extraCharges: cleanedValue} : null)
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={selectedBooking.notes || ''}
                        onChange={(e) => setSelectedBooking(prev => prev ? {...prev, notes: e.target.value} : null)}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => printInvoice(selectedBooking)}
                        className="flex items-center gap-2"
                      >
                        <Printer size={16} />
                        Print Invoice
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteBooking(selectedBooking._id)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditBookingModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateBooking} className="bg-dashboard-primary">
                        <Save size={16} className="mr-2" />
                        Update Booking
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
      
      {/* Beautiful Toaster */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          className: '',
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '12px',
            padding: '16px',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default Bookings;
