/**
 * Filter-test seed script — adds one Camper Van, one Unique Stay, and one
 * Activity per sidebar Type option, tagged with a tier keyword too, so every
 * Type/Category/Facility/Price/Sleep/Seat filter in SearchResults has real
 * data to match against. Idempotent: re-running deletes+recreates by name.
 *
 * Run:  node scripts/seed-filter-test.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Offer = require("../models/Offer");

// Reused per-category photo sets (same HD Unsplash images as seed-fresh.js).
const PHOTOS = {
  "camper-van": [
    "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&h=800&fit=crop&q=80",
  ],
  "unique-stay": [
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&h=800&fit=crop&q=80",
  ],
  activity: [
    "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=1200&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1527004013836-58c2f1028f1e?w=1200&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1503220317266-8c3daeecaa8f?w=1200&h=800&fit=crop&q=80",
  ],
};

// category = "<Tier> <Type>" — matches both the Type checkbox (Motorhome,
// Villa, Adventure, ...) and the Category-tier checkbox (Luxury, Standard,
// Budget, Eco) via the sidebar's substring match on the same field.

const CAMPERVAN_OFFERS = [
  {
    name: "[Test] Budget Solo Motorhome",
    category: "Budget Motorhome",
    city: "Pune",
    state: "Maharashtra",
    locality: "Koregaon Park",
    pincode: "411001",
    regularPrice: 1999,
    perDayCharge: 1999,
    seatingCapacity: 2,
    sleepingCapacity: 2,
    features: ["AC", "Parking"],
    description:
      "A compact, no-frills motorhome for solo travellers or couples on a budget road trip.",
  },
  {
    name: "[Test] Standard Family Camper Trailer",
    category: "Standard Camper Trailer",
    city: "Manali",
    state: "Himachal Pradesh",
    locality: "Old Manali",
    pincode: "175131",
    regularPrice: 4200,
    perDayCharge: 4200,
    seatingCapacity: 5,
    sleepingCapacity: 5,
    features: ["Kitchen", "Wi-Fi", "Parking"],
    description:
      "A comfortable camper trailer with a full kitchen, ideal for small families exploring the hills.",
  },
  {
    name: "[Test] Luxury Expedition RV",
    category: "Luxury RV",
    city: "Udaipur",
    state: "Rajasthan",
    locality: "Fatehsagar",
    pincode: "313001",
    regularPrice: 8900,
    perDayCharge: 8900,
    seatingCapacity: 8,
    sleepingCapacity: 8,
    features: ["AC", "Kitchen", "Wi-Fi", "Shower", "Toilet"],
    description:
      "A fully loaded luxury RV with en-suite shower and toilet for long-haul comfort touring.",
  },
  {
    name: "[Test] Eco Group Caravan",
    category: "Eco Caravan",
    city: "Ooty",
    state: "Tamil Nadu",
    locality: "Fernhill",
    pincode: "643004",
    regularPrice: 6200,
    perDayCharge: 6200,
    seatingCapacity: 14,
    sleepingCapacity: 14,
    features: ["Toilet", "Shower", "Parking"],
    description:
      "A large solar-powered caravan for big groups travelling together with a lighter footprint.",
  },
];

const STAY_OFFERS = [
  {
    name: "[Test] Budget City Apartment",
    category: "Budget Apartment",
    city: "Bengaluru",
    state: "Karnataka",
    locality: "Indiranagar",
    pincode: "560038",
    regularPrice: 2200,
    guestCapacity: 2,
    numberOfBeds: 1,
    numberOfRooms: 1,
    numberOfBathrooms: 1,
    stayType: "apartment",
    features: ["Wi-Fi", "Kitchen"],
    description:
      "A tidy, affordable city apartment close to cafes and transit, perfect for short stays.",
  },
  {
    name: "[Test] Standard Hillside House",
    category: "Standard House",
    city: "Nainital",
    state: "Uttarakhand",
    locality: "Mallital",
    pincode: "263001",
    regularPrice: 4800,
    guestCapacity: 4,
    numberOfBeds: 2,
    numberOfRooms: 2,
    numberOfBathrooms: 2,
    stayType: "house",
    features: ["Parking", "Kitchen", "AC"],
    description:
      "A cosy hillside house with lake views, a full kitchen, and parking for your own vehicle.",
  },
  {
    name: "[Test] Luxury Garden Villa",
    category: "Luxury Villa",
    city: "Alibaug",
    state: "Maharashtra",
    locality: "Nagaon Beach",
    pincode: "402201",
    regularPrice: 15000,
    guestCapacity: 8,
    numberOfBeds: 4,
    numberOfRooms: 4,
    numberOfBathrooms: 4,
    stayType: "villa",
    features: ["Pool", "Garden", "AC", "Wi-Fi"],
    description:
      "A sprawling private villa with pool and garden, built for group getaways near the beach.",
  },
  {
    name: "[Test] Eco Retreat Resort",
    category: "Eco Resort",
    city: "Wayanad",
    state: "Kerala",
    locality: "Vythiri",
    pincode: "673576",
    regularPrice: 6600,
    guestCapacity: 6,
    numberOfBeds: 3,
    numberOfRooms: 3,
    numberOfBathrooms: 2,
    stayType: "resort",
    features: ["Garden", "Wi-Fi", "Parking"],
    description: "A rainforest-edge eco resort with garden dining and easy parking access.",
  },
];

const ACTIVITY_OFFERS = [
  {
    name: "[Test] Budget Cycling Tour",
    category: "Budget Sports",
    city: "Pondicherry",
    state: "Puducherry",
    locality: "White Town",
    pincode: "605001",
    regularPrice: 1200,
    personCapacity: 10,
    timeDuration: "2 hours",
    features: ["Equipment Included", "Guide"],
    description: "A relaxed guided cycling tour through the French Quarter's quiet lanes.",
  },
  {
    name: "[Test] Standard Village Cultural Walk",
    category: "Standard Cultural",
    city: "Jodhpur",
    state: "Rajasthan",
    locality: "Old City",
    pincode: "342001",
    regularPrice: 1800,
    personCapacity: 15,
    timeDuration: "3 hours",
    features: ["Guide", "Transportation"],
    description: "A storytelling walk through Jodhpur's blue-washed lanes with pickup included.",
  },
  {
    name: "[Test] Luxury Adventure Safari",
    category: "Luxury Adventure",
    city: "Ramnagar",
    state: "Uttarakhand",
    locality: "Jim Corbett",
    pincode: "244715",
    regularPrice: 9500,
    personCapacity: 6,
    timeDuration: "6 hours",
    features: ["Transportation", "Meals", "Insurance", "Guide"],
    description:
      "A premium jeep safari through Corbett with meals, insurance, and a naturalist guide.",
  },
  {
    name: "[Test] Eco Spa Relaxation Day",
    category: "Eco Relaxation",
    city: "Rishikesh",
    state: "Uttarakhand",
    locality: "Tapovan",
    pincode: "249192",
    regularPrice: 3200,
    personCapacity: 4,
    timeDuration: "4 hours",
    features: ["Meals", "Insurance"],
    description:
      "A riverside wellness day of yoga and spa treatments using natural, low-impact products.",
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const groups = [
    {
      offers: CAMPERVAN_OFFERS,
      serviceType: "camper-van",
      photos: PHOTOS["camper-van"],
      label: "Camper Vans",
    },
    {
      offers: STAY_OFFERS,
      serviceType: "unique-stay",
      photos: PHOTOS["unique-stay"],
      label: "Unique Stays",
    },
    {
      offers: ACTIVITY_OFFERS,
      serviceType: "activity",
      photos: PHOTOS.activity,
      label: "Activities",
    },
  ];

  for (const group of groups) {
    console.log(`\nSeeding ${group.label}...`);
    for (const info of group.offers) {
      await Offer.deleteOne({ name: info.name });
      await Offer.create({
        ...info,
        serviceType: group.serviceType,
        photos: { coverUrl: group.photos[0], galleryUrls: group.photos },
        status: "approved",
      });
      console.log(`  + ${info.name}`);
    }
  }

  const total = await Offer.countDocuments({ name: { $regex: "^\\[Test\\]" } });
  console.log(`\nDone. ${total} test offers now in DB.`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
