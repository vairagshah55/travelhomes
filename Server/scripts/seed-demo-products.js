/**
 * Seed script — Demo CamperVan, Stay & Activity records
 * Uses actual uploaded photos from /uploads/
 *
 * Run: node scripts/seed-demo-products.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const CamperVan  = require('../models/CamperVan');
const Stay       = require('../models/Stay');
const Activity   = require('../models/Activity');
const Vendor     = require('../models/Vendor');
const User       = require('../models/User');

// ─── Photo URLs (from your uploads folder) ────────────────────────────────────
const CARAVAN_PHOTOS = [
  '/uploads/caravan-photo-1757658512072-cekm5c.jpg',
  '/uploads/caravan-photo-1757658512074-u36btp.png',
  '/uploads/caravan-photo-1757658512076-67033f.png',
  '/uploads/caravan-photo-1757658512079-1p2n9j.png',
  '/uploads/caravan-photo-1757658512080-fj8q4d.webp',
  '/uploads/caravan-photo-1757658513326-fdwk9p.jpg',
  '/uploads/caravan-photo-1757658513327-r0qmu0.png',
  '/uploads/caravan-photo-1757658513328-3mh3nr.png',
  '/uploads/caravan-photo-1757658513329-39sl57.png',
  '/uploads/caravan-photo-1757658513333-lufmgx.webp',
  '/uploads/caravan-photo-1757658513959-krul6e.jpg',
  '/uploads/caravan-photo-1757658513960-mt18gn.png',
  '/uploads/caravan-photo-1757658513961-41muba.png',
  '/uploads/caravan-photo-1757658513964-3uvxqt.png',
  '/uploads/caravan-photo-1757658514163-phm5kk.jpg',
  '/uploads/caravan-photo-1757658514163-qlzhpd.png',
];

const ACTIVITY_PHOTOS = [
  '/uploads/activity-photo-1757658458408-zdmehz.jpg',
  '/uploads/activity-photo-1757658458411-qom7r0.png',
  '/uploads/activity-photo-1757658458412-1n8xv6.png',
  '/uploads/activity-photo-1757658458414-ngghdp.png',
  '/uploads/activity-photo-1757658458417-3k5sh6.webp',
  '/uploads/activity-photo-1768384622663-jl8xxg.jpg',
  '/uploads/activity-photo-1768384622676-ur7xck.jpg',
  '/uploads/activity-photo-1768384622704-1t7hsf.jpg',
  '/uploads/activity-photo-1768384622725-jc1sid.jpg',
  '/uploads/activity-photo-1768384631069-03411w.jpg',
  '/uploads/activity-photo-1768384631082-el9l6k.jpg',
  '/uploads/activity-photo-1768384631118-k14395.jpg',
  '/uploads/activity-photo-1768384631161-0wyy6i.jpg',
  '/uploads/activity-photo-1768384633596-tr2ral.jpg',
  '/uploads/activity-photo-1768384633607-uvmsbe.jpg',
  '/uploads/activity-photo-1768384633638-5ml6jy.jpg',
];

const STAY_PHOTOS = [
  '/uploads/stay-room0-1768462601470-hq0dsb.jpg',
  '/uploads/stay-room0-1768462920298-aw28gy.jpg',
  '/uploads/stay-room0-1768462998765-00alzd.jpg',
  '/uploads/stay-room0-1768463047350-643del.jpg',
];

// ─── Helper: split photos into chunks ─────────────────────────────────────────
const chunk = (arr, size) => arr.reduce((acc, _, i) =>
  i % size === 0 ? [...acc, arr.slice(i, i + size)] : acc, []);

const caravan4 = chunk(CARAVAN_PHOTOS, 4);   // 4 groups of 4 photos each
const activity4 = chunk(ACTIVITY_PHOTOS, 4);

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // ── 1. Get or create demo vendor ──────────────────────────────────────────
  let vendor = await Vendor.findOne({ email: 'demo.vendor@travelhomes.com' });
  if (!vendor) {
    vendor = await Vendor.create({
      brandName: 'TravelHomes Demo',
      personName: 'Demo Vendor',
      email: 'demo.vendor@travelhomes.com',
      phone: '9000000001',
      location: 'Mumbai, Maharashtra',
      status: 'approved',
      servicesOffered: ['campervan', 'activity'],
      listedServices: 4,
    });
    console.log('✅ Demo vendor created:', vendor._id);
  } else {
    console.log('ℹ️  Demo vendor already exists:', vendor._id);
  }

  // ── 2. Get or create demo user (for Stay vendorId ref) ────────────────────
  let user = await User.findOne({ email: 'demo.user@travelhomes.com' });
  if (!user) {
    user = await User.create({
      name: 'Demo Host',
      fullname: 'Demo Host',
      email: 'demo.user@travelhomes.com',
      phone: '9000000002',
      mobile: '9000000002',
      role: 'vendor',
      status: 'active',
      isActive: true,
      username: 'demohost001',
      uid: 1000001,
      location: 'Mumbai',
      userType: 'vendor',
      userSince: new Date(),
    });
    console.log('✅ Demo user created:', user._id);
  } else {
    console.log('ℹ️  Demo user already exists:', user._id);
  }

  const vendorId    = vendor._id.toString();
  const vendorObjId = vendor._id;
  const userObjId   = user._id;

  // ── 3. Seed CamperVans ────────────────────────────────────────────────────
  const camperVans = [
    {
      vendorId,
      name: 'Wanderer Deluxe Camper',
      description: 'Fully equipped luxury camper van perfect for long road trips. Includes kitchen, cozy sleeping area, and panoramic roof windows. Ideal for couples and solo travelers exploring scenic routes.',
      locality: 'Juhu Beach Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400049',
      status: 'approved',
      features: ['AC', 'Kitchen', 'Solar Panel', 'GPS Navigation', 'WiFi', 'Fridge', 'Microwave', 'Shower'],
      images: caravan4[0] || CARAVAN_PHOTOS.slice(0, 4),
      pricePerDay: 4500,
      maxGuests: 2,
      phone: '9000000001',
      email: 'demo.vendor@travelhomes.com',
    },
    {
      vendorId,
      name: 'Adventure Trail Van',
      description: 'Rugged off-road camper built for adventure seekers. 4WD capability with roof tent, camp kitchen, and adventure gear storage. Perfect for hill stations and forest trails.',
      locality: 'Koregaon Park',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      status: 'approved',
      features: ['4WD', 'Roof Tent', 'Camp Kitchen', 'Gear Storage', 'USB Charging', 'First Aid Kit'],
      images: caravan4[1] || CARAVAN_PHOTOS.slice(4, 8),
      pricePerDay: 3800,
      maxGuests: 4,
      phone: '9000000001',
      email: 'demo.vendor@travelhomes.com',
    },
    {
      vendorId,
      name: 'Family Road Cruiser',
      description: 'Spacious family camper van with bunk beds, entertainment system, and full kitchen. Designed for family holidays across India\'s highways. Safe, comfortable, and reliable.',
      locality: 'Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
      status: 'approved',
      features: ['Bunk Beds', 'AC', 'TV', 'Full Kitchen', 'Safety Locks', 'Child Seats', 'Backup Camera'],
      images: caravan4[2] || CARAVAN_PHOTOS.slice(8, 12),
      pricePerDay: 5500,
      maxGuests: 6,
      phone: '9000000001',
      email: 'demo.vendor@travelhomes.com',
    },
    {
      vendorId,
      name: 'Himalayan Explorer',
      description: 'High-altitude camper van specially designed for mountain terrain. Insulated walls, heating system, and all-terrain tyres for Ladakh, Spiti, and Manali roads.',
      locality: 'Mall Road',
      city: 'Manali',
      state: 'Himachal Pradesh',
      pincode: '175131',
      status: 'approved',
      features: ['Heating System', 'Insulated Walls', 'All-Terrain Tyres', 'Oxygen Kit', 'Satellite Phone', 'Snow Chains'],
      images: caravan4[3] || CARAVAN_PHOTOS.slice(12, 16),
      pricePerDay: 6000,
      maxGuests: 3,
      phone: '9000000001',
      email: 'demo.vendor@travelhomes.com',
    },
  ];

  for (const cv of camperVans) {
    const exists = await CamperVan.findOne({ name: cv.name, vendorId });
    if (!exists) {
      await CamperVan.create(cv);
      console.log(`  ✅ CamperVan: ${cv.name}`);
    } else {
      console.log(`  ℹ️  CamperVan already exists: ${cv.name}`);
    }
  }

  // ── 4. Seed Stays ─────────────────────────────────────────────────────────
  const stays = [
    {
      vendorId: userObjId,
      title: 'Beachfront Paradise Villa',
      description: 'Stunning beachfront villa with direct beach access, private pool, and breathtaking sea views. Wake up to the sound of waves and enjoy world-class amenities in a tropical setting.',
      category: 'villa',
      address: { locality: 'Calangute Beach', city: 'Goa', state: 'Goa', pincode: '403516', country: 'India' },
      photos: STAY_PHOTOS,
      amenities: ['Private Pool', 'Beach Access', 'WiFi', 'AC', 'Kitchen', 'Parking', 'BBQ', 'Outdoor Shower'],
      rooms: [
        {
          name: 'Master Suite',
          description: 'King bed with sea view and private balcony',
          capacity: 2, bedCount: 1, price: 8000,
          amenities: ['King Bed', 'Sea View', 'Balcony', 'AC', 'En-suite Bathroom'],
          photos: STAY_PHOTOS.slice(0, 2),
        },
        {
          name: 'Guest Room',
          description: 'Comfortable twin room with garden view',
          capacity: 2, bedCount: 2, price: 5000,
          amenities: ['Twin Beds', 'Garden View', 'AC', 'Attached Bathroom'],
          photos: STAY_PHOTOS.slice(2, 4),
        },
      ],
      policies: {
        checkIn: '14:00', checkOut: '11:00',
        cancellation: 'Free cancellation up to 48 hours before check-in',
        rules: ['No smoking', 'No loud music after 10 PM', 'No outside guests'],
      },
      pricing: { basePrice: 8000, currency: 'INR', taxRate: 12 },
      priceIncludes: ['Breakfast', 'Airport Pickup', 'Beach Towels', 'Welcome Drinks'],
      priceExcludes: ['Lunch & Dinner', 'Water Sports', 'Alcohol'],
      availability: { isActive: true, minStay: 2, maxStay: 14 },
      ratings: { average: 4.8, count: 124 },
      status: 'approved',
    },
    {
      vendorId: userObjId,
      title: 'Mountain View Homestay',
      description: 'Cozy homestay nestled in the Himalayas with panoramic mountain views, bonfire evenings, and authentic Himachali meals. A perfect escape from city life.',
      category: 'homestay',
      address: { locality: 'Old Manali', city: 'Manali', state: 'Himachal Pradesh', pincode: '175131', country: 'India' },
      photos: STAY_PHOTOS,
      amenities: ['Bonfire', 'Home-cooked Meals', 'WiFi', 'Heating', 'Parking', 'Garden', 'Trekking Guide'],
      rooms: [
        {
          name: 'Himalayan Room',
          description: 'Wooden cabin room with valley view',
          capacity: 2, bedCount: 1, price: 2500,
          amenities: ['Valley View', 'Wooden Decor', 'Heater', 'Hot Water'],
          photos: STAY_PHOTOS.slice(0, 2),
        },
        {
          name: 'Family Cottage',
          description: 'Spacious cottage with 2 rooms for families',
          capacity: 4, bedCount: 2, price: 4500,
          amenities: ['2 Bedrooms', 'Living Area', 'Mountain View', 'Heater'],
          photos: STAY_PHOTOS.slice(2, 4),
        },
      ],
      policies: {
        checkIn: '13:00', checkOut: '11:00',
        cancellation: 'Free cancellation up to 72 hours before check-in',
        rules: ['No smoking indoors', 'Respect local culture', 'Quiet hours 10 PM–7 AM'],
      },
      pricing: { basePrice: 2500, currency: 'INR', taxRate: 5 },
      priceIncludes: ['Breakfast & Dinner', 'Bonfire', 'Local Guide'],
      priceExcludes: ['Trekking Equipment', 'Alcohol', 'Lunch'],
      availability: { isActive: true, minStay: 1, maxStay: 30 },
      ratings: { average: 4.6, count: 89 },
      status: 'approved',
    },
    {
      vendorId: userObjId,
      title: 'Urban Luxury Apartment',
      description: 'Sleek, modern apartment in the heart of Bangalore with rooftop access, co-working space, and premium amenities. Ideal for business travelers and digital nomads.',
      category: 'apartment',
      address: { locality: 'Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560034', country: 'India' },
      photos: STAY_PHOTOS,
      amenities: ['Rooftop', 'Co-working Space', 'High-speed WiFi', 'AC', 'Gym', 'Laundry', '24/7 Security'],
      rooms: [
        {
          name: 'Studio Suite',
          description: 'Modern studio with city view',
          capacity: 2, bedCount: 1, price: 3500,
          amenities: ['City View', 'Smart TV', 'Mini Kitchen', 'AC', 'High-speed WiFi'],
          photos: STAY_PHOTOS.slice(0, 2),
        },
      ],
      policies: {
        checkIn: '15:00', checkOut: '11:00',
        cancellation: 'Free cancellation up to 24 hours before check-in',
        rules: ['No parties', 'No smoking', 'No pets'],
      },
      pricing: { basePrice: 3500, currency: 'INR', taxRate: 12 },
      priceIncludes: ['High-speed WiFi', 'Co-working Access', 'Gym Access'],
      priceExcludes: ['Meals', 'Laundry', 'Parking'],
      availability: { isActive: true, minStay: 1, maxStay: 90 },
      ratings: { average: 4.5, count: 67 },
      status: 'approved',
    },
    {
      vendorId: userObjId,
      title: 'Royal Heritage Haveli',
      description: 'Step into royal Rajasthani living in this authentic 200-year-old restored haveli. Intricate architecture, courtyard dining, cultural performances, and regal hospitality.',
      category: 'hotel',
      address: { locality: 'Old City', city: 'Jaipur', state: 'Rajasthan', pincode: '302001', country: 'India' },
      photos: STAY_PHOTOS,
      amenities: ['Courtyard', 'Cultural Performances', 'Rooftop Restaurant', 'Heritage Tour', 'Spa', 'Camel Ride'],
      rooms: [
        {
          name: 'Royal Suite',
          description: 'Opulent suite with Rajasthani artwork and private courtyard',
          capacity: 2, bedCount: 1, price: 12000,
          amenities: ['Private Courtyard', 'Antique Furniture', 'Clawfoot Tub', 'Butler Service'],
          photos: STAY_PHOTOS.slice(0, 2),
        },
        {
          name: 'Heritage Room',
          description: 'Tastefully decorated room with traditional Rajasthani motifs',
          capacity: 2, bedCount: 1, price: 6000,
          amenities: ['Traditional Decor', 'AC', 'En-suite Bathroom', 'City View'],
          photos: STAY_PHOTOS.slice(2, 4),
        },
      ],
      policies: {
        checkIn: '14:00', checkOut: '12:00',
        cancellation: 'Free cancellation up to 48 hours before check-in',
        rules: ['No smoking in rooms', 'Dress code for dinner', 'Photography allowed'],
      },
      pricing: { basePrice: 6000, currency: 'INR', taxRate: 18 },
      priceIncludes: ['Heritage Tour', 'Welcome Drink', 'Cultural Performance'],
      priceExcludes: ['Meals', 'Spa Services', 'Camel Ride'],
      availability: { isActive: true, minStay: 1, maxStay: 7 },
      ratings: { average: 4.9, count: 203 },
      status: 'approved',
    },
  ];

  for (const stay of stays) {
    const exists = await Stay.findOne({ title: stay.title });
    if (!exists) {
      await Stay.create(stay);
      console.log(`  ✅ Stay: ${stay.title}`);
    } else {
      console.log(`  ℹ️  Stay already exists: ${stay.title}`);
    }
  }

  // ── 5. Seed Activities ────────────────────────────────────────────────────
  const activities = [
    {
      vendorId: vendorObjId,
      name: 'Scuba Diving Adventure',
      description: 'Explore the vibrant underwater world of Goa with certified instructors. Suitable for beginners and experienced divers. Includes all equipment, safety briefing, and underwater photos.',
      category: 'Water Sports',
      images: activity4[0] || ACTIVITY_PHOTOS.slice(0, 4),
      regularPrice: 3500,
      salePrice: 2999,
      duration: '3 hours',
      maxParticipants: 10,
      minAge: 12,
      difficulty: 'moderate',
      included: ['All Diving Equipment', 'Certified Instructor', 'Underwater Photos', 'Refreshments', 'Insurance'],
      excluded: ['Hotel Pickup', 'Meals', 'Personal Expenses'],
      requirements: ['Basic Swimming Skills', 'No Heart Conditions', 'Medical Fitness'],
      cancellationPolicy: 'Free cancellation up to 24 hours before activity. 50% refund within 24 hours.',
      location: { address: 'Baga Beach Dive Center', locality: 'Baga Beach', city: 'Goa', state: 'Goa', pincode: '403516', coordinates: { latitude: 15.5563, longitude: 73.7541 } },
      availability: {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        timeSlots: [
          { startTime: '07:00', endTime: '10:00', maxBookings: 10 },
          { startTime: '12:00', endTime: '15:00', maxBookings: 10 },
        ],
      },
      ratings: { average: 4.8, count: 156 },
      status: 'approved',
      featured: true,
      tags: ['water', 'diving', 'adventure', 'goa', 'beach'],
    },
    {
      vendorId: vendorObjId,
      name: 'Himalayan Trek — Triund Peak',
      description: 'A breathtaking one-day trek to Triund Peak offering panoramic views of the Dhauladhar range. Guided trek with camping option. Suitable for beginners with moderate fitness.',
      category: 'Trekking',
      images: activity4[1] || ACTIVITY_PHOTOS.slice(4, 8),
      regularPrice: 1800,
      salePrice: 1499,
      duration: '8 hours',
      maxParticipants: 15,
      minAge: 10,
      difficulty: 'moderate',
      included: ['Certified Trek Guide', 'Lunch & Snacks', 'First Aid Kit', 'Trek Permit', 'Bonfire at Summit'],
      excluded: ['Personal Trekking Gear', 'Hotel', 'Transport to Base'],
      requirements: ['Comfortable Trekking Shoes', 'Light Backpack', 'Water Bottle'],
      cancellationPolicy: 'Free cancellation up to 48 hours before activity.',
      location: { address: 'McLeodGanj Trek Start Point', locality: 'McLeodGanj', city: 'Dharamsala', state: 'Himachal Pradesh', pincode: '176219', coordinates: { latitude: 32.2426, longitude: 76.3234 } },
      availability: {
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-11-30'),
        timeSlots: [
          { startTime: '06:00', endTime: '14:00', maxBookings: 15 },
        ],
      },
      ratings: { average: 4.7, count: 98 },
      status: 'approved',
      featured: true,
      tags: ['trekking', 'himalayas', 'nature', 'adventure', 'camping'],
    },
    {
      vendorId: vendorObjId,
      name: 'Rajasthani Cooking Masterclass',
      description: 'Learn the art of authentic Rajasthani cuisine from a master chef. Cook dal baati churma, laal maas, and ghevar. Includes a market tour, hands-on cooking, and a full meal.',
      category: 'Cooking Class',
      images: activity4[2] || ACTIVITY_PHOTOS.slice(8, 12),
      regularPrice: 2500,
      salePrice: 1999,
      duration: '4 hours',
      maxParticipants: 8,
      minAge: 8,
      difficulty: 'easy',
      included: ['All Ingredients', 'Master Chef Instructor', 'Recipe Book', 'Full Meal', 'Market Tour'],
      excluded: ['Transport', 'Alcoholic Beverages'],
      requirements: ['No prior cooking experience needed', 'Inform of any dietary restrictions'],
      cancellationPolicy: 'Free cancellation up to 24 hours before class.',
      location: { address: 'Heritage Cooking Studio, Old City', locality: 'Old City', city: 'Jaipur', state: 'Rajasthan', pincode: '302001', coordinates: { latitude: 26.9124, longitude: 75.7873 } },
      availability: {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        timeSlots: [
          { startTime: '09:00', endTime: '13:00', maxBookings: 8 },
          { startTime: '16:00', endTime: '20:00', maxBookings: 8 },
        ],
      },
      ratings: { average: 4.9, count: 74 },
      status: 'approved',
      featured: false,
      tags: ['cooking', 'culture', 'rajasthan', 'food', 'jaipur'],
    },
    {
      vendorId: vendorObjId,
      name: 'Kerala Backwater Kayaking',
      description: 'Paddle through the serene backwaters of Alleppey, exploring hidden canals, village life, and exotic bird sanctuaries. A peaceful, eco-friendly experience in God\'s Own Country.',
      category: 'Water Sports',
      images: activity4[3] || ACTIVITY_PHOTOS.slice(12, 16),
      regularPrice: 2200,
      salePrice: 1800,
      duration: '3 hours',
      maxParticipants: 12,
      minAge: 6,
      difficulty: 'easy',
      included: ['Kayak & Paddle', 'Life Jacket', 'Guide', 'Coconut Water & Snacks', 'Bird Watching Guide'],
      excluded: ['Hotel Pickup', 'Swimming', 'Meals'],
      requirements: ['No swimming skills required', 'Life jacket provided', 'Light clothing recommended'],
      cancellationPolicy: 'Free cancellation up to 24 hours before activity.',
      location: { address: 'Alleppey Backwater Jetty', locality: 'Alleppey Beach', city: 'Alappuzha', state: 'Kerala', pincode: '688012', coordinates: { latitude: 9.4981, longitude: 76.3388 } },
      availability: {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        timeSlots: [
          { startTime: '07:00', endTime: '10:00', maxBookings: 12 },
          { startTime: '15:00', endTime: '18:00', maxBookings: 12 },
        ],
      },
      ratings: { average: 4.6, count: 112 },
      status: 'approved',
      featured: true,
      tags: ['kayaking', 'kerala', 'backwaters', 'nature', 'eco-tourism'],
    },
  ];

  for (const activity of activities) {
    const exists = await Activity.findOne({ name: activity.name });
    if (!exists) {
      await Activity.create(activity);
      console.log(`  ✅ Activity: ${activity.name}`);
    } else {
      console.log(`  ℹ️  Activity already exists: ${activity.name}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const cvCount  = await CamperVan.countDocuments({ status: 'approved' });
  const stayCount = await Stay.countDocuments({ status: 'approved' });
  const actCount  = await Activity.countDocuments({ status: 'approved' });

  console.log('\n─────────────────────────────────────');
  console.log('  Seed complete!');
  console.log(`  CamperVans  : ${cvCount}`);
  console.log(`  Stays       : ${stayCount}`);
  console.log(`  Activities  : ${actCount}`);
  console.log('─────────────────────────────────────');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
