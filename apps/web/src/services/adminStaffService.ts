import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface AdminStaff {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roleId?: string;
  status: 'Active' | 'Inactive';
  joinDate: string;
  avatar?: string;
  lastLogin?: string;
  department?: string;
  salary?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminRole {
  _id: string;
  name: string;
  description?: string;
  features: string[];
  permissions: {
    feature: string;
    view: boolean;
    full: boolean;
  }[];
  isActive: boolean;
  isDefault: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffResponse {
  success: boolean;
  data: AdminStaff | AdminStaff[];
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  error?: string;
}

export interface RoleResponse {
  success: boolean;
  data: AdminRole | AdminRole[];
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  error?: string;
}

export interface CreateStaffData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status?: 'Active' | 'Inactive';
  department?: string;
  salary?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

export interface UpdateStaffData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: 'Active' | 'Inactive';
  department?: string;
  salary?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  avatar?: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  features?: string[];
  permissions?: {
    feature: string;
    view: boolean;
    full: boolean;
  }[];
  isActive?: boolean;
  createdBy?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  features?: string[];
  permissions?: {
    feature: string;
    view: boolean;
    full: boolean;
  }[];
  isActive?: boolean;
}

export interface StaffFilters {
  search?: string;
  status?: 'Active' | 'Inactive';
  role?: string;
  department?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RoleFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class AdminStaffService {
  private staffBaseURL = `${API_BASE_URL}/admin/staff`;
  private rolesBaseURL = `${API_BASE_URL}/admin/roles`;

  // ===== STAFF METHODS =====

  // Get all staff members with optional filters
  async getAllStaff(filters?: StaffFilters): Promise<StaffResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      
      const response = await axios.get(`${this.staffBaseURL}?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get single staff member by ID
  async getStaffById(id: string): Promise<StaffResponse> {
    try {
      const response = await axios.get(`${this.staffBaseURL}/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new staff member
  async createStaff(staffData: CreateStaffData): Promise<StaffResponse> {
    try {
      const response = await axios.post(this.staffBaseURL, staffData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update staff member
  async updateStaff(id: string, staffData: UpdateStaffData): Promise<StaffResponse> {
    try {
      const response = await axios.put(`${this.staffBaseURL}/${id}`, staffData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Toggle staff status
  async toggleStaffStatus(id: string): Promise<StaffResponse> {
    try {
      const response = await axios.patch(`${this.staffBaseURL}/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update last login
  async updateLastLogin(id: string): Promise<StaffResponse> {
    try {
      const response = await axios.patch(`${this.staffBaseURL}/${id}/last-login`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete staff member
  async deleteStaff(id: string): Promise<StaffResponse> {
    try {
      const response = await axios.delete(`${this.staffBaseURL}/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Bulk update staff status
  async bulkUpdateStaffStatus(staffIds: string[], status: 'Active' | 'Inactive'): Promise<StaffResponse> {
    try {
      const response = await axios.post(`${this.staffBaseURL}/bulk/status`, {
        staffIds,
        status
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get staff statistics
  async getStaffStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.staffBaseURL}/stats/overview`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Initialize default staff members
  async initializeDefaultStaff(): Promise<StaffResponse> {
    try {
      const response = await axios.post(`${this.staffBaseURL}/initialize`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ===== ROLES METHODS =====

  // Get all roles with optional filters
  async getAllRoles(filters?: RoleFilters): Promise<RoleResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      
      const response = await axios.get(`${this.rolesBaseURL}?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get single role by ID
  async getRoleById(id: string): Promise<RoleResponse> {
    try {
      const response = await axios.get(`${this.rolesBaseURL}/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new role
  async createRole(roleData: CreateRoleData): Promise<RoleResponse> {
    try {
      const response = await axios.post(this.rolesBaseURL, roleData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update role
  async updateRole(id: string, roleData: UpdateRoleData): Promise<RoleResponse> {
    try {
      const response = await axios.put(`${this.rolesBaseURL}/${id}`, roleData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Toggle role status
  async toggleRoleStatus(id: string): Promise<RoleResponse> {
    try {
      const response = await axios.patch(`${this.rolesBaseURL}/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete role
  async deleteRole(id: string): Promise<RoleResponse> {
    try {
      const response = await axios.delete(`${this.rolesBaseURL}/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get available features
  async getAvailableFeatures(): Promise<any> {
    try {
      const response = await axios.get(`${this.rolesBaseURL}/features/available`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get role statistics
  async getRoleStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.rolesBaseURL}/stats/overview`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Initialize default roles
  async initializeDefaultRoles(): Promise<RoleResponse> {
    try {
      const response = await axios.post(`${this.rolesBaseURL}/initialize`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      return new Error(message);
    }
    return error instanceof Error ? error : new Error('An unknown error occurred');
  }
}

export default new AdminStaffService();