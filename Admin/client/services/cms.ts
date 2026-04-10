import api from './api';

export const cmsService = {
  // Jobs
  getJobs: async () => {
    const res = await api.get('/admin/cms/jobs');
    const data = res.data?.data || res.data || [];
    return { data: data.map((d: any) => ({ ...d, id: d.id || d._id })) };
  },
  createJob: async (payload: { jobTitle: string; experienceRequired: string; jobType: string; jobDescription: string }) => {
    console.log('[cmsService] createJob payload:', payload);
    const res = await api.post('/admin/cms/jobs', payload);
    console.log('[cmsService] createJob response:', res.data);
    const d = res.data?.data || res.data;
    return { ...d, id: d.id || d._id };
  },
  updateJob: async (id: string, payload: { jobTitle?: string; experienceRequired?: string; jobType?: string; jobDescription?: string }) => {
    const res = await api.put(`/admin/cms/jobs/${id}`, payload);
    const d = res.data?.data || res.data;
    return { ...d, id: d.id || d._id };
  },
  toggleJobStatus: async (id: string) => {
    const res = await api.patch(`/admin/cms/jobs/${id}/status`);
    const d = res.data?.data || res.data;
    return { ...d, id: d.id || d._id };
  },
  deleteJob: async (id: string) => {
    await api.delete(`/admin/cms/jobs/${id}`);
  },

  // Job Applications
  getJobApplications: async () => {
    const res = await api.get('/admin/cms/jobs/applications');
    return { data: res.data?.data || res.data || [] };
  },
  updateJobApplicationStatus: async (id: string, status: string) => {
    const res = await api.put(`/admin/cms/jobs/applications/${id}/status`, { status });
    return res.data;
  },
  deleteJobApplication: async (id: string) => {
    await api.delete(`/admin/cms/jobs/applications/${id}`);
  },

  // FAQs (MongoDB-backed)
  getFAQs: async () => {
    const res = await api.get('/admin/cms/faqs');
    const arr = Array.isArray(res.data) ? res.data : res.data?.data || [];
    // normalize _id => id for UI code compatibility
    return arr.map((d: any) => ({ ...d, id: d.id || d._id }));
  },
  createFAQ: async (payload: { category: string; question: string; answer: string }) => {
    const res = await api.post('/admin/cms/faqs', payload);
    const d = res.data?.data || res.data;
    return { ...d, id: d.id || d._id };
  },
  updateFAQ: async (id: string, payload: { category?: string; question?: string; answer?: string }) => {
    const res = await api.put(`/admin/cms/faqs/${id}`, payload);
    const d = res.data?.data || res.data;
    return { ...d, id: d.id || d._id };
  },
  deleteFAQ: async (id: string) => {
    await api.delete(`/admin/cms/faqs/${id}`);
  },

  // Testimonials
  getTestimonials: async () => {
    const res = await api.get('/admin/cms/testimonials');
    const data = res.data?.data || res.data || [];
    return { data: data.map((d: any) => ({ ...d, id: d.id || d._id })) };
  },
  createTestimonial: async (payload: { userName: string; rating: number; content: string; avatar?: string; email?: string; isActive?: boolean }) => {
    const res = await api.post('/admin/cms/testimonials', payload);
    const d = res.data?.data || res.data;
    return { ...d, id: d.id || d._id };
  },
  toggleTestimonial: async (id: string) => {
    const res = await api.patch(`/admin/cms/testimonials/${id}/toggle`);
    const d = res.data?.data || res.data;
    return { ...d, id: d.id || d._id };
  },
  deleteTestimonial: async (id: string) => {
    await api.delete(`/admin/cms/testimonials/${id}`);
  },

  // Features
  getFeatures: async (category?: string, type?: string) => {
    const res = await api.get('/admin/cms/features', { params: { category, type } });
    return res.data;
  },
  createFeature: async (payload: { name: string; category: string; icon?: string; type?: string }) => {
    const res = await api.post('/admin/cms/features', payload);
    return res.data;
  },
  toggleFeature: async (id: string) => {
    const res = await api.patch(`/admin/cms/features/${id}/toggle`);
    return res.data;
  },
  deleteFeature: async (id: string) => {
    await api.delete(`/admin/cms/features/${id}`);
  },

  // Media (Change Photo uploads)
  getMedia: async (params: { page?: string; section?: string }) => {
    const res = await api.get('/admin/cms/media', { params });
    return res.data;
  },
  uploadMedia: async (payload: { page: string; section: string; position?: number; file: File }) => {
    const form = new FormData();
    form.append('page', payload.page);
    form.append('section', payload.section);
    if (payload.position !== undefined) form.append('position', String(payload.position));
    form.append('image', payload.file);
    const res = await api.post('/admin/cms/media', form);
    return res.data;
  },
  deleteMedia: async (id: string) => {
    await api.delete(`/admin/cms/media/${id}`);
  },

  // Blogs
  createBlog: async (payload: { title: string; category?: string; description?: string; content?: string; coverImage?: string; authorName?: string; authorImg?: string; authorRole?: string; status?: 'draft'|'published' }) => {
    const res = await api.post('/admin/blogs', payload);
    return res.data;
  },
  listBlogs: async (params?: { status?: 'published'|'draft'; limit?: number }) => {
    const res = await api.get('/admin/blogs', { params });
    return res.data;
  },
  getBlog: async (slug: string) => {
    const res = await api.get(`/admin/blogs/${encodeURIComponent(slug)}`);
    return res.data;
  },
  updateBlog: async (id: string, payload: Partial<{ title: string; category?: string; description?: string; content?: string; coverImage?: string; authorName?: string; authorImg?: string; authorRole?: string; status?: 'draft'|'published' }>) => {
    const res = await api.put(`/admin/blogs/${id}`, payload);
    return res.data;
  },
  deleteBlog: async (id: string) => {
    const res = await api.delete(`/admin/blogs/${id}`);
    return res.data;
  },
  setBlogStatus: async (id: string, status: 'draft'|'published') => {
    const res = await api.put(`/admin/blogs/${id}`, { status });
    return res.data;
  },

  // Roles
  getRoles: async () => {
    const res = await api.get('/admin/cms/roles');
    return res.data;
  },
  createRole: async (payload: { roleName: string; features: string[] }) => {
    const res = await api.post('/admin/cms/roles', payload);
    return res.data;
  },
  deleteRole: async (id: string) => {
    await api.delete(`/admin/cms/roles/${id}`);
  },

  // Legal Pages (Terms, Privacy)
  getPage: async (key: string) => {
    const res = await api.get(`/admin/cms/pages/${key}`);
    return res.data?.data;
  },
  updatePage: async (key: string, payload: { title: string; content?: string; sections?: any[]; isActive?: boolean }) => {
    const res = await api.put(`/admin/cms/pages/${key}`, payload);
    return res.data?.data;
  },

  // Contact (static contact info)
  getContact: async () => {
    const res = await api.get('/admin/cms/contact');
    return res.data;
  },
  upsertContact: async (payload: { email?: string; phone?: string; address?: string; city?: string; state?: string; pincode?: string; image?: string; mapUrl?: string; socials?: Record<string,string> }) => {
    const res = await api.post('/admin/cms/contact', payload);
    return res.data;
  },

  // Contact Messages (submissions from website Contact page)
  listContactMessages: async () => {
    const res = await api.get('/admin/contact');
    const data = res.data?.data ?? res.data ?? [];
    const arr = Array.isArray(data) ? data : [];
    return arr.map((d: any) => ({ ...d, id: d.id || d._id }));
  },
  markContactRead: async (id: string) => {
    const res = await api.patch(`/admin/contact/${id}/read`);
    return res.data?.data ?? res.data;
  },
  deleteContactMessage: async (id: string) => {
    await api.delete(`/admin/contact/${id}`);
  },
  replyToContact: async (id: string, payload: { subject: string; body: string }) => {
    const res = await api.post(`/admin/contact/${id}/reply`, payload);
    return res.data;
  },

  // Homepage Sections
  getHomepageSections: async () => {
    const res = await api.get('/admin/cms/homepage-sections');
    const data = res.data?.data || res.data || [];
    return data.map((d: any) => ({ ...d, id: d.id || d._id }));
  },
  toggleHomepageSection: async (key: string) => {
    const res = await api.patch(`/admin/cms/homepage-sections/${key}/toggle`);
    return res.data?.data;
  },
};
