// src/shared/services/api/apiClient.ts
import axios from 'axios';
import type { 
  AxiosInstance, 
  AxiosResponse, 
  AxiosError
} from 'axios';
import type { 
  ApiResponse, 
  RequestConfig,
  AuthTokens 
} from '../../types/api.types';

// ========================
// API CLIENT CONFIGURATION
// ========================
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  defaultHeaders: Record<string, string>;
}

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition: (error: AxiosError) => boolean;
}

// ========================
// ERROR CLASSES
// ========================
export class ApiClientError extends Error {
  public code: string;
  public status: number;
  public details?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class NetworkError extends ApiClientError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends ApiClientError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends ApiClientError {
  constructor(message: string = 'Validation failed', details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

// ========================
// API CLIENT CLASS
// ========================
export class ApiClient {
  private axiosInstance: AxiosInstance;
  private authTokens: AuthTokens | null = null;
  private retryConfig: RetryConfig;

  constructor(config: ApiClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: config.defaultHeaders,
    });

    this.retryConfig = {
      retries: 3,
      retryDelay: 1000,
      retryCondition: (error: AxiosError) => {
        return !error.response || error.response.status >= 500;
      },
    };

    this.setupInterceptors();
  }

  // ========================
  // INTERCEPTORS
  // ========================
  private setupInterceptors(): void {
    // Request interceptor for auth tokens
    this.axiosInstance.interceptors.request.use(
      (config) => {
        config.headers = config.headers ?? {};

        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
          if (config.headers) {
            delete (config.headers as Record<string, unknown>)['Content-Type'];
            delete (config.headers as Record<string, unknown>)['content-type'];
          }
        }

        if (this.authTokens?.access) {
          config.headers.Authorization = `JWT ${this.authTokens.access}`;
          if (import.meta.env.DEV) {
            console.log(`🔑 Sending request to ${config.url} with token:`, this.authTokens.access.substring(0, 20) + '...');
          }
        } else {
          if (import.meta.env.DEV) {
            console.log(`⚠️ No auth token available for request to ${config.url}`);
          }
        }
        
        // Add request timestamp for performance monitoring
        (config as any).startTime = Date.now();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Log response time in development
        if (import.meta.env.DEV) {
          const endTime = Date.now();
          const startTime = (response.config as any).startTime || endTime;
          console.log(`API call to ${response.config.url} took ${endTime - startTime}ms`);
        }
        
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle token refresh for 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshAuthToken();
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.clearAuthTokens();
            throw new AuthenticationError('Session expired');
          }
        }

        throw this.handleApiError(error);
      }
    );
  }

  // ========================
  // ERROR HANDLING
  // ========================
  private handleApiError(error: AxiosError): ApiClientError {
    if (!error.response) {
      return new NetworkError('Network connection failed');
    }

    const { status, data } = error.response;
    const errorData = data as any;

    switch (status) {
      case 400:
        {
          const detailPayload =
            (errorData && typeof errorData === 'object' && 'detail' in errorData)
              ? { detail: (errorData as Record<string, unknown>).detail }
              : undefined;
          const validationDetails =
            (errorData && typeof errorData === 'object' && 'errors' in errorData)
              ? (errorData as Record<string, unknown>).errors as Record<string, any>
              : (detailPayload as Record<string, any> | undefined) || (errorData as Record<string, any> | undefined);
        return new ValidationError(
          (errorData && errorData.message) ||
            (detailPayload && detailPayload.detail as string) ||
            'Invalid request data',
          validationDetails
        );
        }
      case 401:
        return new AuthenticationError(
          errorData.message || 'Authentication required'
        );
      case 403:
        return new ApiClientError(
          errorData.message || 'Access forbidden',
          'FORBIDDEN',
          403
        );
      case 404:
        return new ApiClientError(
          errorData.message || 'Resource not found',
          'NOT_FOUND',
          404
        );
      case 500:
        return new ApiClientError(
          'Internal server error',
          'SERVER_ERROR',
          500
        );
      default:
        return new ApiClientError(
          errorData.message || 'Unknown error occurred',
          'UNKNOWN_ERROR',
          status
        );
    }
  }

  // ========================
  // HTTP METHODS
  // ========================
  async get<T>(
    url: string, 
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.get<ApiResponse<T>>(url, config)
    );
    // Support APIs that return { data: ... } and also those that return the payload directly
    const resp = response.data as any;
    if (resp && typeof resp === 'object' && resp.data !== undefined) {
      return resp.data as T;
    }

    return resp as T;
  }

  async post<T>(
    url: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.post<ApiResponse<T>>(url, data, config)
    );
    const resp = response.data as any;
    if (resp && typeof resp === 'object' && resp.data !== undefined) {
      return resp.data as T;
    }

    return resp as T;
  }

  async put<T>(
    url: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.put<ApiResponse<T>>(url, data, config)
    );
    const resp = response.data as any;
    if (resp && typeof resp === 'object' && resp.data !== undefined) {
      return resp.data as T;
    }

    return resp as T;
  }

  async patch<T>(
    url: string, 
    data?: any, 
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.patch<ApiResponse<T>>(url, data, config)
    );
    const resp = response.data as any;
    if (resp && typeof resp === 'object' && resp.data !== undefined) {
      return resp.data as T;
    }

    return resp as T;
  }

  async delete<T>(
    url: string, 
    config?: RequestConfig
  ): Promise<T> {
    const response = await this.executeWithRetry(() =>
      this.axiosInstance.delete<ApiResponse<T>>(url, config)
    );
    const resp = response.data as any;
    if (resp && typeof resp === 'object' && resp.data !== undefined) {
      return resp.data as T;
    }

    return resp as T;
  }

  // Special method for logout that doesn't expect data response
  async logout(refreshToken: string): Promise<void> {
    await this.executeWithRetry(() =>
      this.axiosInstance.post('/auth/jwt/logout/', { refresh: refreshToken })
    );
  }

  // ========================
  // RETRY MECHANISM
  // ========================
  private async executeWithRetry<T>(
    operation: () => Promise<AxiosResponse<T>>
  ): Promise<AxiosResponse<T>> {
    let lastError: AxiosError;

    for (let attempt = 0; attempt <= this.retryConfig.retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as AxiosError;
        
        if (
          attempt === this.retryConfig.retries ||
          !this.retryConfig.retryCondition(lastError)
        ) {
          throw lastError;
        }

        await this.delay(this.retryConfig.retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========================
  // AUTHENTICATION
  // ========================
  setAuthTokens(tokens: AuthTokens): void {
    console.log('🔑 Setting auth tokens:', tokens);
    console.log('🔑 Tokens type:', typeof tokens);
    console.log('🔑 Tokens keys:', Object.keys(tokens || {}));
    
    this.authTokens = tokens;
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    
    if (import.meta.env.DEV) {
      console.log('🔐 Auth tokens set:', {
        access: tokens.access ? tokens.access.substring(0, 20) + '...' : 'null',
        refresh: tokens.refresh ? tokens.refresh.substring(0, 20) + '...' : 'null'
      });
    }
  }

  getAuthTokens(): AuthTokens | null {
    if (this.authTokens) {
      return this.authTokens;
    }

    const stored = localStorage.getItem('auth_tokens');
    if (stored && stored !== 'undefined' && stored !== 'null') {
      try {
        this.authTokens = JSON.parse(stored);
        return this.authTokens;
      } catch (error) {
        console.warn('Error parsing auth tokens from localStorage:', error);
        localStorage.removeItem('auth_tokens');
        return null;
      }
    }

    return null;
  }

  clearAuthTokens(): void {
    this.authTokens = null;
    localStorage.removeItem('auth_tokens');
  }

  private async refreshAuthToken(): Promise<void> {
    if (!this.authTokens?.refresh) {
      throw new AuthenticationError('No refresh token available');
    }

    const response = await this.axiosInstance.post<any>(
      '/auth/jwt/refresh/',
      { refresh: this.authTokens.refresh }
    );

    // Django JWT returns direct token format: {access: "..."}
    // Not wrapped in ApiResponse format
    const tokens = response.data;
    if (tokens && tokens.access) {
      // Update only the access token, keep the refresh token
      this.setAuthTokens({
        access: tokens.access,
        refresh: this.authTokens.refresh
      });
    } else {
      throw new AuthenticationError('Invalid refresh response');
    }
  }

  // ========================
  // UTILITY METHODS
  // ========================
  isAuthenticated(): boolean {
    return !!this.getAuthTokens()?.access;
  }

  getBaseURL(): string {
    return this.axiosInstance.defaults.baseURL || '';
  }
}

// ========================
// SINGLETON INSTANCE
// ========================
const apiConfig: ApiClientConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  defaultHeaders: {
    Accept: 'application/json',
  },
};

export const apiClient = new ApiClient(apiConfig);