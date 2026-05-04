/**
 * Migration: Seed initial FAQs for all three homepage categories
 * Run: node migrations/seed-faqs.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const FAQ = require('../models/FAQ');

const faqs = [
  // ── Camper Van ──────────────────────────────────────────────────────────────
  {
    category: 'camper van',
    question: 'What is included in the camper van rental?',
    answer: 'Each camper van comes fully equipped with bedding, kitchen essentials, a portable toilet, and a basic tool kit. Specifics vary by vehicle — check the listing for a detailed inventory.',
    isActive: true,
  },
  {
    category: 'camper van',
    question: 'Do I need a special license to drive a camper van?',
    answer: 'No special license is required for most of our camper vans. A standard driving license (B category) is sufficient. For larger vehicles above 3.5 t, a C1 license is needed — this will be noted on the listing.',
    isActive: true,
  },
  {
    category: 'camper van',
    question: 'What is the minimum rental period?',
    answer: 'The minimum rental period is 2 nights. Some vehicles may have a longer minimum during peak season — always check the listing before booking.',
    isActive: true,
  },
  {
    category: 'camper van',
    question: 'Is mileage unlimited?',
    answer: 'Most listings offer unlimited mileage within the country. Cross-border travel may require prior approval and an additional fee. Check the rental terms on each listing.',
    isActive: true,
  },
  {
    category: 'camper van',
    question: 'What happens if the van breaks down?',
    answer: 'All vehicles include 24/7 roadside assistance. In the event of a breakdown, contact the host first; if unresolved within 30 minutes, our support team will arrange alternative transport.',
    isActive: true,
  },

  // ── Unique Stay ──────────────────────────────────────────────────────────────
  {
    category: 'unique stay',
    question: 'What counts as a "unique stay"?',
    answer: 'Unique stays include treehouses, yurts, shepherd\'s huts, floating cabins, glamping pods, and other non-traditional accommodations. Each listing is curated for its one-of-a-kind character.',
    isActive: true,
  },
  {
    category: 'unique stay',
    question: 'Are unique stays suitable for families with children?',
    answer: 'Many unique stays are family-friendly. Filter listings by the "Family Friendly" tag or check the host\'s house rules to confirm age restrictions and child safety measures.',
    isActive: true,
  },
  {
    category: 'unique stay',
    question: 'What amenities can I expect?',
    answer: 'Amenities vary widely by property. Most include Wi-Fi, linen, and basic kitchen facilities. Luxury properties may offer hot tubs, private chefs, or guided experiences. Always review the amenities list on the listing page.',
    isActive: true,
  },
  {
    category: 'unique stay',
    question: 'What is the cancellation policy?',
    answer: 'Cancellation policies are set by individual hosts and are shown clearly on each listing before you book. Common options are Flexible (full refund up to 24 h before), Moderate (full refund up to 5 days before), and Strict (50 % refund up to 14 days before).',
    isActive: true,
  },
  {
    category: 'unique stay',
    question: 'Can I host my own unique stay on the platform?',
    answer: 'Yes! Register as a host, submit your property for review, and our team will verify it within 3–5 business days. Once approved, your listing goes live immediately.',
    isActive: true,
  },

  // ── Activity ──────────────────────────────────────────────────────────────
  {
    category: 'activity',
    question: 'How do I book an activity?',
    answer: 'Browse activities, select your preferred date and number of participants, and complete the checkout. You\'ll receive a confirmation email with all details and a QR code for check-in.',
    isActive: true,
  },
  {
    category: 'activity',
    question: 'Are activities suitable for beginners?',
    answer: 'Most activities offer beginner-friendly options. Each listing displays a difficulty level (Easy / Moderate / Challenging). No prior experience is required for Easy activities.',
    isActive: true,
  },
  {
    category: 'activity',
    question: 'What should I bring?',
    answer: 'Recommended gear is listed on each activity page. Unless specified otherwise, wear comfortable clothing and closed-toe shoes. Specialist equipment (e.g. helmets, harnesses) is provided by the host.',
    isActive: true,
  },
  {
    category: 'activity',
    question: 'Can I cancel or reschedule a booked activity?',
    answer: 'You can cancel or reschedule up to 48 hours before the activity start time for a full refund. Cancellations within 48 hours are non-refundable unless the host cancels due to weather or safety concerns.',
    isActive: true,
  },
  {
    category: 'activity',
    question: 'Are activities covered by insurance?',
    answer: 'All activity providers listed on our platform carry public liability insurance. We recommend guests also have personal travel insurance that covers adventure activities.',
    isActive: true,
  },
];

async function run() {
  await connectDB();

  // Avoid duplicate seeds
  const existing = await FAQ.countDocuments();
  if (existing > 0) {
    console.log(`Skipping seed — ${existing} FAQ(s) already exist in the collection.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const result = await FAQ.insertMany(faqs);
  console.log(`Seeded ${result.length} FAQs successfully.`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
