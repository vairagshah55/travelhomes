/**
 * Seed script — Demo Offer records (what the homepage reads via /api/offers)
 *
 * Steps:
 *  1. Deletes any offers previously created by this seed script (matched by name)
 *  2. Re-creates them using all images now present in /uploads/
 *
 * Run: node scripts/seed-offers.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Offer = require('../models/Offer');

// ─── All caravan photos grouped by upload session (one group = one listing) ───
const CARAVAN_BATCHES = [
  [
    '/uploads/caravan-photo-1757658512072-cekm5c.jpg',
    '/uploads/caravan-photo-1757658512074-u36btp.png',
    '/uploads/caravan-photo-1757658512076-67033f.png',
    '/uploads/caravan-photo-1757658512079-1p2n9j.png',
    '/uploads/caravan-photo-1757658512080-fj8q4d.webp',
  ],
  [
    '/uploads/caravan-photo-1757658513326-fdwk9p.jpg',
    '/uploads/caravan-photo-1757658513327-r0qmu0.png',
    '/uploads/caravan-photo-1757658513328-3mh3nr.png',
    '/uploads/caravan-photo-1757658513329-39sl57.png',
    '/uploads/caravan-photo-1757658513333-lufmgx.webp',
  ],
  [
    '/uploads/caravan-photo-1757658513959-krul6e.jpg',
    '/uploads/caravan-photo-1757658513960-mt18gn.png',
    '/uploads/caravan-photo-1757658513961-41muba.png',
    '/uploads/caravan-photo-1757658513964-3uvxqt.png',
    '/uploads/caravan-photo-1757658513964-zc6cz2.webp',
  ],
  [
    '/uploads/caravan-photo-1757658514163-phm5kk.jpg',
    '/uploads/caravan-photo-1757658514163-qlzhpd.png',
    '/uploads/caravan-photo-1757658514164-z7zwnn.png',
    '/uploads/caravan-photo-1757658514165-777ez9.png',
    '/uploads/caravan-photo-1757658514166-poajrj.webp',
  ],
  [
    '/uploads/caravan-photo-1757658518824-bmjk5x.jpg',
    '/uploads/caravan-photo-1757658518826-90swx5.png',
    '/uploads/caravan-photo-1757658518826-oli6fc.png',
    '/uploads/caravan-photo-1757658518827-69jyrq.webp',
    '/uploads/caravan-photo-1757658518827-7mc4di.png',
  ],
  [
    '/uploads/caravan-photo-1757658519391-3t285c.jpg',
    '/uploads/caravan-photo-1757658519392-3v9qt6.png',
    '/uploads/caravan-photo-1757658519393-067dvd.png',
    '/uploads/caravan-photo-1757658519394-brmvp3.png',
    '/uploads/caravan-photo-1757658519395-gcbfe2.webp',
  ],
  [
    '/uploads/caravan-photo-1757660662588-yxkq7j.jpg',
    '/uploads/caravan-photo-1757660662591-v1iqdh.png',
    '/uploads/caravan-photo-1757660662592-p6mcjv.png',
    '/uploads/caravan-photo-1757660662593-pmb0bw.png',
    '/uploads/caravan-photo-1757660662594-bsbepc.webp',
  ],
  [
    '/uploads/caravan-photo-1757660665151-1arxcw.jpg',
    '/uploads/caravan-photo-1757660665152-j6iawe.png',
    '/uploads/caravan-photo-1757660665152-m9ekgk.png',
    '/uploads/caravan-photo-1757660665157-axryv7.png',
    '/uploads/caravan-photo-1757660665157-lre3k9.webp',
  ],
  [
    '/uploads/caravan-photo-1757662469370-lb1k28.jpg',
    '/uploads/caravan-photo-1757662469385-qm036q.png',
    '/uploads/caravan-photo-1757662469386-la031a.png',
    '/uploads/caravan-photo-1757662469387-ypwz7k.png',
    '/uploads/caravan-photo-1757662469388-ilufie.webp',
  ],
  [
    '/uploads/caravan-photo-1768384095185-bgkuzv.jpg',
    '/uploads/caravan-photo-1768384095187-pe70i7.jpg',
    '/uploads/caravan-photo-1768384095188-vi3fcd.jpg',
    '/uploads/caravan-photo-1768384095189-q91ks7.jpg',
  ],
  [
    '/uploads/caravan-photo-1768462080444-lamfc9.jpg',
    '/uploads/caravan-photo-1768462080448-yb5mjo.jpg',
    '/uploads/caravan-photo-1768462080449-5wtpjy.jpg',
    '/uploads/caravan-photo-1768462080450-tukpjq.jpg',
  ],
  [
    '/uploads/caravan-photo-1768462259169-coy3yk.jpg',
    '/uploads/caravan-photo-1768462259170-l7a5ba.jpg',
    '/uploads/caravan-photo-1768462259171-ndwhps.jpg',
    '/uploads/caravan-photo-1768462259172-t423kq.jpg',
  ],
  [
    '/uploads/caravan-photo-1768462371750-r1imh1.jpg',
    '/uploads/caravan-photo-1768462371751-qp34os.jpg',
    '/uploads/caravan-photo-1768462371755-00xpv8.jpg',
    '/uploads/caravan-photo-1768462371761-3noo0o.jpg',
  ],
];

// ─── All activity photos grouped by upload session ────────────────────────────
const ACTIVITY_BATCHES = [
  [
    '/uploads/activity-photo-1757658458408-zdmehz.jpg',
    '/uploads/activity-photo-1757658458411-qom7r0.png',
    '/uploads/activity-photo-1757658458412-1n8xv6.png',
    '/uploads/activity-photo-1757658458414-ngghdp.png',
    '/uploads/activity-photo-1757658458417-3k5sh6.webp',
  ],
  [
    '/uploads/activity-photo-1768384622663-jl8xxg.jpg',
    '/uploads/activity-photo-1768384622676-ur7xck.jpg',
    '/uploads/activity-photo-1768384622704-1t7hsf.jpg',
    '/uploads/activity-photo-1768384622725-jc1sid.jpg',
  ],
  [
    '/uploads/activity-photo-1768384631069-03411w.jpg',
    '/uploads/activity-photo-1768384631082-el9l6k.jpg',
    '/uploads/activity-photo-1768384631118-k14395.jpg',
    '/uploads/activity-photo-1768384631161-0wyy6i.jpg',
  ],
  [
    '/uploads/activity-photo-1768384633596-tr2ral.jpg',
    '/uploads/activity-photo-1768384633607-uvmsbe.jpg',
    '/uploads/activity-photo-1768384633638-5ml6jy.jpg',
    '/uploads/activity-photo-1768384633657-v3i11j.jpg',
  ],
  [
    '/uploads/activity-photo-1768384763301-x4cwj0.jpg',
    '/uploads/activity-photo-1768384763315-38dg4q.jpg',
    '/uploads/activity-photo-1768384763349-k1nyrp.jpg',
    '/uploads/activity-photo-1768384763377-3vfhb8.jpg',
  ],
  [
    '/uploads/activity-photo-1768384913799-pipxx7.jpg',
    '/uploads/activity-photo-1768384913812-8nyiyj.jpg',
    '/uploads/activity-photo-1768384913844-hooqgd.jpg',
    '/uploads/activity-photo-1768384913874-opjdg7.jpg',
  ],
  [
    '/uploads/activity-photo-1768385022436-4lrxb4.jpg',
    '/uploads/activity-photo-1768385022455-vtmx3f.jpg',
    '/uploads/activity-photo-1768385022474-yyoiw8.jpg',
    '/uploads/activity-photo-1768385022508-gsu6sm.jpg',
  ],
  [
    '/uploads/activity-photo-1768463157851-48lhd2.jpg',
    '/uploads/activity-photo-1768463157859-2tyfrv.jpg',
    '/uploads/activity-photo-1768463157860-jqbp7g.jpg',
    '/uploads/activity-photo-1768463157862-0men9v.jpg',
  ],
  [
    '/uploads/activity-photo-1768463216288-j4voyf.jpg',
    '/uploads/activity-photo-1768463216290-kcafs3.jpg',
    '/uploads/activity-photo-1768463216290-rfrlpi.jpg',
    '/uploads/activity-photo-1768463216291-glmpei.jpg',
  ],
  [
    '/uploads/activity-photo-1768463265337-r6elzt.jpg',
    '/uploads/activity-photo-1768463265338-raza53.jpg',
    '/uploads/activity-photo-1768463265340-myi28v.jpg',
    '/uploads/activity-photo-1768463265343-zgtlw2.jpg',
  ],
  [
    '/uploads/activity-photo-1768548032183-qj57vt.jpg',
    '/uploads/activity-photo-1768548032197-8swkfd.jpg',
    '/uploads/activity-photo-1768548032225-ss1oha.jpg',
    '/uploads/activity-photo-1768548032249-yt3caa.jpg',
  ],
];

// ─── Stay photos (all 4 available) ───────────────────────────────────────────
const STAY_PHOTOS = [
  '/uploads/stay-room0-1768462601470-hq0dsb.jpg',
  '/uploads/stay-room0-1768462920298-aw28gy.jpg',
  '/uploads/stay-room0-1768462998765-00alzd.jpg',
  '/uploads/stay-room0-1768463047350-643del.jpg',
];

// ─── Offer definitions ────────────────────────────────────────────────────────
// 13 Camper Vans (one per photo batch)
const CAMPERVAN_OFFERS = [
  { name: 'Wanderer Deluxe Camper',    city: 'Mumbai',      state: 'Maharashtra',      locality: 'Juhu Beach Road',  pincode: '400049', regularPrice: 4500, perDayCharge: 4500, seatingCapacity: 2, sleepingCapacity: 2, features: ['AC', 'Kitchen', 'Solar Panel', 'GPS', 'WiFi', 'Fridge'] },
  { name: 'Adventure Trail Van',        city: 'Pune',        state: 'Maharashtra',      locality: 'Koregaon Park',    pincode: '411001', regularPrice: 3800, perDayCharge: 3800, seatingCapacity: 4, sleepingCapacity: 4, features: ['4WD', 'Roof Tent', 'Camp Kitchen', 'Gear Storage', 'USB Charging'] },
  { name: 'Family Road Cruiser',        city: 'Hyderabad',   state: 'Telangana',        locality: 'Banjara Hills',    pincode: '500034', regularPrice: 5500, perDayCharge: 5500, seatingCapacity: 6, sleepingCapacity: 6, features: ['Bunk Beds', 'AC', 'TV', 'Full Kitchen', 'Child Seats', 'Backup Camera'] },
  { name: 'Himalayan Explorer',         city: 'Manali',      state: 'Himachal Pradesh', locality: 'Mall Road',        pincode: '175131', regularPrice: 6000, perDayCharge: 6000, seatingCapacity: 3, sleepingCapacity: 3, features: ['Heating', 'Insulated Walls', 'All-Terrain Tyres', 'Oxygen Kit', 'Snow Chains'] },
  { name: 'Coastal Breeze Camper',      city: 'Mangalore',   state: 'Karnataka',        locality: 'Panambur Beach',   pincode: '575010', regularPrice: 3500, perDayCharge: 3500, seatingCapacity: 2, sleepingCapacity: 2, features: ['AC', 'Mini Kitchen', 'Outdoor Shower', 'Hammock', 'Beach Gear'] },
  { name: 'Forest Retreat Van',         city: 'Coorg',       state: 'Karnataka',        locality: 'Madikeri',         pincode: '571201', regularPrice: 4000, perDayCharge: 4000, seatingCapacity: 4, sleepingCapacity: 4, features: ['Rooftop Tent', 'Camp Stove', 'Firewood', 'Rain Gear', 'Bird Guide'] },
  { name: 'Urban Explorer Camper',      city: 'Delhi',       state: 'Delhi',            locality: 'Connaught Place',  pincode: '110001', regularPrice: 4200, perDayCharge: 4200, seatingCapacity: 2, sleepingCapacity: 2, features: ['WiFi', 'AC', 'GPS', 'Charging Ports', 'Mini Fridge', 'Parking Pass'] },
  { name: 'Mountain Bliss Van',         city: 'Shimla',      state: 'Himachal Pradesh', locality: 'The Mall',         pincode: '171001', regularPrice: 4800, perDayCharge: 4800, seatingCapacity: 4, sleepingCapacity: 4, features: ['Heated Cabin', 'Hot Water', 'Trekking Maps', 'Snow Tyres', 'Emergency Kit'] },
  { name: 'Desert Safari Camper',       city: 'Jaisalmer',   state: 'Rajasthan',        locality: 'Sam Sand Dunes',   pincode: '345001', regularPrice: 5000, perDayCharge: 5000, seatingCapacity: 4, sleepingCapacity: 4, features: ['AC', 'Sand Anchors', 'Star-gazing Kit', 'Bonfire Setup', 'Camel Guide'] },
  { name: 'Sunrise Camper',             city: 'Ooty',        state: 'Tamil Nadu',       locality: 'Charring Cross',   pincode: '643001', regularPrice: 3200, perDayCharge: 3200, seatingCapacity: 2, sleepingCapacity: 2, features: ['Sunroof', 'Coffee Maker', 'Blankets', 'Nature Guide', 'Binoculars'] },
  { name: 'Riverside Retreat Van',      city: 'Rishikesh',   state: 'Uttarakhand',      locality: 'Laxman Jhula',     pincode: '249302', regularPrice: 3600, perDayCharge: 3600, seatingCapacity: 3, sleepingCapacity: 3, features: ['Kayak Rack', 'Dry Bags', 'Camp Chairs', 'Bonfire Kit', 'Yoga Mat'] },
  { name: 'Valley View Camper',         city: 'Munnar',      state: 'Kerala',           locality: 'Pothamedu',        pincode: '685612', regularPrice: 3900, perDayCharge: 3900, seatingCapacity: 2, sleepingCapacity: 2, features: ['Tea Garden Tour', 'AC', 'Panoramic Windows', 'Picnic Basket', 'Rain Gear'] },
  { name: 'Sunset Cruiser Van',         city: 'Goa',         state: 'Goa',              locality: 'Calangute',        pincode: '403516', regularPrice: 4300, perDayCharge: 4300, seatingCapacity: 4, sleepingCapacity: 4, features: ['Beach Gear', 'Surfboard Rack', 'Outdoor Shower', 'Bluetooth Speaker', 'Cooler Box'] },
];

// 11 Activities (one per photo batch)
const ACTIVITY_OFFERS = [
  { name: 'Scuba Diving Adventure',         city: 'Goa',          state: 'Goa',              locality: 'Baga Beach',      pincode: '403516', regularPrice: 3500, discountPrice: 2999, personCapacity: 10, timeDuration: '3 hours',  features: ['All Diving Equipment', 'Certified Instructor', 'Underwater Photos', 'Insurance'] },
  { name: 'Himalayan Trek — Triund Peak',   city: 'Dharamsala',   state: 'Himachal Pradesh', locality: 'McLeodGanj',      pincode: '176219', regularPrice: 1800, discountPrice: 1499, personCapacity: 15, timeDuration: '8 hours',  features: ['Trek Guide', 'Lunch & Snacks', 'First Aid', 'Trek Permit', 'Bonfire'] },
  { name: 'Rajasthani Cooking Masterclass', city: 'Jaipur',       state: 'Rajasthan',        locality: 'Old City',        pincode: '302001', regularPrice: 2500, discountPrice: 1999, personCapacity: 8,  timeDuration: '4 hours',  features: ['All Ingredients', 'Master Chef', 'Recipe Book', 'Full Meal', 'Market Tour'] },
  { name: 'Kerala Backwater Kayaking',      city: 'Alappuzha',    state: 'Kerala',           locality: 'Alleppey Beach',  pincode: '688012', regularPrice: 2200, discountPrice: 1800, personCapacity: 12, timeDuration: '3 hours',  features: ['Kayak & Paddle', 'Life Jacket', 'Guide', 'Snacks', 'Bird Watching Guide'] },
  { name: 'Paragliding in Bir Billing',     city: 'Bir',          state: 'Himachal Pradesh', locality: 'Billing Launch',  pincode: '176077', regularPrice: 2800, discountPrice: 2399, personCapacity: 6,  timeDuration: '2 hours',  features: ['Tandem Pilot', 'GoPro Video', 'Safety Gear', 'Transport to Launch', 'Certificate'] },
  { name: 'White Water Rafting Rishikesh',  city: 'Rishikesh',    state: 'Uttarakhand',      locality: 'Brahmpuri',       pincode: '249302', regularPrice: 1500, discountPrice: 1200, personCapacity: 20, timeDuration: '3 hours',  features: ['Life Jacket', 'Helmet', 'Raft & Paddle', 'Certified Guide', 'Changing Room'] },
  { name: 'Desert Safari & Dune Bashing',   city: 'Jaisalmer',    state: 'Rajasthan',        locality: 'Sam Sand Dunes',  pincode: '345001', regularPrice: 2000, discountPrice: 1699, personCapacity: 10, timeDuration: '4 hours',  features: ['4x4 Vehicle', 'Camel Ride', 'Bonfire', 'Folk Music', 'Dinner Under Stars'] },
  { name: 'Zip-lining in Munnar',           city: 'Munnar',       state: 'Kerala',           locality: 'Pothamedu',       pincode: '685612', regularPrice: 1200, discountPrice: 999,  personCapacity: 8,  timeDuration: '2 hours',  features: ['Safety Harness', 'Trained Staff', 'Gloves', 'Photos & Videos', 'Refreshments'] },
  { name: 'Rock Climbing Workshop',         city: 'Hampi',        state: 'Karnataka',        locality: 'Hippie Island',   pincode: '583239', regularPrice: 1800, discountPrice: 1499, personCapacity: 10, timeDuration: '5 hours',  features: ['Climbing Gear', 'Expert Instructor', 'Beginner Friendly', 'Certificate', 'Lunch'] },
  { name: 'Sunset Camel Safari',            city: 'Pushkar',      state: 'Rajasthan',        locality: 'Lake Side',       pincode: '305022', regularPrice: 1000, discountPrice: 799,  personCapacity: 15, timeDuration: '2 hours',  features: ['Camel Ride', 'Desert Sunset View', 'Photography Guide', 'Chai & Snacks', 'Blanket'] },
  { name: 'Night Sky Stargazing Camp',      city: 'Spiti',        state: 'Himachal Pradesh', locality: 'Kaza',            pincode: '172114', regularPrice: 3000, discountPrice: 2499, personCapacity: 12, timeDuration: '6 hours',  features: ['Telescope', 'Astronomer Guide', 'Bonfire', 'Dinner', 'Sleeping Bag'] },
];

// 4 Unique Stays
const STAY_OFFERS = [
  { name: 'Beachfront Paradise Villa',  city: 'Goa',        state: 'Goa',              locality: 'Calangute Beach', pincode: '403516', regularPrice: 8000, guestCapacity: 4, numberOfBeds: 3, numberOfRooms: 2, numberOfBathrooms: 2, stayType: 'villa',    features: ['Private Pool', 'Beach Access', 'WiFi', 'AC', 'Kitchen', 'Parking', 'BBQ'] },
  { name: 'Mountain View Homestay',     city: 'Manali',     state: 'Himachal Pradesh', locality: 'Old Manali',      pincode: '175131', regularPrice: 2500, guestCapacity: 4, numberOfBeds: 3, numberOfRooms: 2, numberOfBathrooms: 1, stayType: 'homestay', features: ['Bonfire', 'Home-cooked Meals', 'WiFi', 'Heating', 'Parking', 'Trekking Guide'] },
  { name: 'Urban Luxury Apartment',     city: 'Bangalore',  state: 'Karnataka',        locality: 'Koramangala',     pincode: '560034', regularPrice: 3500, guestCapacity: 2, numberOfBeds: 1, numberOfRooms: 1, numberOfBathrooms: 1, stayType: 'apartment', features: ['Rooftop', 'Co-working Space', 'High-speed WiFi', 'AC', 'Gym', 'Laundry'] },
  { name: 'Royal Heritage Haveli',      city: 'Jaipur',     state: 'Rajasthan',        locality: 'Old City',        pincode: '302001', regularPrice: 6000, guestCapacity: 4, numberOfBeds: 3, numberOfRooms: 2, numberOfBathrooms: 2, stayType: 'hotel',    features: ['Courtyard', 'Cultural Performances', 'Rooftop Restaurant', 'Heritage Tour', 'Spa'] },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // ── 1. Delete previously seeded offers ──────────────────────────────────
  const allNames = [
    ...CAMPERVAN_OFFERS.map(o => o.name),
    ...ACTIVITY_OFFERS.map(o => o.name),
    ...STAY_OFFERS.map(o => o.name),
  ];
  const deleted = await Offer.deleteMany({ name: { $in: allNames } });
  console.log(`🗑️  Removed ${deleted.deletedCount} old seeded offer(s)`);

  // ── 2. Create Camper Van offers ──────────────────────────────────────────
  console.log('\n🚐 Seeding Camper Vans...');
  for (let i = 0; i < CAMPERVAN_OFFERS.length; i++) {
    const info = CAMPERVAN_OFFERS[i];
    const photos = CARAVAN_BATCHES[i] || CARAVAN_BATCHES[0];
    await Offer.create({
      ...info,
      category: 'camper-van',
      serviceType: 'camper-van',
      description: `${info.name} — a premium camper van available in ${info.city}, ${info.state}. Fully equipped for a comfortable and memorable road trip experience.`,
      photos: { coverUrl: photos[0], galleryUrls: photos },
      status: 'approved',
    });
    console.log(`  ✅ ${info.name} (${photos.length} photos)`);
  }

  // ── 3. Create Activity offers ────────────────────────────────────────────
  console.log('\n🏄 Seeding Activities...');
  for (let i = 0; i < ACTIVITY_OFFERS.length; i++) {
    const info = ACTIVITY_OFFERS[i];
    const photos = ACTIVITY_BATCHES[i] || ACTIVITY_BATCHES[0];
    await Offer.create({
      ...info,
      category: 'activity',
      serviceType: 'activity',
      description: `${info.name} in ${info.city}, ${info.state}. An unforgettable experience with professional guides and all necessary equipment included.`,
      photos: { coverUrl: photos[0], galleryUrls: photos },
      status: 'approved',
    });
    console.log(`  ✅ ${info.name} (${photos.length} photos)`);
  }

  // ── 4. Create Unique Stay offers ─────────────────────────────────────────
  console.log('\n🏡 Seeding Unique Stays...');
  for (let i = 0; i < STAY_OFFERS.length; i++) {
    const info = STAY_OFFERS[i];
    const photo = STAY_PHOTOS[i] || STAY_PHOTOS[0];
    await Offer.create({
      ...info,
      category: 'stay',
      serviceType: 'unique-stay',
      description: `${info.name} in ${info.city}, ${info.state}. A handpicked property offering exceptional comfort, local character, and world-class hospitality.`,
      photos: { coverUrl: photo, galleryUrls: STAY_PHOTOS },
      status: 'approved',
    });
    console.log(`  ✅ ${info.name}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = await Offer.countDocuments({ status: 'approved' });
  console.log('\n─────────────────────────────────────────────');
  console.log('  Seed complete!');
  console.log(`  Camper Vans : ${CAMPERVAN_OFFERS.length}`);
  console.log(`  Activities  : ${ACTIVITY_OFFERS.length}`);
  console.log(`  Stays       : ${STAY_OFFERS.length}`);
  console.log(`  Total approved offers in DB: ${total}`);
  console.log('─────────────────────────────────────────────');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
