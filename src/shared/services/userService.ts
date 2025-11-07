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
      // Fallback a Djoser
      try {
        const response = await apiClient.get<any[]>('/auth/users/');
        // Normalizar al tipo User mínimo que usa la UI
        return (response || []).map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          phone_number: u.phone_number || '',
          is_active: typeof u.is_active === 'boolean' ? u.is_active : true,
          is_staff: !!u.is_staff,
          is_superuser: !!u.is_superuser,
          // profile puede no venir; se cargan perfiles aparte donde se necesite
        })) as unknown as User[];
      } catch (fallbackErr: any) {
        throw new Error(fallbackErr.response?.data?.message || 'Error al obtener usuarios');
      }
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
      // Fallback a Djoser
      try {
        const u = await apiClient.get<any>(`/auth/users/${id}/`);
        const user: any = {
          id: u.id,
          username: u.username,
          email: u.email,
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          phone_number: u.phone_number || '',
          is_active: typeof u.is_active === 'boolean' ? u.is_active : true,
          is_staff: !!u.is_staff,
          is_superuser: !!u.is_superuser,
        };
        return user as User;
      } catch (fallbackErr: any) {
        throw new Error(fallbackErr.response?.data?.message || 'Error al obtener usuario');
      }
    }
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(userData: UserCreate): Promise<User> {
    try {
      // Usar Djoser para crear usuarios (requiere re_password)
      const payload: any = {
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        password: userData.password,
        re_password: userData.password,
      };

      const created = await apiClient.post<User>('/auth/users/', payload);

      // Si se pasó un rol, intentar asignarlo vía profiles
      if (userData.role && (created as any)?.id) {
        try {
          const profile = await apiClient.get<UserProfile>(`/api/user/v1/my-profile/${(created as any).id}/`);
          if (profile?.id) {
            await this.changeUserRole(profile.id, userData.role);
          }
        } catch (roleErr) {
          console.warn('No se pudo asignar el rol al usuario creado:', roleErr);
        }
      }

      return created;
    } catch (error: any) {
      console.error('❌ Error creating user:', error.response || error);
      const data = error.response?.data;
      // Mensajes comunes de Djoser
      if (data?.password?.length) throw new Error(data.password[0]);
      if (data?.re_password?.length) throw new Error(data.re_password[0]);
      if (data?.email?.length) throw new Error(data.email[0]);
      if (data?.username?.length) throw new Error(data.username[0]);
      throw new Error(data?.message || 'Error al crear usuario');
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
      // Fallback a Djoser
      try {
        const response = await apiClient.patch<User>(`/auth/users/${id}/`, userData);
        return response;
      } catch (fallbackErr: any) {
        throw new Error(fallbackErr.response?.data?.message || 'Error al actualizar usuario');
      }
    }
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}${id}/`);
    } catch (error: any) {
      // Fallback a Djoser
      try {
        await apiClient.delete(`/auth/users/${id}/`);
      } catch (fallbackErr: any) {
        throw new Error(fallbackErr.response?.data?.message || 'Error al eliminar usuario');
      }
    }
  }

  /**
   * Activar/desactivar usuario
   */
  async toggleUserStatus(id: number, currentStatus?: boolean): Promise<User> {
    try {
      const desired = typeof currentStatus === 'boolean' ? !currentStatus : undefined;
      const payload: any = {};
      if (typeof desired === 'boolean') payload.is_active = desired;
      if (Object.keys(payload).length === 0) {
        const user = await this.getUserById(id);
        payload.is_active = !user.is_active;
      }
      const response = await apiClient.patch<User>(`${this.baseUrl}${id}/`, payload);
      return response;
    } catch (error: any) {
      // Fallback a Djoser
      try {
        const response = await apiClient.patch<User>(`/auth/users/${id}/`, {
          is_active: typeof currentStatus === 'boolean' ? !currentStatus : true,
        });
        return response;
      } catch (fallbackErr: any) {
        throw new Error(fallbackErr.response?.data?.message || 'Error al cambiar estado del usuario');
      }
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

  /**
   * Buscar perfil por userId
   */
  async getProfileByUserId(userId: number): Promise<UserProfile | null> {
    try {
      const resp = await apiClient.get<any>(`/api/user/v1/profiles/?user=${userId}`);
      const arr = Array.isArray(resp) ? resp : (resp?.results || []);
      return arr && arr.length ? (arr[0] as UserProfile) : null;
    } catch {
      return null;
    }
  }

  /**
   * Cambiar rol por userId cuando no se conoce profileId
   */
  async changeUserRoleByUserId(userId: number, role: UserRole): Promise<UserProfile | null> {
    const prof = await this.getProfileByUserId(userId);
    if (prof?.id) {
      return this.changeUserRole(prof.id, role);
    }
    return null;
  }
}

// Exportar instancia singleton
export const userService = UserService.getInstance();
export default userService;
