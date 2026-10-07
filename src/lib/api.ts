import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://timavelle-cuisine-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
});

export const enquiryStatuses = ['new', 'contacted', 'quoted', 'won', 'closed'] as const;
export type EnquiryStatus = typeof enquiryStatuses[number];

export interface EnquiryRecord {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  eventDate?: string;
  partySize?: number;
  message: string;
  status: EnquiryStatus;
  internalNotes: string;
  lastContactedAt?: string;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryListResponse {
  items: EnquiryRecord[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}


export const orderStatuses = ['awaiting_payment', 'new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'] as const;
export type OrderStatus = typeof orderStatuses[number];
export const paymentStatuses = ['unpaid', 'receipt_submitted', 'paid', 'rejected', 'refunded'] as const;
export type PaymentStatus = typeof paymentStatuses[number];

export interface OrderLineAddOn {
  name: string;
  price: number;
}

export interface OrderLine {
  menuItemId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  addOns: OrderLineAddOn[];
  lineTotal: number;
}

export interface OrderRecord {
  _id: string;
  customerName: string;
  customerPhone: string;
  orderType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  items: OrderLine[];
  subtotal: number;
  total: number;
  notes?: string;
  status: OrderStatus;
  channel: 'website' | 'whatsapp' | 'admin';
  paymentMethod: 'bank_transfer' | 'whatsapp';
  paymentStatus: PaymentStatus;
  internalNotes: string;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  items: OrderRecord[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  database: 'ready' | 'connecting' | 'unavailable';
  uptimeSeconds?: number;
  checkedAt?: string;
  message?: string;
}

export interface PaymentSettings {
  bankTransferEnabled: boolean;
  whatsappEnabled: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !String(error.config?.url || '').includes('/api/auth/login')) {
      localStorage.removeItem('adminToken');
      window.dispatchEvent(new Event('admin-auth-expired'));
    }
    return Promise.reject(error);
  },
);

export default api;
