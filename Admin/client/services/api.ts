import axios from 'axios';

// Create an axios instance with default config
// Use env-configured base URL in dev/prod; default to relative '/api' for Vite proxy
const baseURL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api';
console.log('[API CONFIG] Base URL:', baseURL);
export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Admin Staff API services
export const adminStaffService = {
  getStaff: async (params: { search?: string; status?: 'Active' | 'Inactive'; role?: string; department?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) => {
    const { data } = await api.get('/admin/staff', { params });
    return data; // { success, data: [], pagination }
  },
  getOne: async (id: string) => {
    const { data } = await api.get(`/admin/staff/${id}`);
    return data;
  },
  create: async (payload: { firstName: string; lastName: string; email: string; phone: string; role: string; status?: 'Active' | 'Inactive'; department?: string; salary?: number; address?: any; emergencyContact?: any; password?: string; }) => {
    const { data } = await api.post('/admin/staff', payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await api.put(`/admin/staff/${id}`, payload);
    return data;
  },
  toggleStatus: async (id: string) => {
    const { data } = await api.patch(`/admin/staff/${id}/toggle-status`);
    return data;
  },
  setLastLogin: async (id: string) => {
    const { data } = await api.patch(`/admin/staff/${id}/last-login`);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await api.delete(`/admin/staff/${id}`);
    return data;
  },
  bulkStatus: async (staffIds: string[], status: 'Active' | 'Inactive') => {
    const { data } = await api.post('/admin/staff/bulk/status', { staffIds, status });
    return data;
  },
  statsOverview: async () => {
    const { data } = await api.get('/admin/staff/stats/overview');
    return data;
  }
};

// Admin Roles API services
export const adminRolesService = {
  getRoles: async (params: { search?: string; isActive?: boolean; page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) => {
    const { data } = await api.get('/admin/roles', { params });
    return data;
  },
  getAllRoles: async (params: { search?: string; isActive?: boolean; page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) => {
    const { data } = await api.get('/admin/roles', { params });
    return data;
  },
  getOne: async (id: string) => {
    const { data } = await api.get(`/admin/roles/${id}`);
    return data;
  },
  create: async (payload: { name: string; description?: string; features?: string[]; permissions?: any[]; isActive?: boolean; createdBy?: string; }) => {
    const { data } = await api.post('/admin/roles', payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await api.put(`/admin/roles/${id}`, payload);
    return data;
  },
  toggleStatus: async (id: string) => {
    const { data } = await api.patch(`/admin/roles/${id}/toggle`);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await api.delete(`/admin/roles/${id}`);
    return data;
  },
  getAvailableFeatures: async () => {
    const { data } = await api.get('/admin/roles/features/available');
    return data;
  },
  statsOverview: async () => {
    const { data } = await api.get('/admin/roles/stats/overview');
    return data;
  }
};

// Admin Auth API services
export const adminAuthService = {
  login: async (credentials: any) => {
    try {
      const { data } = await api.post('/admin/auth/login', credentials);
      return data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  // Fallback demo login
  demoLogin: async (credentials: any) => {
    try {
      const { data } = await api.post('/login', credentials);
      return data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  getMe: async () => {
    try {
      const { data } = await api.get('/admin/auth/me');
      return data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  }
};

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear tokens
      localStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminToken');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// User API services
export const userService = {
  // Get all users with optional status filter
  getUsers: async (status?: string) => {
    try {
      const response = await api.get('/admin/users', {
        params: { status },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get a single user by ID
  getUser: async (id: string) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create a new user
  createUser: async (userData: any) => {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update an existing user
  updateUser: async (id: string, userData: any) => {
    try {
      const response = await api.put(`/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a user
  deleteUser: async (id: string) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Management API services
export const managementService = {
  // Get all management listings with optional status filter
  getManagementListings: async (status?: string) => {
    try {
      const response = await api.get('/admin/management', {
        params: { status },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Get a single management listing by ID
  getManagementListing: async (id: string) => {
    try {
      const response = await api.get(`/admin/management/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Create a new management listing
  createManagementListing: async (listingData: any) => {
    try {
      const response = await api.post('/admin/management', listingData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Update an existing management listing
  updateManagementListing: async (id: string, listingData: any) => {
    try {
      const response = await api.put(`/admin/management/${id}`, listingData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a management listing
  deleteManagementListing: async (id: string) => {
    try {
      const response = await api.delete(`/admin/management/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Update management listing status
  updateListingStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/admin/management/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};

// Vendor API services
export const vendorService = {
  // Get vendors (with tab/status mapping)
  getVendors: async (status?: string) => {
    try {
      console.log('API: Getting vendors with status:', status);
      const response = await api.get('/admin/vendors', { params: { status } });
      console.log('API: Get vendors response:', response.data);
      
      // Server returns { success: true, count: number, data: [...] }
      const responseData = response.data;
      if (responseData?.success && Array.isArray(responseData.data)) {
        return responseData.data;
      }
      
      // Fallback for other response formats
      return Array.isArray(responseData) ? responseData : (responseData?.vendors ?? []);
    } catch (error: any) {
      console.error('API: Get vendors error:', error);
      throw error.response?.data || error.message;
    }
  },
  getVendor: async (id: string) => {
    try {
      const response = await api.get(`/admin/vendors/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  createVendor: async (data: any) => {
    try {
      console.log('API: Creating vendor with data:', data);
      const response = await api.post('/admin/vendors', data);
      console.log('API: Create vendor response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API: Create vendor error:', error);
      console.error('API: Error response:', error.response?.data);
      throw error.response?.data || error.message;
    }
  },
  updateVendor: async (id: string, data: any) => {
    try {
      const response = await api.put(`/admin/vendors/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  deleteVendor: async (id: string) => {
    try {
      const response = await api.delete(`/admin/vendors/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  updateVendorStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/admin/vendors/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};

// Booking API services
export const bookingService = {
  getBookings: async (params: { tab?: string; serviceType?: string; search?: string; sortBy?: string; sortDir?: 'asc' | 'desc' } = {}) => {
    try {
      // Use legacy list endpoint to avoid required date param on GET /bookings
      const response = await api.get('/admin/bookings/legacy/all', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  getBooking: async (id: string) => {
    try {
      const response = await api.get(`/admin/bookings/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  createBooking: async (data: any) => {
    try {
      const response = await api.post('/admin/bookings', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  updateBooking: async (id: string, data: any) => {
    try {
      const response = await api.put(`/admin/bookings/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  deleteBooking: async (id: string) => {
    try {
      const response = await api.delete(`/admin/bookings/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  updateBookingStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/admin/bookings/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};

// Payment API services
export const paymentService = {
  getPayments: async (params: { tab?: string; serviceType?: string; search?: string; sortBy?: string; sortDir?: 'asc' | 'desc' } = {}) => {
    try {
      const response = await api.get('/admin/payments', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  getPayment: async (id: string) => {
    try {
      const response = await api.get(`/admin/payments/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  createPayment: async (data: any) => {
    try {
      const response = await api.post('/admin/payments', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  updatePayment: async (id: string, data: any) => {
    try {
      const response = await api.put(`/admin/payments/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  deletePayment: async (id: string) => {
    try {
      const response = await api.delete(`/admin/payments/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  updatePaymentStatus: async (id: string, status: string) => {
    try {
      const response = await api.patch(`/admin/payments/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};

// HelpDesk API services
export const helpDeskService = {
  getItems: async (params: { status?: 'Pending' | 'Resolved' | 'all'; search?: string; sortBy?: 'date' | 'status' | 'createdAt'; sortDir?: 'asc' | 'desc' } = {}) => {
    try {
      const response = await api.get('/admin/helpdesk', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  getItem: async (id: string) => {
    try {
      const response = await api.get(`/admin/helpdesk/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  createItem: async (data: any) => {
    try {
      const response = await api.post('/admin/helpdesk', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  updateItem: async (id: string, data: any) => {
    try {
      const response = await api.put(`/admin/helpdesk/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  deleteItem: async (id: string) => {
    try {
      const response = await api.delete(`/admin/helpdesk/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  updateStatus: async (id: string, status: 'Pending' | 'Resolved') => {
    try {
      const response = await api.patch(`/admin/helpdesk/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};

// Global Settings API services
export const settingsService = {
  // SEO settings: page-based get/upsert
  getSeo: async (page: string) => {
    try {
      const response = await api.get('/admin/settings/seo', { params: { page } });
      return response.data?.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  upsertSeo: async (payload: { page: string; metaKeywords?: string; metaTitle?: string; metaDescription?: string; socialTitle?: string; socialDescription?: string; faviconUrl?: string; logoUrl?: string; ogImageUrl?: string; }) => {
    try {
      const response = await api.put('/admin/settings/seo', payload);
      return response.data?.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  uploadSeoAsset: async (page: string, type: 'favicon' | 'logo' | 'og' | 'logo_dark', file: File) => {
    try {
      const form = new FormData();
      form.append('page', page);
      form.append('type', type);
      form.append('image', file);
      const response = await api.post('/admin/settings/seo/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data?.data || response.data; // { url, page, type }
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // System settings: userType-based get/update
  getSystem: async (userType: 'Vendor' | 'User') => {
    try {
      const response = await api.get('/admin/settings/system', { params: { userType } });
      return response.data?.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  updateSystem: async (payload: { userType: 'Vendor' | 'User'; vendorApproval?: boolean; mobileApproval?: boolean; emailApproval?: boolean; phoneApproval?: boolean; }) => {
    try {
      const response = await api.put('/admin/settings/system', payload);
      return response.data?.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};

// Admin Roles API services
// export const adminRolesService = { ... } // Duplicate removed from here


// Offers API services
export const offersService = {
  list: async (status?: 'pending' | 'approved' | 'cancelled' | 'modified') => {
    try {
      const response = await api.get('/offers', { params: status ? { status } : undefined });
      return response.data; // { success, count, data }
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  get: async (id: string) => {
    try {
      const response = await api.get(`/offers/${id}`);
      return response.data; // { success, data }
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  create: async (payload: any) => {
    try {
      const response = await api.post('/offers', payload);
      return response.data; // { success, data }
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  update: async (id: string, payload: any) => {
    try {
      const response = await api.put(`/offers/${id}`, payload);
      return response.data; // { success, data }
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  remove: async (id: string) => {
    try {
      const response = await api.delete(`/offers/${id}`);
      return response.data; // { success, message }
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  setStatus: async (id: string, status: 'pending' | 'approved' | 'cancelled', reason?: string) => {
    try {
      const response = await api.patch(`/offers/${id}/status`, { status, reason });
      return response.data; // { success, data }
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
};

// Analytics API services
export const analyticsService = {
  getOverview: async () => {
    try {
      const response = await api.get('/admin/adminAnalytics');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  getReport: async (params: { tab: string; search?: string; sortBy?: string; page?: number; limit?: number; filters?: string }) => {
    try {
      const response = await api.get('/admin/adminAnalyticsReport', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  }
};

export default api;
