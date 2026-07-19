/**
 * seed-demo-admin.js — populate the admin panel with realistic demo data.
 *
 * Fills the collections the admin dashboard + list pages read from, with data
 * spread across the last 6 months so the trend graphs render properly.
 *
 * IDEMPOTENT: every record it creates carries a marker, so re-running first
 * deletes the previous demo batch, then re-inserts. Real data is never touched.
 *
 *   node scripts/seed-demo-admin.js          # clean prior demo data, then seed
 *   node scripts/seed-demo-admin.js --clean  # only remove demo data, don't seed
 *
 * Markers used to identify demo data:
 *   Users / Vendors / HelpDesk / Subscribers / ContactMessages : email @demo-seed.com
 *   Management : bookingPolicy.cancellationPolicy === 'DEMO_SEED'
 *   Booking    : bookingId starts with 'BKDEMO'
 *   Payment    : transactionId starts with 'TXNDEMO'
 *   Blog       : slug starts with 'demo-'
 *   Notification : title starts with '[DEMO]'
 */
const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/travelhomes";

const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Management = require("../models/Management");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const HelpDesk = require("../models/HelpDesk");
const Subscriber = require("../models/Subscriber");
const ContactMessage = require("../models/ContactMessage");
const Blog = require("../models/Blog");
const Notification = require("../models/Notification");

// NOTE: the User/Subscriber email validators require a 2-3 char TLD, so the
// demo domain must end in a normal TLD. "demo-seed.com" doubles as the marker.
const DEMO_DOMAIN = "demo-seed.com";

// ---- helpers ---------------------------------------------------------------
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// random Date within the last `days` days (default ~6 months) — used for createdAt
function randDate(days = 178) {
  const now = Date.now();
  const offset = Math.floor(Math.random() * days) * 24 * 60 * 60 * 1000;
  const jitter = Math.floor(Math.random() * 24 * 60 * 60 * 1000);
  return new Date(now - offset - jitter);
}
// a date a few days after a base date (for checkout / future bookings)
const addDays = (d, n) => new Date(d.getTime() + n * 24 * 60 * 60 * 1000);

const FIRST = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Sai",
  "Reyansh",
  "Krishna",
  "Ishaan",
  "Rohan",
  "Ananya",
  "Diya",
  "Saanvi",
  "Aadhya",
  "Kiara",
  "Myra",
  "Anika",
  "Navya",
  "Priya",
  "Riya",
  "Karan",
  "Nikhil",
  "Rahul",
  "Varun",
  "Aman",
  "Neha",
  "Pooja",
  "Sneha",
  "Meera",
  "Tara",
];
const LAST = [
  "Sharma",
  "Verma",
  "Patel",
  "Gupta",
  "Singh",
  "Reddy",
  "Nair",
  "Iyer",
  "Mehta",
  "Desai",
  "Kapoor",
  "Malhotra",
  "Joshi",
  "Rao",
  "Bhat",
  "Shah",
  "Chopra",
  "Bose",
  "Menon",
  "Pillai",
];
const CITIES = [
  "Goa",
  "Manali",
  "Jaipur",
  "Udaipur",
  "Rishikesh",
  "Munnar",
  "Shimla",
  "Leh",
  "Coorg",
  "Pondicherry",
  "Mumbai",
  "Bengaluru",
  "Lonavala",
  "Alibaug",
  "Mysuru",
  "Nainital",
  "Darjeeling",
  "Kasol",
];
const BRANDS = [
  "Wanderlust Stays",
  "Nomad Camper Co",
  "Himalayan Escapes",
  "Coastal Retreats",
  "Desert Safari Hub",
  "Backwater Houseboats",
  "Hilltop Villas",
  "Riverside Camps",
  "Heritage Havens",
  "Offbeat Trails",
  "Sunset Caravans",
  "Forest Nest",
  "Blue Lagoon Resorts",
  "Trek & Trail",
  "Lake View Lodges",
  "Royal Tents",
];
const SERVICES = ["activity", "camper-van", "unique-stay"];
const ACTIVITY_NAMES = [
  "River Rafting Expedition",
  "Paragliding Adventure",
  "Scuba Diving Trip",
  "Desert Camping",
  "Trekking Tour",
  "Houseboat Cruise",
  "Wildlife Safari",
  "Hot Air Balloon Ride",
  "Kayaking Session",
  "Bungee Jumping",
];
const STAY_NAMES = [
  "Lakeside Wooden Cottage",
  "Treehouse Villa",
  "Glass Igloo Stay",
  "Heritage Haveli Suite",
  "Beachfront Cabana",
  "Mountain Glass Pod",
  "Riverside Tent Stay",
  "Farmstay Bungalow",
];
const VAN_NAMES = [
  "Force Traveller Camper",
  "Mahindra Bolero Camper",
  "Tata Winger Caravan",
  "Luxury RV Van",
  "Compact Adventure Van",
  "Family Motorhome",
];

