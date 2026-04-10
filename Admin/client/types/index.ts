// Management types
export interface Management {
  _id?: string;
  brandName: string;
  personName: string;
  serviceName: string;
  location: string;
  status: 'approved' | 'pending' | 'modified' | 'deactivated' | 'blocked' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  
  // Additional properties that might be needed
  email?: string;
  phone?: string;
  description?: string;
  address?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  businessHours?: {
    open: string;
    close: string;
    days: string[];
  };
  services?: string[];
  amenities?: string[];
  pricing?: {
    basePrice?: number;
    currency?: string;
  };
}

// Other common types can be added here
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}