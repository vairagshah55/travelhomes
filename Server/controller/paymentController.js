const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const BookingDetail = require('../models/BookingDetail');
const CalendarBooking = require('../models/CalendarBooking');
const User = require('../models/User');
const Management = require('../models/Management');
const Offer = require('../models/Offer');
const Vendor = require('../models/Vendor');
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

// GET /api/payments
const getPayments = async (req, res) => {
  try {
    const { tab, serviceType, search, sortBy, sortDir } = req.query;

    // --- CASE 1: Vendor Payouts (Outgoing Payments) ---
    if (tab === 'vendor') {
      // Logic: List Bookings where User has paid, and Admin needs to pay Vendor.
      // We'll treat "Pending" as bookings confirmed/active/completed but not yet marked as vendor-paid.
      // We'll treat "Paid" as bookings where we have a record of payout (Future implementation: Payout model or Payment flag).
      
      const query = {};
      
      // Filter by status (Pending vs Paid)
      if (serviceType === 'paid') {
         // Currently we don't track vendor payouts explicitly in Booking model.
         // Returns empty array for now or implementation dependent.
         return res.status(200).json({ success: true, data: [] }); 
      } else {
         // Default to 'pending' payouts: Bookings where user paid (confirmed, active, completed, checked-in, checked-out)
         // And booking is NOT cancelled (unless refund involves vendor?)
         query.bookingStatus = { $in: ['confirmed', 'active', 'completed', 'checked-in', 'checked-out'] };
         // Filter by search if provided
         if (search) {
            const s = String(search);
            // Search logic requires population first or regex on fields we can match directly
            // Booking has clientName, bookingId. Vendor name requires populate.
            // We'll handle search after population or complex query.
            query.$or = [
                { bookingId: new RegExp(s, 'i') },
                { clientName: new RegExp(s, 'i') }
                // Vendor name search would be post-population or aggregate
            ];
         }
      }

      // Fetch Bookings
      let bookingsQuery = Booking.find(query)
          .populate({
            path: 'serviceId',
            select: 'brandName vendorId serviceName', // Get brand/service name and link to vendor
            populate: {
              path: 'vendorId',
              select: 'personName brandName' // Get Vendor Name
            }
          })
          .lean();

      let bookings = await bookingsQuery.exec();

      // Transform to PaymentData format
      let paymentData = bookings.map(booking => {
          const service = booking.serviceId || {};
          const vendor = service.vendorId || {};
          
          return {
              _id: booking._id, // Use Booking ID as reference
              paymentId: booking.bookingId,
              businessName: service.brandName || service.serviceName || 'N/A', // Service/Brand Name
              personName: vendor.personName || 'Unknown Vendor', // Vendor Name
              servicesId: service._id ? service._id.toString() : 'N/A',
              servicesNames: service.serviceName || booking.serviceName || 'Service',
              status: 'pending', // Vendor Payout Status (Hardcoded as Pending for now)
              amount: booking.totalAmount, // Vendor Share Calculation logic needed? Using total for now.
              paymentMode: booking.paymentDetails?.paymentMethod || 'N/A',
              transactionId: booking.paymentDetails?.transactionId || 'N/A',
              date: booking.createdAt
          };
      });

      // Client-side search for Vendor Name (since it was populated)
      if (search) {
         const s = String(search).toLowerCase();
         paymentData = paymentData.filter(p => 
            p.paymentId.toLowerCase().includes(s) ||
            p.businessName.toLowerCase().includes(s) ||
            p.personName.toLowerCase().includes(s) ||
            p.servicesNames.toLowerCase().includes(s)
         );
      }
      
      // Client-side sort (simplest for mixed fields)
      if (sortBy) {
         const dir = sortDir === 'desc' ? -1 : 1;
         paymentData.sort((a, b) => {
            let valA = a[sortBy] || '';
            let valB = b[sortBy] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
         });
      }

      return res.status(200).json({ success: true, data: paymentData });
    }

    // --- CASE 2: Incoming Payments (Payment Received) & Refund Status ---
    // Original Logic (slightly modified to ensure we target Payment collection correctly)
    
    const query = {};
    
    // Auth & Vendor Isolation Logic (Keep existing logic)
    if (req.user) {
        const isAdmin = req.user.userType === 'admin' || req.user.type === 'admin' || req.user.type === 'superadmin' || req.user.role === 'admin';
        
        if (!isAdmin && req.user.userType === 'vendor') {
             const currentUserId = req.user._id || req.user.id;
             const v = await Vendor.findOne({ email: req.user.email });
             
             // Find offers owned by this vendor
             const offerQuery = { $or: [{ userId: currentUserId }] };
             if (v && v.vendorId) offerQuery.$or.push({ vendorId: v.vendorId });
             
             const offers = await Offer.find(offerQuery).select('name');
             const myServiceNames = offers.map(o => o.name);
             
             // Filter payments where service name matches vendor's offers
             if (myServiceNames.length > 0) {
                query.servicesNames = { $in: myServiceNames };
             } else {
                return res.status(200).json({ success: true, data: [] });
             }
        }
    } else {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    if (tab === 'refund-status') {
      query.status = { $in: ['requested', 'processing', 'refunded'] };
    } else {
      // Default / payment-received: Show all payments except maybe refunded ones? 
      // Current UI expects all. But let's filter if needed.
      // Usually "Payment Received" implies status='paid' or 'completed'.
      // But let's show all for now to match original behavior, or restrict to incoming.
      // If we add 'vendor' payments to Payment collection later, we might need a flag.
      // For now, Payment collection IS ONLY incoming.
    }
    
    if (serviceType && ['camper-van', 'unique-stay', 'activity'].includes(serviceType)) {
      query.serviceCategory = serviceType;
    }
    
    if (search) {
      const s = String(search);
      query.$or = [
        { paymentId: new RegExp(s, 'i') },
        { businessName: new RegExp(s, 'i') },
        { personName: new RegExp(s, 'i') },
        { servicesId: new RegExp(s, 'i') },
        { servicesNames: new RegExp(s, 'i') },
        { transactionId: new RegExp(s, 'i') },
      ];
    }
    
    let cursor = Payment.find(query);
    if (sortBy) {
      const dir = sortDir === 'desc' ? -1 : 1;
      cursor = cursor.sort({ [sortBy]: dir });
    }
    
    const list = await cursor.exec();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error('Error in getPayments:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/payments/:id
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error('Error in getPayment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/payments
const createPayment = async (req, res) => {
  try {
    const created = await Payment.create(req.body);

    // Create Notification
    try {
      await Notification.create({
        type: 'payment_received',
        title: 'Payment Received',
        message: `Payment received from ${created.personName}.`,
        referenceId: created._id,
        referenceModel: 'Payment'
      });
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
    }
    console.error('Error in createPayment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/payments/:id
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
    }
    console.error('Error in updatePayment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/payments/:id
const deletePayment = async (req, res) => {
  try {
    const doc = await Payment.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Payment not found' });
    await doc.deleteOne();
    return res.status(200).json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error in deletePayment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/payments/:id/status
const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'paid', 'requested', 'processing', 'refunded'];
    
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: ' + allowed.join(', ')
      });
    }

    const payment = await Payment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const razorPaymentCreateOrder = async (req, res) => {

  const razorpay = new Razorpay({
    key_id: process.env.RAZOR_KEY,
    key_secret: process.env.RAZOR_SECRET,
  });
    try {
      const options = {
        amount: req.body.amount * 100, // amount in paise
        currency: "INR",
        receipt: "receipt_" + Date.now(),
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
}

const razorPaymentVerify = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            booking
        } = req.body;

        console.log('Payment verification request received');
        console.log('Booking data:', JSON.stringify(booking, null, 2));

        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZOR_SECRET)
            .update(sign)
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            console.log('Payment signature verified successfully');
            
            // Find the service to get the correct vendorId
            let actualVendorId = "";
            try {
                if (booking.serviceId) {
                    // Try Management first
                    const managementService = await Management.findById(booking.serviceId);
                    if (managementService && managementService.vendorId) {
                        actualVendorId = managementService.vendorId.toString();
                    } else {
                        // Try Offer
                        const offerService = await Offer.findById(booking.serviceId);
                        if (offerService) {
                            actualVendorId = offerService.vendorId || offerService.userId || "";
                        }
                    }
                }
            } catch (err) {
                console.error("Error finding vendor for service:", err);
            }

            // Create Booking
            const mongoose = require('mongoose');
            let serviceModel = "Management";
            try {
                if (booking.serviceId) {
                    const managementService = await Management.findById(booking.serviceId);
                    if (!managementService) {
                        const offerService = await Offer.findById(booking.serviceId);
                        if (offerService) {
                            serviceModel = "Offer";
                        }
                    }
                }
            } catch (err) {
                console.error("Error determining service model:", err);
            }

            // Ensure userId and serviceId are ObjectIds
            const bookingToSave = { ...booking };
            if (bookingToSave.userId && mongoose.Types.ObjectId.isValid(bookingToSave.userId)) {
                bookingToSave.userId = new mongoose.Types.ObjectId(bookingToSave.userId);
            }
            if (bookingToSave.serviceId && mongoose.Types.ObjectId.isValid(bookingToSave.serviceId)) {
                bookingToSave.serviceId = new mongoose.Types.ObjectId(bookingToSave.serviceId);
            }

            const newBooking = new Booking({
                ...bookingToSave,
                serviceModel: serviceModel
            });
            await newBooking.save();
            console.log('Booking created:', newBooking.bookingId);

            // Create BookingDetail for vendor dashboard
            const statusMap = {
                'pending': 'pending',
                'confirmed': 'confirmed',
                'active': 'active',
                'cancelled': 'cancelled'
            };
            const statusColorMap = {
                'pending': 'bg-status-orange-bg text-status-orange-text',
                'confirmed': 'bg-status-purple-bg text-status-purple-text',
                'active': 'bg-status-green-bg text-status-green-text',
                'cancelled': 'bg-status-red-bg text-status-red-text'
            };
            const bookingStatus = statusMap[booking.bookingStatus] || 'confirmed';
            
            const newBookingDetail = new BookingDetail({
                id: booking.bookingId || newBooking.bookingId,
                clientName: booking.clientName,
                serviceName: booking.propertyName || "Service",
                servicePrice: Number(booking.totalAmount),
                checkIn: new Date(booking.checkInDate),
                checkOut: new Date(booking.checkOutDate),
                guests: Number(booking.numberOfGuests) || 1,
                status: bookingStatus,
                statusColor: statusColorMap[bookingStatus],
                location: booking.location || "",
                contactEmail: booking.clientEmail || "",
                contactPhone: booking.clientPhone || "",
                pickupLocation: booking.pickupLocation || "", 
                vendorId: actualVendorId || booking.userId || ""
            });
            await newBookingDetail.save();
            console.log('BookingDetail created:', newBookingDetail.id);

            // Create CalendarBooking for vendor calendar view
            const calendarStatus = bookingStatus === 'confirmed' ? 'Confirmed' : 
                                 bookingStatus === 'active' ? 'Checked-in' : 
                                 bookingStatus === 'cancelled' ? 'Cancelled' : 'Confirmed';
            
            const newCalendarBooking = new CalendarBooking({
                bookingId: booking.bookingId || newBooking.bookingId,
                guestName: booking.clientName,
                resourceName: booking.propertyName || "Service",
                startDate: new Date(booking.checkInDate),
                endDate: new Date(booking.checkOutDate),
                adults: Number(booking.numberOfGuests) || 1,
                children: 0,
                basePrice: Number(booking.baseAmount) || Number(booking.totalAmount),
                totalAmount: Number(booking.totalAmount),
                paidAmount: Number(booking.totalAmount),
                pendingAmount: 0,
                paymentMethod: 'upi',
                paymentStatus: 'paid',
                transactionId: razorpay_payment_id,
                paidAt: new Date(),
                status: calendarStatus,
                phoneNumber: booking.clientPhone || "",
                email: booking.clientEmail || "",
                notes: booking.notes || "",
                vendorId: actualVendorId || ""
            });
            await newCalendarBooking.save();
            console.log('CalendarBooking created:', newCalendarBooking.bookingId);

            // Create Payment Record
            const newPayment = new Payment({
                businessName: booking.propertyName || "Travel Homes",
                personName: booking.clientName,
                servicesNames: [booking.propertyName || "Service"],
                serviceCategory: booking.serviceName,
                bookingId: booking.bookingId || newBooking.bookingId,
                userId: booking.userId,
                serviceId: booking.serviceId,
                amount: Number(booking.totalAmount),
                currency: "INR",
                paymentMethod: "razorpay",
                transactionId: razorpay_payment_id,
                status: "paid",
                paymentDate: new Date(),
                paymentGateway: "razorpay",
                gatewayTransactionId: razorpay_payment_id,
                description: `Payment for booking ${booking.bookingId || newBooking.bookingId}`
            });
            await newPayment.save();
            console.log('Payment record created:', newPayment.transactionId);

            // Create Notifications for Booking and Payment
            try {
              // 1. New Booking Notification
              await Notification.create({
                type: 'new_booking',
                title: 'New Booking Received',
                message: `New booking ${newBooking.bookingId} created by ${newBooking.clientName}.`,
                recipientRole: 'admin',
                referenceId: newBooking._id,
                referenceModel: 'Booking'
              });

              // 2. Payment Received Notification
              await Notification.create({
                type: 'payment_received',
                title: 'Payment Received',
                message: `Payment of ₹${newPayment.amount} received from ${newPayment.personName}.`,
                recipientRole: 'admin',
                referenceId: newPayment._id,
                referenceModel: 'Payment'
              });
            } catch (notifErr) {
              console.error('Error creating notifications in razorPaymentVerify:', notifErr);
            }

            console.log('All records created successfully! Sending success response');
            res.json({ success: true, bookingId: newBooking.bookingId });
        } else {
            console.log('Payment signature verification failed');
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Error in razorPaymentVerify:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ success: false, message: error.message });
    }
}


module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  updatePaymentStatus,
  razorPaymentCreateOrder,
  razorPaymentVerify
};
