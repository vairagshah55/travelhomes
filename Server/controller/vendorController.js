const Vendor = require('../models/Vendor');
const Activity = require('../models/Activity');
const ActivityOnboarding = require('../models/ActivityOnboarding');
const CamperVan = require('../models/CamperVan');
const Stay = require('../models/Stay');
const StayOnboarding = require('../models/StayOnboarding');
const CaravanOnboarding = require('../models/CaravanOnboarding');
const Offer = require('../models/Offer');
const Management = require('../models/Management');
const mongoose = require('mongoose');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
const getVendors = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let vendors;
    
    let query = {};
    
    if (status && status !== 'all-vendors') {
      let statusValue = status;
      if (status === 'pending-vendors') statusValue = 'pending';
      query = { status: statusValue };
    }
    
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);
    
    // Fetch vendors from DB
    const vendorsList = await Vendor.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(); // Use lean() to allow modification
    
    // Process each vendor to get dynamic data
    vendors = await Promise.all(vendorsList.map(async (vendor) => {
      try {
        const vendorIdObj = vendor._id;
        const vendorIdStr = vendor.vendorId;

        // 1. Count Services (including active services and onboarding requests)
        const [
          activityCount, camperCount, stayCount, offerCount, managementCount,
          stayOnboardingCount, activityOnboardingCount, caravanOnboardingCount
        ] = await Promise.all([
          Activity.countDocuments({ vendorId: vendorIdObj }),
          CamperVan.countDocuments({ vendorId: vendorIdStr }), 
          Stay.countDocuments({ vendorId: vendorIdObj }),
          Offer.countDocuments({ vendorId: vendorIdStr }),
          Management.countDocuments({ vendorId: vendorIdObj }),
          StayOnboarding.countDocuments({ vendorId: vendorIdStr }),
          ActivityOnboarding.countDocuments({ vendorId: vendorIdStr }),
          CaravanOnboarding.countDocuments({ vendorId: vendorIdStr })
        ]);

        const totalServices = activityCount + camperCount + stayCount + offerCount + managementCount + 
                            stayOnboardingCount + activityOnboardingCount + caravanOnboardingCount;
        vendor.listedServices = totalServices;

        // 2. Fetch Brand Name & Location from Onboarding (Prioritize onboarding data)
        const [stayOnboarding, activityOnboarding, caravanOnboarding] = await Promise.all([
          StayOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 }),
          ActivityOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 }),
          CaravanOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 })
        ]);

        const source = stayOnboarding || activityOnboarding || caravanOnboarding;
        
        if (source) {
          vendor.brandName = source.brandName || source.businessName || vendor.brandName;
          
          if (source.firstName || source.lastName) {
            vendor.personName = `${source.firstName || ""} ${source.lastName || ""}`.trim();
          }

          if (source.city || source.state || source.locality || source.businessLocality) {
            const city = source.city || source.businessCity;
            const state = source.state || source.businessState;
            vendor.location = [city, state].filter(Boolean).join(', ');
          }
        }
        
        return vendor;
      } catch (err) {
        console.error(`Error processing vendor ${vendor._id}:`, err);
        return vendor; // Return original if error
      }
    }));
    
    res.status(200).json({ 
      success: true, 
      data: vendors 
    });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Private
