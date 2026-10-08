import { apiClient } from './api';
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  UpdateUserRequest,
  User,
  UserRole,
} from '../types';

export const authService = {
  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    if (response.data.data) {
      const data = response.data.data;
      localStorage.setItem('agri_access_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('agri_refresh_token', data.refreshToken);
      }
      // Ensure user has name field for UI components
      const user = {
        ...data.user,
        name: data.user.name || data.user.fullName || data.user.email.split('@')[0],
      };
      localStorage.setItem('agri_user', JSON.stringify(user));
      return { ...data, user };
    }
    throw new Error(response.data.message || 'Login failed');
  },

  /**
   * Register a new user account
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const payload = {
      email: data.email,
      password: data.password,
      fullName: data.fullName || data.name || data.email.split('@')[0],
      organization: data.organization || 'AgriVision Research',
      role: data.role || 'ANALYST',
    };

    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
    if (response.data.data) {
      const authData = response.data.data;
      localStorage.setItem('agri_access_token', authData.accessToken);
      if (authData.refreshToken) {
        localStorage.setItem('agri_refresh_token', authData.refreshToken);
      }
      const user = {
        ...authData.user,
        name: authData.user.name || authData.user.fullName || authData.user.email.split('@')[0],
      };
      localStorage.setItem('agri_user', JSON.stringify(user));
      return { ...authData, user };
    }
    throw new Error(response.data.message || 'Registration failed');
  },

  /**
   * Refresh JWT access token using refresh token
   */
  async refresh(): Promise<AuthResponse | null> {
    const refreshToken = localStorage.getItem('agri_refresh_token');
    if (!refreshToken) return null;

    try {
      const payload: RefreshTokenRequest = { refreshToken };
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh', payload);
      if (response.data.data) {
        const data = response.data.data;
        localStorage.setItem('agri_access_token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('agri_refresh_token', data.refreshToken);
        }
        return data;
      }
      return null;
    } catch {
      this.logout();
      return null;
    }
  },

  /**
   * Fetch current authenticated user profile
   */
  async getCurrentUser(signal?: AbortSignal): Promise<User | null> {
    const token = localStorage.getItem('agri_access_token');
    if (!token) return null;
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me', { signal });
      if (response.data.data) {
        const user = {
          ...response.data.data,
          name: response.data.data.name || response.data.data.fullName || response.data.data.email.split('@')[0],
        };
        localStorage.setItem('agri_user', JSON.stringify(user));
        return user;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Update authenticated user profile
   */
  async updateProfile(data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>('/users/me', data);
    if (response.data.data) {
      const user = {
        ...response.data.data,
        name: response.data.data.name || response.data.data.fullName || response.data.data.email.split('@')[0],
      };
      localStorage.setItem('agri_user', JSON.stringify(user));
      return user;
    }
    throw new Error(response.data.message || 'Failed to update profile');
  },

  /**
   * Log out user and clear storage
   */
  logout(): void {
    localStorage.removeItem('agri_access_token');
    localStorage.removeItem('agri_refresh_token');
    localStorage.removeItem('agri_user');
  },

  /**
   * Get cached user from localStorage
   */
  getStoredUser(): User | null {
    const stored = localStorage.getItem('agri_user');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        name: parsed.name || parsed.fullName || parsed.email?.split('@')[0] || 'User',
      };
    } catch {
      return null;
    }
  },

  /**
   * Get JWT token
   */
  getToken(): string | null {
    return localStorage.getItem('agri_access_token');
  },

  /**
   * Check if token is present
   */
  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('agri_access_token'));
  },

  /**
   * Check if user possesses required role (ADMIN > ANALYST > VIEWER)
   */
  hasRole(requiredRole: UserRole): boolean {
    const user = this.getStoredUser();
    if (!user) return false;

    const role = (user.role || '').toUpperCase();
    const target = (requiredRole || '').toUpperCase();

    if (role === 'ADMIN') return true;
    if (role === 'ANALYST' && (target === 'ANALYST' || target === 'VIEWER')) return true;
    return role === target;
  },
};

export default authService;