const PAYMENT_METHODS = ["credit_card", "debit_card", "paypal", "bank_transfer", "razorpay"];
const GATEWAYS = ["stripe", "paypal", "razorpay", "manual"];

const FEMALE = new Set([
  "Ananya",
  "Diya",
  "Saanvi",
  "Aadhya",
  "Kiara",
  "Myra",
  "Anika",
  "Navya",
  "Priya",
  "Riya",
  "Neha",
  "Pooja",
  "Sneha",
  "Meera",
  "Tara",
]);

function nameFor(i) {
  const f = FIRST[i % FIRST.length];
  const l = LAST[(i * 7) % LAST.length];
  return { full: `${f} ${l}`, email: `${f}.${l}.${i}`.toLowerCase() + `@${DEMO_DOMAIN}` };
}

// real human portrait, gender-matched to the first name (randomuser.me has 0-99 each)
function portrait(name, i) {
  const first = String(name).trim().split(/\s+/)[0];
  const gender = FEMALE.has(first) ? "women" : "men";
  return `https://randomuser.me/api/portraits/${gender}/${i % 100}.jpg`;
}

function listingNameFor(service) {
  if (service === "activity") return pick(ACTIVITY_NAMES);
  if (service === "camper-van") return pick(VAN_NAMES);
  return pick(STAY_NAMES);
}

// ---- clean -----------------------------------------------------------------
async function clean() {
  const r = {};
  r.users = (await User.deleteMany({ email: new RegExp(`@${DEMO_DOMAIN}$`) })).deletedCount;
  r.vendors = (await Vendor.deleteMany({ email: new RegExp(`@${DEMO_DOMAIN}$`) })).deletedCount;
  r.management = (
    await Management.deleteMany({ "bookingPolicy.cancellationPolicy": "DEMO_SEED" })
  ).deletedCount;
  r.bookings = (await Booking.deleteMany({ bookingId: /^BKDEMO/ })).deletedCount;
  r.payments = (await Payment.deleteMany({ transactionId: /^TXNDEMO/ })).deletedCount;
  r.helpdesk = (await HelpDesk.deleteMany({ email: new RegExp(`@${DEMO_DOMAIN}$`) })).deletedCount;
  r.subscribers = (
    await Subscriber.deleteMany({ email: new RegExp(`@${DEMO_DOMAIN}$`) })
  ).deletedCount;
  r.contacts = (
    await ContactMessage.deleteMany({ email: new RegExp(`@${DEMO_DOMAIN}$`) })
  ).deletedCount;
  r.blogs = (await Blog.deleteMany({ slug: /^demo-/ })).deletedCount;
  r.notifications = (await Notification.deleteMany({ title: /^\[DEMO\]/ })).deletedCount;
  return r;
}

