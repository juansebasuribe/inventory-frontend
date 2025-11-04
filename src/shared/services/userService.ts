// src/shared/services/userService.ts

/**
 * Servicio para gestión de usuarios y vendedores
 */

import { apiClient } from './index';
import type { User, UserProfile, UserRole } from '../types/entities';

export interface UserCreate {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  role?: UserRole;
}

class UserService {
  private static instance: UserService;
  private readonly baseUrl = '/api/user/v1/users/';

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Obtener lista de usuarios
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>(this.baseUrl);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener usuarios');
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: number): Promise<User> {
    try {
      const response = await apiClient.get<User>(`${this.baseUrl}${id}/`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener usuario');
    }
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(userData: UserCreate): Promise<User> {
    try {
      const response = await apiClient.post<User>(this.baseUrl, userData);
      return response;
    } catch (error: any) {
      console.error('❌ Error creating user:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al crear usuario');
    }
  }

  /**
   * Actualizar usuario
   */
  async updateUser(id: number, userData: Partial<UserCreate>): Promise<User> {
    try {
      const response = await apiClient.patch<User>(`${this.baseUrl}${id}/`, userData);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar usuario');
    }
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}${id}/`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar usuario');
    }
  }

  /**
   * Activar/desactivar usuario
   */
  async toggleUserStatus(id: number): Promise<User> {
    try {
      // Primero obtenemos el usuario actual
      const user = await this.getUserById(id);
      // Cambiamos su estado
      const response = await apiClient.patch<User>(`${this.baseUrl}${id}/`, { 
        is_active: !user.is_active 
      });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cambiar estado del usuario');
    }
  }

  /**
   * Cambiar rol de usuario
   */
  async changeUserRole(profileId: number, role: UserRole): Promise<UserProfile> {
    try {
      const response = await apiClient.post<UserProfile>(
        `/api/user/v1/profiles/${profileId}/change-role/`, 
        { role }
      );
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cambiar rol del usuario');
    }
  }
}

// Exportar instancia singleton
export const userService = UserService.getInstance();
export default userService;
