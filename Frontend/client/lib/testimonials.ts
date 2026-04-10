// Frontend testimonials API for public endpoints
import { API_BASE_URL } from './api';

export type PublicTestimonial = {
  id: string;
  _id?: string;
  userName: string;
  rating: number;
  content: string;
  avatar?: string;
  email?: string;
  createdAt?: string;
  isActive?: boolean;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(options?.headers || {}),
      'Content-Type': options?.headers && (options.headers as any)['Content-Type'] ? (options.headers as any)['Content-Type'] : 'application/json',
    },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const testimonialsApi = {
  list: async () => {
    const res = await request<{ success: boolean; data: PublicTestimonial[] }>(`/api/cms/testimonials`);
    return (res.data || []).map(t => ({ ...t, id: t.id || t._id || '' }));
  },
  create: async (payload: { userName: string; rating: number; content: string; avatar?: string; email?: string }) => {
    const res = await request<{ success: boolean; data: PublicTestimonial }>(`/api/cms/testimonials`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const t = res.data;
    return { ...t, id: t.id || t._id || '' };
  },
};
