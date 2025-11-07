// src/shared/services/repositories/userRepository.ts
import { BaseRepository } from './baseRepository';
import { ApiClient } from '../api/apiClient';
import type { 
  PaginatedResponse,
  FilterParams,
  AuthTokens
} from '../../types/api.types';
import type {
  User, 
  UserRole
} from '../../types/entities';

// ========================
// USER DTOs
// ========================
export interface CreateUserDto {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_active?: boolean;
}

export interface UserFilter extends FilterParams {
  role?: UserRole;
  is_active?: boolean;
  email?: string;
  search?: string;
  [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordDto {
  token: string;
  new_password: string;
  confirm_password: string;
}

// ========================
// USER REPOSITORY INTERFACE
// ========================
export interface IUserRepository extends BaseRepository<User, CreateUserDto, UpdateUserDto> {
  // Authentication methods
  login(email: string, password: string): Promise<AuthTokens>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  
  // Password management
  changePassword(id: string | number, data: ChangePasswordDto): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(data: ResetPasswordDto): Promise<void>;
  
  // User profile
  getCurrentUser(): Promise<User>;
  updateProfile(data: UpdateUserDto): Promise<User>;
  
  // Role and permissions
  getUsersByRole(role: UserRole): Promise<PaginatedResponse<User>>;
  assignRole(userId: string | number, role: UserRole): Promise<User>;
  
  // User status
  activateUser(id: string | number): Promise<User>;
  deactivateUser(id: string | number): Promise<User>;
  
  // Advanced filters
  findByEmail(email: string): Promise<User | null>;
  searchUsers(query: string, filters?: UserFilter): Promise<PaginatedResponse<User>>;
}

// ========================
// USER REPOSITORY IMPLEMENTATION
// ========================
export class UserRepository extends BaseRepository<User, CreateUserDto, UpdateUserDto> 
  implements IUserRepository {

  constructor(apiClient: ApiClient) {
    super(apiClient, {
      endpoint: '/api/user/v1/users/',
      idField: 'id'
    });
  }

  // ========================
  // AUTHENTICATION METHODS
  // ========================
  async login(email: string, password: string): Promise<AuthTokens> {
    const username = (email || '').trim();
    const pwd = (password || '').trim();
    const response = await this.apiClient.post<AuthTokens>(
      '/auth/jwt/create/', 
      { username, password: pwd }
    );
    
    console.log('🔍 Login response:', response);
    console.log('🔍 Response type:', typeof response);
    console.log('🔍 Response keys:', Object.keys(response || {}));
    
    // Store tokens in the API client
    this.apiClient.setAuthTokens(response);
    
    return response;
  }

  async logout(): Promise<void> {
    const tokens = this.apiClient.getAuthTokens();
    
    if (tokens?.refresh) {
      try {
        // Use specific logout method that doesn't expect data response
        await this.apiClient.logout(tokens.refresh);
      } catch (error) {
        // Continue with client-side logout even if server logout fails
        console.warn('Server logout failed:', error);
      }
    }
    
    // Clear tokens from client
    this.apiClient.clearAuthTokens();
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await this.apiClient.post<AuthTokens>(
      '/auth/jwt/refresh/', 
      { refresh: refreshToken }
    );
    
    // Update tokens in the API client
    this.apiClient.setAuthTokens(response);
    
    return response;
  }

  // ========================
  // PASSWORD MANAGEMENT
  // ========================
  async changePassword(id: string | number, data: ChangePasswordDto): Promise<void> {
    this.validateId(id);
    
    const url = this.buildEndpointUrl(`${id}/change-password/`);
    await this.apiClient.post<void>(url, data);
  }

  async requestPasswordReset(email: string): Promise<void> {
    if (!email) {
      throw new Error('Email is required');
    }
    
    await this.apiClient.post<void>(
      '/api/auth/users/reset-password/', 
      { email }
    );
  }

  async resetPassword(data: ResetPasswordDto): Promise<void> {
    this.validateData(data);
    
    await this.apiClient.post<void>(
      '/api/auth/users/reset-password-confirm/', 
      data
    );
  }

  // ========================
  // USER PROFILE
  // ========================
  async getCurrentUser(): Promise<User> {
    return this.apiClient.get<User>('/auth/users/me/');
  }

  async updateProfile(data: UpdateUserDto): Promise<User> {
    this.validateData(data);
    
    return this.apiClient.patch<User>('/auth/users/me/', data);
  }

  // ========================
  // ROLE AND PERMISSIONS
  // ========================
  async getUsersByRole(role: UserRole): Promise<PaginatedResponse<User>> {
    return this.findAll({
      filter: { role }
    });
  }

  async assignRole(userId: string | number, role: UserRole): Promise<User> {
    this.validateId(userId);
    
    const url = `/api/user/v1/profiles/${userId}/change-role/`;
    return this.apiClient.post<User>(url, { role });
  }

  // ========================
  // USER STATUS
  // ========================
  async activateUser(id: string | number): Promise<User> {
    this.validateId(id);
    
    const url = this.buildEndpointUrl(`${id}/activate/`);
    return this.apiClient.post<User>(url);
  }

  async deactivateUser(id: string | number): Promise<User> {
    this.validateId(id);
    
    const url = this.buildEndpointUrl(`${id}/deactivate/`);
    return this.apiClient.post<User>(url);
  }

  // ========================
  // ADVANCED FILTERS
  // ========================
  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new Error('Email is required');
    }
    
    try {
      const response = await this.findAll({
        filter: { email },
        pagination: { pageSize: 1 }
      });
      
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async searchUsers(query: string, filters?: UserFilter): Promise<PaginatedResponse<User>> {
    return this.search(query, {
      fields: ['first_name', 'last_name', 'email'],
      filter: filters,
      pagination: { pageSize: 20 }
    });
  }
}

// ========================
// SINGLETON EXPORT
// ========================
export const createUserRepository = (apiClient: ApiClient): UserRepository => {
  return new UserRepository(apiClient);
};
