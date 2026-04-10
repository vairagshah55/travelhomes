// Client-side Calendar Booking API helper

import { API_BASE_URL } from './api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export type CalendarBookingStatus = 'Confirmed' | 'Checked-in' | 'Checked-out' | 'Cancelled';

export interface CalendarBookingDTO {
  _id: string;
  bookingId: string;
  guestName: string;
  resourceName: string; // vehicle/property name
  startDate: string; // ISO
  endDate: string;   // ISO
  totalDays: number;
  color: string; // hex like #3B82F6
  adults?: number;
  children?: number;
  totalGuests?: number;
  basePrice?: number;
  extraCharges?: number;
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque';
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'refunded';
  transactionId?: string;
  paidAt?: string;
  status: CalendarBookingStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  specialRequests?: string;
  createdBy?: string;
  lastDraggedAt?: string;
  lastDragAction?: 'move' | 'resize-start' | 'resize-end';
}

export interface ApiList<T> { success: boolean; data: T[]; pagination?: any; meta?: any }
export interface ApiItem<T> { success: boolean; data: T }

export const calendarBookingApi = {
  // month: 1-12
  list: (params: { month?: number; year?: number; resource?: string; status?: string; startDate?: string; endDate?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<ApiList<CalendarBookingDTO>>(`/api/calendarbooking${query}`);
  },
  resources: () => request<{ success: boolean; data: { name: string; totalBookings: number }[] }>(`/api/calendarbooking/resources`),
  get: (id: string) => request<ApiItem<CalendarBookingDTO>>(`/api/calendarbooking/${id}`),
  create: (payload: Partial<CalendarBookingDTO>) => request<ApiItem<CalendarBookingDTO>>(`/api/calendarbooking`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  update: (id: string, payload: Partial<CalendarBookingDTO>) => request<ApiItem<CalendarBookingDTO>>(`/api/calendarbooking/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  patchDates: (id: string, payload: { startDate: string; endDate: string; action: 'move' | 'resize-start' | 'resize-end' }) => request<ApiItem<CalendarBookingDTO>>(`/api/calendarbooking/${id}/dates`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  updateStatus: (id: string, status: CalendarBookingStatus) => request<ApiItem<CalendarBookingDTO>>(`/api/calendarbooking/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  remove: (id: string) => request<{ success: boolean; message: string }>(`/api/calendarbooking/${id}`, { method: 'DELETE' }),
};