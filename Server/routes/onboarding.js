const express = require('express');
const fs = require('fs');
const path = require('path');
const ActivityOnboarding = require('../models/ActivityOnboarding');
const CaravanOnboarding = require('../models/CaravanOnboarding');
const StayOnboarding = require('../models/StayOnboarding');
const Offer = require('../models/Offer');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Register = require('../models/Register');
const { requireJwt } = require('../middleware/auth');
const router = express.Router();

// Ensure uploads dir exists
const uploadsDir = path.join(process.cwd(), 'uploads');
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch {}

// Helpers
const asyncWrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const mimeToExt = (mime) => {
  if (!mime) return 'bin';
  if (mime.includes('jpeg')) return 'jpg';
  if (mime.includes('jpg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('pdf')) return 'pdf';
  return 'bin';
};

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  try {
    const buffer = Buffer.from(base64, 'base64');
    return { mime, buffer, ext: mimeToExt(mime) };
  } catch {
    return null;
  }
}

async function saveDataUrlToUploads(dataUrl, prefix = 'file') {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${parsed.ext}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filePath, parsed.buffer);
  return `/uploads/${filename}`;
}

async function normalizeImageArray(input, prefix = 'image') {
  if (!Array.isArray(input)) return [];
  const out = [];
  
  for (const p of input) {
    let s = '';
    if (typeof p === 'string') s = p;
    else if (p && typeof p === 'object') s = p.url || p.dataUrl || p.src || p.path || '';
    if (!s) continue;
    
    if (s.startsWith('data:')) {
      const url = await saveDataUrlToUploads(s, prefix);
      if (url) out.push(url);
    } else {
      out.push(s);
    }
  }
  return out;
}

