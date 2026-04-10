"use client";
import React, { useRef, useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Minus, Plus, SearchIcon, Star } from "lucide-react";
import { cmsPublicApi, PublicFaq } from "@/lib/api";
import { testimonialsApi, PublicTestimonial } from "@/lib/testimonials";
import TestimonialCard from "@/components/TestimonialCard";
import { Loader } from "@/components/ui/Loader";

const hostBenefits = [
  {
    img: "/host1.jpg",
    title: "Get 5-Star Reviews Fast",
    text: "We help boost your ratings with consistent guest service and attention to detail.",
  },
  {
    img: "/host.jpg",
    title: "Maximize Your Profit",
    text: "Dynamic pricing and listing optimization help you earn the most from your home.",
  },
  {
    img: "/host2.jpg",
    title: "Save Your Time",
    text: "We handle bookings, payments, & guest communication, so you don't have to.",
  },
];

const cardList = [
  {
    title: "Host It Yourself",
    bullets: [
      "List directly on travel sites",
      "Control your calendar and guests",
      "Set your own house rules",
      "Respond to guest inquiries",
      "Manage cleanings and maintenance",
      "Collect and handle payments",
      "Handle all guest check-ins/outs",
      "Market your home yourself",
    ],
  },
  {
    title: "Managed by Us",
    bullets: [
      "Professional listing & photography",
      "Dynamic pricing & revenue management",
      "24/7 guest support",
      "Housekeeping & quality checks",
      "Maintenance coordinated for you",
      "All bookings, checks & payments handled",
      "Optimal occupancy & rate",
      "No stress or hassle",
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer?: string }) {
  const [openAns, setOpenAns] = useState(false);

  const toggleAnswer = () => setOpenAns((prev) => !prev);

  return (
    <div
      className={`w-full rounded-lg border transition-colors ${
        openAns
          ? "bg-gray-50 dark:bg-black dark:text-white border-gray-200"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Question Header */}
      <div    onClick={toggleAnswer}
      className="flex items-start justify-between gap-4  p-4 sm:p-5 md:p-6 cursor-pointer ">
        <p
       
          className={`text-sm md:text-base  leading-relaxed flex-1 ${
            openAns
              ? "text-gray-800 dark:text-white"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {question}
        </p>

        <div className="flex-shrink-0">
          {openAns ? (
            <Minus
              onClick={toggleAnswer}
              className="w-6 h-6 cursor-pointer text-gray-900 dark:text-white"
            />
          ) : (
            <Plus
              onClick={toggleAnswer}
              className="w-5 h-5 cursor-pointer text-gray-900 dark:text-white"
            />
          )}
        </div>
      </div>

      {/* Answer Content */}
      {openAns && answer && (
        <div className="mt-4 pt-4 border-t border-gray-200  p-4 sm:p-5 md:p-4">
          <p className="text-gray-600 dark:text-white text-sm md:text-base leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function VacationRentalPlatform() {
  const [activeTab, setActiveTab] = useState("activities");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
   const [rental, setRental] = useState(45000);
  const [showwAddReview, setShowwAddReview] = useState(false);
  const [days, setDays] = useState(21);
  const [faqs, setFaqs] = useState<PublicFaq[]>([]);
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([]);
  const scrollRef = useRef(null);
const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const list = await testimonialsApi.list();
        setTestimonials(list || []);
      } catch (err) {
        console.error("Failed to load testimonials", err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await cmsPublicApi.listFaqs();
        setFaqs(list || []);
      } catch (err) {
        console.error("Failed to fetch FAQs", err);
      }
    })();
  }, []);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({
      left: -300,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({
      left: 300,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    // Simulate dynamic data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

 
  return (
   <>
  <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
    
    <Header variant="transparent" className="fixed w-full z-50" />

    {loading && (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader size="xl" />
          <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
            Fetching hostwithus data...
          </p>
        </div>
      </div>
    )
  }

 <section className="w-full mt-20 relative h-[300px] md:h-[350px] ">
        <img
          src="/career.jpg"
          alt="Career Banner"
          className="w-full h-full object-cover"
        />
        <div className="gap-6 absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-3xl md:text-5xl font-semibold">Host With Us</h1>
          <p className="max-w-2xl text-sm md:text-base">
            Join a team where passion meets purpose. We’re more than just a workplace—we’re a
            community driven by innovation, collaboration, and a shared vision to make a difference.
          </p>
          <div className="flex items-center rounded-full py-1 px-6 bg-white text-black border outline-none w-full max-w-md">
            <input
              type="text"
              placeholder="Search jobs..."
              className="flex-grow bg-transparent outline-none text-sm"
            />
            <div className="flex items-center justify-center bg-black rounded-full h-8 w-8 cursor-pointer">
              <SearchIcon className="text-white h-3 w-3" />
            </div>
          </div>
        </div>
      </section>
    <section className="max-w-7xl mx-auto w-full">

      {/* HERO */}
      <div className="flex flex-col lg:flex-row gap-8 dark:bg-black mx-4 md:px-4 mt-20 overflow-hidden">

        <img
          className="w-full lg:w-1/2 h-[250px] sm:h-[350px] md:h-[400px] rounded-lg border object-cover"
          src="/host.jpg"
          alt="Vacation Homes"
        />

        <div className="flex-1 p-6 border rounded-lg flex items-center justify-center">
          <div className="max-w-2xl flex flex-col gap-5">
            <h1 className="italic text-3xl md:text-4xl lg:text-5xl font-bold">
              “The{" "}
              <span className="text-[#979797]">
                Host-Friendly, <br /> Decentralized
              </span>{" "}
              & All-in-One Platform for Vacation Rentals”
            </h1>

            <p className="text-gray-600 dark:text-white text-sm md:text-base text-center lg:text-left">
              At Travel Homes, we empower individuals to unlock the potential
              of their homes by hosting travelers from around the globe.
              Whether you own a cozy apartment, a serene villa, or a unique
              getaway, becoming a host with us is your gateway to earning
              extra income while creating unforgettable guest experiences.
            </p>
          </div>
        </div>
      </div>


      {/* PROFIT SECTION */}
      <div className="w-full flex flex-col lg:flex-row gap-10 justify-between items-center mt-12 px-4 md:px-14">

        {/* LEFT */}
        <div className="flex-1 text-center lg:text-left">

          <p className="text-xl sm:text-2xl font-bold mt-4">
            Your Home Could Make
          </p>

          <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mt-2">
            ₹93,000
          </h2>

          <p className="text-lg sm:text-xl font-bold">
            on Travel Homes
          </p>

          <p className="text-xs text-black dark:text-white mt-4 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Due to growing workload, we are looking for experienced and talented
            Full-Stack Developers to join our fast-paced Engineering team.
            You will work closely with Product, Design and Marketing to analyze,
            develop and debug.
          </p>

          <p className="text-xs text-black dark:text-white mt-4 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Due to growing workload, we are looking for experienced and talented
            Full-Stack Developers to join our fast-paced Engineering team.
          </p>
        </div>


        {/* CALCULATOR */}
        <div className="bg-gradient-to-t from-[#FFFFFF] to-[#d7e1f0] p-6 rounded-xl shadow dark:bg-black border dark:border-slate-300 w-full max-w-md">

          <h3 className="font-bold mb-6 text-xl">
            Profit Calculator
          </h3>

          {/* RENTAL */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Per Day Rental
            </p>

            <p className="font-bold text-lg text-center mb-2">
              ₹{rental.toLocaleString()}
            </p>

            <input
              type="range"
              min="1000"
              max="100000"
              value={rental}
              onChange={(e) => setRental(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* DAYS */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Occupancy In A Month
            </p>

            <p className="font-bold text-lg text-center mb-2">
              {days} Day
            </p>

            <input
              type="range"
              min="1"
              max="31"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

        </div>
      </div>


      {/* CARDS */}
      <div className="w-full grid gap-6 grid-cols-1 md:grid-cols-2 my-12 px-4 md:px-14">

        {cardList.map((card) => (

          <div
            key={card.title}
            className="bg-white dark:bg-black shadow rounded-lg p-6"
          >

            <h2 className="text-xl font-bold mb-4">
              {card.title}
            </h2>

            <ul className="space-y-2 text-gray-600 dark:text-white mb-4">
              {card.bullets.map((b, i) => (
                <li key={i} className="flex items-center">
                  <span className="text-green-500 mr-2">•</span>
                  {b}
                </li>
              ))}
            </ul>

            <div className="flex justify-end gap-2 flex-wrap">

              <button className="px-4 py-2 bg-black text-white rounded-full">
                Apply
              </button>

              <button className="px-4 py-2 border border-gray-600 rounded-full">
                Learn More
              </button>

            </div>
          </div>

        ))}
      </div>


      {/* BENEFITS */}
      <div className="w-full my-10 px-4 md:px-14">

        <h2 className="text-2xl font-bold text-center mb-4">
          Benefits of Working With Us
        </h2>

        <p className="text-center text-gray-600 dark:text-white mb-6">
          We believe that great work starts with a great workplace.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {hostBenefits.map((benefit) => (

            <div
              key={benefit.title}
              className="bg-white dark:bg-black shadow rounded-lg flex flex-col items-center p-6 text-center"
            >

              <img
                src={benefit.img}
                alt={benefit.title}
                className="rounded-xl h-[200px] w-full object-cover mb-4"
              />

              <h3 className="text-lg font-semibold mb-2">
                {benefit.title}
              </h3>

              <p className="text-gray-600 dark:text-white">
                {benefit.text}
              </p>

            </div>

          ))}

        </div>
      </div>


      {/* BANNER */}
      <div className="px-4 md:px-16 w-full">
        <img
          src="/hostbanner.png"
          className="w-full object-cover rounded-lg"
          alt="Host Banner"
        />
      </div>


      {/* TESTIMONIAL SECTION */}
      <div className="w-full px-4 md:px-14 py-12">
        <div className="flex flex-col lg:justify-between gap-4 lg:flex-row">
<div className="mb-4 ">
        <h2 className="text-2xl font-bold">
          Testimonials
        </h2>
    <p className="text-gray-600 dark:text-white">
            Most popular choices for travelers from India
          </p>
          </div>
             <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 dark:bg-white dark:text-black rounded-full border-black"
            onClick={scrollLeft}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Button
            size="icon"
            className="h-12 w-12 rounded-full dark:bg-white dark:text-black bg-black text-white"
            onClick={scrollRight}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
          </div>
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide"
        >

          {testimonials.map((t, i) => (

            <div key={i} className="min-w-[300px] sm:min-w-[300px]">
              <TestimonialCard
                userName={t.userName}
                rating={t.rating}
                content={t.content}
                avatar={t.avatar}
              />
            </div>

          ))}

        </div>

      </div>


      {/* FAQ */}
     <section className="py-8 md:py-12 px-4 md:px-20">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-12 mx-auto">
          {/* Header + Tabs */}
          <div className="text-center lg:text-left w-full lg:w-4/12">
            <h2 className="text-center text-2xl sm:text-xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 capitalize">
              Frequently asked questions
            </h2>
            <p className="text-gray-600 text-center dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 mb-8 text-sm sm:text-base">
 We’re here to make your experience as smooth as possible. This section provides clear explanations, useful tips, and detailed guidance to help you get the most out of our platform.            </p>

            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center lg:justify-between gap-2 bg-white border border-gray-200 rounded-full p-1 mb-8 shadow-sm max-w-full">
              {[
                { id: "unique-stays", label: "Unique Stays" },
                { id: "activities", label: "Activities" },
                { id: "caravan", label: "Caravan" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition-colors ${
                    activeTab === tab.id
                      ? "bg-black text-white"
                      : "text-black hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Items */}
          <div className="w-full lg:w-7/12 space-y-4">
            {faqs
              .filter((faq) => {
                const cat = (faq.category || "").toLowerCase();
                if (activeTab === "activities") return cat === "activity";
                if (activeTab === "unique-stays") return cat === "unique stay";
                if (activeTab === "caravan") return cat === "camper van";
                return false;
              })
              .map((faq) => (
                <FAQItem
                  key={faq._id}
                  question={faq.question}
                  answer={faq.answer || ""}
                />
              ))}
            {faqs.filter((faq) => {
              const cat = (faq.category || "").toLowerCase();
              if (activeTab === "activities") return cat === "activity";
              if (activeTab === "unique-stays") return cat === "unique stay";
              if (activeTab === "caravan") return cat === "camper van";
              return false;
            }).length === 0 && (
              <p className="text-gray-500 italic">No FAQs available for this category.</p>
            )}
          </div>
        </div>
      </section>

    </section>

    <Footer />

  </div>
</>
  );
}
