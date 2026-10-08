export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER' | 'admin' | 'analyst' | 'viewer' | 'researcher';

export interface User {
  id: string;
  email: string;
  fullName: string;
  name?: string; // fallback alias for UI components
  role: UserRole;
  organization?: string;
  active?: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  name?: string; // support both
  organization?: string;
  role?: UserRole;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  organization?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  user: User;
  expiresIn?: number;
}

