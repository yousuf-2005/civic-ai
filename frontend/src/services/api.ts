import axios from 'axios';
import {
  AuthResponse,
  User,
  Complaint,
  ImageValidationResult,
  LetterGenerationResult,
  DashboardStats,
  CategoryStat,
  MapPoint,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civic_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error messaging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('civic_token');
    }
    let message = 'An unexpected error occurred. Please try again.';
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      message = typeof detail === 'string' ? detail : JSON.stringify(detail);
    } else if (error.message) {
      message = error.message;
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = error.response?.status;
    return Promise.reject(err);
  }
);

export const api = {
  // Auth
  async register(data: { email: string; password: string; full_name: string; phone?: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  async getUserComplaints(): Promise<Complaint[]> {
    const res = await apiClient.get<Complaint[]>('/auth/my-complaints');
    return res.data;
  },

  // AI & Complaints
  async validateImage(file: File): Promise<ImageValidationResult> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ImageValidationResult>('/complaints/validate-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async generateLetter(payload: {
    title: string;
    category: string;
    description: string;
    location_address?: string;
    latitude?: number;
    longitude?: number;
    ai_image_description?: string;
    citizen_name?: string;
    citizen_contact?: string;
  }): Promise<LetterGenerationResult> {
    const res = await apiClient.post<LetterGenerationResult>('/complaints/generate-letter', payload);
    return res.data;
  },

  async submitComplaint(data: {
    title: string;
    description: string;
    category: string;
    latitude?: number | null;
    longitude?: number | null;
    location_address?: string | null;
    image_filename?: string | null;
    complaint_letter?: string | null;
    citizen_name?: string | null;
    citizen_contact?: string | null;
    ai_valid_image?: boolean;
    ai_relevance?: string | null;
    ai_confidence?: number | null;
    ai_detected_category?: string | null;
    ai_description?: string | null;
    ai_rejection_reason?: string | null;
    ai_recommended_next_step?: string | null;
    is_mock_ai?: boolean;
  }): Promise<Complaint> {
    const res = await apiClient.post<Complaint>('/complaints', data);
    return res.data;
  },

  async getComplaints(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<{ items: Complaint[]; total: number; page: number; page_size: number }> {
    const res = await apiClient.get<{ items: Complaint[]; total: number; page: number; page_size: number }>('/complaints', {
      params,
    });
    return res.data;
  },

  async getComplaintById(id: string): Promise<Complaint> {
    const res = await apiClient.get<Complaint>(`/complaints/${id}`);
    return res.data;
  },

  async trackComplaint(reference: string): Promise<Complaint> {
    const res = await apiClient.get<Complaint>(`/complaints/track/${encodeURIComponent(reference.trim())}`);
    return res.data;
  },

  async updateComplaintStatus(
    id: string,
    payload: { status: string; remarks?: string }
  ): Promise<Complaint> {
    const res = await apiClient.patch<Complaint>(`/complaints/${id}/status`, payload);
    return res.data;
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await apiClient.get<DashboardStats>('/dashboard/stats');
    return res.data;
  },

  async getCategoryStats(): Promise<{ categories: CategoryStat[]; total: number }> {
    const res = await apiClient.get<{ categories: CategoryStat[]; total: number }>('/dashboard/categories');
    return res.data;
  },

  async getMapPoints(): Promise<MapPoint[]> {
    const res = await apiClient.get<MapPoint[]>('/dashboard/map-points');
    return res.data;
  },

  // Health
  async getHealth(): Promise<any> {
    const res = await apiClient.get('/health');
    return res.data;
  },
};
