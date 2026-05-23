import { useState, useEffect, useCallback } from 'react';
import adminStaffService, { 
  AdminStaff, 
  AdminRole,
  StaffFilters, 
  RoleFilters,
  CreateStaffData, 
  UpdateStaffData,
  CreateRoleData,
  UpdateRoleData
} from '../services/adminStaffService';

interface UseAdminStaffReturn {
  // Staff data
  staff: AdminStaff[];
  staffLoading: boolean;
  staffError: string | null;
  staffPagination: any;
  
  // Roles data
  roles: AdminRole[];
  rolesLoading: boolean;
  rolesError: string | null;
  rolesPagination: any;
  
  // Filters
  staffFilters: StaffFilters;
  roleFilters: RoleFilters;
  setStaffFilters: (filters: StaffFilters) => void;
  setRoleFilters: (filters: RoleFilters) => void;
  
  // Staff methods
  fetchStaff: () => Promise<void>;
  createStaff: (data: CreateStaffData) => Promise<boolean>;
  updateStaff: (id: string, data: UpdateStaffData) => Promise<boolean>;
  toggleStaffStatus: (id: string) => Promise<boolean>;
  deleteStaff: (id: string) => Promise<boolean>;
  bulkUpdateStaffStatus: (staffIds: string[], status: 'Active' | 'Inactive') => Promise<boolean>;
  initializeDefaultStaff: () => Promise<boolean>;
  
  // Role methods
  fetchRoles: () => Promise<void>;
  createRole: (data: CreateRoleData) => Promise<boolean>;
  updateRole: (id: string, data: UpdateRoleData) => Promise<boolean>;
  toggleRoleStatus: (id: string) => Promise<boolean>;
  deleteRole: (id: string) => Promise<boolean>;
  initializeDefaultRoles: () => Promise<boolean>;
  
  // Utility methods
  refreshStaff: () => void;
  refreshRoles: () => void;
  getAvailableFeatures: () => Promise<string[]>;
}

