import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Search } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { cmsPublicApi, PublicFaq, helpDeskApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/ui/Loader';

/* ---------------- TAB MAP (single source of truth) ---------------- */
const tabLabelMap: Record<string, string> = {
  guest: 'Guest',
  booking: 'Booking',
  common: 'Common Questions',
  locations: 'Locations',
};

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
}

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('guest');
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: `${user?.firstName} ${user?.lastName}` || '',
    phoneNumber: user?.phoneNumber || '',
    subject: '',
    email: user?.email || '',
    description: '',
  });

  const [allFaqs, setAllFaqs] = useState<PublicFaq[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [visibleTabs, setVisibleTabs] = useState<string[]>([]);
const [loading, setLoading] = useState(true);
  /* ---------------- FETCH FAQs ---------------- */
  useEffect(() => {
    (async () => {
      try {
        const list = await cmsPublicApi.listFaqs();
        setAllFaqs(list || []);
      } catch (err) {
        console.error('Failed to fetch FAQs', err);
      }
    })();
  }, []);

  /* ---------------- CALCULATE VISIBLE TABS ---------------- */
  useEffect(() => {
    if (!allFaqs.length) {
      setVisibleTabs([]);
      return;
    }

    const tabsWithFaqs = Object.keys(tabLabelMap).filter((tabKey) =>
      allFaqs.some(
        (faq) =>
          (faq.category || '').toLowerCase() ===
          tabLabelMap[tabKey].toLowerCase()
      )
    );

    setVisibleTabs(tabsWithFaqs);

    // active tab agar remove ho jaye to first valid tab set karo
    if (!tabsWithFaqs.includes(activeTab)) {
      setActiveTab(tabsWithFaqs[0] || '');
    }
  }, [allFaqs]);

  /* ---------------- FILTER FAQS BY ACTIVE TAB ---------------- */
  useEffect(() => {
    if (!activeTab) {
      setFaqItems([]);
      return;
    }

    const filtered = allFaqs
      .filter(
        (f) =>
          (f.category || '').toLowerCase() ===
          tabLabelMap[activeTab]?.toLowerCase()
      )
      .map((f) => ({
        id: f._id,
        question: f.question,
        answer: f.answer || '',
        isOpen: false,
      }));

    setFaqItems(filtered);
  }, [activeTab, allFaqs]);

  /* ---------------- TOGGLE FAQ ---------------- */
  const toggleFAQ = (id: string) => {
    setFaqItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, isOpen: !item.isOpen } : item
      )
    );
  };

  /* ---------------- FORM HANDLERS ---------------- */
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await helpDeskApi.create(formData);
      toast.success('Ticket raised successfully!', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
      });
      setFormData((prev) => ({ ...prev, subject: '', description: '' }));
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      toast.error('Failed to submit ticket. Please try again.', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#EF4444',
        },
      });
    }
  };

  /* ---------------- SEARCH FILTER ---------------- */
const filteredFAQs = searchQuery.trim()
  ? faqItems.filter((faq) => {
      const q = searchQuery.toLowerCase();
      return (
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q)
      );
    })
  : faqItems;

  useEffect(() => {
    // Simulate dynamic data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex-col flex gap-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      <Header variant="transparent" className="fixed w-full z-50" />


      {loading && (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader size="xl" />
          <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
           Fetching help information...
          </p>
        </div>
      </div>
    )
  }

      <main className="px-4 mt-10 md:mt-20 sm:px-6 lg:px-10 py-10">
        <div className="max-w-5xl mx-auto w-full">
          {/* Page Header */}
          <div className="text-center mb-10 px-2">
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-semibold text-dashboard-heading font-poppins leading-tight mb-6">
              👋🏻 Hi {formData.name || 'there'}, how can we help?
            </h1>

            {/* Search Bar */}
            <div className="relative mx-auto max-w-xl w-full mb-8">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your queries here..."
                className="pl-10 pr-16 py-4 rounded-full border-gray-300 font-plus-jakarta text-base w-full"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Button className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-dashboard-primary rounded-full p-0">
                <Search className="h-5 w-5 text-white dark:text-white" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap justify-center border-b border-gray-100 mb-8">
              {visibleTabs.map((tabKey) => (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-5 py-2 text-sm sm:text-base font-semibold transition-colors ${
                    activeTab === tabKey
                      ? 'text-dashboard-primary border-b-2 border-dashboard-primary'
                      : 'text-gray-400 hover:text-dashboard-primary'
                  }`}
                >
                  {tabLabelMap[tabKey]}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="space-y-5 mb-16">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border transition-all ${
                    item.isOpen
                      ? 'bg-gray-100 dark:bg-gray-800 dark:text-white border-gray-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(item.id)}
                    className="w-full flex items-center justify-between px-4 sm:px-6 py-5 text-left"
                  >
                    <span className="text-base sm:text-lg text-dashboard-primary font-geist pr-4">
                      {item.question}
                    </span>
                    {item.isOpen ? (
                      <Minus className="h-5 w-5 text-dashboard-primary flex-shrink-0" />
                    ) : (
                      <Plus className="h-6 w-6 text-dashboard-primary flex-shrink-0" />
                    )}
                  </button>

                  {item.isOpen && item.answer && (
                    <div className="px-4 sm:px-6 pb-5">
                      <p className="text-sm sm:text-base text-gray-500 dark:bg-gray-800 dark:text-white font-plus-jakarta leading-6">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No results found.</p>
            )}
          </div>

          {/* Ticket Form */}
          <div className="bg-gray-100 dark:bg-gray-800 dark:text-white rounded-xl px-4 sm:px-6 py-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-dashboard-heading font-poppins mb-5">
              Raise a Ticket
            </h2>

            <div className="space-y-5">
              {/* Name and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm sm:text-base text-dashboard-title font-plus-jakarta mb-2">
                    Name
                  </label>
                  <Input
                    value={formData.name}
                    placeholder='Enter your name'
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="border-gray-400 rounded-lg w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base text-dashboard-title font-plus-jakarta mb-2">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phoneNumber}
                      placeholder='Enter your phone number'
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="border-gray-400 rounded-lg w-full"
                  />
                </div>
              </div>

              {/* Subject and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm sm:text-base text-dashboard-title font-plus-jakarta mb-2">
                    Subject
                  </label>
                  <Input
                    value={formData.subject}
                      placeholder='Enter your subject'
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="border-gray-400 rounded-lg w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base text-dashboard-title font-plus-jakarta mb-2">
                    Email
                  </label>
                  <Input
                    value={formData.email}
                      placeholder='Enter your email'
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="border-gray-400 rounded-lg w-full outline-none"
                  />
                </div>
              </div>

              {/* City Field */}
              <div>
                <label className="block text-sm sm:text-base text-dashboard-title font-plus-jakarta mb-2  ">
                  Description
                </label>
               <Textarea
  value={formData.description}
  placeholder="Enter description of your issue"
  onChange={(e) => handleInputChange('description', e.target.value)}
  className="border-gray-400 h-32 rounded-lg resize-none w-full outline-none  transition-colors"
/>

              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  className="bg-dashboard-primary text-white dark:text-white px-6 sm:px-10 py-3 rounded-full hover:bg-gray-500 font-geist"
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Help;
