const Booking = require('../models/Booking');
const Management = require('../models/Management');
const Notification = require('../models/Notification');
const InvoiceGenerator = require('../services/invoiceGenerator');
const { sendEmail } = require('../lib/email-sender/sender');

// GET /api/bookings?date=YYYY-MM-DD
const getBookingsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ success: false, message: 'Date is required as query param (YYYY-MM-DD)' });
    }
    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(date + 'T23:59:59.999Z');
    
    const bookings = await Booking.find({ date: { $gte: start, $lte: end } }).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/:id
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    console.log("hello bookings", booking);
    // Create Notifications
    try {
      // 1. Admin Notification
      await Notification.create({
        type: 'new_booking',
        title: 'New Booking Received',
        message: `New booking ${booking.bookingId} created by ${booking.clientName}.`,
        recipientRole: 'admin',
        referenceId: booking._id,
        referenceModel: 'Booking'
      });

      // 2. Vendor Notification
      const service = await Management.findById(booking.serviceId);
      if (service && service.vendorId) {
        await Notification.create({
          type: 'new_booking',
          title: 'New Booking for Your Service',
          message: `You have received a new booking ${booking.bookingId} for your service "${service.brandName}".`,
          recipientRole: 'vendor',
          recipientId: service.vendorId,
          referenceId: booking._id,
          referenceModel: 'Booking'
        });
      }
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    // --- Add: booking confirmation workflow ---
    if (
      booking &&
      (booking.bookingStatus === 'confirmed' || (req.body.bookingStatus && req.body.bookingStatus === 'confirmed'))
    ) {
      try {
        // 1. Generate Invoice PDF
        const invoiceGen = new InvoiceGenerator();
        const bookingData = {
          booking: booking,
          user: {
            name: booking.clientName,
            email: booking.clientEmail,
            phone: booking.clientPhone,
          },
          service: {
            name: booking.serviceName,
            id: booking.serviceId,
          },
          serviceType: booking.serviceName,
        };
        const pdfBuffer = await invoiceGen.generateInvoice(bookingData);
        const filePath = await invoiceGen.saveInvoiceToFile(pdfBuffer, booking.bookingId);
        booking.invoiceGenerated = true;
        booking.invoicePath = filePath;
        booking.confirmationSent = false;

        // 2. Send Email to User with Invoice PDF
        const mailBody = {
          from: process.env.EMAIL_SENDER || 'no-reply@traveldashboard.com',
          to: booking.clientEmail,
          subject: `Booking Confirmed: ${booking.bookingId}`,
          text: `Dear ${booking.clientName},\n\nYour booking (${booking.bookingId}) is confirmed.\nPlease find your invoice attached.\n\nThank you for booking with Travel Dashboard!`,
          attachments: [
            {
              filename: `Invoice-${booking.bookingId}.pdf`,
              path: filePath,
            },
          ],
        };
        await new Promise((resolve, reject) => {
          sendEmail(mailBody, {
            status: () => ({}), // dummy for non-blocking
            send: () => { resolve(); },
          }, "Booking confirmation email sent");
        });

        booking.confirmationSent = true;
        booking.confirmationSentAt = new Date();
        await booking.save();

      } catch (workflowErr) {
        // Do NOT block the booking creation if invoice/mail fails
        console.error("Booking confirmation workflow error:", workflowErr);
      }
    }
    
    res.status(201).json({ success: true, booking });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(v => v.message);
      res.status(400).json({ success: false, message: messages.join(', ') });
    } else if (error?.code === 11000) {
      res.status(409).json({ success: false, message: 'Duplicate booking' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// PUT /api/bookings/:id
const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.status(200).json({ success: true, booking });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(v => v.message);
      res.status(400).json({ success: false, message: messages.join(', ') });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// DELETE /api/bookings/:id
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.status(200).json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['confirmed', 'checked-in', 'checked-out', 'cancelled', 'active', 'pending'];
    if (!status || !allowed.includes(status.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Invalid or missing status' });
    }
    
    const booking = await Booking.findByIdAndUpdate(req.params.id, { bookingStatus: status }, { new: true });

    // --- Add: booking confirmation workflow on status change to confirmed ---
    if (
      booking &&
      status.toLowerCase() === 'confirmed' &&
      !booking.confirmationSent
    ) {
      try {
        // 1. Generate Invoice PDF
        const invoiceGen = new InvoiceGenerator();
        const bookingData = {
          booking: booking,
          user: {
            name: booking.clientName,
            email: booking.clientEmail,
            phone: booking.clientPhone,
          },
          service: {
            name: booking.serviceName,
            id: booking.serviceId,
          },
          serviceType: booking.serviceName,
        };
        const pdfBuffer = await invoiceGen.generateInvoice(bookingData);
        const filePath = await invoiceGen.saveInvoiceToFile(pdfBuffer, booking.bookingId);
        booking.invoiceGenerated = true;
        booking.invoicePath = filePath;

        // 2. Send Email to User with Invoice PDF
        const mailBody = {
          from: process.env.EMAIL_SENDER || 'no-reply@traveldashboard.com',
          to: booking.clientEmail,
          subject: `Booking Confirmed: ${booking.bookingId}`,
          text: `Dear ${booking.clientName},\n\nYour booking (${booking.bookingId}) is confirmed.\nPlease find your invoice attached.\n\nThank you for booking with Travel Dashboard!`,
          attachments: [
            {
              filename: `Invoice-${booking.bookingId}.pdf`,
              path: filePath,
            },
          ],
        };

        await new Promise((resolve, reject) => {
          sendEmail(mailBody, {
            status: () => ({}),
            send: () => { resolve(); },
          }, "Booking confirmation email sent");
        });

        booking.confirmationSent = true;
        booking.confirmationSentAt = new Date();
        await booking.save();

      } catch (workflowErr) {
        // Log error, do not block booking status update
        console.error("Booking confirmation workflow error:", workflowErr);
      }
    }

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/bookings/:id/dates
const updateBookingDates = async (req, res) => {
  try {
    const { startDate, endDate, action } = req.body;
    if (!startDate && !endDate) {
      return res.status(400).json({ success: false, message: 'startDate or endDate required' });
    }
    const updateData = {};
    if (startDate) updateData.date = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (action) updateData.dragAction = action;
    updateData.lastModified = new Date();
    
    const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/bookings/:id/invoice
const generateInvoice = async (req, res) => {
  try {
    const id = req.params.id;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Build basic invoice structure
    const invoiceData = {
      bookingId: booking.bookingId || booking._id,
      guestName: booking.guestName || booking.clientName || '',
      date: booking.date,
      extraItems: booking.extraItems || [],
      paymentDetails: booking.paymentDetails || {},
      notes: booking.notes || '',
      status: booking.status,
      totalAmount: Array.isArray(booking.extraItems)
        ? booking.extraItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) + (booking.paymentDetails?.amount || 0)
        : booking.paymentDetails?.amount || 0,
      company: {
        name: "Travel Homes",
        address: "Your Company Address",
        phone: "Your Phone Number",
        email: "support@travelhomes.com"
      }
    };
    const filePath = `/invoices/${booking.bookingId || booking._id}_${Date.now()}.pdf`;
    booking.invoiceUrl = filePath;
    await booking.save();
    res.status(200).json({
      success: true,
      invoice: { ...invoiceData, filePath }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy route for compatibility (returns all bookings, e.g. for admin dashboards)
const getBookings = async (req, res) => {
  try {
    const { tab, serviceType, search, sortBy, sortDir } = req.query;
    
    console.log('Admin Booking Filters:', { tab, serviceType, search, sortBy, sortDir });
    
    const query = {};
    const now = new Date();
    
    // Tab filtering
    if (tab === 'upcoming-bookings') {
      query.checkInDate = { $gt: now };
      query.bookingStatus = { $nin: ['cancelled'] };
    } else if (tab === 'past-booking') {
      query.checkOutDate = { $lt: now };
      query.bookingStatus = { $nin: ['cancelled'] };
    } else if (tab === 'cancelled-bookings') {
      query.bookingStatus = 'cancelled';
    }
    // 'all-bookings' has no status filter
    
    // Service type filtering
    const serviceTypeMap = {
      'caravan': 'camper-van',
      'stay': 'unique-stay',
      'activity': 'activity'
    };
    
    if (serviceType && serviceTypeMap[serviceType]) {
      query.serviceName = serviceTypeMap[serviceType];
    }
    
    console.log('MongoDB Query:', JSON.stringify(query, null, 2));
    
    // Search filtering
    if (search) {
      const s = String(search);
      query.$or = [
        { bookingId: new RegExp(s, 'i') },
        { clientName: new RegExp(s, 'i') },
        { clientEmail: new RegExp(s, 'i') },
        { clientPhone: new RegExp(s, 'i') },
      ];
    }
    
    // Build query
    let cursor = Booking.find(query);
    
    // Sorting
    if (sortBy) {
      const dir = sortDir === 'desc' ? -1 : 1;
      cursor = cursor.sort({ [sortBy]: dir });
    } else {
      cursor = cursor.sort({ createdAt: -1 });
    }
    
    const bookings = await cursor.exec();
    
    console.log(`Found ${bookings.length} bookings matching query`);
    
    res.status(200).json({ success: true, data: bookings, bookings });
  } catch (error) {
    console.error('Error in getBookings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/bookings/user/:userId
const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const mongoose = require('mongoose');
    
    // Security check: ensure user is fetching their own bookings
    const authUserId = req.user?._id || req.user?.id;
    if (authUserId && authUserId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only view your own trips' });
    }

    // Use ObjectId if valid, else string
    const queryId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    const bookings = await Booking.find({ userId: queryId })
      .populate('serviceId')
      .sort({ createdAt: -1 })
      .lean();

    // Manual fallback for serviceId population if serviceModel was missing or incorrect
    const Offer = require('../models/Offer');
    const Management = require('../models/Management');
    for (let booking of bookings) {
        if (!booking.serviceId || typeof booking.serviceId !== 'object') {
            try {
                const offer = await Offer.findById(booking.serviceId).lean();
                if (offer) {
                    booking.serviceId = offer;
                    booking.serviceModel = 'Offer';
                } else {
                    const mgmt = await Management.findById(booking.serviceId).lean();
                    if (mgmt) {
                        booking.serviceId = mgmt;
                        booking.serviceModel = 'Management';
                    }
                }
            } catch (err) {
                // Ignore errors during manual lookup
            }
        }
    }

    const formattedBookings = bookings.map(booking => {
      const service = booking.serviceId;
      
      let serviceDetails = null;
      if (service && typeof service === 'object') {
        let coverUrl = '';
        let galleryUrls = [];

        if (booking.serviceModel === 'Offer') {
          coverUrl = service.photos?.coverUrl || '';
          galleryUrls = service.photos?.galleryUrls || [];
        } else {
          coverUrl = service.images && service.images.length > 0 ? service.images[0] : '';
          galleryUrls = service.images || [];
        }

        serviceDetails = {
          ...service,
          photos: {
            coverUrl: coverUrl,
            galleryUrls: galleryUrls
          }
        };
      }

      return {
        ...booking,
        serviceId: service?._id ? service._id.toString() : booking.serviceId,
        serviceDetails
      };
    });

    res.status(200).json({ success: true, bookings: formattedBookings });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  getBookingsByDate,
  getUserBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  updateBookingStatus,
  updateBookingDates,
  generateInvoice
};
