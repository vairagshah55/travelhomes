const Management = require('../models/Management');
const Offer = require('../models/Offer');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Register = require('../models/Register');
const ActivityOnboarding = require('../models/ActivityOnboarding');
const StayOnboarding = require('../models/StayOnboarding');
const CaravanOnboarding = require('../models/CaravanOnboarding');
const Feature = require('../models/Feature');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { sendRejectionEmail, sendApprovalEmail } = require('../services/mailer');

// Helper to get resolved category name
const resolveCategoryName = (category, featureMap) => {
  if (!category) return '';
  // Check if it's a direct match in map (ID or name)
  if (featureMap[category]) return featureMap[category];
  return category;
};

// Helper to fetch onboarding details
const getOnboardingDetails = async (vendorId, userId, categoryName) => {
  let businessDetails = {};
  let personalDetails = {};
  let onboardingDoc = null;
  let serviceType = 'Caravan'; // Default assumption
  const catLower = (categoryName || '').toLowerCase();

  // 1. Try to find the specific onboarding document
  if (catLower === 'activity') {
    onboardingDoc = await ActivityOnboarding.findOne({ vendorId }).sort({ createdAt: -1 });
    if (onboardingDoc) serviceType = 'Activity';
  } else if (catLower === 'stay') {
    onboardingDoc = await StayOnboarding.findOne({ vendorId }).sort({ createdAt: -1 });
    if (onboardingDoc) serviceType = 'Stay';
  } else {
    // Default to Caravan for others or 'caravan'
    onboardingDoc = await CaravanOnboarding.findOne({ vendorId }).sort({ createdAt: -1 });
    if (onboardingDoc) serviceType = 'Caravan';
  }

  // If still not found, try others just in case category name didn't match
  if (!onboardingDoc) {
      if (catLower !== 'activity') {
          onboardingDoc = await ActivityOnboarding.findOne({ vendorId }).sort({ createdAt: -1 });
          if (onboardingDoc) serviceType = 'Activity';
      }
      if (!onboardingDoc && catLower !== 'stay') {
          onboardingDoc = await StayOnboarding.findOne({ vendorId }).sort({ createdAt: -1 });
          if (onboardingDoc) serviceType = 'Stay';
      }
      if (!onboardingDoc && catLower !== 'caravan') {
          onboardingDoc = await CaravanOnboarding.findOne({ vendorId }).sort({ createdAt: -1 });
          if (onboardingDoc) serviceType = 'Caravan';
      }
  }

  if (onboardingDoc) {
    // Extract Business Details
    if (onboardingDoc.businessName || onboardingDoc.brandName || onboardingDoc.companyName) {
        businessDetails = {
            name: onboardingDoc.businessName || onboardingDoc.brandName || onboardingDoc.companyName,
            email: onboardingDoc.businessEmail,
            phone: onboardingDoc.businessPhone,
            gst: onboardingDoc.gstNumber,
            address: [
                onboardingDoc.businessLocality || onboardingDoc.locality,
                onboardingDoc.businessCity || onboardingDoc.city,
                onboardingDoc.businessState || onboardingDoc.state,
                onboardingDoc.businessPincode || onboardingDoc.pincode
            ].filter(Boolean).join(', ')
        };
    }

    // Extract Personal Details
    if (onboardingDoc.firstName || onboardingDoc.lastName) {
        personalDetails = {
            name: `${onboardingDoc.firstName || ''} ${onboardingDoc.lastName || ''}`.trim(),
            dob: onboardingDoc.dateOfBirth,
            maritalStatus: onboardingDoc.maritalStatus,
            idProof: onboardingDoc.idProof,
            address: [
                onboardingDoc.personalLocality || onboardingDoc.locality,
                onboardingDoc.personalCity || onboardingDoc.city,
                onboardingDoc.personalState || onboardingDoc.state,
                onboardingDoc.personalPincode || onboardingDoc.pincode,
                onboardingDoc.personalCountry
            ].filter(Boolean).join(', ')
        };
    }
  }

  // Fallback / Enhancement from Vendor/User if details missing
  if (!businessDetails.name || !personalDetails.name) {
    if (vendorId) {
        const vendor = await Vendor.findOne({ vendorId });
        if (vendor) {
            if (!businessDetails.name) businessDetails.name = vendor.brandName;
            if (!businessDetails.email) businessDetails.email = vendor.email;
            if (!businessDetails.phone) businessDetails.phone = vendor.phone;
            
            if (!personalDetails.name) personalDetails.name = vendor.personName;
        }
    }
    
    if (userId && (!personalDetails.name || !businessDetails.email)) {
        let user = null;
        if (mongoose.Types.ObjectId.isValid(userId)) {
             user = await User.findById(userId);
        }
        if (!user) {
             user = await User.findOne({ userId });
        }

        if (user) {
            if (!personalDetails.name) personalDetails.name = user.name;
            if (!businessDetails.email) businessDetails.email = user.email;
            if (!businessDetails.phone) businessDetails.phone = user.phone;
        }
    }
  }

  return { businessDetails, personalDetails, serviceType };
};

