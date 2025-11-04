// src/shared/types/api.types.ts

// ========================
// CORE API TYPES
// ========================
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, any>;
  timestamp: string;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  ordering?: string;
  [key: string]: any;
}

// ========================
// HTTP METHODS
// ========================
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// ========================
// QUERY PARAMETERS
// ========================
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

export interface FilterParams {
  [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}

export interface SortParams {
  field?: string;
  order?: 'asc' | 'desc';
}

// ========================
// REQUEST CONFIGURATION
// ========================
export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
  data?: any;
}

// ========================
// AUTHENTICATION
// ========================
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}