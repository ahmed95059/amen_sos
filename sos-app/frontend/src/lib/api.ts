// API Client for communicating with the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('sos_access_token', access);
    localStorage.setItem('sos_refresh_token', refresh);
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sos_access_token');
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (refreshToken) return refreshToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sos_refresh_token');
  }
  return null;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sos_access_token');
    localStorage.removeItem('sos_refresh_token');
    localStorage.removeItem('sos_user');
  }
}

// Generic API fetch wrapper with authentication
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle token refresh if needed
  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the request with new token
      (headers as Record<string, string>)['Authorization'] = `Bearer ${getAccessToken()}`;
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({}));
        throw new Error(error.detail || `API Error: ${retryResponse.status}`);
      }
      
      return retryResponse.json();
    } else {
      // Refresh failed, clear tokens and redirect to login
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;
  
  return JSON.parse(text);
}

// Refresh access token
async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// ==================== AUTH API ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface BackendUser {
  id: number;
  full_name: string;
  email: string;
  role: BackendRole;
  village_id: number | null;
}

// Backend role enum mapping
export type BackendRole = 
  | 'DECLARANT'
  | 'PSYCHOLOGUE'
  | 'RESPONSABLE_SOCIAL'
  | 'SAFEGUARDING'
  | 'DIRECTEUR_VILLAGE'
  | 'NATIONAL'
  | 'ADMIN_IT';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Login failed');
    }

    const data: TokenResponse = await response.json();
    setTokens(data.access_token, data.refresh_token);
    return data;
  },

  getMe: async (): Promise<BackendUser> => {
    return apiFetch<BackendUser>('/auth/me');
  },

  logout: () => {
    clearTokens();
  },
};

// ==================== REPORTS API ====================

export type BackendUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BackendReportStatus = 
  | 'SUBMITTED'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'IN_ASSESSMENT'
  | 'AWAITING_VILLAGE_DECISION'
  | 'FOLLOW_UP'
  | 'AWAITING_NATIONAL_REVIEW'
  | 'CLOSED';

export type BackendTriageCategory = 'SAFEGUARDING' | 'CARE' | 'FALSE_ALERT';

export interface ReportCreate {
  is_anonymous?: boolean;
  program_name: string;
  abuser_first_name: string;
  abuser_last_name: string;
  child_first_name: string;
  child_last_name: string;
  incident_type: string;
  urgency: BackendUrgency;
  description: string;
  child_pseudo_code?: string;
}

export interface BackendReportOut {
  id: number;
  created_by: number | null;
  village_id: number;
  is_anonymous: boolean;
  program_name: string;
  incident_type: string;
  urgency: BackendUrgency;
  status: BackendReportStatus;
  public_status: string;
  triage_category: BackendTriageCategory | null;
  severity_score: number;
  child_pseudo_code: string;
  created_at: string;
}

export interface BackendReportDetailOut extends BackendReportOut {
  description: string;
  abuser_first_name: string;
  abuser_last_name: string;
  child_first_name: string;
  child_last_name: string;
}

export interface TriageRequest {
  triage_category: BackendTriageCategory;
  note?: string;
}

export interface AssignRequest {
  assignee_user_id: number;
}

export interface UpdateStatusRequest {
  status: BackendReportStatus;
  note?: string;
}

export const reportsApi = {
  list: async (): Promise<BackendReportOut[]> => {
    return apiFetch<BackendReportOut[]>('/reports');
  },

  get: async (id: number): Promise<BackendReportDetailOut> => {
    return apiFetch<BackendReportDetailOut>(`/reports/${id}`);
  },

  create: async (data: ReportCreate): Promise<BackendReportOut> => {
    return apiFetch<BackendReportOut>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  triage: async (id: number, data: TriageRequest): Promise<BackendReportOut> => {
    return apiFetch<BackendReportOut>(`/reports/${id}/triage`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  assign: async (id: number, data: AssignRequest): Promise<BackendReportOut> => {
    return apiFetch<BackendReportOut>(`/reports/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: number, data: UpdateStatusRequest): Promise<BackendReportOut> => {
    return apiFetch<BackendReportOut>(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// ==================== NOTIFICATIONS API ====================

export interface BackendNotification {
  id: number;
  notif_type: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  list: async (): Promise<BackendNotification[]> => {
    return apiFetch<BackendNotification[]>('/notifications');
  },

  markAsRead: async (id: number): Promise<void> => {
    return apiFetch<void>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  },
};

// ==================== ADMIN API ====================

export interface UserListItem {
  id: number;
  full_name: string;
  email: string;
  role: BackendRole;
  village_id: number | null;
  is_active: boolean;
}

export const adminApi = {
  listUsers: async (): Promise<UserListItem[]> => {
    return apiFetch<UserListItem[]>('/admin/users');
  },
};