// @desc    Get all management listings
// @route   GET /api/management
// @access  Private
const getManagementListings = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Use real MongoDB - Pull from Offer model as well
    let query = {};
    // Filter by status if provided
    if (status && ['approved', 'pending', 'modified', 'deactivated', 'blocked', 'cancelled', 'rejected'].includes(status)) {
      query = { status };
    }
    
    const offers = await Offer.find(query).sort({ createdAt: -1 });

    // 1. Prefetch Features for category resolution
    const features = await Feature.find({});
    const featureMap = {};
    features.forEach(f => {
        featureMap[f._id.toString()] = f.name;
        // Optional: Map lowercase name to name for consistency
        if (f.name) featureMap[f.name.toLowerCase()] = f.name;
    });
    
    // 2. Map Offer fields and enrich with details
    const listings = await Promise.all(offers.map(async (o) => {
      const categoryName = resolveCategoryName(o.category, featureMap);
      const { businessDetails, personalDetails, serviceType } = await getOnboardingDetails(o.vendorId, o.userId, categoryName);

      return {
        // Base fields
        _id: o._id,
        vendorId: o.vendorId, 
        brandName: o.name, 
        personName: personalDetails.name || 'Vendor', 
        serviceName: serviceType,
        location: `${o.city || ''}, ${o.state || ''}`,
        price: o.regularPrice,
        status: o.status,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        
        // Full object fields + Enrichments
        ...o.toObject(),
        category: categoryName, // Override category ID
        businessDetails,
        personalDetails
      };
    }));
    
    res.status(200).json({
      success: true,
      listings
    });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error && 'message' in error) {
      message = error.message;
    }
    res.status(500).json({
      success: false,
      message
    });
  }
};

// @desc    Get single management listing
// @route   GET /api/management/:id
// @access  Private
const getManagementListing = async (req, res) => {
  try {
    let listingData;
    
    // Try Offer model first
    const offer = await Offer.findById(req.params.id);
    
    if (offer) {
        // Enrich offer
        const features = await Feature.find({});
        const featureMap = {};
        features.forEach(f => {
            featureMap[f._id.toString()] = f.name;
            if (f.name) featureMap[f.name.toLowerCase()] = f.name;
        });

        const categoryName = resolveCategoryName(offer.category, featureMap);
        const { businessDetails, personalDetails, serviceType } = await getOnboardingDetails(offer.vendorId, offer.userId, categoryName);

        listingData = {
            ...offer.toObject(),
            category: categoryName,
            serviceName: serviceType,
            businessDetails,
            personalDetails
        };

    } else {
      // Fallback to legacy Management model if needed (though likely unused now)
      listingData = await Management.findById(req.params.id);
    }
    
    if (!listingData) {
      res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
      return;
    }
    res.status(200).json({
      success: true,
      listing: listingData
    });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error && 'message' in error) {
      message = error.message;
    }
    res.status(500).json({
      success: false,
      message
    });
  }
};