const getVendor = async (req, res) => {
  try {
    const { id } = req.params;
    let vendor;
    
    // Check if valid ObjectId, if so try finding by _id
    if (mongoose.Types.ObjectId.isValid(id)) {
      vendor = await Vendor.findById(id);
    }
    
    // If not found by _id (or invalid ObjectId), try finding by custom vendorId
    if (!vendor) {
      vendor = await Vendor.findOne({ vendorId: id });
    }
    
    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }
    
    // Convert to object to allow attachment of dynamic fields
    const vendorData = vendor.toObject ? vendor.toObject() : vendor;
    const vendorIdStr = vendorData.vendorId;

    // Fetch details from Onboarding models to enrich the response
    // Priority: Stay > Activity > Caravan (or any logic preferred)
    const [stayOnboarding, activityOnboarding, caravanOnboarding] = await Promise.all([
        StayOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 }),
        ActivityOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 }),
        CaravanOnboarding.findOne({ vendorId: vendorIdStr }).sort({ createdAt: -1 })
    ]);

    // Helper to merge fields if not already present
    const mergeDetails = (source) => {
        if (!source) return;
        
        // Business (Prioritize source if available)
        vendorData.brandName = source.brandName || source.businessName || vendorData.brandName;
        vendorData.personName = (source.firstName || source.lastName) ? `${source.firstName || ""} ${source.lastName || ""}`.trim() : vendorData.personName;
        
        if (!vendorData.legalCompanyName) vendorData.legalCompanyName = source.legalCompanyName || source.companyName || source.businessName;
        if (!vendorData.gstNumber) vendorData.gstNumber = source.gstNumber;
        if (!vendorData.businessEmail) vendorData.businessEmail = source.businessEmail;
        if (!vendorData.businessPhone) vendorData.businessPhone = source.businessPhone;
        
        if (!vendorData.businessLocality) vendorData.businessLocality = source.businessLocality || source.locality;
        if (!vendorData.businessCity) vendorData.businessCity = source.businessCity || source.city;
        if (!vendorData.businessState) vendorData.businessState = source.businessState || source.state;
        if (!vendorData.businessPincode) vendorData.businessPincode = source.businessPincode || source.pincode;

        // Personal
        if (!vendorData.firstName) vendorData.firstName = source.firstName;
        if (!vendorData.lastName) vendorData.lastName = source.lastName;
        
        if (!vendorData.dateOfBirth && source.dateOfBirth) {
            // Normalize Date to string if it's a Date object
            if (source.dateOfBirth instanceof Date) {
                vendorData.dateOfBirth = source.dateOfBirth.toISOString().split('T')[0];
            } else {
                vendorData.dateOfBirth = source.dateOfBirth;
            }
        }
        
        if (!vendorData.maritalStatus) vendorData.maritalStatus = source.maritalStatus;
        if (!vendorData.idProof) vendorData.idProof = source.idProof;
        if (!vendorData.idPhotos) vendorData.idPhotos = source.idPhotos;

        if (!vendorData.personalLocality) vendorData.personalLocality = source.personalLocality || source.personalAddress; // specific mapping?
        if (!vendorData.personalCity) vendorData.personalCity = source.personalCity;
        if (!vendorData.personalState) vendorData.personalState = source.personalState;
        if (!vendorData.personalPincode) vendorData.personalPincode = source.personalPincode;
    };

    // Apply merges (Reverse order to prioritize Stay > Activity > Caravan)
    if (caravanOnboarding) mergeDetails(caravanOnboarding);
    if (activityOnboarding) mergeDetails(activityOnboarding);
    if (stayOnboarding) mergeDetails(stayOnboarding);

    // Count Services
    const [
      activityCount, camperCount, stayCount, offerCount, managementCount,
      stayOnboardingCount, activityOnboardingCount, caravanOnboardingCount
    ] = await Promise.all([
        Activity.countDocuments({ vendorId: vendor._id }),
        CamperVan.countDocuments({ vendorId: vendorIdStr }),
        Stay.countDocuments({ vendorId: vendor._id }),
        Offer.countDocuments({ vendorId: vendorIdStr }),
        Management.countDocuments({ vendorId: vendor._id }),
        StayOnboarding.countDocuments({ vendorId: vendorIdStr }),
        ActivityOnboarding.countDocuments({ vendorId: vendorIdStr }),
        CaravanOnboarding.countDocuments({ vendorId: vendorIdStr })
    ]);
    vendorData.listedServices = activityCount + camperCount + stayCount + offerCount + managementCount +
                               stayOnboardingCount + activityOnboardingCount + caravanOnboardingCount;

    res.status(200).json({ 
      success: true, 
      data: vendorData 
    });
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Create vendor
// @route   POST /api/vendors
// @access  Private
const createVendor = async (req, res) => {
  try {
    let vendor;
    
    vendor = await Vendor.create(req.body);
    
    res.status(201).json({ 
      success: true, 
      data: vendor,
      message: 'Vendor created successfully' 
    });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private
const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    let vendor;
    
    vendor = await Vendor.findByIdAndUpdate(id, req.body, { 
      new: true, 
      runValidators: true 
    });
    
    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: vendor,
      message: 'Vendor updated successfully' 
    });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private
const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findById(id);
    if (vendor) {
      await vendor.deleteOne();
    }
    
    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Vendor deleted successfully' 
    });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Update vendor status
// @route   PATCH /api/vendors/:id/status
// @access  Private
const updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Updated to match Model enums and frontend requirements
    const validStatuses = ['pending', 'approved', 'rejected', 'suspended', 'active', 'inactive', 'banned', 'kyc-unverified'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Valid status is required (${validStatuses.join(', ')})`
      });
    }
    
    let vendor;
    
    vendor = await Vendor.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true, runValidators: true }
    );
    
    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: vendor,
      message: `Vendor status updated to ${status}` 
    });
  } catch (error) {
    console.error('Update vendor status error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Check if current user is a vendor
// @route   GET /api/vendors/check
// @access  Private
const checkVendorStatus = async (req, res) => {
  try {
    const email = req.user.email;
    let vendor;
    
    vendor = await Vendor.findOne({ email });
    
    res.status(200).json({ 
      success: true, 
      isVendor: !!vendor,
      vendor: vendor || null
    });
  } catch (error) {
    console.error('Check vendor status error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  updateVendorStatus,
  checkVendorStatus,
};