// Parse price helper
const parsePrice = (val) => {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const cleaned = String(val || '').replace(/[^0-9.]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

async function ensureVendor(user) {
  if (!user || !user.email) return null;
  
  let vendor = await Vendor.findOne({ email: user.email });
  if (!vendor) {
    // Create vendor from user data
    vendor = await Vendor.create({
      email: user.email,
      brandName: user.firstName ? `${user.firstName}'s Offerings` : 'New Vendor',
      personName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      phone: user.mobile || '',
      location: 'Default Location', // Should ideally come from user profile
      status: 'pending', // Pending approval
    });
  } else if (vendor.status === 'rejected') {
    // If vendor was previously rejected, reset to pending upon new submission
    vendor.status = 'pending';
    await vendor.save();
  }

  // Ensure user is active but DO NOT set userType to vendor yet.
  // This will be done upon admin approval.
  await User.findOneAndUpdate({ email: user.email }, { status: 'active' });
  // await Register.findOneAndUpdate({ email: user.email }, { userType: 'vendor' });

  return vendor;
}

async function syncUserProfile(email, data) {
  if (!email || !data) return;
  
  try {
    const profileData = {};
    
    // Personal Details
    if (data.firstName) profileData.firstName = data.firstName;
    if (data.lastName) profileData.lastName = data.lastName;
    if (data.personalState) profileData.state = data.personalState;
    if (data.personalCity) profileData.city = data.personalCity;
    if (data.personalPincode) profileData.personalPincode = data.personalPincode;
    
    // Country Logic
    if (data.personalCountry) {
        profileData.country = data.personalCountry;
    } else if (data.personalLocality && (data.personalLocality === 'India' || data.type === 'activity' || data.type === 'caravan')) {
         profileData.country = data.personalLocality;
    }

    if (data.personalLocality) profileData.personalLocality = data.personalLocality;
    if (data.dateOfBirth) profileData.dateOfBirth = data.dateOfBirth;
    if (data.maritalStatus) profileData.maritalStatus = data.maritalStatus;
    if (data.idProof) profileData.idProof = data.idProof;
    if (data.idPhotos && data.idPhotos.length > 0) profileData.idPhotos = data.idPhotos;

    // Business Details
    const business = {};
    if (data.brandName) business.brandName = data.brandName;
    if (data.legalCompanyName) business.legalCompanyName = data.legalCompanyName;
    if (data.gstNumber) business.gstNumber = data.gstNumber;
    
    if (data.businessEmailId) business.email = data.businessEmailId;
    if (data.businessEmail) business.email = data.businessEmail;

    if (data.businessPhoneNumber) business.phoneNumber = data.businessPhoneNumber;
    if (data.businessPhone) business.phoneNumber = data.businessPhone;

    if (data.businessLocality) business.locality = data.businessLocality;
    if (data.locality && data.type === 'stay') business.locality = data.locality;

    if (data.businessState) business.state = data.businessState;
    if (data.state && data.type === 'stay') business.state = data.state;

    if (data.businessCity) business.city = data.businessCity;
    if (data.city && data.type === 'stay') business.city = data.city;

    if (data.businessPincode) business.pincode = data.businessPincode;

    if (Object.keys(business).length > 0) {
      profileData.business = business;
    }

    if (Object.keys(profileData).length > 0) {
      // Use upsert to create if not exists
      // merge with existing business data if needed, but here we replace for simplicity/correctness of latest data
      // For deep merge, we'd need to fetch first. Mongoose findOneAndUpdate with $set works well for top level, but for nested 'business' it might replace.
      // Let's fetch and update to be safe.
      
      const profile = await Profile.findOne({ email });
      if (profile) {
        if (profileData.business) {
            profile.business = { ...profile.business, ...profileData.business };
            delete profileData.business; // handled
        }
        Object.assign(profile, profileData);
        await profile.save();
      } else {
        await Profile.create({ email, ...profileData });
      }
      console.log('[Onboarding] Synced user profile for', email);
    }
  } catch (err) {
    console.error('[Onboarding] Failed to sync user profile:', err);
  }
}


// Activity onboarding endpoint
router.post('/activity', requireJwt(), asyncWrap(async (req, res) => {
  const body = req.body || {};
  const vendor = await ensureVendor(req.user);
  
  try {
    // Normalize photos
    const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
    const strPhotos = await normalizeImageArray(rawPhotos, 'activity-photo');
    
    // Normalize cover image (Activity uses single string)
    let strCoverImage = null;
    if (body.coverImage) {
        const covers = await normalizeImageArray([body.coverImage], 'activity-cover');
        if (covers.length > 0) strCoverImage = covers[0];
    }
    
    // Normalize ID photos
    const rawIdPhotos = Array.isArray(body.idPhotos) ? body.idPhotos : [];
    const strIdPhotos = await normalizeImageArray(rawIdPhotos, 'activity-id-photo');

    const doc = await ActivityOnboarding.create({
      ...body,
      photos: strPhotos,
      coverImage: strCoverImage,
      idPhotos: strIdPhotos,
      userId: req.user._id,
      vendorId: vendor?.vendorId,
      status: 'pending'
    });

    // Sync profile
    await syncUserProfile(req.user.email, { ...body, idPhotos: strIdPhotos, type: 'activity' });

    console.log('[Onboarding] Activity created:', doc._id.toString().slice(0, 40));

    // Cancel previous pending/rejected offers for this user to avoid duplicates
    try {
      await Offer.updateMany(
        { userId: req.user._id, category: 'activity', status: { $in: ['pending', 'rejected'] } },
        { status: 'cancelled' }
      );
    } catch (e) {
      console.warn('Failed to cancel old activity offers:', e.message);
    }

    // Try to create corresponding Offer
    // Removed try-catch to ensure failure is reported if Offer creation fails
    const offerData = {
      name: doc.activityName || 'Activity',
      category: 'activity',
      description: (doc.description && String(doc.description).trim()) || 'Auto-created from activity onboarding',
      rules: doc.rules || [],
      features: doc.features || [],
      seatingCapacity: doc.personCapacity,
      sleepingCapacity: 0,
      locality: doc.locality,
      pincode: doc.pincode,
      city: doc.city || 'Default City',
      state: doc.state || 'Default State',
      regularPrice: parsePrice(doc.regularPrice ?? doc.finalPrice ?? 0),
      priceIncludes: doc.priceIncludes || [],
      priceExcludes: doc.priceExcludes || [],
      // Activity specific fields
      personCapacity: doc.personCapacity,
      timeDuration: doc.timeDuration,
      expectations: doc.expectations || [],
      serviceType: 'activity',
      
      photos: { coverUrl: strPhotos[0] || '', galleryUrls: strPhotos.slice(0, 6) },
      status: 'pending',
      userId: req.user._id,
      vendorId: vendor?.vendorId,
      sourceId: doc._id,
      sourceModel: 'ActivityOnboarding'
    };
    
    console.log('[Onboarding] Creating Offer for Activity:', offerData.name);
    try {
      await Offer.create(offerData);
    } catch (error) {
      console.error('[ERROR] Failed to create Offer for Activity:', error);
      // Delete the onboarding doc if offer creation fails to maintain consistency
      await ActivityOnboarding.findByIdAndDelete(doc._id);
      throw new Error(`Failed to create Offer: ${error.message}`);
    }

    res.status(201).json({ success: true, id: doc._id, data: doc });
  } catch (error) {
    console.error('[ERROR] Activity onboarding failed:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => 
        `${key}: ${error.errors[key].message}`
      );
      return res.status(400).json({ 
        success: false, 
        message: `Validation failed: ${validationErrors.join('; ')}`, 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

// Attach selfie to an existing activity onboarding document
router.post('/activity/selfie', requireJwt(), asyncWrap(async (req, res) => {
  const { id, imageData } = req.body || {};
  
  if (!id || !imageData) {
    return res.status(400).json({ success: false, message: 'Missing id or imageData' });
  }

  const doc = await ActivityOnboarding.findById(id);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Activity not found' });
  }

  // Check ownership
  if (doc.userId && String(doc.userId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  // Push the selfie into idPhotos
  const next = Array.isArray(doc.idPhotos) ? doc.idPhotos.slice() : [];
  next.push(typeof imageData === 'string' ? imageData : String(imageData));
  doc.idPhotos = next;
  await doc.save();

  res.status(200).json({ success: true, id: doc._id });
}));

// Caravan onboarding endpoint
router.post('/caravan', requireJwt(), asyncWrap(async (req, res) => {
  console.log('[DEBUG] Caravan onboarding request body keys:', Object.keys(req.body || {}));
  const body = req.body || {};
  const vendor = await ensureVendor(req.user);
  
  try {
    // Use MongoDB for production
    const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
    const strPhotos = await normalizeImageArray(rawPhotos, 'caravan-photo');

    // Normalize cover image (Caravan uses array)
    const rawCover = Array.isArray(body.coverImage) ? body.coverImage : (body.coverImage ? [body.coverImage] : []);
    const strCoverImage = await normalizeImageArray(rawCover, 'caravan-cover');
    
    console.log('[DEBUG] Normalized photos:', strPhotos.length, 'items');

    const doc = await CaravanOnboarding.create({
      ...body,
      photos: strPhotos,
      coverImage: strCoverImage,
      userId: req.user._id,
      vendorId: vendor?.vendorId,
      status: 'pending'
    });

    // Sync profile
    await syncUserProfile(req.user.email, { ...body, type: 'caravan' });

    console.log('[Onboarding] Caravan created:', doc._id.toString().slice(0, 40));

    // Cancel previous pending/rejected offers for this user to avoid duplicates
    try {
      const caravanCategories = ['caravan', 'campervan', 'camper-trailer', 'motorhome', 'rv'];
      await Offer.updateMany(
        { userId: req.user._id, category: { $in: caravanCategories }, status: { $in: ['pending', 'rejected'] } },
        { status: 'cancelled' }
      );
    } catch (e) {
      console.warn('Failed to cancel old caravan offers:', e.message);
    }

    // Try to create corresponding Offer
    const offerData = {
      name: doc.name || 'Caravan',
      category: doc.category || 'caravan',
      description: (doc.description && String(doc.description).trim()) || 'Auto-created from caravan onboarding',
      rules: doc.rules || [],
      features: doc.features || [],
      seatingCapacity: doc.seatingCapacity,
      sleepingCapacity: doc.sleepingCapacity,
      locality: doc.locality,
      pincode: doc.pincode,
      city: doc.city || 'Default City',
      state: doc.state || 'Default State',
      regularPrice: parsePrice(doc.perDayCharge || doc.finalPrice || 0),
      priceIncludes: doc.priceIncludes || [],
      priceExcludes: doc.priceExcludes || [],
      // Caravan specific fields
      perKmCharge: parsePrice(doc.perKmCharge),
      perDayCharge: parsePrice(doc.perDayCharge),
      perKmIncludes: doc.perKmIncludes || [],
      perKmExcludes: doc.perKmExcludes || [],
      perDayIncludes: doc.perDayIncludes || [],
      perDayExcludes: doc.perDayExcludes || [],
      serviceType: 'camper-van',

      photos: { coverUrl: strPhotos[0] || '', galleryUrls: strPhotos.slice(0, 6) },
      status: 'pending',
      userId: req.user._id,
      vendorId: vendor?.vendorId,
      sourceId: doc._id,
      sourceModel: 'CaravanOnboarding'
    };
    
    console.log('[Onboarding] Creating Offer for Caravan:', offerData.name);
    try {
      await Offer.create(offerData);
    } catch (error) {
      console.error('[ERROR] Failed to create Offer for Caravan:', error);
      await CaravanOnboarding.findByIdAndDelete(doc._id);
      throw new Error(`Failed to create Offer: ${error.message}`);
    }

    res.status(201).json({ success: true, id: doc._id, data: doc });
  } catch (error) {
    console.error('[ERROR] Caravan onboarding failed:', error);
    console.error('[ERROR] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => 
        `${key}: ${error.errors[key].message}`
      );
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

// Attach selfie to caravan onboarding
router.post('/caravan/selfie', requireJwt(), asyncWrap(async (req, res) => {
  const { id, imageData } = req.body || {};
  
  if (!id || !imageData) {
    return res.status(400).json({ success: false, message: 'Missing id or imageData' });
  }

  const doc = await CaravanOnboarding.findById(id);
  if (!doc) return res.status(404).json({ success: false, message: 'Caravan not found' });

  // Check ownership
  if (doc.userId && String(doc.userId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const asUrl = typeof imageData === 'string' && imageData.startsWith('data:')
    ? await saveDataUrlToUploads(imageData, 'caravan-selfie')
    : (typeof imageData === 'string' ? imageData : String(imageData));

  const arr = Array.isArray(doc.idPhotos) ? doc.idPhotos.slice() : [];
  arr.push(asUrl || (typeof imageData === 'string' ? imageData : String(imageData)));
  doc.idPhotos = arr;
  await doc.save();

  res.status(200).json({ success: true, id: doc._id });
}));

// Stay onboarding endpoint
router.post('/stay', requireJwt(), asyncWrap(async (req, res) => {
  const body = req.body || {};
  const vendor = await ensureVendor(req.user);
  
  // Normalize embedded base64 room photos to URLs
  try {
    if (Array.isArray(body.rooms) && body.rooms.length) {
      body.rooms = await Promise.all(body.rooms.map(async (r, idx) => {
        const photos = await normalizeImageArray(r?.photos || [], `stay-room${idx}`);
        return { ...r, photos };
      }));
    }
  } catch (e) {
    console.warn('Error normalizing room photos:', e.message);
  }

  // Normalize entire stay images
  const rawImages = Array.isArray(body.images) ? body.images : [];
  const strImages = await normalizeImageArray(rawImages, 'stay-image');

  // Normalize ID photos
  const rawIdPhotos = Array.isArray(body.idPhotos) ? body.idPhotos : [];
  const strIdPhotos = await normalizeImageArray(rawIdPhotos, 'stay-id-photo');

  const doc = await StayOnboarding.create({
    ...body,
    images: strImages,
    idPhotos: strIdPhotos,
    userId: req.user._id,
    vendorId: vendor?.vendorId,
    status: 'pending'
  });

  // Sync profile
  await syncUserProfile(req.user.email, { ...body, idPhotos: strIdPhotos, type: 'stay' });

  console.log('[Onboarding] Stay created:', doc._id.toString().slice(0, 40));

  // Cancel previous pending/rejected offers for this user to avoid duplicates
  try {
    await Offer.updateMany(
      { userId: req.user._id, category: 'stay', status: { $in: ['pending', 'rejected'] } },
      { status: 'cancelled' }
    );
  } catch (e) {
    console.warn('Failed to cancel old stay offers:', e.message);
  }

  // Try to create corresponding Offer
  // try {
    const rawPhotos = Array.isArray(doc.rooms?.[0]?.photos) ? doc.rooms[0].photos : [];
    const strPhotos = rawPhotos
      .map((p) => (typeof p === 'string' ? p : String(p)))
      .filter((s) => typeof s === 'string' && s.length > 0);

    const offerData = {
      name: doc.propertyName || doc.selectedProperties?.[0] || 'Stay',
      category: 'stay',
      description: (doc.description && String(doc.description).trim()) || 'Auto-created from stay onboarding',
      rules: [],
      features: doc.selectedFeatures || [],
      guestCapacity: doc.guestCapacity,
      numberOfBeds: doc.numberOfBeds,
      locality: doc.locality,
      pincode: doc.pincode,
      city: doc.city || 'Default City',
      state: doc.state || 'Default State',
      regularPrice: parsePrice(doc.regularPrice || doc.finalPrice || 0),
      priceIncludes: [],
      priceExcludes: [],
      // Stay specific fields
      numberOfRooms: doc.numberOfRooms,
      numberOfBeds: doc.numberOfBeds,
      guestCapacity: doc.guestCapacity,
      numberOfBathrooms: doc.numberOfBathrooms,
      stayType: doc.stayType,
      rooms: doc.rooms,
      entireStayRules: doc.entireStayRules,
      optionalRules: doc.optionalRules,
      serviceType: 'unique-stay',

      photos: { coverUrl: strPhotos[0] || '', galleryUrls: strPhotos.slice(0, 6) },
      status: 'pending',
      userId: req.user._id,
      vendorId: vendor?.vendorId,
      sourceId: doc._id,
      sourceModel: 'StayOnboarding'
    };

    console.log('[Onboarding] Creating Offer for Stay:', offerData.name);
    try {
      await Offer.create(offerData);
    } catch (error) {
      console.error('[ERROR] Failed to create Offer for Stay:', error);
      await StayOnboarding.findByIdAndDelete(doc._id);
      throw new Error(`Failed to create Offer: ${error.message}`);
    }

  res.status(201).json({ success: true, id: doc._id, data: doc });
}));

// Attach selfie to stay onboarding
router.post('/stay/selfie', requireJwt(), asyncWrap(async (req, res) => {
  const { id, imageData } = req.body || {};
  
  if (!id || !imageData) {
    return res.status(400).json({ success: false, message: 'Missing id or imageData' });
  }

  const doc = await StayOnboarding.findById(id);
  if (!doc) return res.status(404).json({ success: false, message: 'Stay not found' });

  // Check ownership
  if (doc.userId && String(doc.userId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const asUrl = typeof imageData === 'string' && imageData.startsWith('data:')
    ? await saveDataUrlToUploads(imageData, 'stay-selfie')
    : (typeof imageData === 'string' ? imageData : String(imageData));

  const next = Array.isArray(doc.images) ? doc.images.slice() : [];
  next.push(asUrl || (typeof imageData === 'string' ? imageData : String(imageData)));
  doc.images = next;
  await doc.save();

  res.status(200).json({ success: true, id: doc._id });
}));

// Get my latest onboarding submission
router.get('/mine', requireJwt(), asyncWrap(async (req, res) => {
  const userId = req.user._id;
  
  const [activity, caravan, stay] = await Promise.all([
    ActivityOnboarding.findOne({ userId }).sort({ createdAt: -1 }),
    CaravanOnboarding.findOne({ userId }).sort({ createdAt: -1 }),
    StayOnboarding.findOne({ userId }).sort({ createdAt: -1 })
  ]);

  console.log(stay);


  // Find the most recent one
  let latest = null;
  const submissions = [
    { type: 'activity', doc: activity }, 
    { type: 'caravan', doc: caravan }, 
    { type: 'stay', doc: stay }
  ].filter(x => x.doc);


  if (submissions.length > 0) {
    submissions.sort((a, b) => new Date(b.doc.createdAt) - new Date(a.doc.createdAt));
    latest = submissions[0];
  }
  console.log(`[Onboarding] User ${req.user.email} latest submission:`, latest );
  res.json({ success: true, data: latest });
}));

// List endpoints
router.get('/activity', requireJwt({ adminOnly: true }), asyncWrap(async (req, res) => {
  const list = await ActivityOnboarding.find().sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: list });
}));

router.get('/caravan', requireJwt({ adminOnly: true }), asyncWrap(async (req, res) => {
  const list = await CaravanOnboarding.find().sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: list });
}));

router.get('/stay', requireJwt({ adminOnly: true }), asyncWrap(async (req, res) => {
  const list = await StayOnboarding.find().sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: list });
}));

// Get by id endpoints
router.get('/activity/:id', requireJwt({ adminOnly: true }), asyncWrap(async (req, res) => {
  const doc = await ActivityOnboarding.findById(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Activity not found' });
  res.json({ success: true, data: doc });
}));

router.get('/caravan/:id', requireJwt({ adminOnly: true }), asyncWrap(async (req, res) => {
  const doc = await CaravanOnboarding.findById(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Caravan not found' });
  res.json({ success: true, data: doc });
}));

router.get('/stay/:id', requireJwt({ adminOnly: true }), asyncWrap(async (req, res) => {
  const doc = await StayOnboarding.findById(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Stay not found' });
  res.json({ success: true, data: doc });
}));

// Debug endpoints (only in development)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/stats', asyncWrap(async (req, res) => {
    const activityCount = await ActivityOnboarding.countDocuments();
    const caravanCount = await CaravanOnboarding.countDocuments();
    const stayCount = await StayOnboarding.countDocuments();
    res.json({ 
      success: true, 
      mockData: false, 
      stats: { 
        activities: activityCount, 
        caravans: caravanCount, 
        stays: stayCount,
        total: activityCount + caravanCount + stayCount
      } 
    });
  }));

  router.post('/debug/test', asyncWrap(async (req, res) => {
    console.log('[DEBUG TEST] Request received');
    console.log('[DEBUG TEST] Headers:', req.headers);
    console.log('[DEBUG TEST] Body keys:', Object.keys(req.body || {}));
    console.log('[DEBUG TEST] Body preview:', JSON.stringify(req.body, null, 2).slice(0, 500));
    
    res.json({
      success: true,
      message: 'Debug test endpoint working',
      receivedData: {
        bodyKeys: Object.keys(req.body || {}),
        timestamp: new Date().toISOString()
      }
    });
  }));
}

module.exports = router;