// ---- seed ------------------------------------------------------------------
async function seed() {
  const opts = { timestamps: false }; // we set createdAt/updatedAt explicitly to backdate

  // 1) Users -----------------------------------------------------------------
  const userDocs = [];
  for (let i = 0; i < 42; i++) {
    const { full, email } = nameFor(i);
    const created = randDate();
    // weight statuses toward active
    const status = i % 11 === 0 ? "inactive" : i % 17 === 0 ? "banned" : "active";
    userDocs.push({
      name: full,
      fullname: full,
      email,
      phone: `9${randInt(100000000, 999999999)}`,
      location: pick(CITIES),
      userType: i % 4 === 0 ? "vendor" : "user",
      role: i % 4 === 0 ? "vendor" : "user",
      status,
      isActive: status === "active",
      photo: portrait(full, i),
      userSince: created,
      createdAt: created,
      updatedAt: created,
    });
  }
  const users = await User.insertMany(userDocs, opts);
  const vendorUsers = users.filter((u) => u.userType === "vendor");
  const ownerPool = vendorUsers.length ? vendorUsers : users;

  // 2) Vendors ---------------------------------------------------------------
  const vendorStatuses = [
    "active",
    "active",
    "active",
    "approved",
    "pending",
    "inactive",
    "kyc-unverified",
  ];
  const vendorDocs = [];
  for (let i = 0; i < 16; i++) {
    const created = randDate();
    const { full } = nameFor(i + 100);
    vendorDocs.push({
      brandName: BRANDS[i % BRANDS.length],
      personName: full,
      photo: portrait(full, (i + 40) % 100),
      email: `vendor.${i}@${DEMO_DOMAIN}`,
      phone: `9${randInt(100000000, 999999999)}`,
      location: pick(CITIES),
      status: vendorStatuses[i % vendorStatuses.length],
      listedServices: randInt(1, 12),
      servicesOffered: [pick(SERVICES), pick(SERVICES)],
      ratings: { average: Math.round((3 + Math.random() * 2) * 10) / 10, count: randInt(5, 240) },
      createdAt: created,
      updatedAt: created,
    });
  }
  await Vendor.insertMany(vendorDocs, opts);

  // 3) Management listings ---------------------------------------------------
  const mgmtDocs = [];
  for (let i = 0; i < 26; i++) {
    const service = SERVICES[i % SERVICES.length];
    const created = randDate();
    const owner = pick(ownerPool);
    const status = i % 6 === 0 ? "pending" : i % 9 === 0 ? "inactive" : "active";
    mgmtDocs.push({
      brandName: BRANDS[i % BRANDS.length],
      personName: owner.name,
      serviceName: service,
      location: pick(CITIES),
      description: `${listingNameFor(service)} — an unforgettable ${service.replace("-", " ")} experience.`,
      price: randInt(1500, 45000),
      availability: true,
      status,
      images: [`https://picsum.photos/seed/lst${i}/800/600`],
      amenities: ["WiFi", "Parking", "Meals", "Guide"].slice(0, randInt(1, 4)),
      capacity: randInt(2, 12),
      contactInfo: { phone: `9${randInt(100000000, 999999999)}`, email: owner.email },
      rating: { average: Math.round((3 + Math.random() * 2) * 10) / 10, count: randInt(3, 180) },
      vendorId: owner._id,
      bookingPolicy: {
        cancellationPolicy: "DEMO_SEED", // <-- marker
        checkInTime: "13:00",
        checkOutTime: "11:00",
        minimumStay: 1,
      },
      createdAt: created,
      updatedAt: created,
    });
  }
  const listings = await Management.insertMany(mgmtDocs, opts);

  // 4) Bookings --------------------------------------------------------------
  const bookingStatuses = [
    "confirmed",
    "confirmed",
    "completed",
    "completed",
    "completed",
    "cancelled",
    "pending",
    "active",
  ];
  const bookingDocs = [];
  for (let i = 0; i < 95; i++) {
    const created = randDate();
    const listing = pick(listings);
    const guest = pick(users);
    const checkIn = addDays(created, randInt(2, 40));
    const nights = randInt(1, 7);
    const base = listing.price * nights;
    const total = Math.round(base * 1.18); // +18% GST
    bookingDocs.push({
      bookingId: `BKDEMO${String(i).padStart(4, "0")}`, // <-- marker
      userId: guest._id,
      serviceId: listing._id,
      serviceModel: "Management",
      serviceName: listing.serviceName,
      clientName: guest.name,
      clientEmail: guest.email,
      clientPhone: guest.phone,
      checkInDate: checkIn,
      checkOutDate: addDays(checkIn, nights),
      numberOfGuests: randInt(1, listing.capacity || 6),
      location: listing.location,
      totalAmount: total,
      baseAmount: base,
      bookingStatus: bookingStatuses[i % bookingStatuses.length],
      paymentDetails: {
        amount: total,
        currency: "INR",
        paymentMethod: pick(["credit_card", "razorpay", "debit_card"]),
        transactionId: `TXNB${i}`,
        paymentStatus: "completed",
        paidAt: created,
      },
      createdAt: created,
      updatedAt: created,
    });
  }
  const bookings = await Booking.insertMany(bookingDocs, opts);

  // 5) Payments (drives the revenue graph) -----------------------------------
  const payStatuses = [
    "completed",
    "completed",
    "completed",
    "completed",
    "completed",
    "pending",
    "failed",
    "refunded",
  ];
  const payDocs = [];
  for (let i = 0; i < 85; i++) {
    const b = bookings[i % bookings.length];
    const created = randDate();
    const status = payStatuses[i % payStatuses.length];
    payDocs.push({
      businessName: pick(BRANDS),
      personName: b.clientName,
      servicesNames: [b.serviceName],
      serviceCategory: b.serviceName,
      bookingId: b.bookingId,
      userId: b.userId,
      serviceId: b.serviceId,
      amount: b.totalAmount,
      currency: "INR",
      paymentMethod: pick(PAYMENT_METHODS),
      transactionId: `TXNDEMO${String(i).padStart(5, "0")}`, // <-- marker
      status,
      paymentDate: created,
      paymentGateway: pick(GATEWAYS),
      description: `Payment for ${b.serviceName} booking ${b.bookingId}`,
      refundAmount: status === "refunded" ? b.totalAmount : 0,
      createdAt: created,
      updatedAt: created,
    });
  }
  await Payment.insertMany(payDocs, opts);

  // 6) HelpDesk tickets ------------------------------------------------------
  const ticketStatuses = ["Pending", "Pending", "open", "resolved", "Resolved", "closed", "Read"];
  const subjects = [
    "Refund not received",
    "Unable to update listing",
    "Payout delayed",
    "Change booking dates",
    "Photo upload failing",
    "KYC verification stuck",
    "Cancellation query",
    "App login issue",
    "Wrong amount charged",
    "Need invoice copy",
    "Vendor onboarding help",
    "Calendar not syncing",
  ];
  const tixDocs = [];
  for (let i = 0; i < 16; i++) {
    const created = randDate(60);
    const { full } = nameFor(i + 200);
    tixDocs.push({
      name: full,
      email: `support.${i}@${DEMO_DOMAIN}`,
      vendorName: pick(BRANDS),
      vendorEmail: `vendor.${i % 16}@${DEMO_DOMAIN}`,
      phoneNumber: `9${randInt(100000000, 999999999)}`,
      subject: subjects[i % subjects.length],
      description: `${subjects[i % subjects.length]}. Please assist as soon as possible.`,
      status: ticketStatuses[i % ticketStatuses.length],
      priority: pick(["low", "medium", "high"]),
      createdAt: created,
      updatedAt: created,
    });
  }
  await HelpDesk.insertMany(tixDocs, opts);

  // 7) Subscribers -----------------------------------------------------------
  const subDocs = [];
  for (let i = 0; i < 34; i++) {
    const created = randDate();
    subDocs.push({
      email: `subscriber.${i}@${DEMO_DOMAIN}`,
      subscribedAt: created,
      status: i % 8 === 0 ? "unsubscribed" : "active",
      createdAt: created,
      updatedAt: created,
    });
  }
  await Subscriber.insertMany(subDocs, opts);

  // 8) Contact messages ------------------------------------------------------
  const contactDocs = [];
  for (let i = 0; i < 20; i++) {
    const created = randDate(90);
    const f = FIRST[i % FIRST.length];
    const l = LAST[i % LAST.length];
    contactDocs.push({
      firstName: f,
      lastName: l,
      email: `contact.${i}@${DEMO_DOMAIN}`,
      phone: `9${randInt(100000000, 999999999)}`,
      message: pick([
        "I'd like to know about group booking discounts.",
        "Do you offer corporate travel packages?",
        "Is the camper van pet friendly?",
        "Can I get a custom itinerary for Manali?",
        "What is the cancellation policy?",
      ]),
      status: i % 3 === 0 ? "read" : "unread",
      createdAt: created,
      updatedAt: created,
    });
  }
  await ContactMessage.insertMany(contactDocs, opts);

  // 9) Blogs -----------------------------------------------------------------
  const blogTitles = [
    "10 Offbeat Stays in the Himalayas",
    "Camper Van Road Trips Across India",
    "A Foodie's Guide to Goa",
    "Best Time to Visit Leh-Ladakh",
    "Top 7 Adventure Activities in Rishikesh",
    "Houseboat Living in Kerala",
    "Weekend Getaways Near Mumbai",
    "Desert Camping in Rajasthan",
    "How to Pack for a Trekking Trip",
    "Monsoon Travel Destinations",
  ];
  const blogDocs = blogTitles.map((title, i) => {
    const created = randDate(120);
    return {
      title,
      slug: `demo-${slug(title)}`, // <-- marker
      category: pick(["Travel Tips", "Destinations", "Adventure", "Food", "Guides"]),
      description: `${title} — everything you need to know before you go.`,
      content:
        `<p>${title}. ` +
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(8) +
        "</p>",
      coverImage: `https://picsum.photos/seed/blog${i}/1200/630`,
      authorName: nameFor(i + 300).full,
      authorImg: `https://api.dicebear.com/7.x/avataaars/svg?seed=author${i}`,
      authorRole: "Travel Writer",
      status: i % 5 === 0 ? "draft" : "published",
      createdAt: created,
      updatedAt: created,
    };
  });
  await Blog.insertMany(blogDocs, opts);

  // 10) Notifications --------------------------------------------------------
  const notifTypes = [
    "new_booking",
    "payment_received",
    "vendor_registration",
    "helpdesk_ticket",
    "new_user",
    "system_alert",
  ];
  const notifDocs = [];
  for (let i = 0; i < 14; i++) {
    const created = randDate(30);
    const type = notifTypes[i % notifTypes.length];
    const msgByType = {
      new_booking: "A new booking was just made.",
      payment_received: "Payment received successfully.",
      vendor_registration: "A new vendor registered and awaits approval.",
      helpdesk_ticket: "A new support ticket was raised.",
      new_user: "A new user signed up.",
      system_alert: "Scheduled maintenance completed.",
    };
    notifDocs.push({
      type,
      title: `[DEMO] ${type.replace(/_/g, " ")}`, // <-- marker
      message: msgByType[type],
      isRead: i % 3 === 0,
      recipientRole: "admin",
      createdAt: created,
      updatedAt: created,
    });
  }
  await Notification.insertMany(notifDocs, opts);

  return {
    users: users.length,
    vendors: vendorDocs.length,
    listings: listings.length,
    bookings: bookings.length,
    payments: payDocs.length,
    helpdesk: tixDocs.length,
    subscribers: subDocs.length,
    contacts: contactDocs.length,
    blogs: blogDocs.length,
    notifications: notifDocs.length,
  };
}

// ---- main ------------------------------------------------------------------
(async () => {
  const cleanOnly = process.argv.includes("--clean");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  console.log(`Connected to ${MONGO_URI}`);

  console.log("Removing any previous demo data...");
  const removed = await clean();
  console.log("  removed:", JSON.stringify(removed));

  if (cleanOnly) {
    console.log("--clean specified; skipping seed.");
  } else {
    console.log("Seeding demo data across the last 6 months...");
    const created = await seed();
    console.log("  created:", JSON.stringify(created, null, 2));
  }

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(0);
})().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
