import { api } from './api';

export interface PluginDto {
  _id: string;
  vendorName: string;
  enabled: boolean;
  description?: string;
  licenseKey?: string;
}

export const pluginsApi = {
  list: async (q?: string): Promise<PluginDto[]> => {
    const params = q ? { q } : {};
    const { data } = await api.get('/admin/plugins', { params });
    
    // Check if the response matches what the controller sends: { success: true, data: [...] }
    if (data && Array.isArray(data.data)) {
        return data.data as PluginDto[];
    }
    // Or if it returns just the array
    if (Array.isArray(data)) {
        return data as PluginDto[];
    }
    return [];
  },
  
  get: async (id: string): Promise<PluginDto> => {
    const { data } = await api.get(`/admin/plugins/${id}`);
    return data.data || data;
  },
  
  create: async (body: { vendorName: string; enabled?: boolean; description?: string; licenseKey?: string }) => {
    const { data } = await api.post('/admin/plugins', body);
    return data.data || data;
  },
  
  update: async (
    id: string,
    body: Partial<{ vendorName: string; enabled: boolean; description: string; licenseKey: string }>
  ) => {
    const { data } = await api.put(`/admin/plugins/${id}`, body);
    return data.data || data;
  },
  
  toggle: async (id: string) => {
    const { data } = await api.patch(`/admin/plugins/${id}/toggle`);
    return data.data || data;
  },
  
  setLicense: async (id: string, licenseKey: string) => {
    const { data } = await api.put(`/admin/plugins/${id}/license`, { licenseKey });
    return data.data || data;
  },
  
  remove: async (id: string) => {
    const { data } = await api.delete(`/admin/plugins/${id}`);
    return data;
  },
};
