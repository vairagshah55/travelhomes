import api from './api';

export const crmService = {
  sendMessage: async (payload: { targetType: 'Vendor' | 'User' | 'Staff'; channels: string[]; serviceType?: 'Caravan' | 'Stay' | 'Activity' | ''; message: string; }) => {
    const res = await api.post('/admin/crm/send', payload);
    return res.data;
  },
  listMessages: async (params?: { targetType?: string; channels?: string }) => {
    const res = await api.get('/admin/crm/messages', { params });
    return res.data;
  },
  deleteMessage: async (id: string) => {
    await api.delete(`/admin/crm/messages/${id}`);
  }
};
