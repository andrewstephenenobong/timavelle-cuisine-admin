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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
