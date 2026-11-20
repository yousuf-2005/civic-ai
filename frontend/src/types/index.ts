export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: 'citizen' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type ComplaintStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected';

export interface StatusHistoryItem {
  id: string;
  old_status?: string | null;
  new_status: string;
  remarks?: string | null;
  created_at: string;
  changed_by_user_id?: string | null;
}

export interface Complaint {
  id: string;
  reference_number: string;
  title: string;
  description: string;
  category: string;
  latitude?: number | null;
  longitude?: number | null;
  location_address?: string | null;
  image_filename?: string | null;
  image_url?: string | null;
  complaint_letter?: string | null;
  status: ComplaintStatus;
  citizen_name?: string | null;
  citizen_contact?: string | null;
  user_id?: string | null;
  ai_valid_image: boolean;
  ai_relevance?: string | null;
  ai_confidence?: number | null;
  ai_detected_category?: string | null;
  ai_description?: string | null;
  ai_rejection_reason?: string | null;
  ai_recommended_next_step?: string | null;
  is_mock_ai: boolean;
  created_at: string;
  updated_at: string;
  timeline: StatusHistoryItem[];
}

export interface ImageValidationResult {
  valid_image: boolean;
  relevance: 'relevant' | 'irrelevant' | 'uncertain';
  detected_category?: string | null;
  description?: string | null;
  confidence?: number | null;
  rejection_reason?: string | null;
  recommended_next_step?: string | null;
  image_filename?: string | null;
  image_url?: string | null;
  is_mock: boolean;
}

export interface LetterGenerationResult {
  letter_subject: string;
  letter_body: string;
  is_mock: boolean;
}

export interface DashboardStats {
  total: number;
  submitted: number;
  under_review: number;
  in_progress: number;
  resolved: number;
  rejected: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface MapPoint {
  id: string;
  reference_number: string;
  title: string;
  category: string;
  status: string;
  latitude: number;
  longitude: number;
  location_address?: string | null;
  created_at: string;
  image_url?: string | null;
}

export const CIVIC_CATEGORIES = [
  'Potholes and Damaged Roads',
  'Overflowing Garbage and Illegal Dumping',
  'Broken Streetlights',
  'Water Leakage and Drainage',
  'Damaged Public Infrastructure',
  'Other Legitimate Public Service Problems',
] as const;
