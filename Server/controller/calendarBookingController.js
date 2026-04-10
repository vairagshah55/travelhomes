// Controller for calendar bookings: get, create, update, drag, status, delete, resource stats, invoice generation
const CalendarBooking = require('../models/CalendarBooking');
const BookingDetail = require('../models/BookingDetail');
const Offer = require('../models/Offer');
const Vendor = require('../models/Vendor');
const Booking = require('../models/Booking');
const Management = require('../models/Management');
const mongoose = require('mongoose');

// Get all calendar bookings (with filters, pagination)
const getCalendarBookings = async (req, res) => {
  try {
    const {
      month,
      year,
      resource,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      vendorId,
      vendorEmail
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    let vendorObj = null;
    let vendorOfferNames = [];

    // Vendor filtering
    if (vendorId || vendorEmail) {
       console.log(`Filtering calendar bookings. vendorId: ${vendorId}, vendorEmail: ${vendorEmail}`);
       
       let vendor;
       
       // Try finding by vendorId (custom string)
       if (vendorId) {
           vendor = await Vendor.findOne({ vendorId: vendorId });
           
           // If not found, and vendorId looks like ObjectId, try finding by _id
           if (!vendor && mongoose.Types.ObjectId.isValid(vendorId)) {
               vendor = await Vendor.findById(vendorId);
           }
       }
       
       // If still not found, try email
       if (!vendor && vendorEmail) {
           vendor = await Vendor.findOne({ email: vendorEmail });
       }
       
       if (vendor) {
           vendorObj = vendor;
           console.log(`Found vendor: ${vendor.brandName} (${vendor._id})`);
           
           const offerQueryCondition = [];
           
           if (vendor.vendorId) offerQueryCondition.push({ vendorId: vendor.vendorId });
           
           // If the passed vendorId looks like a MongoID, it might be the userId in Offer
           if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
                offerQueryCondition.push({ userId: vendorId });
           }

           // Also check if vendor has a userId field and add it (consistent with bookingDetailsController)
           if (vendor.userId) {
                offerQueryCondition.push({ userId: vendor.userId });
           }

           if (offerQueryCondition.length > 0) {
               const offers = await Offer.find({ $or: offerQueryCondition }).select('name');
               vendorOfferNames = offers.map(o => o.name);
               console.log(`Found ${offers.length} offers: ${vendorOfferNames.join(', ')}`);
           } else {
               console.log('No conditions to find offers (vendor has no vendorId/userId)');
           }
           
           filter.$or = [];
           const vendorIds = [vendor._id.toString()];
           if (vendor.vendorId) vendorIds.push(vendor.vendorId);
           
           filter.$or.push({ vendorId: { $in: vendorIds } });
           
           if (vendorOfferNames.length > 0) {
               filter.$or.push({ resourceName: { $in: vendorOfferNames } });
           }
           
           // If filter.$or is empty, it means we have no criteria to find bookings for this vendor.
           if (filter.$or.length === 0) {
               console.log('Vendor found but no matching criteria for bookings. Returning empty.');
               filter._id = new mongoose.Types.ObjectId(); 
               delete filter.$or;
           }
       } else {
           console.log('Vendor not found for filtering');
           // If vendor criteria provided but vendor not found, return empty
           filter._id = new mongoose.Types.ObjectId();
       }
    }

    // Date filtering logic
    const dateFilter = {};
    const bdDateFilter = {};

    if (month && year) {
        const m = parseInt(month) - 1; // 0-indexed
        const y = parseInt(year);
        
        // Start of month
        const startOfMonth = new Date(y, m, 1);
        // End of month (start of next month)
        const endOfMonth = new Date(y, m + 1, 1);
        
        // Filter for CalendarBooking (startDate or endDate within month, or spanning)
        // Actually, simplest is: (startDate < endOfMonth) AND (endDate >= startOfMonth)
        dateFilter.$or = [
            { startDate: { $gte: startOfMonth, $lt: endOfMonth } },
            { endDate: { $gte: startOfMonth, $lt: endOfMonth } },
            { startDate: { $lt: startOfMonth }, endDate: { $gte: endOfMonth } }
        ];

        // Filter for BookingDetail (checkIn/checkOut)
        bdDateFilter.$or = [
            { checkIn: { $gte: startOfMonth, $lt: endOfMonth } },
            { checkOut: { $gte: startOfMonth, $lt: endOfMonth } },
            { checkIn: { $lt: startOfMonth }, checkOut: { $gte: endOfMonth } }
        ];
    }

    // Apply date filter to existing filters
    if (Object.keys(dateFilter).length > 0) {
        // If filter.$or already exists (for vendor), we need to use $and
        if (filter.$or) {
            filter.$and = [
                { $or: filter.$or },
                { $or: dateFilter.$or }
            ];
            delete filter.$or;
        } else {
            filter.$or = dateFilter.$or;
        }
    }

    // 1. Fetch CalendarBookings
    const calendarBookings = await CalendarBooking
      .find(filter)
      .sort({ startDate: 1 });

    // 2. Fetch BookingDetails (if vendor is identified)
    let bookingDetails = [];
    let serviceBookings = [];

    if (vendorObj) {
        const vendorIds = [vendorObj._id.toString()];
        if (vendorObj.vendorId) vendorIds.push(vendorObj.vendorId);
        
        let bdFilter = {
             $or: [
                { vendorId: { $in: vendorIds } },
                { serviceName: { $in: vendorOfferNames }, vendorId: { $exists: false } },
                { serviceName: { $in: vendorOfferNames }, vendorId: null },
                { serviceName: { $in: vendorOfferNames }, vendorId: "" }
            ]
        };

        // Apply date filter to BookingDetails
        if (Object.keys(bdDateFilter).length > 0) {
            bdFilter = {
                $and: [
                    bdFilter,
                    { $or: bdDateFilter.$or }
                ]
            };
        }
        
        bookingDetails = await BookingDetail.find(bdFilter);

        // --- NEW: Fetch from Booking model (Management services) ---
        try {
            // Find the User associated with this vendor to get the correct vendorId for Management
            const User = require('../models/User');
            const vendorUser = await User.findOne({ email: vendorObj.email });
            
            if (vendorUser) {
                const managementServices = await Management.find({ 
                    vendorId: vendorUser._id 
                }).select('_id brandName');
                
                const managementServiceIds = managementServices.map(s => s._id);
                
                if (managementServiceIds.length > 0) {
                    let bFilter = {
                        serviceId: { $in: managementServiceIds }
                    };

                    // Apply date filter to Booking model
                    if (month && year) {
                        const m = parseInt(month) - 1;
                        const y = parseInt(year);
                        const startOfMonth = new Date(y, m, 1);
                        const endOfMonth = new Date(y, m + 1, 1);
                        
                        bFilter.$and = [
                            {
                                $or: [
                                    { checkInDate: { $gte: startOfMonth, $lt: endOfMonth } },
                                    { checkOutDate: { $gte: startOfMonth, $lt: endOfMonth } },
                                    { checkInDate: { $lt: startOfMonth }, checkOutDate: { $gte: endOfMonth } }
                                ]
                            }
                        ];
                    }

                    serviceBookings = await Booking.find(bFilter).populate('serviceId');
                }
            }
        } catch (err) {
            console.error('Error fetching service bookings from Booking model:', err);
        }
    } else if (!vendorId && !vendorEmail) {
        // Admin case: fetch all within date range if needed
        try {
            let bFilter = {};
            if (month && year) {
                const m = parseInt(month) - 1;
                const y = parseInt(year);
                const startOfMonth = new Date(y, m, 1);
                const endOfMonth = new Date(y, m + 1, 1);
                bFilter.$or = [
                    { checkInDate: { $gte: startOfMonth, $lt: endOfMonth } },
                    { checkOutDate: { $gte: startOfMonth, $lt: endOfMonth } },
                    { checkInDate: { $lt: startOfMonth }, checkOutDate: { $gte: endOfMonth } }
                ];
            }
            serviceBookings = await Booking.find(bFilter).populate('serviceId');
        } catch (err) {
            console.error('Admin fetching service bookings error:', err);
        }
    }

    // 3. Map BookingDetails and Bookings to CalendarBooking format
    const mappedBookingDetails = bookingDetails.map(bd => {
        let status = 'Confirmed';
        if (bd.status === 'cancelled') status = 'Cancelled';
        else if (bd.status === 'active') status = 'Checked-in';
        
        // Parse price safely
        let price = 0;
        if (typeof bd.servicePrice === 'number') {
            price = bd.servicePrice;
        } else if (bd.servicePrice) {
            const match = String(bd.servicePrice).match(/(\d+)/);
            if (match) price = parseInt(match[0]);
        }

        return {
            _id: bd._id,
            bookingId: bd.id || bd._id.toString(),
            guestName: bd.clientName,
            resourceName: bd.serviceName,
            startDate: bd.checkIn || new Date(),
            endDate: bd.checkOut || new Date(),
            status: status,
            adults: bd.guests || 1,
            children: 0,
            totalGuests: bd.guests || 1,
            basePrice: price,
            totalAmount: price,
            email: bd.contactEmail,
            phoneNumber: bd.contactPhone,
            createdAt: bd.createdAt,
            updatedAt: bd.updatedAt,
            // Virtuals need to be calculated if simple object
            totalDays: bd.checkIn && bd.checkOut ? Math.ceil((new Date(bd.checkOut) - new Date(bd.checkIn)) / (1000 * 60 * 60 * 24)) : 1,
            color: status === 'Cancelled' ? '#EF4444' : (status === 'Checked-in' ? '#10B981' : '#3B82F6'),
            isFromBookingDetail: true
        };
    });

    const mappedServiceBookings = serviceBookings.map(b => {
        let status = 'Confirmed';
        const s = (b.bookingStatus || '').toLowerCase();
        if (s === 'cancelled') status = 'Cancelled';
        else if (s === 'checked-in' || s === 'active') status = 'Checked-in';
        else if (s === 'checked-out' || s === 'completed') status = 'Checked-out';

        return {
            _id: b._id,
            bookingId: b.bookingId || b._id.toString(),
            guestName: b.clientName,
            resourceName: b.serviceId?.brandName || b.serviceName || 'Service',
            startDate: b.checkInDate,
            endDate: b.checkOutDate,
            status: status,
            adults: b.numberOfGuests || 1,
            children: 0,
            totalGuests: b.numberOfGuests || 1,
            basePrice: b.baseAmount || 0,
            totalAmount: b.totalAmount || 0,
            email: b.clientEmail,
            phoneNumber: b.clientPhone,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt,
            vendorId: b.serviceId?.vendorId,
            totalDays: b.checkInDate && b.checkOutDate ? Math.ceil((new Date(b.checkOutDate) - new Date(b.checkInDate)) / (1000 * 60 * 60 * 24)) : 1,
            color: status === 'Cancelled' ? '#EF4444' : (status === 'Checked-in' ? '#10B981' : (status === 'Checked-out' ? '#6B7280' : '#3B82F6')),
            isFromBooking: true
        };
    });

    // 4. Merge and Sort
    const allBookings = [...calendarBookings, ...mappedBookingDetails, ...mappedServiceBookings];
    allBookings.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // 5. Paginate
    const totalCount = allBookings.length;
    const paginatedBookings = allBookings.slice(skip, skip + Number(limit));
    const resources = [...new Set(allBookings.map(b => b.resourceName))];

    res.status(200).json({
      success: true,
      data: paginatedBookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalCount,
        hasNext: skip + Number(limit) < totalCount
      },
      meta: {
        resources: resources,
        filters: { month, year, resource, status }
      }
    });
    return; // Stop here

    /* OLD CODE
    const bookings = await CalendarBooking
      .find(filter)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(Number(limit));

    const totalCount = await CalendarBooking.countDocuments(filter);
    const resources = await CalendarBooking.distinct('resourceName');

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalCount,
        hasNext: skip + Number(limit) < totalCount
      },
      meta: {
        resources: resources,
        filters: { month, year, resource, status }
      }
    });
    */
  } catch (error) {
    console.error('Error fetching calendar bookings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single calendar booking by ID
const getCalendarBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }
    const booking = await CalendarBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Error fetching calendar booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create new calendar booking
const createCalendarBooking = async (req, res) => {
  try {
    const bookingData = req.body;
    // Validate required fields
    const requiredFields = ['guestName', 'resourceName', 'startDate', 'endDate'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return res.status(400).json({ success: false, message: `Missing field: ${field}` });
      }
    }
    // Validate dates
    const startDate = new Date(bookingData.startDate);
    const endDate = new Date(bookingData.endDate);
    if (startDate > endDate) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }
    // Check for conflicts
    const conflictingBooking = await CalendarBooking.findOne({
      resourceName: bookingData.resourceName,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });
    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message:
          `Booking conflict: `
          + `${conflictingBooking.startDate.toISOString().slice(0, 10)} to `
          + `${conflictingBooking.endDate.toISOString().slice(0, 10)}`
      });
    }
    // Create new booking
    const newBooking = new CalendarBooking({
      ...bookingData,
      startDate,
      endDate,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // If vendorId is missing, try to find it from the resource name (Offer)
    if (!newBooking.vendorId && bookingData.resourceName) {
        try {
            const offer = await Offer.findOne({ name: bookingData.resourceName });
            if (offer) {
                newBooking.vendorId = offer.vendorId || offer.userId || "";
            }
        } catch (err) {
            console.error("Error finding vendorId for new calendar booking:", err);
        }
    }

    const savedBooking = await newBooking.save();
    res.status(201).json({ success: true, data: savedBooking });
  } catch (error) {
    console.error('Error creating calendar booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update entire calendar booking
const updateCalendarBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    // If dates are being updated, validate them and check for conflicts
    if (updateData.startDate || updateData.endDate) {
      const booking = await CalendarBooking.findById(id);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      const startDate = new Date(updateData.startDate || booking.startDate);
      const endDate = new Date(updateData.endDate || booking.endDate);
      if (startDate > endDate) {
        return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
      }
      const conflictingBooking = await CalendarBooking.findOne({
        resourceName: booking.resourceName,
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
        _id: { $ne: id }
      });
      if (conflictingBooking) {
        return res.status(409).json({
          success: false,
          message:
            `Booking conflict: `
            + `${conflictingBooking.startDate.toISOString().slice(0, 10)} to `
            + `${conflictingBooking.endDate.toISOString().slice(0, 10)}`
        });
      }
    }

    updateData.updatedAt = new Date();

    const updatedBooking = await CalendarBooking.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(200).json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error('Error updating calendar booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update calendar booking dates (e.g. via drag in a UI)
const updateCalendarBookingDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, action } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }
    const booking = await CalendarBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const newStartDate = new Date(startDate);
    const newEndDate = new Date(endDate);
    if (newStartDate > newEndDate) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    // Check conflicts (excluding current booking)
    const conflictingBooking = await CalendarBooking.findOne({
      resourceName: booking.resourceName,
      startDate: { $lte: newEndDate },
      endDate: { $gte: newStartDate },
      _id: { $ne: id }
    });
    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message:
          `Booking conflict: `
          + `${conflictingBooking.startDate.toISOString().slice(0, 10)} to `
          + `${conflictingBooking.endDate.toISOString().slice(0, 10)}`
      });
    }

    const originalDates = {
      startDate: booking.startDate,
      endDate: booking.endDate
    };

    const updatedBooking = await CalendarBooking.findByIdAndUpdate(
      id,
      { startDate: newStartDate, endDate: newEndDate, lastDragAction: action, originalDates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    const totalDays = Math.ceil((newEndDate - newStartDate) / (1000 * 60 * 60 * 24)) + 1;

    res.status(200).json({
      success: true,
      data: updatedBooking,
      dragAction: action,
      oldDates: `${originalDates.startDate.toISOString().slice(0, 10)} to ${originalDates.endDate.toISOString().slice(0, 10)}`,
      newDates: `${newStartDate.toISOString().slice(0, 10)} to ${newEndDate.toISOString().slice(0, 10)}`,
      totalDays
    });
  } catch (error) {
    console.error('Error updating calendar booking dates:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update calendar booking status
const updateCalendarBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, checkInTime, checkOutTime } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }
    const validStatuses = ['Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const updateFields = { status };

    if (status === 'Checked-in' && !checkInTime) {
      updateFields.checkInTime = new Date();
    }
    if (status === 'Checked-out' && !checkOutTime) {
      updateFields.checkOutTime = new Date();
    }

    updateFields.updatedAt = new Date();

    const updatedBooking = await CalendarBooking.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(200).json({ success: true, data: updatedBooking });
  } catch (error) {
    console.error('Error updating calendar booking status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete calendar booking
const deleteCalendarBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }
    const deletedBooking = await CalendarBooking.findByIdAndDelete(id);
    if (!deletedBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(200).json({ success: true, message: 'Booking deleted', data: deletedBooking });
  } catch (error) {
    console.error('Error deleting calendar booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all unique resources (with booking stats)
const getResources = async (req, res) => {
  try {
    const resources = await CalendarBooking.aggregate([
      { $group: {
          _id: '$resourceName',
          totalBookings: { $sum: 1 },
          activeBookings: { $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] } }
        }
      },
      { $project: {
          resourceName: '$_id',
          totalBookings: 1,
          activeBookings: 1,
          _id: 0
        }
      }
    ]);
    res.status(200).json({
      success: true,
      data: resources,
      stats: {
        totalBookings: resources.reduce((sum, r) => sum + r.totalBookings, 0),
        totalActiveBookings: resources.reduce((sum, r) => sum + r.activeBookings, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Generate invoice for a booking (structure only; rendering handled by service)
const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }
    const booking = await CalendarBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const invoiceData = {
      bookingId: booking._id,
      guestName: booking.guestName,
      resourceName: booking.resourceName,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalDays: booking.totalDays,
      adults: booking.adults,
      children: booking.children,
      totalGuests: booking.totalGuests,
      basePrice: booking.basePrice,
      extraCharges: booking.extraCharges,
      totalAmount: booking.totalAmount,
      paidAmount: booking.paidAmount,
      pendingAmount: booking.pendingAmount,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
      phoneNumber: booking.phoneNumber,
      email: booking.email,
      notes: booking.notes,
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt,
      generatedAt: new Date()
    };
    res.status(200).json({ success: true, data: invoiceData });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Export all handlers
module.exports = {
  getCalendarBookings,
  getCalendarBookingById,
  createCalendarBooking,
  updateCalendarBooking,
  updateCalendarBookingDates,
  updateCalendarBookingStatus,
  deleteCalendarBooking,
  getResources,
  generateInvoice
};