// src/shared/services/warehouseService.ts
import { apiClient } from './api/apiClient';

// ========================
// TYPES
// ========================
export interface WarehouseRole {
  id: number;
  role_type: 'editor' | 'operator' | 'manager' | 'warehouse_seller';
  name: string;
  description: string;
}

export interface WarehouseLocation {
  id: number;
  name: string;
  code: string;
  type: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  is_active: boolean;
  capacity: number | null;
  notes: string;
}

export interface WarehouseAssignment {
  id: number;
  user: number;
  user_username: string;
  user_email: string;
  warehouse: number;
  warehouse_details: WarehouseLocation;
  role: number;
  role_details: WarehouseRole;
  assigned_date: string;
  assigned_by: number | null;
  assigned_by_username: string;
  is_active: boolean;
}

export interface WarehouseAssignmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: WarehouseAssignment[];
}

// ========================
// SERVICE CLASS
// ========================
class WarehouseService {
  private baseUrl = '/api/warehouse-roles/v1';

  /**
   * Obtener las asignaciones de warehouse del vendedor actual
   */
  async getMyWarehouseAssignments(): Promise<WarehouseAssignment[]> {
    try {
      const response = await apiClient.get<WarehouseAssignment[]>(
        `${this.baseUrl}/my-warehouse-seller-info/`
      );
      return response;
    } catch (error) {
      console.error('❌ Error al obtener asignaciones de warehouse:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las asignaciones de warehouse (solo supervisores/admin)
   */
  async getAllWarehouseAssignments(params?: {
    warehouse?: number;
    role?: number;
    is_active?: boolean;
    search?: string;
  }): Promise<WarehouseAssignmentsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.warehouse) queryParams.append('warehouse', params.warehouse.toString());
      if (params?.role) queryParams.append('role', params.role.toString());
      if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
      if (params?.search) queryParams.append('search', params.search);
      
      const url = queryParams.toString() 
        ? `${this.baseUrl}/assignments/?${queryParams.toString()}`
        : `${this.baseUrl}/assignments/`;
      
      const response = await apiClient.get<WarehouseAssignmentsResponse>(url);
      return response;
    } catch (error) {
      console.error('❌ Error al obtener todas las asignaciones:', error);
      throw error;
    }
  }

  /**
   * Crear una nueva asignación de warehouse
   */
  async createWarehouseAssignment(data: {
    user: number;
    warehouse: number;
    role: number;
  }): Promise<WarehouseAssignment> {
    try {
      const response = await apiClient.post<WarehouseAssignment>(
        `${this.baseUrl}/assignments/`,
        data
      );
      return response;
    } catch (error) {
      console.error('❌ Error al crear asignación de warehouse:', error);
      throw error;
    }
  }

  /**
   * Actualizar una asignación de warehouse
   */
  async updateWarehouseAssignment(
    id: number,
    data: Partial<WarehouseAssignment>
  ): Promise<WarehouseAssignment> {
    try {
      const response = await apiClient.patch<WarehouseAssignment>(
        `${this.baseUrl}/assignments/${id}/`,
        data
      );
      return response;
    } catch (error) {
      console.error('❌ Error al actualizar asignación:', error);
      throw error;
    }
  }

  /**
   * Desactivar (soft delete) una asignación de warehouse
   */
  async deactivateWarehouseAssignment(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/assignments/${id}/`);
    } catch (error) {
      console.error('❌ Error al desactivar asignación:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los roles de warehouse disponibles
   */
  async getWarehouseRoles(): Promise<WarehouseRole[]> {
    try {
      const response = await apiClient.get<{ results: WarehouseRole[] }>(
        `${this.baseUrl}/roles/`
      );
      return response.results;
    } catch (error) {
      console.error('❌ Error al obtener roles de warehouse:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las ubicaciones/bodegas disponibles
   */
  async getLocations(): Promise<WarehouseLocation[]> {
    try {
      const response = await apiClient.get<{ results: WarehouseLocation[] }>(
        '/api/warehouse/v1/locations/'
      );
      return response.results || [];
    } catch (error) {
      console.error('❌ Error al obtener ubicaciones:', error);
      throw error;
    }
  }
}

// Singleton instance
const warehouseService = new WarehouseService();

export default warehouseService;
