import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  label: string;
  faqs: FAQItem[];
}

interface FAQSectionProps {
  title?: string;
  categories: FAQCategory[];
  defaultCategory?: string;
}

export default function FAQSection({ 
  title = "Frequently Asked Questions", 
  categories, 
  defaultCategory 
}: FAQSectionProps) {
  const [activeCategory, setActiveCategory] = useState(defaultCategory || categories[0]?.id);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const activeCategoryData = categories.find(cat => cat.id === activeCategory);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="flex max-md:flex-col space-y-8">
     <div className='w-[50%] max-md:w-full mt-32'>
       <h2 className="text-2xl text-center  font-bold dark:bg-black dark:text-white text-black mb-6">{title}</h2>
      
      {/* Category Buttons */}
      <div className="flex flex-wrap gap-4 mb-6 items-center justify-center">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setActiveCategory(category.id);
              setOpenFAQ(null); // Reset open FAQ when switching categories
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === category.id
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-gray-100 text-gray-700 dark:bg-black dark:text-white hover:bg-gray-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

     </div>
      {/* FAQ Content */}
      <div className="space-y-4 w-full">
        {activeCategoryData?.faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-500 transition-colors"
            >
              <span className="font-medium text-black dark:text-white pr-4">{faq.question}</span>
              <span className={`text-gray-500  dark:text-white transition-transform ${
                openFAQ === index ? 'rotate-180' : ''
              }`}>
                ↓
              </span>
            </button>
            {openFAQ === index && (
              <div className="px-6 pb-4">
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-gray-700 dark:text-white leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Predefined FAQ data for different types
export const campervanFAQs: FAQCategory[] = [
  {
    id: 'vehicle-info',
    label: 'Vehicle Information',
    faqs: [
      {
        question: 'What is the fuel efficiency of the camper van?',
        answer: 'Our camper vans typically achieve 12-15 MPG depending on driving conditions and terrain. We provide detailed fuel consumption estimates based on your planned route.'
      },
      {
        question: 'How many people can sleep in the van?',
        answer: 'This camper van comfortably sleeps 4 people with a queen bed in the back and a convertible dinette that becomes a double bed.'
      },
      {
        question: 'Is the van equipped with a bathroom?',
        answer: 'Yes, the van includes a compact wet bath with toilet, sink, and shower. Fresh water tank holds 20 gallons and gray water tank holds 15 gallons.'
      },
      {
        question: 'What kitchen amenities are included?',
        answer: 'The kitchen features a 2-burner gas stove, refrigerator/freezer, microwave, sink with hot water, and ample storage for cookware and groceries.'
      }
    ]
  },
  {
    id: 'rental-terms',
    label: 'Rental Terms',
    faqs: [
      {
        question: 'What is your cancellation policy?',
        answer: 'Free cancellation up to 14 days before your trip. 50% refund for cancellations 7-14 days before, and 25% refund for 3-7 days before. No refund for cancellations within 72 hours.'
      },
      {
        question: 'What is included in the rental price?',
        answer: 'Rental includes unlimited mileage, basic insurance, kitchen essentials, bedding, towels, camping chairs, and a welcome kit with snacks and local recommendations.'
      },
      {
        question: 'Are pets allowed in the camper van?',
        answer: 'Pets are welcome for an additional fee of $50 per stay. Please ensure pets are house-trained and well-behaved. A pet damage deposit of $200 is required.'
      },
      {
        question: 'What is the minimum rental period?',
        answer: 'Minimum rental is 3 nights. Weekly and monthly discounts are available for longer stays.'
      }
    ]
  },
  {
    id: 'safety',
    label: 'Safety & Requirements',
    faqs: [
      {
        question: 'What are the driver requirements?',
        answer: 'Primary driver must be 25+ years old with a valid driver\'s license for at least 3 years. Additional drivers can be added for $10/day each.'
      },
      {
        question: 'What safety equipment is provided?',
        answer: 'All vans include fire extinguisher, smoke detector, carbon monoxide detector, first aid kit, emergency roadside kit, and 24/7 roadside assistance.'
      },
      {
        question: 'Is insurance included?',
        answer: 'Basic liability insurance is included. We strongly recommend purchasing our comprehensive coverage for $25/day which covers collision, theft, and interior damage.'
      },
      {
        question: 'What happens in case of breakdown?',
        answer: 'We provide 24/7 roadside assistance and will arrange repairs or a replacement vehicle if needed. Emergency contact numbers are provided at pickup.'
      }
    ]
  }
];

export const uniqueStayFAQs: FAQCategory[] = [
  {
    id: 'house-rules',
    label: 'House Rules',
    faqs: [
      {
        question: 'What are the check-in and check-out times?',
        answer: 'Check-in is after 3:00 PM and check-out is before 11:00 AM. Early check-in or late check-out may be available upon request for an additional fee.'
      },
      {
        question: 'Is smoking allowed in the property?',
        answer: 'No smoking is allowed anywhere inside the property. Designated outdoor smoking areas are available in the garden.'
      },
      {
        question: 'Can I host parties or events?',
        answer: 'No parties, events, or gatherings are permitted. The property is intended for quiet, relaxing stays only.'
      },
      {
        question: 'What are the quiet hours?',
        answer: 'Quiet hours are from 10:00 PM to 8:00 AM. Please be considerate of neighbors and other guests during these times.'
      }
    ]
  },
  {
    id: 'amenities',
    label: 'Amenities & Services',
    faqs: [
      {
        question: 'Is WiFi available throughout the property?',
        answer: 'Yes, complimentary high-speed WiFi is available throughout the entire property with speeds up to 100 Mbps.'
      },
      {
        question: 'Is parking included?',
        answer: 'Yes, secure garage parking for one vehicle is included. Additional parking can be arranged for $25 per night.'
      },
      {
        question: 'Are cleaning services provided?',
        answer: 'Daily housekeeping is included for stays over 7 nights. Additional cleaning services can be arranged for $150 per service.'
      },
      {
        question: 'What kitchen appliances are available?',
        answer: 'The fully equipped kitchen includes a professional-grade stove, oven, refrigerator, dishwasher, microwave, coffee machine, and all cookware and utensils.'
      }
    ]
  },
  {
    id: 'policies',
    label: 'Policies',
    faqs: [
      {
        question: 'What is your cancellation policy?',
        answer: 'Strict cancellation policy: Full refund if cancelled 14+ days before check-in. 50% refund for 7-14 days. No refund for cancellations within 7 days.'
      },
      {
        question: 'Are children welcome?',
        answer: 'Yes, children of all ages are welcome. Please note that the property contains antique furnishings and artwork that require careful handling.'
      },
      {
        question: 'What is the damage deposit policy?',
        answer: 'A refundable security deposit of $500 is required and will be returned within 7 days after check-out, subject to property inspection.'
      },
      {
        question: 'Are additional guests allowed?',
        answer: 'The maximum occupancy is 6 guests. Additional guests can be accommodated for $50 per person per night, subject to availability.'
      }
    ]
  }
];

export const activityFAQs: FAQCategory[] = [
  {
    id: 'requirements',
    label: 'Requirements',
    faqs: [
      {
        question: 'What is the minimum age requirement?',
        answer: 'Participants must be at least 16 years old. Minors ages 16-17 must be accompanied by a parent or guardian and have a signed waiver.'
      },
      {
        question: 'Do I need prior climbing experience?',
        answer: 'No prior experience is necessary! Our expert instructors provide comprehensive training for beginners. This activity is designed for intermediate skill level but all levels are welcome.'
      },
      {
        question: 'What fitness level is required?',
        answer: 'Moderate fitness level is recommended. Participants should be able to hike 1-2 miles and be comfortable with heights. If you have concerns, please contact us to discuss.'
      },
      {
        question: 'What should I wear and bring?',
        answer: 'Wear comfortable athletic clothing and closed-toe shoes. Bring sunscreen, water bottle, and camera. All climbing equipment is provided.'
      }
    ]
  },
  {
    id: 'safety',
    label: 'Safety Information',
    faqs: [
      {
        question: 'What safety measures are in place?',
        answer: 'All guides are certified by AMGA/PCIA. We maintain a 3:1 participant to instructor ratio maximum. All equipment is professionally inspected and meets international safety standards.'
      },
      {
        question: 'What happens in bad weather?',
        answer: 'Activities may be cancelled for safety due to rain, lightning, or high winds. We offer full refunds for weather cancellations or can reschedule for another date.'
      },
      {
        question: 'Are there any medical restrictions?',
        answer: 'Participants with heart conditions, pregnancy, recent surgeries, or severe fear of heights should not participate. Please disclose any medical conditions during booking.'
      },
      {
        question: 'What insurance coverage is provided?',
        answer: 'All participants are covered by our comprehensive liability insurance. We recommend personal travel insurance for additional coverage.'
      }
    ]
  },
  {
    id: 'booking',
    label: 'Booking & Cancellation',
    faqs: [
      {
        question: 'How far in advance should I book?',
        answer: 'We recommend booking at least 1 week in advance, especially during peak seasons (spring and fall). Same-day bookings may be available based on guide availability.'
      },
      {
        question: 'What is your cancellation policy?',
        answer: 'Free cancellation up to 48 hours before the activity. Cancellations within 48 hours receive a 50% refund. No refund for no-shows.'
      },
      {
        question: 'Can I reschedule my booking?',
        answer: 'Yes, you can reschedule once without penalty if done at least 48 hours in advance. Additional rescheduling may incur a $25 fee.'
      },
      {
        question: 'What if our group size changes?',
        answer: 'You can adjust group size up to 24 hours before the activity. Additional participants are subject to availability and must meet all requirements.'
      }
    ]
  }
];
