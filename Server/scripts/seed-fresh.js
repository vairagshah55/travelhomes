/**
 * Fresh seed script — Deletes old offers & images, downloads HD images, creates 4 of each type
 *
 * Run:  node scripts/seed-fresh.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Offer = require('../models/Offer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// ─── HD Image URLs (Unsplash – free to use) ─────────────────────────────────
// Each listing gets 5 HD photos (1 cover + 4 gallery)

const IMAGE_URLS = {
  campervans: [
    // Van 1 – Coastal Cruiser (Goa)
    [
      'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1533591380348-14193f1de18f?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1200&h=800&fit=crop&q=80',
    ],
    // Van 2 – Mountain Explorer (Leh-Ladakh)
    [
      'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515876305430-f06edab8282a?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1501785888108-9e3b17b5e7c6?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?w=1200&h=800&fit=crop&q=80',
    ],
    // Van 3 – Forest Wanderer (Coorg)
    [
      'https://images.unsplash.com/photo-1564998651682-bf8ae3851fa0?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1537905569824-f89f14cceb68?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517824806704-9040b037703b?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=1200&h=800&fit=crop&q=80',
    ],
    // Van 4 – Desert Nomad (Jaisalmer)
    [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542401886-65d6c61db217?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504457047772-27faf1c00561?w=1200&h=800&fit=crop&q=80',
    ],
  ],
  stays: [
    // Stay 1 – Lakeside Treehouse (Munnar)
    [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&h=800&fit=crop&q=80',
    ],
    // Stay 2 – Luxury Beach Villa (Goa)
    [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1200&h=800&fit=crop&q=80',
    ],
    // Stay 3 – Snow Valley Cabin (Manali)
    [
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&q=80',
    ],
    // Stay 4 – Royal Heritage Haveli (Jaipur)
    [
      'https://images.unsplash.com/photo-1564013799919-ab6a1cded7e8?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a6300d5296f?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d955e4f38?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&h=800&fit=crop&q=80',
    ],
  ],
  activities: [
    // Activity 1 – Paragliding (Bir Billing)
    [
      'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527004013836-58c2f1028f1e?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503220317266-8c3daeecaa8f?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?w=1200&h=800&fit=crop&q=80',
    ],
    // Activity 2 – White Water Rafting (Rishikesh)
    [
      'https://images.unsplash.com/photo-1530870110042-98b2cb110834?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=1200&h=800&fit=crop&q=80',
    ],
    // Activity 3 – Scuba Diving (Andaman)
    [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1200&h=800&fit=crop&q=80',
    ],
    // Activity 4 – Mountain Trekking (Manali)
    [
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1200&h=800&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=800&fit=crop&q=80',
    ],
  ],
};

// ─── Offer definitions ──────────────────────────────────────────────────────

const CAMPERVAN_OFFERS = [
  {
    name: 'Coastal Cruiser Van',
    city: 'Goa', state: 'Goa', locality: 'Calangute Beach', pincode: '403516',
    regularPrice: 4500, perDayCharge: 4500, seatingCapacity: 4, sleepingCapacity: 4,
    features: ['AC', 'Kitchen', 'Solar Panel', 'WiFi', 'Outdoor Shower', 'Surfboard Rack'],
    description: 'Cruise the Goan coastline in this fully equipped beach-ready camper. Wake up to ocean views, cook fresh catches in the mini kitchen, and hit the waves anytime.',
  },
  {
    name: 'Mountain Explorer Van',
    city: 'Leh', state: 'Ladakh', locality: 'Main Bazaar', pincode: '194101',
    regularPrice: 6500, perDayCharge: 6500, seatingCapacity: 3, sleepingCapacity: 3,
    features: ['Heating', 'Oxygen Kit', 'All-Terrain Tyres', 'GPS', 'Insulated Walls', 'Snow Chains'],
    description: 'Conquer the highest passes in India with this rugged mountain-ready camper. Built for extreme altitudes with heating, oxygen support, and panoramic windows.',
  },
  {
    name: 'Forest Wanderer Van',
    city: 'Coorg', state: 'Karnataka', locality: 'Madikeri', pincode: '571201',
    regularPrice: 3800, perDayCharge: 3800, seatingCapacity: 4, sleepingCapacity: 4,
    features: ['Rooftop Tent', 'Camp Stove', 'Hammock', 'Bird Guide', 'Rain Gear', 'Firewood'],
    description: 'Disappear into the coffee plantations and misty forests of Coorg. This nature-focused camper comes with everything you need for a forest retreat.',
  },
  {
    name: 'Desert Nomad Van',
    city: 'Jaisalmer', state: 'Rajasthan', locality: 'Sam Sand Dunes', pincode: '345001',
    regularPrice: 5200, perDayCharge: 5200, seatingCapacity: 4, sleepingCapacity: 4,
    features: ['AC', 'Sand Anchors', 'Stargazing Kit', 'Bonfire Setup', 'Solar Power', 'Cooler Box'],
    description: 'Navigate the golden dunes of the Thar Desert in ultimate comfort. Solar-powered AC, stargazing equipment, and bonfire setup included.',
  },
];

const STAY_OFFERS = [
  {
    name: 'Lakeside Treehouse Retreat',
    city: 'Munnar', state: 'Kerala', locality: 'Pothamedu', pincode: '685612',
    regularPrice: 7500, guestCapacity: 4, numberOfBeds: 2, numberOfRooms: 1, numberOfBathrooms: 1,
    stayType: 'resort',
    features: ['Lake View', 'Private Deck', 'WiFi', 'Room Service', 'Nature Trail', 'Bonfire'],
    description: 'Perched among the treetops overlooking a serene lake, this unique treehouse retreat offers an unforgettable stay amidst the tea gardens of Munnar.',
  },
  {
    name: 'Luxury Beachfront Villa',
    city: 'Goa', state: 'Goa', locality: 'Vagator Beach', pincode: '403509',
    regularPrice: 12000, guestCapacity: 6, numberOfBeds: 4, numberOfRooms: 3, numberOfBathrooms: 3,
    stayType: 'villa',
    features: ['Private Pool', 'Beach Access', 'Chef on Call', 'AC', 'Home Theatre', 'Garden'],
    description: 'A stunning beachfront villa with private pool, direct beach access, and panoramic sea views. Perfect for families and groups seeking luxury by the sea.',
  },
  {
    name: 'Snow Valley Cabin',
    city: 'Manali', state: 'Himachal Pradesh', locality: 'Old Manali', pincode: '175131',
    regularPrice: 4500, guestCapacity: 4, numberOfBeds: 2, numberOfRooms: 2, numberOfBathrooms: 1,
    stayType: 'homestay',
    features: ['Fireplace', 'Mountain View', 'Home-cooked Meals', 'Heating', 'Trekking Guide', 'Parking'],
    description: 'A cozy wooden cabin nestled in the snow-capped mountains of Manali. Wake up to stunning valley views and warm yourself by the fireplace.',
  },
  {
    name: 'Royal Heritage Haveli',
    city: 'Jaipur', state: 'Rajasthan', locality: 'Old City', pincode: '302001',
    regularPrice: 9000, guestCapacity: 4, numberOfBeds: 3, numberOfRooms: 2, numberOfBathrooms: 2,
    stayType: 'hotel',
    features: ['Courtyard', 'Rooftop Restaurant', 'Heritage Tour', 'Spa', 'Cultural Performances', 'WiFi'],
    description: 'Step into royalty at this beautifully restored 200-year-old haveli. Intricate frescoes, a rooftop restaurant with fort views, and authentic Rajasthani hospitality.',
  },
];

const ACTIVITY_OFFERS = [
  {
    name: 'Paragliding at Bir Billing',
    city: 'Bir', state: 'Himachal Pradesh', locality: 'Billing Launch Site', pincode: '176077',
    regularPrice: 3500, discountPrice: 2999, personCapacity: 6, timeDuration: '2 hours',
    features: ['Tandem Pilot', 'GoPro Video', 'Safety Gear', 'Transport to Launch', 'Certificate'],
    description: 'Soar over the Kangra Valley from the world\'s second-highest paragliding site. Tandem flights with certified pilots, HD video recording, and breathtaking Himalayan views.',
  },
  {
    name: 'White Water Rafting',
    city: 'Rishikesh', state: 'Uttarakhand', locality: 'Shivpuri', pincode: '249302',
    regularPrice: 2000, discountPrice: 1599, personCapacity: 12, timeDuration: '3 hours',
    features: ['Life Jacket', 'Helmet', 'Professional Guide', 'Cliff Jumping', 'Changing Room'],
    description: 'Navigate Grade III and IV rapids on the holy Ganges. 16km of thrilling white water, cliff jumping stops, and riverside camping options.',
  },
  {
    name: 'Scuba Diving Adventure',
    city: 'Havelock', state: 'Andaman & Nicobar', locality: 'Neil Island', pincode: '744211',
    regularPrice: 4500, discountPrice: 3799, personCapacity: 8, timeDuration: '4 hours',
    features: ['All Equipment', 'Certified Instructor', 'Underwater Photos', 'Insurance', 'Lunch'],
    description: 'Explore the crystal-clear waters of the Andaman Sea. Dive among vibrant coral reefs, tropical fish, and sea turtles with PADI-certified instructors.',
  },
  {
    name: 'Himalayan Trek — Hampta Pass',
    city: 'Manali', state: 'Himachal Pradesh', locality: 'Jobra', pincode: '175131',
    regularPrice: 5500, discountPrice: 4499, personCapacity: 15, timeDuration: '4 days',
    features: ['Trek Guide', 'All Meals', 'Camping Gear', 'First Aid', 'Permits', 'Porter Support'],
    description: 'Cross the dramatic Hampta Pass at 4,270m — from lush green valleys to stark desert landscapes. All-inclusive trek with experienced guides and mountain camping.',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const request = proto.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(filepath); });
      file.on('error', (err) => { fs.unlink(filepath, () => {}); reject(err); });
    });
    request.on('error', reject);
    request.setTimeout(30000, () => { request.destroy(); reject(new Error('Timeout')); });
  });
}

function generateFilename(prefix, index) {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${ts}-${rand}-${index}.jpg`;
}

// ─── Main seed ──────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // ── 1. Delete ALL existing seeded offers ─────────────────────────────────
  const allNames = [
    ...CAMPERVAN_OFFERS.map(o => o.name),
    ...STAY_OFFERS.map(o => o.name),
    ...ACTIVITY_OFFERS.map(o => o.name),
  ];

  // Also delete old seed offers by name (from previous seed script)
  const oldNames = [
    'Wanderer Deluxe Camper', 'Adventure Trail Van', 'Family Road Cruiser', 'Himalayan Explorer',
    'Coastal Breeze Camper', 'Forest Retreat Van', 'Urban Explorer Camper', 'Mountain Bliss Van',
    'Desert Safari Camper', 'Sunrise Camper', 'Riverside Retreat Van', 'Valley View Camper', 'Sunset Cruiser Van',
    'Scuba Diving Adventure', 'Himalayan Trek — Triund Peak', 'Rajasthani Cooking Masterclass',
    'Kerala Backwater Kayaking', 'Paragliding in Bir Billing', 'White Water Rafting Rishikesh',
    'Desert Safari & Dune Bashing', 'Zip-lining in Munnar', 'Rock Climbing Workshop',
    'Sunset Camel Safari', 'Night Sky Stargazing Camp',
    'Beachfront Paradise Villa', 'Mountain View Homestay', 'Urban Luxury Apartment', 'Royal Heritage Haveli',
  ];

  const deleted = await Offer.deleteMany({ name: { $in: [...allNames, ...oldNames] } });
  console.log(`🗑️  Removed ${deleted.deletedCount} old seeded offer(s)`);

  // ── 2. Delete old seed images from uploads ───────────────────────────────
  console.log('\n🧹 Cleaning old seed images...');
  let deletedFiles = 0;
  if (fs.existsSync(UPLOADS_DIR)) {
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const file of files) {
      if (/^(caravan-photo-|activity-photo-|stay-room)/.test(file)) {
        fs.unlinkSync(path.join(UPLOADS_DIR, file));
        deletedFiles++;
      }
    }
  }
  console.log(`  Deleted ${deletedFiles} old image files`);

  // Ensure uploads dir exists
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // ── 3. Download new HD images ────────────────────────────────────────────
  console.log('\n📸 Downloading HD images...');

  async function downloadBatch(urls, prefix, listingIndex) {
    const paths = [];
    for (let i = 0; i < urls.length; i++) {
      const filename = generateFilename(prefix, `${listingIndex}-${i}`);
      const filepath = path.join(UPLOADS_DIR, filename);
      try {
        await downloadImage(urls[i], filepath);
        paths.push(`/uploads/${filename}`);
        process.stdout.write('.');
      } catch (err) {
        console.warn(`\n  ⚠️  Failed to download image ${i} for ${prefix} ${listingIndex}: ${err.message}`);
      }
    }
    return paths;
  }

  // Download campervan images
  const campervanPhotos = [];
  for (let i = 0; i < IMAGE_URLS.campervans.length; i++) {
    const photos = await downloadBatch(IMAGE_URLS.campervans[i], 'caravan-photo', i);
    campervanPhotos.push(photos);
  }
  console.log(`\n  ✅ Campervan images: ${campervanPhotos.flat().length} downloaded`);

  // Download stay images
  const stayPhotos = [];
  for (let i = 0; i < IMAGE_URLS.stays.length; i++) {
    const photos = await downloadBatch(IMAGE_URLS.stays[i], 'stay-room0', i);
    stayPhotos.push(photos);
  }
  console.log(`  ✅ Stay images: ${stayPhotos.flat().length} downloaded`);

  // Download activity images
  const activityPhotos = [];
  for (let i = 0; i < IMAGE_URLS.activities.length; i++) {
    const photos = await downloadBatch(IMAGE_URLS.activities[i], 'activity-photo', i);
    activityPhotos.push(photos);
  }
  console.log(`  ✅ Activity images: ${activityPhotos.flat().length} downloaded`);

  // ── 4. Create Camper Van offers ──────────────────────────────────────────
  console.log('\n🚐 Seeding Camper Vans...');
  for (let i = 0; i < CAMPERVAN_OFFERS.length; i++) {
    const info = CAMPERVAN_OFFERS[i];
    const photos = campervanPhotos[i] || [];
    if (photos.length === 0) { console.log(`  ⚠️  Skipping ${info.name} (no images)`); continue; }
    await Offer.create({
      ...info,
      category: 'camper-van',
      serviceType: 'camper-van',
      photos: { coverUrl: photos[0], galleryUrls: photos },
      status: 'approved',
    });
    console.log(`  ✅ ${info.name} (${photos.length} photos)`);
  }

  // ── 5. Create Unique Stay offers ─────────────────────────────────────────
  console.log('\n🏡 Seeding Unique Stays...');
  for (let i = 0; i < STAY_OFFERS.length; i++) {
    const info = STAY_OFFERS[i];
    const photos = stayPhotos[i] || [];
    if (photos.length === 0) { console.log(`  ⚠️  Skipping ${info.name} (no images)`); continue; }
    await Offer.create({
      ...info,
      category: 'stay',
      serviceType: 'unique-stay',
      photos: { coverUrl: photos[0], galleryUrls: photos },
      status: 'approved',
    });
    console.log(`  ✅ ${info.name} (${photos.length} photos)`);
  }

  // ── 6. Create Activity offers ────────────────────────────────────────────
  console.log('\n🏄 Seeding Activities...');
  for (let i = 0; i < ACTIVITY_OFFERS.length; i++) {
    const info = ACTIVITY_OFFERS[i];
    const photos = activityPhotos[i] || [];
    if (photos.length === 0) { console.log(`  ⚠️  Skipping ${info.name} (no images)`); continue; }
    await Offer.create({
      ...info,
      category: 'activity',
      serviceType: 'activity',
      photos: { coverUrl: photos[0], galleryUrls: photos },
      status: 'approved',
    });
    console.log(`  ✅ ${info.name} (${photos.length} photos)`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = await Offer.countDocuments({ status: 'approved' });
  console.log('\n─────────────────────────────────────────────');
  console.log('  🎉 Fresh seed complete!');
  console.log(`  Camper Vans : ${CAMPERVAN_OFFERS.length}`);
  console.log(`  Stays       : ${STAY_OFFERS.length}`);
  console.log(`  Activities  : ${ACTIVITY_OFFERS.length}`);
  console.log(`  Total approved offers in DB: ${total}`);
  console.log(`  New images downloaded: ${[...campervanPhotos, ...stayPhotos, ...activityPhotos].flat().length}`);
  console.log('─────────────────────────────────────────────');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
