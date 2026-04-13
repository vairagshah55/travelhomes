// Simple client-side API helper using fetch

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = {
    ...(options && options.headers ? options.headers : {}),
    'Content-Type': options && options.headers && (options.headers as any)['Content-Type'] ? (options.headers as any)['Content-Type'] : 'application/json',
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: options?.cache || 'default',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// Auth/Register API
export interface RegisterPayload {
  userType: 'user' | 'vendor';
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  country?: string;
  state?: string;
  city?: string;
  email: string;
  mobile?: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) => request<{ success: boolean; userType: 'user'|'vendor'; data: any; registerId: string }>(`/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateRegister: (id: string, payload: Partial<RegisterPayload>) => request<{ success: boolean; data: any }>(`/api/auth/register/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  verifyRegisterOtp: (id: string, otp: string) => request<{ success: boolean }>(`/api/auth/register/${id}/verify-otp`, {
    method: 'POST',
    body: JSON.stringify({ otp }),
  }),
  resendRegisterOtp: (id: string) => request<{ success: boolean }>(`/api/auth/register/${id}/resend-otp`, {
    method: 'POST',
  }),
  googleAuth: (code: string) => request<{ success: boolean; token: string; user: any }>(`/api/auth/google`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  }),
};

export const vendorAuthApi = {
  login: (payload: { email: string; password: string; userType: 'user' | 'vendor'; remember?: boolean }) => request<{ success: boolean; token: string; user: { id: string; email: string; firstName?: string; lastName?: string; userType: 'user' | 'vendor' } }>(`/api/vendorlogin/login`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  forgot: (payload: { email: string }) => request<{ success: boolean; message: string }>(`/api/vendorlogin/forgot`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  verifyOtp: (payload: { email: string; otp: string }) => request<{ success: boolean; message: string }>(`/api/vendorlogin/verify-otp`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  reset: (payload: { email: string; token: string; newPassword: string }) => request<{ success: boolean; message: string }>(`/api/vendorlogin/reset`, {
    method: 'POST',
    body: JSON.stringify({ email: payload.email, otp: payload.token, newPassword: payload.newPassword }),
  }),
  updateAccount: (payload: { currentEmail: string; email?: string; mobile?: string; currentPassword?: string; newPassword?: string }) => request<{ success: boolean; message: string; user: any }>(`/api/vendorlogin/update-account`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  sendChangeOtp: (payload: { currentEmail: string; userType?: string; newEmail?: string; newMobile?: string }) => request<{ success: boolean; message: string; otp?: string }>(`/api/vendorlogin/send-change-otp`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

export interface BookingDetailDTO {
  _id?: string;
  id: string;
  clientName: string;
  serviceName: string;
  servicePrice: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'active' | 'cancelled';
  statusColor?: string;
  location?: string;
  createdBy?: 'user' | 'vendor';
  createdForEmail?: string;
  contactEmail?: string;
  contactPhone?: string;
  pickupLocation?: string;
  attachmentUrl?: string;
  serviceType?: 'camera' | 'van' | 'unique-stays' | 'activity';
  vendorId?: string;
  service?: { vendorId?: string };
  resource?: { vendorId?: string };
}

export interface ApiListResponse<T> { success: boolean; count: number; data: T[] }
export interface ApiItemResponse<T> { success: boolean; data: T }

// Vendor Setting types
export interface VendorSettingDTO {
  vendorId: string;
  general: { siteName: string; logoUrl?: string; theme: 'light'|'dark'|'system'; faviconUrl?: string };
  account: { contactEmail: string; contactPhone?: string; supportEmail?: string };
  preferences: { language: string; timezone: string; notifications: { email: boolean; sms: boolean; push: boolean } };
  createdAt?: string;
  updatedAt?: string;
}

export const vendorSettingApi = {
  get: (vendorId: string) => request<{ success: boolean; data: VendorSettingDTO }>(`/api/vendorsetting/${vendorId}`),
  create: (payload: VendorSettingDTO) => request<{ success: boolean; data: VendorSettingDTO }>(`/api/vendorsetting`, { method: 'POST', body: JSON.stringify(payload) }),
  upsert: (vendorId: string, payload: Partial<VendorSettingDTO>) => request<{ success: boolean; data: VendorSettingDTO }>(`/api/vendorsetting/${vendorId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateSection: (vendorId: string, section: 'general'|'account'|'preferences', payload: any) => request<{ success: boolean; data: VendorSettingDTO }>(`/api/vendorsetting/${vendorId}/${section}`, { method: 'PATCH', body: JSON.stringify(payload) }),
};

export const bookingDetailsApi = {
  list: (token?: string, params?: Record<string, any>) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.append(k, String(v)));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<ApiListResponse<BookingDetailDTO>>(`/api/bookingDetails${query}`, {
       headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },
  get: (code: string, token?: string) => request<ApiItemResponse<BookingDetailDTO>>(`/api/bookingDetails/${code}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
  create: (payload: Partial<BookingDetailDTO>, token?: string) => request<ApiItemResponse<BookingDetailDTO>>('/api/bookingDetails', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
  update: (code: string, payload: Partial<BookingDetailDTO>, token?: string) => request<ApiItemResponse<BookingDetailDTO>>(`/api/bookingDetails/${code}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
  remove: (code: string, token?: string) => request<{ success: boolean; message: string }>(`/api/bookingDetails/${code}`, { 
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
  invoice: (code: string, token?: string) => request<{ success: boolean; data: { invoiceUrl: string; invoiceData: any; printData: any } }>(`/api/bookingDetails/${code}/invoice`, { 
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
};

// Offers API
export interface OfferDTO {
  _id?: string;
  vendorId?: string;
  name: string;
  category: string;
  description: string;
  rules: string[];
  features: string[];
  // Camper Van specific
  seatingCapacity?: number | string;
  sleepingCapacity?: number | string;
  perKmCharge?: number | string;
  perDayCharge?: number | string;
  perKmIncludes?: string[];
  perKmExcludes?: string[];
  perDayIncludes?: string[];
  perDayExcludes?: string[];
  // Unique Stay specific
  guestCapacity?: number | string;
  numberOfRooms?: number | string;
  numberOfBeds?: number | string;
  numberOfBathrooms?: number | string;
  stayType?: string;
  // Activity specific
  personCapacity?: number | string;
  timeDuration?: string;
  expectations?: string[];
  // Common
  serviceType?: string;
  locality?: string;
  pincode?: string;
  city?: string;
  state?: string;
  address?: string;
  regularPrice: number | string;
  discountPrice?: number | null;
  priceIncludes: string[];
  priceExcludes: string[];
  photos: { coverUrl?: string; galleryUrls: string[] };
  status: 'pending' | 'approved' | 'cancelled' | 'deactivated' | 'blocked' | 'rejected';
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const offersApi = {
  list: (status?: 'pending' | 'approved' | 'cancelled', token?: string, params?: Record<string, any>) => {
    const qs = new URLSearchParams();
    if (status) qs.append('status', status);
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.append(k, String(v)));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<ApiListResponse<OfferDTO>>(`/api/offers${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },
  get: (id: string, token?: string) => request<ApiItemResponse<OfferDTO>>(`/api/offers/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
  create: (payload: Partial<OfferDTO>, token?: string) => request<ApiItemResponse<OfferDTO>>('/api/offers', { 
    method: 'POST', 
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
  update: (id: string, payload: Partial<OfferDTO>, token?: string) => request<ApiItemResponse<OfferDTO>>(`/api/offers/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(payload),
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
  remove: (id: string, token?: string) => request<{ success: boolean; message: string }>(`/api/offers/${id}`, { 
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
  setStatus: (id: string, status: 'pending' | 'approved' | 'cancelled', token?: string) => request<ApiItemResponse<OfferDTO>>(`/api/offers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
  trackClick: (id: string) => request<{ success: boolean }>(`/api/offers/${id}/click`, { method: 'POST' }).catch(() => {}),
};

// Vendor Analytics API
export interface VendorAnalyticsCounts {
  total: number;
  upcoming: number;
  past: number;
  cancelled: number;
  metrics?: { impressions: number; clicks: number; visitors: number };
  payments?: { received: number; pending: number };
  properties?: { approved: number; pending: number };
}

export interface VendorAnalyticsGraphData {
  name: string;
  year: number;
  earnings: number;
  visitors: number;
}

export const vendorAnalyticsApi = {
  getCounts: (token?: string) => request<{ success: boolean; data: VendorAnalyticsCounts }>(`/api/vendorAnalytics`, {
     headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
  getGraphs: (token?: string, period: string = 'monthly') => request<{ success: boolean; data: VendorAnalyticsGraphData[] }>(`/api/vendorAnalytics/graphs?period=${period}`, {
     headers: token ? { Authorization: `Bearer ${token}` } : {}
  }),
};

// User Profile API
export interface UserProfileDTO {
  email: string;
  firstName?: string;
  lastName?: string;
  userType?: 'user' | 'vendor'; // Added userType
  vendorStatus?: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'banned' | 'kyc-unverified'; // Added vendorStatus
  phoneNumber?: string;
  mobileVerified?: boolean;
  emailVerified?: boolean;
  country?: string;
  state?: string;
  city?: string;
  dateOfBirth?: string;
  photo?: string; // url returned from server
  maritalStatus?: string;
  idProof?: string;
  idPhotos?: string[];
  personalLocality?: string;
  personalPincode?: string;
  socialProfiles?: Array<{ platform: string; url: string; username?: string }>;
  business?: {
    brandName?: string;
    legalCompanyName?: string;
    gstNumber?: string;
    email?: string;
    phoneNumber?: string;
    locality?: string;
    state?: string;
    city?: string;
    pincode?: string;
    website?: string;
    businessName?: string;
  };
}

export const userProfileApi = {
  get: (email: string) => request<{ success: boolean; data: UserProfileDTO }>(`/api/profile?email=${encodeURIComponent(email)}`),
  upsert: (payload: Partial<UserProfileDTO> & { email: string }) => request<{ success: boolean; data: UserProfileDTO }>(`/api/profile`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  uploadPhoto: async (email: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    form.append('email', email);
    const res = await fetch(`${API_BASE_URL}/api/profile/photo`, {
      method: 'POST',
      body: form,
      // Let browser set Content-Type with boundary automatically
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json() as Promise<{ success: boolean; data: UserProfileDTO; url: string }>;
  },
};

// Activities API (user + vendor)
export interface ActivityDTO {
  _id?: string;
  vendorId?: string;
  title: string;
  description?: string;
  images: string[];
  price: number;
  personCapacity?: number;
  timeDuration?: string;
  location?: { locality?: string; city?: string; state?: string; pincode?: string };
  priceIncludes?: string[];
  priceExcludes?: string[];
  expectations?: string[];
  categories?: string[];
  itinerary?: Array<{ title: string; time?: string; description?: string }>;
  policies?: { cancellationPolicy?: string };
  instructor?: { name?: string; bio?: string; photo?: string };
  status?: 'draft' | 'published' | 'archived';
  ratingAverage?: number;
  ratingCount?: number;
}

export const activitiesApi = {
  // Public list
  list: (params?: { q?: string; city?: string; state?: string; category?: string; minPrice?: number; maxPrice?: number; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.append(k, String(v)));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ success: boolean; data: ActivityDTO[]; page: number; total: number; pageSize: number }>(`/api/activities${query}`);
  },
  // Public get by id
  get: (id: string) => request<{ success: boolean; data: ActivityDTO }>(`/api/activities/${id}`),

  // Vendor: my list (requires Bearer token)
  myList: (token: string) => request<{ success: boolean; data: ActivityDTO[] }>(`/api/activities/vendor/mine/list`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  }),
  // Vendor: create
  create: (token: string, payload: Partial<ActivityDTO>) => request<{ success: boolean; id: string; data: ActivityDTO }>(`/api/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  }),
  // Vendor: update
  update: (token: string, id: string, payload: Partial<ActivityDTO>) => request<{ success: boolean; data: ActivityDTO }>(`/api/activities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  }),
  // Vendor/Admin: set status
  setStatus: (token: string, id: string, status: 'draft'|'published'|'archived') => request<{ success: boolean; data: ActivityDTO }>(`/api/activities/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  }),
};

// Public CMS media (read-only) + FAQs
export interface CmsMediaItem { _id: string; page: string; section: string; position: number; url: string }
export interface PublicFaq { _id: string; category: string; question: string; answer: string; isActive?: boolean; createdAt?: string }
export const cmsPublicApi = {
  listMedia: async (params: { page?: string; section?: string }) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k,v])=> v!==undefined && qs.append(k,String(v)));
    qs.append('t', Date.now().toString());
    const s = qs.toString();
    const query = s ? `?${s}` : '';
    return request<{ success: boolean; data: CmsMediaItem[] }>(`/api/cms/media${query}`, {
      cache: 'no-store',
    });
  },
  listFaqs: async () => {
    const res = await request<{ success: boolean; data: PublicFaq[] }>(`/api/cms/faqs`);
    return res.data || [];
  },
  getContact: async () => {
    const res = await request<{ success: boolean; data: any }>(`/api/cms/contact`);
    return res.data;
  },
  submitContact: async (payload: { firstName: string; lastName: string; email: string; phone: string; message: string }) => {
    return request<{ success: boolean; message: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  listHomepageSections: async () => {
    const res = await request<{ success: boolean; data: any[] }>(`/api/cms/homepage-sections`);
    return res.data || [];
  },
  listJobs: async (active: boolean = true) => {
    return request<{ success: boolean; data: any[] }>(`/api/cms/jobs?active=${active}`);
  },
  applyJob: async (formData: FormData) => {
    const res = await fetch(`${API_BASE_URL}/api/cms/jobs/apply`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
  },
  getFeatures: async (category: string, type?: string) => {
    const params = new URLSearchParams({ category });
    if (type) params.append('type', type);
    const res = await request<{ success: boolean; data: any[] }>(`/api/cms/features?${params.toString()}`);
    return res.data || [];
  },
};

export const vendorPublicApi = {
  get: (id: string) => request<ApiItemResponse<any>>(`/api/vendors/${id}`),
};

export const helpDeskApi = {
  create: (payload: { name: string; phoneNumber: string; subject: string; email: string; description: string }) => 
    request<{ success: boolean; data: any }>('/api/helpdesk', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
};

// Bookings API
export interface BookingDTO {
  _id: string;
  bookingId: string;
  userId: string;
  serviceId: string;
  serviceName: 'activity' | 'camper-van' | 'unique-stay';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'checked-in' | 'checked-out' | 'active';
  createdAt: string;
  location?: string;
  pickupLocation?: string;
  serviceDetails?: any; // Added for UI convenience
}

export const bookingsApi = {
  getUserBookings: (userId: string, token: string) => request<{ success: boolean; bookings: BookingDTO[] }>(`/api/bookings/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getBookingById: (id: string, token: string) => request<{ success: boolean; booking: BookingDTO }>(`/api/bookings/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  create: (payload: Partial<BookingDTO>, token?: string) => request<{ success: boolean; booking: BookingDTO }>('/api/bookings', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  }),
  updateStatus: (id: string, status: string, token: string) => request<{ success: boolean; booking: BookingDTO }>(`/api/bookings/${id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status })
  }),
  delete: (id: string, token: string) => request<{ success: boolean; message: string }>(`/api/bookings/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  }),
  generateInvoice: (id: string, token: string) => request<{ success: boolean; invoice: any }>(`/api/bookings/${id}/invoice`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
};

// Onboarding API helpers
export const submitOnboardingData = async (type: 'activity' | 'caravan' | 'stay', data: any) => {
  try {
    const token = localStorage.getItem('travel_auth_token');
    console.log(`Submitting ${type} onboarding data:`, {
      ...data,
      photos: data.photos ? `[${data.photos.length} photos]` : 'none',
      idPhotos: data.idPhotos ? `[${data.idPhotos.length} ID photos]` : 'none',
      hasToken: !!token,
      tokenStart: token ? token.substring(0, 10) + '...' : 'N/A'
    });

    const response = await fetch(`${API_BASE_URL}/api/onboarding/${type}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data),
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
        const textError = await response.text().catch(() => 'Unknown error');
        console.error('Error response text:', textError);
        errorMessage = textError || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`${type} onboarding submitted successfully:`, result);
    return result;
  } catch (error) {
    console.error(`Error submitting ${type} onboarding:`, error);
    throw error;
  }
};

export const getOnboardingData = async () => {
  try {
    const token = localStorage.getItem('travel_auth_token');
    const response = await fetch(`${API_BASE_URL}/api/onboarding/mine`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
       throw new Error(`HTTP ${response.status}`);
    }
    const result = await response.json();
    console.log(result);
    
    return result.data;
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return null;
  }
};

export const submitSelfieVerification = async (type: 'activity' | 'caravan' | 'stay', id: string, imageData: string) => {
  try {
    const token = localStorage.getItem('travel_auth_token');
    const response = await fetch(`${API_BASE_URL}/api/onboarding/${type}/selfie`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ id, imageData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || 'Failed to submit selfie verification');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error submitting selfie verification:', error);
    throw error;
  }
};

export const settingsApi = {
  getSeo: (page: string) => request<{ success: boolean; data: any }>(`/api/settings/seo?page=${page}`),
};

// CMS Pages API (Terms, Privacy)
export const cmsPagesApi = {
  getPage: (key: string) => request<{ success: boolean; data: { title: string; content: string; sections?: { heading: string; content: string }[] } }>(`/api/cms/pages/${key}`),
};

// Marketing API
export interface MarketingContentDTO {
  _id: string;
  images: string[];
  content: string;
  additionalCount?: number;
  createdAt: string;
}

export const marketingApi = {
  list: () => {
    const token = localStorage.getItem('travel_auth_token');
    return request<MarketingContentDTO[]>('/api/marketing/content', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },
  create: (payload: { images: string[], content: string, additionalCount?: number }) => {
    const token = localStorage.getItem('travel_auth_token');
    return request<MarketingContentDTO>('/api/marketing/content', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },
  delete: (id: string) => {
    const token = localStorage.getItem('travel_auth_token');
    return request<{ success: boolean }>('/api/marketing/content/' + id, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }
};

export const adminCmsMediaApi = {
    upload: async (file: File, page: string, section: string) => {
        const token = localStorage.getItem('travel_auth_token');
        const form = new FormData();
        form.append('page', page);
        form.append('section', section);
        form.append('image', file);
        
        // Use the public/vendor accessible endpoint instead of admin-only
        const res = await fetch(`${API_BASE_URL}/api/cms/media`, {
            method: 'POST',
            body: form,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        if (!res.ok) {
            const text = await res.text();
             throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json() as Promise<{ success: boolean; data: { url: string } }>;
    }
};

export interface NotificationDTO {
    _id: string;
    type: 'vendor_registration' | 'new_booking' | 'helpdesk_ticket' | 'payment_received' | 'new_user' | 'system_alert' | 'service_approval' | 'service_rejection';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    referenceId?: string;
    referenceModel?: string;
}

export const notificationsApi = {
    list: (unreadOnly?: boolean, limit: number = 50, recipientRole: string = 'vendor') => {
        const token = localStorage.getItem('travel_auth_token');
        const query = new URLSearchParams();
        query.append('unreadOnly', String(!!unreadOnly));
        query.append('limit', String(limit));
        if (recipientRole) query.append('recipientRole', recipientRole);
        
        return request<{ success: boolean; data: NotificationDTO[]; totalUnread: number }>(`/api/notifications?${query.toString()}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
    },
    markAsRead: (id: string) => {
        const token = localStorage.getItem('travel_auth_token');
        return request<{ success: boolean; data: NotificationDTO }>(`/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
    },
    markAllAsRead: () => {
        const token = localStorage.getItem('travel_auth_token');
        return request<{ success: boolean; message: string }>('/api/notifications/read-all', {
            method: 'PUT',
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
    },
    remove: (id: string) => {
        const token = localStorage.getItem('travel_auth_token');
        return request<{ success: boolean; message: string }>(`/api/notifications/${id}`, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
    },
    deleteMany: (ids: string[]) => {
        const token = localStorage.getItem('travel_auth_token');
        return request<{ success: boolean; message: string }>('/api/notifications/bulk-delete', {
            method: 'POST',
            body: JSON.stringify({ ids }),
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
    }
};

