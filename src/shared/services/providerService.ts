// src/shared/services/providerService.ts

/**
 * Servicio para gestión de proveedores
 * FASE 7.3 - Componentes UI Profesionales
 */

import type { Provider, ProviderCreate, IdentificationType } from '../types/product.types';
import { apiClient } from './index';

interface ProviderResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Provider[];
}

interface ProviderSearchParams {
  page?: number;
  page_size?: number;
  search?: string;
  active?: boolean;
  identification_type?: IdentificationType;
  ordering?: string;
}

class ProviderService {
  private static instance: ProviderService;
  private readonly baseUrl = '/api/provider/v1/providers/';

  static getInstance(): ProviderService {
    if (!ProviderService.instance) {
      ProviderService.instance = new ProviderService();
    }
    return ProviderService.instance;
  }

  /**
   * Obtener lista de proveedores con filtros y paginación
   */
  async getProviders(params: ProviderSearchParams = {}): Promise<ProviderResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.active !== undefined) queryParams.append('active', params.active.toString());
      if (params.identification_type) queryParams.append('identification_type', params.identification_type);
      if (params.ordering) queryParams.append('ordering', params.ordering);

      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await apiClient.get<ProviderResponse>(url);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener proveedores');
    }
  }

  /**
   * Obtener proveedor por ID
   */
  async getProviderById(id: number): Promise<Provider> {
    try {
      const response = await apiClient.get<Provider>(`${this.baseUrl}${id}/`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener proveedor');
    }
  }

  /**
   * Crear nuevo proveedor
   */
  async createProvider(providerData: ProviderCreate): Promise<Provider> {
    try {
      const response = await apiClient.post<Provider>(this.baseUrl, providerData);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear proveedor');
    }
  }

  /**
   * Actualizar proveedor
   */
  async updateProvider(id: number, providerData: Partial<ProviderCreate>): Promise<Provider> {
    try {
      const response = await apiClient.patch<Provider>(`${this.baseUrl}${id}/`, providerData);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar proveedor');
    }
  }

  /**
   * Eliminar proveedor
   */
  async deleteProvider(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}${id}/`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar proveedor');
    }
  }

  /**
   * Activar/desactivar proveedor
   */
  async toggleProviderStatus(id: number, active: boolean): Promise<Provider> {
    try {
      const response = await apiClient.patch<Provider>(`${this.baseUrl}${id}/`, { active });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cambiar estado del proveedor');
    }
  }

  /**
   * Buscar proveedores por término
   */
  async searchProviders(searchTerm: string): Promise<Provider[]> {
    try {
      const response = await apiClient.get<ProviderResponse>(`${this.baseUrl}?search=${encodeURIComponent(searchTerm)}`);
      return response.results;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al buscar proveedores');
    }
  }

  /**
   * Obtener proveedores activos
   */
  async getActiveProviders(): Promise<Provider[]> {
    try {
      const response = await apiClient.get<ProviderResponse>(`${this.baseUrl}?active=true`);
      return response.results;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener proveedores activos');
    }
  }

  /**
   * Actualizar calificación de proveedor
   */
  async updateProviderRating(id: number, rating: number): Promise<Provider> {
    try {
      if (rating < 0 || rating > 5) {
        throw new Error('La calificación debe estar entre 0 y 5');
      }

      const response = await apiClient.patch<Provider>(`${this.baseUrl}${id}/`, { rating });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar calificación del proveedor');
    }
  }

  /**
   * Obtener estadísticas de proveedores
   */
  async getProviderStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    averageRating: number;
    topRated: Provider[];
  }> {
    try {
      const [allProviders, activeProviders] = await Promise.all([
        this.getProviders({ page_size: 1000 }),
        this.getProviders({ active: true, page_size: 1000 })
      ]);

      const providers = allProviders.results;
      const activeList = activeProviders.results;

      // Calcular promedio de calificaciones
      const ratedProviders = providers.filter(p => p.rating && p.rating > 0);
      const averageRating = ratedProviders.length > 0 
        ? ratedProviders.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedProviders.length 
        : 0;

      // Top 5 proveedores mejor calificados
      const topRated = providers
        .filter(p => p.rating && p.rating > 0)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);

      return {
        total: allProviders.count,
        active: activeList.length,
        inactive: allProviders.count - activeList.length,
        averageRating: Math.round(averageRating * 10) / 10,
        topRated
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas de proveedores');
    }
  }
}

// Exportar instancia singleton
export const providerService = ProviderService.getInstance();
export default providerService;