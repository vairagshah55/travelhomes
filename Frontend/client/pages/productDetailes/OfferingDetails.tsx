import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Bell,
  Menu,
  Edit2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sidebar } from '@/components/Navigation';
import { useParams, useNavigate } from 'react-router-dom';
import ProfileDropdown from '@/components/ProfileDropdown';
import MobileVendorNav from '@/components/MobileVendorNav';
import { offersApi, OfferDTO } from '@/lib/api';

const OfferingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    descriptions: true,
    details: true,
    pricing: true,
    discount: true
  });

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleEdit = () => {
    navigate(`/offering/${id}/edit`);
  };

  // Load real offer by ID
  const [offer, setOffer] = useState<OfferDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        if (!id) return;
        const res = await offersApi.get(id);
        setOffer(res.data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load offer');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  return (
    <div className="flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-3 lg:px-9 py-4 lg:py-5 bg-dashboard-bg dark:bg-gray-900">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
            
            <h1 className="text-xl lg:text-2xl font-bold text-dashboard-heading dark:text-white tracking-tight font-geist">
              Offering
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="relative bg-white dark:bg-gray-800 rounded-full border shadow-sm h-9 w-9 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all">
              <Bell size={20} className="text-gray-600 dark:text-gray-300 hover:text-dashboard-primary transition-colors" />
            </Button>
            <ProfileDropdown
              onProfileClick={() => console.log('Profile clicked')}
              onViewAsUserClick={() => console.log('Logout clicked')}
              onBusinessDetailsClick={() => console.log('Business Details clicked')}
              onPersonalDetailsClick={() => console.log('Personal Details clicked')}
              onChangePasswordClick={() => console.log('Change Password clicked')}
              onLogoutClick={() => console.log('Logout clicked')}
            />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col pr-5 pb-5">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-dashboard-stroke dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-3xl">
            <h2 className="text-xl font-bold text-dashboard-heading dark:text-white font-geist">
              {offer?.name || 'Offering'}
            </h2>
            <Button
              onClick={handleEdit}
              className="bg-dashboard-primary text-white hover:bg-gray-800 rounded-full px-6 h-11 font-geist font-medium flex items-center gap-2"
            >
              <Edit2 size={18} />
              Edit
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 bg-white dark:bg-gray-800 rounded-b-3xl overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* Caravan Descriptions Section */}
              <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    Caravan Descriptions
                  </h3>
                  <button onClick={() => toggleSection('descriptions')}>
                    {expandedSections.descriptions ? (
                      <ChevronUp size={20} className="text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
                
                {expandedSections.descriptions && (
                  <>
                    <hr className="border-dashed border-dashboard-stroke dark:border-gray-600 mb-4" />
                    
                    <div className="space-y-6">
                      {/* Name and Category */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                            Name
                          </h4>
                          <p className="text-neutral-07 dark:text-gray-400 font-plus-jakarta">
                            {offer?.name}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                            Camper Van Category
                          </h4>
                          <p className="text-neutral-07 dark:text-gray-400 font-plus-jakarta">
                            {offer?.category}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                          Descriptions
                        </h4>
                        <p className="text-sm text-neutral-07 dark:text-gray-400 leading-relaxed font-plus-jakarta">
                          {offer?.description}
                        </p>
                      </div>

                      {/* Rules & Regulation */}
                      <div className="space-y-2">
                        <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                          Rules & Regulation
                        </h4>
                        <div className="text-sm text-neutral-07 dark:text-gray-400 leading-loose font-plus-jakarta">
                          {(offer?.rules || []).map((rule, index) => (
                            <div key={index}>{rule}</div>
                          ))}
                        </div>
                      </div>

                      {/* Upload Photos */}
                      <div className="space-y-4">
                        <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                          Upload Photos
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Cover Photo */}
                          <div className="lg:col-span-1">
                            <div 
                              className="rounded-xl overflow-hidden h-64 bg-cover bg-center relative"
                              style={{ backgroundImage: `url(${offer?.photos?.coverUrl || ''})` }}
                            >
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <span className="text-white font-medium">Cover Photo</span>
                              </div>
                            </div>
                          </div>

                          {/* Gallery Photos */}
                          <div className="lg:col-span-2">
                            <div className="grid grid-cols-2 gap-4">
                              {(offer?.photos?.galleryUrls || []).slice(0, 4).map((photo, index) => (
                                <div 
                                  key={index}
                                  className="rounded-xl overflow-hidden h-28 bg-cover bg-center relative"
                                  style={{ backgroundImage: `url(${photo})` }}
                                >
                                  <div className="absolute inset-0 bg-black/10"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* CamperVan Details Section */}
              <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    CamperVan Details
                  </h3>
                  <button onClick={() => toggleSection('details')}>
                    {expandedSections.details ? (
                      <ChevronUp size={20} className="text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
                
                {expandedSections.details && (
                  <>
                    <hr className="border-dashed border-dashboard-stroke dark:border-gray-600 mb-4" />
                    
                    <div className="space-y-6">
                      {/* Features */}
                      <div className="space-y-2">
                        <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                          CamperVan Features
                        </h4>
                        <p className="text-neutral-07 dark:text-gray-400 font-plus-jakarta">
                          {(offer?.features || []).join(', ')}
                        </p>
                      </div>

                      {/* Capacity */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                            Seating Capacity
                          </h4>
                          <p className="text-neutral-07 dark:text-gray-400 font-plus-jakarta">
                            {offer?.seatingCapacity}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                            Sleeping Capacity
                          </h4>
                          <p className="text-neutral-07 dark:text-gray-400 font-plus-jakarta">
                            {offer?.sleepingCapacity}
                          </p>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="space-y-2">
                        <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                          Address
                        </h4>
                        <div className="text-neutral-07 dark:text-gray-400 font-plus-jakarta">
                          <p>{[offer?.locality, offer?.city, offer?.state].filter(Boolean).join(', ')}</p>
                          <p>{offer?.pincode}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Pricing Details Section */}
              <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    Pricing Details
                  </h3>
                  <button onClick={() => toggleSection('pricing')}>
                    {expandedSections.pricing ? (
                      <ChevronUp size={20} className="text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
                
                {expandedSections.pricing && (
                  <>
                    <hr className="border-dashed border-dashboard-stroke dark:border-gray-600 mb-4" />
                    
                    <div className="space-y-6">
                      {/* Regular Price */}
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                          Regular Price (in Rupees):
                        </span>
                        <span className="text-base font-bold text-black dark:text-white font-plus-jakarta">
                          ₹{Number(offer?.regularPrice || 0)} / day
                        </span>
                      </div>

                      {/* Price Excludes */}
                      <div className="space-y-2">
                        <h4 className="text-base font-normal text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                          Above price excludes
                        </h4>
                        <div className="text-sm text-neutral-07 dark:text-gray-400 leading-loose font-plus-jakarta">
                          {(offer?.priceExcludes || []).map((item, index) => (
                            <div key={index}>{item}</div>
                          ))}
                        </div>
                      </div>

                      {/* Price Includes */}
                      <div className="space-y-2">
                        <h4 className="text-base font-normal text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                          Above price Includes
                        </h4>
                        <div className="text-sm text-neutral-07 dark:text-gray-400 leading-loose font-plus-jakarta">
                          {(offer?.priceIncludes || []).map((item, index) => (
                            <div key={index}>{item}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Discount Details Section */}
              <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    Discount Details
                  </h3>
                  <button onClick={() => toggleSection('discount')}>
                    {expandedSections.discount ? (
                      <ChevronUp size={20} className="text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
                
                {expandedSections.discount && (
                  <>
                    <hr className="border-dashed border-dashboard-stroke dark:border-gray-600 mb-4" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                          Discount Name
                        </h4>
                        <p className="text-neutral-07 dark:text-gray-400 font-plus-jakarta">
                          {/* No discount data in OfferDTO yet */}
                          -
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                          Discount Type
                        </h4>
                        <p className="text-neutral-07 dark:text-gray-400 font-plus-jakarta">
                          -
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                          Discount Percentage
                        </h4>
                        <p className="text-neutral-07 dark:text-gray-400 font-plus-jakarta">
                          -
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                          Final Price
                        </h4>
                        <p className="text-neutral-07 dark:text-gray-400 font-plus-jakarta">
                          -
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
           <div className='fixed '>  <MobileVendorNav/></div>
    </div>
  );
};

export default OfferingDetails;
