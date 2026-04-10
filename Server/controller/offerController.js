const Offer = require('../models/Offer');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Register = require('../models/Register');
const Profile = require('../models/Profile');
const ActivityOnboarding = require('../models/ActivityOnboarding');
const CaravanOnboarding = require('../models/CaravanOnboarding');
const StayOnboarding = require('../models/StayOnboarding');
const Notification = require('../models/Notification');
const { sendRejectionEmail, sendApprovalEmail } = require('../services/mailer');
const fs = require('fs');
const path = require('path');

// Ensure uploads dir exists
const uploadsDir = path.join(process.cwd(), 'uploads');
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch {}

// Helpers
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

// Create Offer (defaults to pending)
const createOffer = async (req, res) => {
  try {
    const payload = req.body;
    
    // Normalize photos
    let coverUrl = '';
    let galleryUrls = [];

    if (payload.photos) {
        if (payload.photos.coverUrl) {
            const covers = await normalizeImageArray([payload.photos.coverUrl], 'offer-cover');
            coverUrl = covers[0] || '';
        }
        if (payload.photos.galleryUrls) {
            galleryUrls = await normalizeImageArray(payload.photos.galleryUrls, 'offer-gallery');
        }
    }
    
    // Auto-populate vendorId if not provided
    let vendorId = payload.vendorId;
    if (!vendorId && req.user) {
       const v = await Vendor.findOne({ email: req.user.email });
       if (v) vendorId = v.vendorId;
    }

    const offer = await Offer.create({
      ...payload,
      photos: { coverUrl: coverUrl, galleryUrls: galleryUrls },
      status: 'pending',
      userId: req.user._id || req.user.id,
      vendorId: vendorId // Optional, but usually we link by userId
    });

    // Create Notification for Admin
    try {
      await Notification.create({
        type: 'service_approval',
        title: 'New Service for Approval',
        message: `New service "${offer.name}" submitted for approval by ${req.user.name || 'Vendor'}.`,
        recipientRole: 'admin',
        referenceId: offer._id,
        referenceModel: 'Offer'
      });
    } catch (notifErr) {
      console.error('[Offer] Error creating admin notification:', notifErr);
    }
    
    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// List offers with optional filters and pagination
const listOffers = async (req, res) => {
  try {
    const { status, city, state, category, q, page = '1', limit = '20', sort, vendorId, mine } = req.query;
    const query = {};
    const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Ownership enforcement
    console.log('[DEBUG] listOffers query:', req.query);
    console.log('[DEBUG] listOffers user:', req.user);

    if (req.user) {
      const isAdmin = req.user.userType === 'admin' || req.user.type === 'admin' || req.user.type === 'superadmin' || req.user.role === 'admin';
      
      if (isAdmin) {
        // Admin can see everything, or filter by specific vendor if provided
        if (vendorId) query.vendorId = vendorId;
      } else if (mine === 'true' || req.query.mine) {
        // Vendor seeing their own offers
        const v = await Vendor.findOne({ email: req.user.email });
        const currentUserId = req.user._id || req.user.id;
        
        if (v && v.vendorId) {
             query.$or = [{ userId: currentUserId }, { vendorId: v.vendorId }];
        } else {
             query.userId = currentUserId;
        }
      } else {
        // Default to approved only for public/other users
        query.status = 'approved';
      }
    } else {
      // Public view
      if (mine === 'true' || req.query.mine) {
        return res.status(401).json({ success: false, message: 'Authentication required to view your offers' });
      }
      query.status = 'approved';
    }

    if (status) query.status = status;
    
    const or = [];
    if (city) {
      const rx = { $regex: esc(city), $options: 'i' };
      or.push({ city: rx });
    }
    if (state) {
      const rx = { $regex: esc(state), $options: 'i' };
      or.push({ state: rx });
    }
    if (category) query.category = { $regex: esc(category), $options: 'i' };
    if (q) {
      or.push({ name: { $regex: esc(q), $options: 'i' } }, { description: { $regex: esc(q), $options: 'i' } });
    }
    if (or.length) {
      if (query.$or) {
        // If we already have an ownership or status filter using $or, we need to AND it with the search filters
        query.$and = [
          { $or: query.$or },
          { $or: or }
        ];
        delete query.$or;
      } else {
        query.$or = or;
      }
    }
    
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    
    // pick sort
    let sortObj = { createdAt: -1 };
    if (typeof sort === 'string') {
      if (sort === 'rating') sortObj = { averageRating: -1, ratingsCount: -1, createdAt: -1 };
      else if (sort === 'price_desc') sortObj = { regularPrice: -1 };
      else if (sort === 'price_asc') sortObj = { regularPrice: 1 };
      else if (sort === 'latest') sortObj = { createdAt: -1 };
    }
    
    const [data, total] = await Promise.all([
      Offer.find(query).sort(sortObj).skip(skip).limit(limitNum),
      Offer.countDocuments(query),
    ]);
    
    res.json({ 
      success: true, 
      data, 
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single offer
const getOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update offer
const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    
    // Check ownership
    const isAdmin = req.user.userType === 'admin' || req.user.type === 'admin' || req.user.type === 'superadmin' || req.user.role === 'admin';
    const currentUserId = req.user._id || req.user.id;
    const isOwner = offer.userId === currentUserId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const payload = req.body;
    if (payload.photos) {
        if (payload.photos.coverUrl) {
             const covers = await normalizeImageArray([payload.photos.coverUrl], 'offer-cover');
             if (covers.length) payload.photos.coverUrl = covers[0];
        }
        if (payload.photos.galleryUrls) {
             payload.photos.galleryUrls = await normalizeImageArray(payload.photos.galleryUrls, 'offer-gallery');
        }
    }

    const updated = await Offer.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete offer
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

    // Check ownership
    const isAdmin = req.user.userType === 'admin' || req.user.type === 'admin' || req.user.type === 'superadmin' || req.user.role === 'admin';
    const currentUserId = req.user._id || req.user.id;
    const isOwner = offer.userId === currentUserId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await offer.deleteOne();
    res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Rate an offer (1-5)
const rateOffer = async (req, res) => {
  try {
    const { rating } = req.body;
    const r = Math.max(1, Math.min(5, Number(rating)));
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    
    const currentCount = offer.ratingsCount || 0;
    const currentSum = offer.ratingsSum || 0;
    const newCount = currentCount + 1;
    const newSum = currentSum + r;
    const newAvg = Number((newSum / newCount).toFixed(2));
    
    offer.ratingsCount = newCount;
    offer.ratingsSum = newSum;
    offer.averageRating = newAvg;
    
    await offer.save();
    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update status (approve/cancel/pending/deactivate/block/reject)
const updateOfferStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = ['pending', 'approved', 'cancelled', 'deactivated', 'blocked', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

    const isAdmin = req.user.userType === 'admin' || req.user.type === 'admin' || req.user.type === 'superadmin' || req.user.role === 'admin';
    const currentUserId = req.user._id || req.user.id;
    const isOwner = offer.userId === currentUserId;

    if (isAdmin) {
      // Admin can do anything
    } else if (isOwner) {
      // Vendor can only toggle between approved and deactivated, 
      // or cancel a pending one
      if (status === 'deactivated' && offer.status === 'approved') {
        // allow
      } else if (status === 'approved' && offer.status === 'deactivated') {
        // allow
      } else if (status === 'cancelled' && offer.status === 'pending') {
        // allow
      } else {
        return res.status(403).json({ success: false, message: 'You can only deactivate approved services or cancel pending ones' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    offer.status = status;
    await offer.save();
    
    // Sync status with source onboarding document if exists
    if (offer.sourceId && offer.sourceModel) {
      try {
        let Model;
        if (offer.sourceModel === 'ActivityOnboarding') Model = ActivityOnboarding;
        else if (offer.sourceModel === 'CaravanOnboarding') Model = CaravanOnboarding;
        else if (offer.sourceModel === 'StayOnboarding') Model = StayOnboarding;
        
        if (Model) {
          // Map statuses to Onboarding allowed values: draft, pending, approved, rejected
          let sourceStatus = status;
          if (['cancelled', 'deactivated', 'blocked'].includes(status)) {
            sourceStatus = 'rejected';
          }
          
          const updateFields = { status: sourceStatus };
          if (status === 'rejected' && reason) {
             updateFields.rejectionReason = reason;
          }

          await Model.findByIdAndUpdate(offer.sourceId, updateFields);
          console.log(`Synced status for ${offer.sourceModel} ${offer.sourceId} to ${sourceStatus}`);
        }
      } catch (err) {
        console.error(`Failed to sync status to source model: ${err.message}`);
      }
    }
    
    // Update Offer rejection reason
    if (status === 'rejected' && reason) {
        offer.rejectionReason = reason;
        await offer.save();
    }

    // Cascading Logic for Admin Actions
    if (isAdmin) {
      console.log('[DEBUG] Admin action detected. Processing cascading updates...');
      
      // Resolve User with robust lookup
      let user = null;
      let targetEmail = null;

      // 1. Try Lookup by userId
      if (offer.userId) {
          const mongoose = require('mongoose');
          console.log(`[DEBUG] Looking up user for userId: ${offer.userId}`);
          
          if (mongoose.Types.ObjectId.isValid(offer.userId)) {
              user = await User.findById(offer.userId);
          }
          if (!user) {
              user = await User.findOne({ userId: offer.userId });
          }
      }
      
      // 2. Try Lookup by vendorId
      if (!user && offer.vendorId) {
           console.log(`[DEBUG] User not found by userId. Trying vendorId: ${offer.vendorId}`);
           const vendor = await Vendor.findOne({ vendorId: offer.vendorId });
           if (vendor && vendor.email) {
               console.log(`[DEBUG] Vendor found: ${vendor.email}`);
               // Mock a user object with the email
               user = { email: vendor.email, name: vendor.personName || vendor.brandName };
               targetEmail = vendor.email;
           }
      }

      // 3. Try Lookup via Source Onboarding Document (Ultimate Fallback)
      if (!user && !targetEmail && offer.sourceId && offer.sourceModel) {
           console.log(`[DEBUG] User/Vendor not found. Trying Source Doc: ${offer.sourceModel} ${offer.sourceId}`);
           let Model;
           if (offer.sourceModel === 'ActivityOnboarding') Model = ActivityOnboarding;
           else if (offer.sourceModel === 'CaravanOnboarding') Model = CaravanOnboarding;
           else if (offer.sourceModel === 'StayOnboarding') Model = StayOnboarding;

           if (Model) {
               const doc = await Model.findById(offer.sourceId);
               if (doc) {
                   if (doc.businessEmail) {
                        targetEmail = doc.businessEmail;
                        console.log(`[DEBUG] Found businessEmail in Onboarding doc: ${targetEmail}`);
                   } else if (doc.userId) {
                        console.log(`[DEBUG] Found userId in Onboarding doc: ${doc.userId}, retrying user lookup...`);
                        // Retry user lookup with the userId from onboarding doc
                        const mongoose = require('mongoose');
                        if (mongoose.Types.ObjectId.isValid(doc.userId)) {
                            user = await User.findById(doc.userId);
                        }
                        if (!user) {
                            user = await User.findOne({ userId: doc.userId });
                        }
                   }
               }
           }
      }

      // Finalize Email Target
      if (user && user.email) {
          targetEmail = user.email;
          console.log(`[DEBUG] User found: ${user.email} (${user._id || 'mock'})`);
      }
      
      if (targetEmail) {
           console.log(`[DEBUG] Final Target Email: ${targetEmail}`);
      } else {
           console.log('[DEBUG] CRITICAL: Could not determine email address for notification.');
      }
      
      console.log(`[DEBUG] Checking Status: "${status}" (Type: ${typeof status})`);

      if (status === 'approved') {
        console.log('[DEBUG] Status is APPROVED. Activating vendor and sending email...');
        // Activate Vendor
        if (offer.vendorId) {
          await Vendor.findOneAndUpdate({ vendorId: offer.vendorId }, { status: 'approved' });
        } else if (user && user.email) {
           // Fallback: update vendor by email if vendorId missing on offer
           const normalizedEmail = user.email.toLowerCase();
           const existingVendor = await Vendor.findOne({ email: normalizedEmail });
           
           if (existingVendor) {
               existingVendor.status = 'approved';
               await existingVendor.save();
           } else {
               console.log('[DEBUG] Vendor record not found, creating new one...');
               // Create new vendor
               // Need profile for details
               try {
                   const profile = await Profile.findOne({ email: new RegExp(`^${user.email}$`, 'i') });
                   const name = (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : (user.name || 'New Vendor');
                   const loc = (profile?.city && profile?.state) ? `${profile.city}, ${profile.state}` : (user.city || 'Unknown Location');
                   
                   const newVendor = new Vendor({
                       brandName: profile?.business?.brandName || name,
                       personName: name,
                       location: loc,
                       email: normalizedEmail,
                       status: 'approved',
                       servicesOffered: [offer.category || 'Service']
                   });
                   await newVendor.save();
                   console.log('[DEBUG] Created new vendor record:', newVendor._id);
               } catch (err) {
                   console.error('[DEBUG] Failed to create vendor record:', err);
               }
           }
        }
        
        // Update User/Register to Vendor type
        if (user && user._id) { // Only if we have a real user record
            // Update User role
             await User.findByIdAndUpdate(user._id, { status: 'active', role: 'vendor' });
             await Register.findOneAndUpdate({ email: user.email }, { userType: 'vendor' });
        }
        
        // Send Approval Email
        if (targetEmail) {
            console.log(`[DEBUG] Sending Approval Email to ${targetEmail}...`);
            const mailResult = await sendApprovalEmail(targetEmail, offer.name, offer.category || 'Service');
            console.log('[DEBUG] Mail result:', mailResult ? 'Sent' : 'Failed');
        } else {
            console.log('[DEBUG] Skipping email - Target Email missing.');
        }

        // Create Notification for Vendor
        try {
          await Notification.create({
            type: 'service_approval',
            title: 'Service Approved',
            message: `Your service "${offer.name}" has been approved.`,
            recipientRole: 'vendor',
            recipientId: offer.vendorId,
            referenceId: offer._id,
            referenceModel: 'Offer'
          });
        } catch (notifErr) {
          console.error('[Offer] Error creating approval notification:', notifErr);
        }
      } else if (['rejected', 'cancelled', 'blocked'].includes(status)) {
        console.log(`[DEBUG] Status is ${status.toUpperCase()}. Sending rejection email...`);
        
        let mailReason = reason;
        if (!mailReason) {
            if (status === 'cancelled') mailReason = 'Service cancelled by admin';
            else if (status === 'blocked') mailReason = 'Service blocked by admin';
            else mailReason = 'No reason provided';
        }

        // Send rejection email
        if (targetEmail) {
           console.log(`[DEBUG] Sending Rejection Email to ${targetEmail}...`);
           const mailResult = await sendRejectionEmail(targetEmail, offer.name, mailReason);
           console.log('[DEBUG] Mail result:', mailResult ? 'Sent' : 'Failed');
        } else {
           console.log('[DEBUG] Skipping email - Target Email missing.');
        }

        // Create Notification for Vendor
        try {
          await Notification.create({
            type: status === 'rejected' ? 'service_rejection' : 'system_alert',
            title: `Service ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `Your service "${offer.name}" has been ${status}. ${reason ? 'Reason: ' + reason : ''}`,
            recipientRole: 'vendor',
            recipientId: offer.vendorId,
            referenceId: offer._id,
            referenceModel: 'Offer'
          });
        } catch (notifErr) {
          console.error('[Offer] Error creating status notification:', notifErr);
        }
      }
    } else {
        console.log('[DEBUG] Not an admin action. Skipping cascading updates.');
    }

    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOffer,
  listOffers,
  getOffer,
  updateOffer,
  deleteOffer,
  rateOffer,
  updateOfferStatus
};