export const useAdminStaff = (): UseAdminStaffReturn => {
  // Staff state
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [staffLoading, setStaffLoading] = useState<boolean>(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffPagination, setStaffPagination] = useState<any>(null);
  
  // Roles state
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState<boolean>(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [rolesPagination, setRolesPagination] = useState<any>(null);
  
  // Filters state
  const [staffFilters, setStaffFilters] = useState<StaffFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [roleFilters, setRoleFilters] = useState<RoleFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // ===== STAFF METHODS =====

  // Fetch staff with current filters
  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    setStaffError(null);
    
    try {
      const response = await adminStaffService.getAllStaff(staffFilters);
      
      if (response.success && Array.isArray(response.data)) {
        setStaff(response.data);
        setStaffPagination(response.pagination);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff';
      setStaffError(errorMessage);
      console.error('Error fetching staff:', err);
    } finally {
      setStaffLoading(false);
    }
  }, [staffFilters]);

  // Create new staff member
  const createStaff = async (data: CreateStaffData): Promise<boolean> => {
    try {
      setStaffError(null);
      const response = await adminStaffService.createStaff(data);
      
      if (response.success) {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        throw new Error(response.message || 'Failed to create staff member');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create staff member';
      setStaffError(errorMessage);
      return false;
    }
  };

  // Update staff member
  const updateStaff = async (id: string, data: UpdateStaffData): Promise<boolean> => {
    try {
      setStaffError(null);
      const response = await adminStaffService.updateStaff(id, data);
      
      if (response.success) {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        throw new Error(response.message || 'Failed to update staff member');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update staff member';
      setStaffError(errorMessage);
      return false;
    }
  };

  // Toggle staff status
  const toggleStaffStatus = async (id: string): Promise<boolean> => {
    try {
      setStaffError(null);
      const response = await adminStaffService.toggleStaffStatus(id);
      
      if (response.success) {
        // Update the local state immediately for better UX
        setStaff(prevStaff => 
          prevStaff.map(member => 
            member._id === id 
              ? { 
                  ...member, 
                  status: member.status === 'Active' ? 'Inactive' : 'Active'
                }
              : member
          )
        );
        return true;
      } else {
        throw new Error(response.message || 'Failed to toggle staff status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle staff status';
      setStaffError(errorMessage);
      return false;
    }
  };

  // Delete staff member
  const deleteStaff = async (id: string): Promise<boolean> => {
    try {
      setStaffError(null);
      const response = await adminStaffService.deleteStaff(id);
      
      if (response.success) {
        // Remove from local state
        setStaff(prevStaff => prevStaff.filter(member => member._id !== id));
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete staff member');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete staff member';
      setStaffError(errorMessage);
      return false;
    }
  };

  // Bulk update staff status
  const bulkUpdateStaffStatus = async (staffIds: string[], status: 'Active' | 'Inactive'): Promise<boolean> => {
    try {
      setStaffError(null);
      const response = await adminStaffService.bulkUpdateStaffStatus(staffIds, status);
      
      if (response.success) {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        throw new Error(response.message || 'Failed to bulk update staff');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update staff';
      setStaffError(errorMessage);
      return false;
    }
  };

  // Initialize default staff
  const initializeDefaultStaff = async (): Promise<boolean> => {
    try {
      setStaffError(null);
      const response = await adminStaffService.initializeDefaultStaff();
      
      if (response.success) {
        await fetchStaff(); // Refresh the list
        return true;
      } else {
        throw new Error(response.message || 'Failed to initialize default staff');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize default staff';
      setStaffError(errorMessage);
      return false;
    }
  };

  // ===== ROLES METHODS =====

  // Fetch roles with current filters
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    
    try {
      const response = await adminStaffService.getAllRoles(roleFilters);
      
      if (response.success && Array.isArray(response.data)) {
        setRoles(response.data);
        setRolesPagination(response.pagination);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles';
      setRolesError(errorMessage);
      console.error('Error fetching roles:', err);
    } finally {
      setRolesLoading(false);
    }
  }, [roleFilters]);

  // Create new role
  const createRole = async (data: CreateRoleData): Promise<boolean> => {
    try {
      setRolesError(null);
      const response = await adminStaffService.createRole(data);
      
      if (response.success) {
        await fetchRoles(); // Refresh the list
        return true;
      } else {
        throw new Error(response.message || 'Failed to create role');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      setRolesError(errorMessage);
      return false;
    }
  };

  // Update role
  const updateRole = async (id: string, data: UpdateRoleData): Promise<boolean> => {
    try {
      setRolesError(null);
      const response = await adminStaffService.updateRole(id, data);
      
      if (response.success) {
        await fetchRoles(); // Refresh the list
        return true;
      } else {
        throw new Error(response.message || 'Failed to update role');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setRolesError(errorMessage);
      return false;
    }
  };

  // Toggle role status
  const toggleRoleStatus = async (id: string): Promise<boolean> => {
    try {
      setRolesError(null);
      const response = await adminStaffService.toggleRoleStatus(id);
      
      if (response.success) {
        // Update the local state immediately for better UX
        setRoles(prevRoles => 
          prevRoles.map(role => 
            role._id === id 
              ? { ...role, isActive: !role.isActive }
              : role
          )
        );
        return true;
      } else {
        throw new Error(response.message || 'Failed to toggle role status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle role status';
      setRolesError(errorMessage);
      return false;
    }
  };

  // Delete role
  const deleteRole = async (id: string): Promise<boolean> => {
    try {
      setRolesError(null);
      const response = await adminStaffService.deleteRole(id);
      
      if (response.success) {
        // Remove from local state
        setRoles(prevRoles => prevRoles.filter(role => role._id !== id));
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete role');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      setRolesError(errorMessage);
      return false;
    }
  };

  // Initialize default roles
  const initializeDefaultRoles = async (): Promise<boolean> => {
    try {
      setRolesError(null);
      const response = await adminStaffService.initializeDefaultRoles();
      
      if (response.success) {
        await fetchRoles(); // Refresh the list
        return true;
      } else {
        throw new Error(response.message || 'Failed to initialize default roles');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize default roles';
      setRolesError(errorMessage);
      return false;
    }
  };

  // Get available features
  const getAvailableFeatures = async (): Promise<string[]> => {
    try {
      const response = await adminStaffService.getAvailableFeatures();
      return response.success ? response.data : [];
    } catch (err) {
      console.error('Error fetching available features:', err);
      return [];
    }
  };

  // Refresh methods (aliases for fetch methods)
  const refreshStaff = useCallback(() => {
    fetchStaff();
  }, [fetchStaff]);

  const refreshRoles = useCallback(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    // Staff data
    staff,
    staffLoading,
    staffError,
    staffPagination,
    
    // Roles data
    roles,
    rolesLoading,
    rolesError,
    rolesPagination,
    
    // Filters
    staffFilters,
    roleFilters,
    setStaffFilters,
    setRoleFilters,
    
    // Staff methods
    fetchStaff,
    createStaff,
    updateStaff,
    toggleStaffStatus,
    deleteStaff,
    bulkUpdateStaffStatus,
    initializeDefaultStaff,
    
    // Role methods
    fetchRoles,
    createRole,
    updateRole,
    toggleRoleStatus,
    deleteRole,
    initializeDefaultRoles,
    
    // Utility methods
    refreshStaff,
    refreshRoles,
    getAvailableFeatures
  };
};