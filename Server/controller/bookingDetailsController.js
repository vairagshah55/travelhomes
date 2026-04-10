const BookingDetail = require('../models/BookingDetail');
const Offer = require('../models/Offer');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Management = require('../models/Management');
const Register = require('../models/Register');

// GET /api/bookingDetails
const listBookingDetails = async (req, res) => {
  try {
    let filter = {};

    console.log("===== BOOKING DETAILS API HIT =====");
    console.log("req.user:", req.user);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const isAdmin =
      req.user.userType === "admin" ||
      req.user.type === "admin" ||
      req.user.type === "superadmin" ||
      req.user.role === "admin";

    // ==============================
    // ✅ ADMIN
    // ==============================
    if (isAdmin) {
      if (req.query.vendorId) {
        filter.vendorId = req.query.vendorId;
      }

      const items = await BookingDetail.find(filter).sort({
        createdAt: -1,
      });

      // Also fetch from Booking if admin
      let serviceBookings = [];
      try {
          let bFilter = {};
          if (req.query.vendorId) {
              // Admin filtering by vendorId
              // Find User by vendorId (custom string or _id)
              const vendorUser = await User.findOne({ 
                  $or: [{ vendorId: req.query.vendorId }, { _id: mongoose.Types.ObjectId.isValid(req.query.vendorId) ? req.query.vendorId : null }] 
              });
              if (vendorUser) {
                  const mIds = await Management.find({ vendorId: vendorUser._id }).select('_id');
                  bFilter.serviceId = { $in: mIds.map(s => s._id) };
              }
          }
          serviceBookings = await Booking.find(bFilter).populate('serviceId').sort({ createdAt: -1 });
      } catch (err) {
          console.error('Admin fetching service bookings error:', err);
      }

      const mappedServiceBookings = serviceBookings.map(b => {
          const s = (b.bookingStatus || 'pending').toLowerCase();
          let status = 'pending';
          if (s === 'confirmed' || s === 'completed' || s === 'checked-out') status = 'confirmed';
          else if (s === 'active' || s === 'checked-in') status = 'active';
          else if (s === 'cancelled') status = 'cancelled';
          
          const colorMap = {
            pending: 'bg-status-orange-bg text-status-orange-text',
            confirmed: 'bg-status-purple-bg text-status-purple-text',
            active: 'bg-status-green-bg text-status-green-text',
            cancelled: 'bg-status-red-bg text-status-red-text',
          };

          const formatDate = (date) => {
              if (!date) return '';
              const d = new Date(date);
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const year = d.getFullYear();
              return `${day}/${month}/${year}`;
          };

          return {
              _id: b._id,
              id: b.bookingId || b._id.toString(),
              clientName: b.clientName,
              serviceName: b.serviceId?.brandName || b.serviceName,
              servicePrice: `₹ ${b.totalAmount}`,
              checkIn: formatDate(b.checkInDate),
              checkOut: formatDate(b.checkOutDate),
              guests: b.numberOfGuests || 1,
              status: status,
              statusColor: colorMap[status],
              location: b.location || '',
              contactEmail: b.clientEmail,
              contactPhone: b.clientPhone,
              serviceType: b.serviceName === 'camper-van' ? 'van' : (b.serviceName === 'unique-stay' ? 'unique-stays' : b.serviceName),
              vendorId: b.serviceId?.vendorId,
              isFromBooking: true
          };
      });

      return res.status(200).json({
        success: true,
        data: [...items, ...mappedServiceBookings],
      });
    }

    // ==============================
    // ✅ VENDOR (EMAIL MATCH)
    // ==============================
    const vendor = await Vendor.findOne({ email: req.user.email });

    if (!vendor) {
      console.log("Vendor not found for email:", req.user.email);
      return res.status(403).json({
        success: false,
        message: "Vendor not found",
      });
    }

    console.log("Vendor _id:", vendor._id.toString());
    console.log("Vendor vendorId (custom):", vendor.vendorId);

    // 🔐 IMPORTANT FIX HERE
    // Check both Mongo ID and custom vendorId to ensure we catch all bookings
    const vendorIds = [vendor._id.toString()];
    if (vendor.vendorId) vendorIds.push(vendor.vendorId);
    
    console.log("Filtering bookings with vendorIds:", vendorIds);

    filter.vendorId = { $in: vendorIds };

    // DEBUG: Check if ANY bookings exist at all
    const allBookingsCount = await BookingDetail.countDocuments({});
    console.log("Total bookings in DB (unfiltered):", allBookingsCount);

    // DEBUG: Sample a few bookings to see their structure
    if (allBookingsCount > 0) {
        const sampleBookings = await BookingDetail.find().limit(3).select('vendorId serviceName clientName');
        console.log("Sample bookings:", sampleBookings);
    }

    // Fallback: Find bookings by Service Name if vendorId is missing
    // Get all services/offers owned by this vendor
    const offers = await Offer.find({ 
        $or: [
            { vendorId: { $in: vendorIds } },
            { userId: vendor.userId || vendor._id } 
        ]
    }).select('name');
    
    const serviceNames = offers.map(o => o.name);
    console.log("Vendor service names:", serviceNames);
    
    // Complex filter: 
    // 1. Matches vendorId (standard)
    // 2. OR matches serviceName AND vendorId is missing/empty (fallback)
    filter = {
        $or: [
            { vendorId: { $in: vendorIds } },
            { serviceName: { $in: serviceNames }, vendorId: { $exists: false } },
            { serviceName: { $in: serviceNames }, vendorId: null },
            { serviceName: { $in: serviceNames }, vendorId: "" }
        ]
    };

    const items = await BookingDetail.find(filter).sort({
      createdAt: -1,
    });

    console.log("Vendor bookings count from BookingDetail:", items.length);

    // --- NEW: Fetch from Booking model (Management services) ---
    let serviceBookings = [];
    try {
        const vendorUser = await User.findOne({ email: req.user.email });
        if (vendorUser) {
            const managementServices = await Management.find({ 
                vendorId: vendorUser._id 
            }).select('_id brandName');
            
            const managementServiceIds = managementServices.map(s => s._id);
            
            if (managementServiceIds.length > 0) {
                serviceBookings = await Booking.find({ 
                    serviceId: { $in: managementServiceIds } 
                }).populate('serviceId');
                console.log("Vendor bookings count from Booking model:", serviceBookings.length);
            }
        }
    } catch (err) {
        console.error('Error fetching service bookings from Booking model:', err);
    }

    const mappedServiceBookings = serviceBookings.map(b => {
        const s = (b.bookingStatus || 'pending').toLowerCase();
        let status = 'pending';
        if (s === 'confirmed' || s === 'completed' || s === 'checked-out') status = 'confirmed';
        else if (s === 'active' || s === 'checked-in') status = 'active';
        else if (s === 'cancelled') status = 'cancelled';

        const colorMap = {
            pending: 'bg-status-orange-bg text-status-orange-text',
            confirmed: 'bg-status-purple-bg text-status-purple-text',
            active: 'bg-status-green-bg text-status-green-text',
            cancelled: 'bg-status-red-bg text-status-red-text',
        };

        const formatDate = (date) => {
            if (!date) return '';
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        return {
            _id: b._id,
            id: b.bookingId || b._id.toString(),
            clientName: b.clientName,
            serviceName: b.serviceId?.brandName || b.serviceName,
            servicePrice: `₹ ${b.totalAmount}`,
            checkIn: formatDate(b.checkInDate),
            checkOut: formatDate(b.checkOutDate),
            guests: b.numberOfGuests || 1,
            status: status,
            statusColor: colorMap[status],
            location: b.location || '',
            contactEmail: b.clientEmail,
            contactPhone: b.clientPhone,
            serviceType: b.serviceName === 'camper-van' ? 'van' : (b.serviceName === 'unique-stay' ? 'unique-stays' : b.serviceName),
            vendorId: b.serviceId?.vendorId,
            isFromBooking: true
        };
    });

    const allItems = [...items, ...mappedServiceBookings];

    return res.status(200).json({
      success: true,
      data: allItems,
    });

  } catch (error) {
    console.error("Error in listBookingDetails:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET /api/bookingDetails/:id      (Mongo _id, not "code")
const getBookingDetailByCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorId } = req.query; // Optional: verify ownership if provided

    const item = await BookingDetail.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Booking detail not found' });

    // Security check if vendorId is provided (e.g. from vendor dashboard)
    if (vendorId) {
        // If the booking has a direct vendorId field, check it
        if (item.vendorId && item.vendorId !== vendorId) {
             // Also check if vendorId is the mongo ID (userId) of the vendor
             // We'd need to fetch Vendor to be sure, or rely on item.vendorId being the custom ID.
             // For now, if item has vendorId and it doesn't match, we should be suspicious.
             // But let's check Offers to be safe (like in list)
             
             const Vendor = require('../models/Vendor');
             const Offer = require('../models/Offer');
             
             const vendor = await Vendor.findOne({ vendorId: vendorId });
             const offerQuery = { $or: [{ vendorId: vendorId }] };
             if (vendor && vendor.userId) offerQuery.$or.push({ userId: vendor.userId });
             
             // Check if service matches one of vendor's offers
             const offers = await Offer.find(offerQuery).select('name');
             const offerNames = offers.map(o => o.name);
             
             if (!offerNames.includes(item.serviceName) && item.vendorId !== vendorId) {
                 return res.status(403).json({ success: false, message: 'Unauthorized access to this booking' });
             }
        } else if (!item.vendorId) {
             // If item has no vendorId, must match service name
             const Vendor = require('../models/Vendor');
             const Offer = require('../models/Offer');
             
             const vendor = await Vendor.findOne({ vendorId: vendorId });
             const offerQuery = { $or: [{ vendorId: vendorId }] };
             if (vendor && vendor.userId) offerQuery.$or.push({ userId: vendor.userId });
             
             const mongoose = require('mongoose');
             if (mongoose.Types.ObjectId.isValid(vendorId)) {
                 offerQuery.$or.push({ userId: vendorId });
             }

             const offers = await Offer.find(offerQuery).select('name');
             const offerNames = offers.map(o => o.name);
             
             if (!offerNames.includes(item.serviceName)) {
                 return res.status(403).json({ success: false, message: 'Unauthorized access to this booking' });
             }
        }
    }

    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/bookingDetails
const createBookingDetail = async (req, res) => {
  try {
    const payload = req.body;
    
    // Auto-populate vendorId if user is a vendor
    if (!payload.vendorId && req.user && (req.user.userType === 'vendor' || req.user.role === 'vendor')) {
        const Vendor = require('../models/Vendor');
        const vendor = await Vendor.findOne({ email: req.user.email });
        if (vendor) {
            // Prefer custom vendorId if available
            payload.vendorId = vendor.vendorId || vendor._id.toString();
        }
    }

    // Auto-class for status color if not provided
    if (!payload.statusColor) {
      const map = {
        pending: 'bg-status-orange-bg text-status-orange-text',
        confirmed: 'bg-status-purple-bg text-status-purple-text',
        active: 'bg-status-green-bg text-status-green-text',
        cancelled: 'bg-status-red-bg text-status-red-text',
      };
      if (payload.status) payload.statusColor = map[payload.status];
    }
    
    // Look up vendorId if not provided
    if (!payload.vendorId && payload.serviceName) {
        // Attempt to find the vendor who owns this service
        // Since Offer is already required at top, we can use it
        const offer = await Offer.findOne({ name: payload.serviceName });
        if (offer && offer.vendorId) {
            payload.vendorId = offer.vendorId;
        }
    }

    const created = await BookingDetail.create(payload);
    res.status(201).json({ success: true, created });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((v) => v.message);
      res.status(400).json({ success: false, message: messages.join(', ') });
    } else if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Duplicate booking detail' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// PUT /api/bookingDetails/:id
const updateBookingDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await BookingDetail.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Booking detail not found' });
    res.status(200).json({ success: true, updated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((v) => v.message);
      res.status(400).json({ success: false, message: messages.join(', ') });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// DELETE /api/bookingDetails/:id
const deleteBookingDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await BookingDetail.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Booking detail not found' });
    res.status(200).json({ success: true, message: 'Booking detail deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/bookingDetails/:id/invoice
const generateBookingDetailInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await BookingDetail.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking detail not found' });

    // Minimal fake invoice data; in production, would generate a PDF
    const invoiceData = {
      bookingId: booking._id,
      clientName: booking.clientName,
      serviceName: booking.serviceName,
      servicePrice: booking.servicePrice,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      status: booking.status,
      location: booking.location,
      contactEmail: booking.contactEmail || '',
      contactPhone: booking.contactPhone || '',
      pickupLocation: booking.pickupLocation || '',
    };
    // Demo invoice path
    const filePath = `/invoices/BD_${booking._id}_${Date.now()}.pdf`;
    res.status(200).json({
      success: true,
      invoice: {
        filePath,
        ...invoiceData,
        companyName: 'Travel Homes',
        companyAddress: 'Your Company Address',
        companyPhone: 'Your Phone Number',
        companyEmail: 'support@travelhomes.com',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listBookingDetails,
  getBookingDetailByCode,
  createBookingDetail,
  updateBookingDetail,
  deleteBookingDetail,
  generateBookingDetailInvoice,
};