import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell,
  Menu,
  Plus,
  ChevronDown,
  Upload,
  X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sidebar } from '@/components/Navigation';
import { useNavigate, useParams } from 'react-router-dom';
import ProfileDropdown from '@/components/ProfileDropdown';

const EditOfferings = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('camper-van');
  const [dragActive, setDragActive] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    rules: [''],
    features: [],
    seatingCapacity: '',
    sleepingCapacity: '',
    locality: '',
    pincode: '',
    city: '',
    state: '',
    regularPrice: '',
    priceIncludes: [''],
    priceExcludes: [''],
    photos: {
      cover: null as File | null,
      gallery: [] as File[]
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Mock data to simulate loading existing offering data
  useEffect(() => {
    // Simulate loading existing data based on ID
    const mockExistingData = {
      name: 'MiniVan 4 Setter',
      category: 'Camper Trailer',
      description: 'A camper van is a versatile, self-contained vehicle designed for travel and living on the road. It typically includes a sleeping area, a small kitchenette, and sometimes a compact bathroom.',
      rules: [
        'Follow all traffic laws and speed limits.',
        'The driver must have a valid license and insurance.',
        'Avoid reckless driving or off-road travel in restricted areas.'
      ],
      features: ['Fan', 'Cooler', 'AC', 'Kitchen utilities'],
      seatingCapacity: '4',
      sleepingCapacity: '5',
      locality: '23, Green Valley Road, Sector 5',
      pincode: '500034',
      city: 'Hyderabad',
      state: 'Telangana',
      regularPrice: '5000',
      priceIncludes: [
        'Follow all traffic laws and speed limits.',
        'The driver must have a valid license and insurance.'
      ],
      priceExcludes: [
        'Personal insurance coverage',
        'Fuel costs'
      ],
      photos: {
        cover: null,
        gallery: []
      }
    };

    setFormData(mockExistingData);
  }, [id]);

  const categories = [
    'Camper Trailer',
    'Luxury RV',
    'Basic Van',
    'Adventure Vehicle'
  ];

  const features = [
    'Fan', 'Cooler', 'AC', 'Kitchen utilities', 'Drinking water', 
    'Hot water', 'Washroom', 'Bathroom', 'WiFi', 'Solar panels'
  ];

  const capacityOptions = ['1', '2', '3', '4', '5', '6', '7', '8+'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].map((item: string, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev], '']
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].filter((_: any, i: number) => i !== index)
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'cover' | 'gallery') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (type === 'cover') {
        setFormData(prev => ({
          ...prev,
          photos: { ...prev.photos, cover: file }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          photos: { 
            ...prev.photos, 
            gallery: [...prev.photos.gallery, file]
          }
        }));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'gallery') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'cover') {
        setFormData(prev => ({
          ...prev,
          photos: { ...prev.photos, cover: file }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          photos: { 
            ...prev.photos, 
            gallery: [...prev.photos.gallery, file]
          }
        }));
      }
    }
  };

  const handleSubmit = () => {
    // Validate form
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (formData.name.length > 50) newErrors.name = 'Name must be 50 characters or less';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (formData.description.length > 200) newErrors.description = 'Description must be 200 characters or less';
    if (!formData.regularPrice) newErrors.regularPrice = 'Price is required';
    if (formData.regularPrice && isNaN(Number(formData.regularPrice))) newErrors.regularPrice = 'Price must be a valid number';

    setErrors(newErrors);
    setShowErrorAlert(false);

    if (Object.keys(newErrors).length === 0) {
      try {
        // Simulate API call
        setShowSuccessAlert(true);
        setTimeout(() => {
          navigate(`/offering/${id}`);
        }, 2000);
      } catch (error) {
        setErrorMessage('Failed to update offering. Please try again.');
        setShowErrorAlert(true);
      }
    } else {
      setErrorMessage('Please fix the errors below and try again.');
      setShowErrorAlert(true);
    }
  };

  const handleCancel = () => {
    navigate(`/offering/${id}`);
  };

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
              onViewAsUserClick={() => console.log('View As User clicked')}
              onBusinessDetailsClick={() => console.log('Business Details clicked')}
              onPersonalDetailsClick={() => console.log('Personal Details clicked')}
              onChangePasswordClick={() => console.log('Change Password clicked')}
              onLogoutClick={() => console.log('Logout clicked')}
            />
          </div>
        </header>

        {/* Success Alert */}
        {showSuccessAlert && (
          <div className="mx-5 mt-5">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 animate-fade-in">
              <AlertDescription className="text-green-800 dark:text-green-200">
                Offering updated successfully! Redirecting to offering details...
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Error Alert */}
        {showErrorAlert && (
          <div className="mx-5 mt-5">
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 animate-fade-in">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col pr-5 pb-5">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-dashboard-stroke dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-3xl">
            <h2 className="text-xl font-bold text-dashboard-heading dark:text-white font-geist">
              Edit Offerings
            </h2>
            <Button className="bg-dashboard-primary text-white hover:bg-gray-800 rounded-full px-6 h-11 font-geist font-medium flex items-center gap-2">
              <Plus size={18} />
              New Booking
            </Button>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-5 bg-white dark:bg-gray-800 rounded-b-3xl overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Tabs */}
              <div className="flex items-center gap-6 border-b border-dashboard-stroke dark:border-gray-600">
                <button
                  onClick={() => setActiveTab('camper-van')}
                  className={`px-4 py-3 text-base font-bold font-plus-jakarta relative ${
                    activeTab === 'camper-van' 
                      ? 'text-dashboard-heading dark:text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-dashboard-heading dark:hover:text-white'
                  }`}
                >
                  Camper Van
                  {activeTab === 'camper-van' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dashboard-primary"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('unique-stay')}
                  className={`px-4 py-3 text-base font-bold font-plus-jakarta relative ${
                    activeTab === 'unique-stay' 
                      ? 'text-dashboard-heading dark:text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-dashboard-heading dark:hover:text-white'
                  }`}
                >
                  Unique Stay
                  {activeTab === 'unique-stay' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dashboard-primary"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-4 py-3 text-base font-bold font-plus-jakarta relative ${
                    activeTab === 'activity' 
                      ? 'text-dashboard-heading dark:text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-dashboard-heading dark:hover:text-white'
                  }`}
                >
                  Activity
                  {activeTab === 'activity' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dashboard-primary"></div>
                  )}
                </button>
              </div>

              {/* Descriptions Section */}
              <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    Descriptions
                  </h3>
                  <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                </div>
                <hr className="border-dashed border-dashboard-stroke dark:border-gray-600 mb-4" />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                  {/* Name Field */}
                  <div className={`space-y-2 ${errors.name ? 'form-field error' : 'form-field'}`}>
                    <Label htmlFor="name" className="figma-label">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Name"
                      className={`figma-input ${errors.name ? 'error' : ''}`}
                    />
                    {errors.name && <div className="error-message">{errors.name}</div>}
                    <div className={`text-right text-sm ${formData.name.length > 45 ? 'text-orange-500' : 'text-dashboard-title dark:text-gray-400'}`}>
                      {formData.name.length}/50
                    </div>
                  </div>

                  {/* Category Field */}
                  <div className={`space-y-2 ${errors.category ? 'form-field error' : 'form-field'}`}>
                    <Label htmlFor="category" className="figma-label">
                      Camper Van Category
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className={`figma-input ${errors.category ? 'error' : ''}`}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <div className="error-message">{errors.category}</div>}
                  </div>
                </div>

                {/* Description Field */}
                <div className={`space-y-2 ${errors.description ? 'form-field error' : 'form-field'}`}>
                  <Label htmlFor="description" className="figma-label">
                    Descriptions
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Write here..."
                    className={`figma-input min-h-[120px] ${errors.description ? 'error' : ''}`}
                    maxLength={200}
                  />
                  {errors.description && <div className="error-message">{errors.description}</div>}
                  <div className={`text-right text-sm ${formData.description.length > 180 ? 'text-orange-500' : 'text-dashboard-title dark:text-gray-400'}`}>
                    {formData.description.length}/200
                  </div>
                </div>

                {/* Rules & Regulation */}
                <div className="space-y-2 mt-6">
                  <Label className="text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    Rules & Regulation
                  </Label>
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={rule}
                        onChange={(e) => handleArrayChange('rules', index, e.target.value)}
                        placeholder="Add rules..."
                        className="figma-input"
                      />
                      {formData.rules.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem('rules', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => addArrayItem('rules')}
                    className="text-dashboard-primary hover:text-dashboard-primary/80 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 h-auto font-normal rounded-full transition-all duration-200 hover:shadow-sm"
                  >
                    <Plus size={12} className="mr-2" />
                    Add More
                  </Button>
                </div>
              </div>

              {/* Upload Photos Section */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                  Upload Photos
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Cover Photo */}
                  <div className="lg:col-span-1">
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-dashboard-primary hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        dragActive ? 'border-dashboard-primary bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-[1.02]' : 'border-gray-300 dark:border-gray-600'
                      } ${errors.cover ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={(e) => handleDrop(e, 'cover')}
                      onClick={() => document.getElementById('cover-upload')?.click()}
                    >
                      {formData.photos.cover ? (
                        <div className="space-y-2">
                          <img
                            src={URL.createObjectURL(formData.photos.cover)}
                            alt="Cover"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <p className="text-sm text-gray-600">Cover Photo</p>
                        </div>
                      ) : (
                        <>
                          <Plus size={24} className="mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-500">Cover Photo</p>
                        </>
                      )}
                      <input
                        id="cover-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'cover')}
                      />
                    </div>
                  </div>

                  {/* Gallery Photos */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[...Array(4)].map((_, index) => (
                        <div
                          key={index}
                          className="relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 hover:border-dashboard-primary hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-md hover:scale-[1.02]"
                          onClick={() => document.getElementById(`gallery-upload-${index}`)?.click()}
                        >
                          {formData.photos.gallery[index] ? (
                            <img
                              src={URL.createObjectURL(formData.photos.gallery[index])}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <>
                              <Plus size={18} className="mx-auto mb-2 text-gray-400" />
                              <p className="text-sm text-gray-500">Photos</p>
                            </>
                          )}
                          <input
                            id={`gallery-upload-${index}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, 'gallery')}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-right text-dashboard-title dark:text-gray-400">
                      (Minimum 5 photo required)
                    </p>
                  </div>
                </div>
              </div>

              {/* Camper Van Details Section */}
              <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    CamperVan Details
                  </h3>
                  <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                </div>
                <hr className="border-dashed border-dashboard-stroke dark:border-gray-600 mb-4" />
                
                {/* Features */}
                <div className="space-y-2 mb-6">
                  <Label className="text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    CamperVan Features
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature) => (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => handleFeatureToggle(feature)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          formData.features.includes(feature)
                            ? 'bg-dashboard-primary text-white border-dashboard-primary'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-dashboard-primary'
                        }`}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Capacity Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                  <div className="space-y-2">
                    <Label className="text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                      Seating Capacity
                    </Label>
                    <Select value={formData.seatingCapacity} onValueChange={(value) => handleInputChange('seatingCapacity', value)}>
                      <SelectTrigger className="figma-input">
                        <SelectValue placeholder="4" />
                      </SelectTrigger>
                      <SelectContent>
                        {capacityOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                      Sleeping Capacity
                    </Label>
                    <Select value={formData.sleepingCapacity} onValueChange={(value) => handleInputChange('sleepingCapacity', value)}>
                      <SelectTrigger className="figma-input">
                        <SelectValue placeholder="2" />
                      </SelectTrigger>
                      <SelectContent>
                        {capacityOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Address Fields */}
                <div className="space-y-4">
                  <Label className="text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    Address
                  </Label>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Input
                      placeholder="Locality"
                      value={formData.locality}
                      onChange={(e) => handleInputChange('locality', e.target.value)}
                      className="figma-input lg:col-span-2"
                    />
                    <Input
                      placeholder="Pincode"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className="figma-input"
                    />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="figma-input"
                    />
                    <Input
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="figma-input"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Details Section */}
              <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    Pricing Details
                  </h3>
                  <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                </div>
                <hr className="border-dashed border-dashboard-stroke dark:border-gray-600 mb-4" />
                
                {/* Regular Price */}
                <div className="space-y-2 mb-6">
                  <Label className="text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    Regular Price (in Rupees)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Select"
                    value={formData.regularPrice}
                    onChange={(e) => handleInputChange('regularPrice', e.target.value)}
                    className={`figma-input ${errors.regularPrice ? 'border-red-500' : ''}`}
                  />
                </div>

                {/* Price Includes */}
                <div className="space-y-2 mb-6">
                  <Label className="text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    Above price includes
                  </Label>
                  {formData.priceIncludes.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange('priceIncludes', index, e.target.value)}
                        placeholder="Text here.."
                        className="figma-input"
                      />
                      {formData.priceIncludes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem('priceIncludes', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => addArrayItem('priceIncludes')}
                    className="text-dashboard-primary hover:text-dashboard-primary/80 p-0 h-auto font-normal"
                  >
                    <Plus size={12} className="mr-2" />
                    Add More
                  </Button>
                </div>

                {/* Price Excludes */}
                <div className="space-y-2">
                  <Label className="text-dashboard-title dark:text-gray-300 font-plus-jakarta">
                    Above price excludes
                  </Label>
                  {formData.priceExcludes.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange('priceExcludes', index, e.target.value)}
                        placeholder="Text here.."
                        className="figma-input"
                      />
                      {formData.priceExcludes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeArrayItem('priceExcludes', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => addArrayItem('priceExcludes')}
                    className="text-dashboard-primary hover:text-dashboard-primary/80 p-0 h-auto font-normal"
                  >
                    <Plus size={12} className="mr-2" />
                    Add More
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-4 px-5 py-4 bg-white dark:bg-gray-800 border-t border-dashboard-stroke dark:border-gray-600 rounded-b-3xl shadow-lg">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 font-geist transition-all duration-200 hover:shadow-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-dashboard-primary text-white hover:bg-gray-800 hover:shadow-lg hover:scale-[1.02] rounded-full px-8 font-geist transition-all duration-200"
            >
              Update
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOfferings;