// @desc    Create new management listing
// @route   POST /api/management
// @access  Private
const createManagementListing = async (req, res) => {
  try {
    let listing;
    
    // Use real MongoDB
    listing = await Management.create(req.body);
    
    res.status(201).json({
      success: true,
      listing
    });
  } catch (error) {
    // Type-safe validation error
    if (
      typeof error === 'object' &&
      error && 'name' in error && error.name === 'ValidationError' &&
      'errors' in error
    ) {
      const messages = Object.values(error.errors).map((val) => val.message);
      res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    } else {
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      else if (typeof error === 'object' && error && 'message' in error) message = error.message;
      res.status(500).json({
        success: false,
        message
      });
    }
  }
};

// @desc    Update management listing
// @route   PUT /api/management/:id
// @access  Private
const updateManagementListing = async (req, res) => {
  try {
    let listing;
    
    // Use real MongoDB
    listing = await Management.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    
    if (!listing) {
      res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
      return;
    }
    res.status(200).json({
      success: true,
      listing
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'name' in error &&
      error.name === 'ValidationError' &&
      'errors' in error
    ) {
      const messages = Object.values(error.errors).map((val) => val.message);
      res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    } else {
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      else if (typeof error === 'object' && error && 'message' in error) message = error.message;
      res.status(500).json({
        success: false,
        message
      });
    }
  }
};

// @desc    Delete management listing
// @route   DELETE /api/management/:id
// @access  Private
const deleteManagementListing = async (req, res) => {
  try {
    let deleted = false;
    
    // Use real MongoDB
    const listing = await Management.findById(req.params.id);
    if (!listing) {
      res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
      return;
    }
    await listing.deleteOne();
    deleted = true;
    
    res.status(200).json({
      success: true,
      deleted
    });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    else if (typeof error === 'object' && error && 'message' in error) message = error.message;
    res.status(500).json({
      success: false,
      message
    });
  }
};

// @desc    Update management listing status
// @route   PATCH /api/management/:id/status
// @access  Private
const updateListingStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (
      !status ||
      !['approved', 'pending', 'modified', 'deactivated', 'blocked', 'cancelled', 'rejected'].includes(status)
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid or missing status'
      });
      return;
    }

    // Enforce rejection reason
    if (status === 'rejected' && !rejectionReason) {
        res.status(400).json({
            success: false,
            message: 'Rejection reason is required when rejecting a service'
        });
        return;
    }

    let listing;
    
    // Update Offer status AND rejectionReason
    const updateData = { status };
    if (status === 'rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
    }
    
    // Try Offer model first
    listing = await Offer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );
    
    if (listing) {
      // Find Onboarding Document to update its status as well
      let onboardingDoc = null;
      let onboardingModel = null;
      
      // Determine model from sourceModel or category
      if (listing.sourceModel === 'ActivityOnboarding') {
          onboardingModel = ActivityOnboarding;
      } else if (listing.sourceModel === 'StayOnboarding') {
          onboardingModel = StayOnboarding;
      } else if (listing.sourceModel === 'CaravanOnboarding') {
          onboardingModel = CaravanOnboarding;
      } else {
          // Fallback to category name matching (legacy support)
          const cat = (listing.category || '').toLowerCase();
          if (cat === 'activity') {
              onboardingModel = ActivityOnboarding;
          } else if (cat === 'stay') {
              onboardingModel = StayOnboarding;
          } else {
              onboardingModel = CaravanOnboarding;
          }
      }

      if (onboardingModel) {
          const updateFields = { status };
          if (status === 'rejected' && rejectionReason) {
              updateFields.rejectionReason = rejectionReason;
          }
          
          if (listing.sourceId) {
             // Precise update using sourceId
             onboardingDoc = await onboardingModel.findByIdAndUpdate(
                 listing.sourceId,
                 updateFields,
                 { new: true }
             );
          } else if (listing.vendorId) {
              // Fallback for legacy data without sourceId
              onboardingDoc = await onboardingModel.findOneAndUpdate(
                  { vendorId: listing.vendorId },
                  updateFields,
                  { sort: { createdAt: -1 }, new: true }
              );
          }
      }

      // Determine email recipient
      let targetEmail = null;
      // 1. Try business email from onboarding doc
      if (onboardingDoc && onboardingDoc.businessEmail) {
           targetEmail = onboardingDoc.businessEmail;
      }
      
      // 2. Fallback to User email
      if (!targetEmail && listing.userId) {
          let user = null;
          if (mongoose.Types.ObjectId.isValid(listing.userId)) {
              user = await User.findById(listing.userId);
          }
          if (!user) {
              user = await User.findOne({ userId: listing.userId });
          }
          
          if (user && user.email) {
              targetEmail = user.email;
          }
      }
      
      // Log for debugging
      console.log(`[StatusUpdate] Service: ${listing.name}, Status: ${status}, Email Target: ${targetEmail || 'NONE'}`);

      // Handle Approval Logic
      if (status === 'approved') {
        // Activate Vendor
        if (listing.vendorId) {
          await Vendor.findOneAndUpdate({ vendorId: listing.vendorId }, { status: 'approved' });
        }
        
        // Update User/Register to Vendor type
        if (listing.userId) {
          let user = null;
          if (mongoose.Types.ObjectId.isValid(listing.userId)) {
              user = await User.findById(listing.userId);
          }
          if (!user) {
              user = await User.findOne({ userId: listing.userId });
          }

          if (user && user.email) {
            // Use findByIdAndUpdate if we have the user._id, otherwise try the custom userId
            await User.findByIdAndUpdate(user._id, { status: 'active', role: 'vendor' });
            await Register.findOneAndUpdate({ email: user.email }, { userType: 'vendor' });
          }
        }

        // Send Approval Email
        if (targetEmail) {
            await sendApprovalEmail(targetEmail, listing.name, listing.category || 'Service');
        }

        // Create Notification for Vendor
        try {
          await Notification.create({
            type: 'service_approval',
            title: 'Service Approved',
            message: `Your service "${listing.name}" has been approved.`,
            recipientRole: 'vendor',
            recipientId: listing.vendorId,
            referenceId: listing._id,
            referenceModel: 'Offer'
          });
        } catch (notifErr) {
          console.error('[Management] Error creating approval notification:', notifErr);
        }
      }
      
      // Handle Rejection Logic
      if (status === 'rejected') {
        // Update Vendor status to rejected if applicable
        if (listing.vendorId) {
          await Vendor.findOneAndUpdate({ vendorId: listing.vendorId }, { status: 'rejected' });
        }

        // Send Rejection Email
        if (targetEmail) {
             await sendRejectionEmail(targetEmail, listing.name, rejectionReason || 'No reason provided');
        }

        // Create Notification for Vendor
        try {
          await Notification.create({
            type: 'service_rejection',
            title: 'Service Rejected',
            message: `Your service "${listing.name}" was rejected. Reason: ${rejectionReason || 'No reason provided'}.`,
            recipientRole: 'vendor',
            recipientId: listing.vendorId,
            referenceId: listing._id,
            referenceModel: 'Offer'
          });
        } catch (notifErr) {
          console.error('[Management] Error creating rejection notification:', notifErr);
        }
      }
    } else {
      listing = await Management.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true },
      );
    }
    
    if (!listing) {
      res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
      return;
    }
    res.status(200).json({
      success: true,
      listing
    });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    else if (typeof error === 'object' && error && 'message' in error) message = error.message;
    res.status(500).json({
      success: false,
      message
    });
  }
};

module.exports = {
  getManagementListings,
  getManagementListing,
  createManagementListing,
  updateManagementListing,
  deleteManagementListing,
  updateListingStatus
};
