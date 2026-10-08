/**
 * Standard API response interfaces matching Spring Boot ApiResponse and PageResponse
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T | null;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// Alias for backwards compatibility
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

