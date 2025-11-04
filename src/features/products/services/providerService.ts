// src/features/products/services/providerService.ts

/**
 * Servicio para gestión de proveedores
 * Maneja CRUD, calificaciones y relaciones con productos
 */

// TODO: Crear archivo de tipos centralizados
// import type { 
//   Provider, 
//   ProviderCreate, 
//   ProviderUpdate,
//   ProviderRating 
// } from '../../../shared/types/provider.types';

import { apiClient } from '../../../shared/services';
import { PRODUCT_API_ENDPOINTS } from '../constants';

// ========================================
// INTERFACES Y TIPOS LOCALES
// ========================================

interface Provider {
  id: number;
  name: string;
  email: string;
  contact_email: string; // Agregado para compatibilidad
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  description?: string;
  is_active: boolean;
  rating: number;
  average_rating?: number; // Agregado para compatibilidad
  total_ratings: number;
  created_date: string;
  updated_date: string;
}

interface ProviderCreate {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  description?: string;
}

interface ProviderUpdate {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  description?: string;
  is_active?: boolean;
}

interface ProviderRating {
  id: number;
  provider_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  created_date: string;
}

interface ProviderListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Provider[];
}

// ========================================
// INTERFACES Y TIPOS
// ========================================

interface ProviderFilter {
  search?: string;
  active?: boolean;
  country?: string;
  city?: string;
  rating_min?: number;
  rating_max?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}

interface ProviderStats {
  total: number;
  active: number;
  inactive: number;
  averageRating: number;
  withProducts: number;
  withoutProducts: number;
}

// ========================================
// SERVICIO DE PROVEEDORES
// ========================================

export class ProviderService {
  private static instance: ProviderService;

  private constructor() {}

  /**
   * Singleton pattern para instancia única
   */
  static getInstance(): ProviderService {
    if (!ProviderService.instance) {
      ProviderService.instance = new ProviderService();
    }
    return ProviderService.instance;
  }

  // ========================================
  // MÉTODOS DE CONSULTA
  // ========================================

  /**
   * Obtiene lista paginada de proveedores
   */
  async getProviders(filters: ProviderFilter = {}): Promise<ProviderListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.active !== undefined) params.append('active', filters.active.toString());
      if (filters.country) params.append('country', filters.country);
      if (filters.city) params.append('city', filters.city);
      if (filters.rating_min) params.append('rating_min', filters.rating_min.toString());
      if (filters.rating_max) params.append('rating_max', filters.rating_max.toString());
      if (filters.ordering) params.append('ordering', filters.ordering);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size) params.append('page_size', filters.page_size.toString());

      const queryString = params.toString();
      const url = `${PRODUCT_API_ENDPOINTS.PROVIDERS}${queryString ? `?${queryString}` : ''}`;
      
      return await apiClient.get<ProviderListResponse>(url);
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      throw new Error('Error al cargar los proveedores');
    }
  }

  /**
   * Obtiene un proveedor por ID
   */
  async getProvider(id: number): Promise<Provider> {
    try {
      return await apiClient.get<Provider>(
        PRODUCT_API_ENDPOINTS.PROVIDER_DETAIL(id)
      );
    } catch (error) {
      console.error('Error al obtener proveedor:', error);
      throw new Error('Error al cargar el proveedor');
    }
  }

  /**
   * Obtiene proveedores inactivos
   */
  async getInactiveProviders(): Promise<Provider[]> {
    try {
      return await apiClient.get<Provider[]>(
        PRODUCT_API_ENDPOINTS.PROVIDER_INACTIVE
      );
    } catch (error) {
      console.error('Error al obtener proveedores inactivos:', error);
      throw new Error('Error al cargar los proveedores inactivos');
    }
  }

  /**
   * Obtiene productos de un proveedor específico
   */
  async getProviderProducts(providerId: number): Promise<any[]> {
    try {
      return await apiClient.get<any[]>(
        PRODUCT_API_ENDPOINTS.PROVIDER_PRODUCTS(providerId)
      );
    } catch (error) {
      console.error('Error al obtener productos del proveedor:', error);
      throw new Error('Error al cargar los productos del proveedor');
    }
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA
  // ========================================

  /**
   * Busca proveedores por nombre o información de contacto
   */
  async searchProviders(query: string, limit: number = 10): Promise<Provider[]> {
    try {
      const response = await this.getProviders({
        search: query,
        page_size: limit,
        active: true
      });
      return response.results;
    } catch (error) {
      console.error('Error en búsqueda de proveedores:', error);
      throw new Error('Error al buscar proveedores');
    }
  }

  // ========================================
  // MÉTODOS CRUD
  // ========================================

  /**
   * Crea un nuevo proveedor
   */
  async createProvider(providerData: ProviderCreate): Promise<Provider> {
    try {
      return await apiClient.post<Provider>(
        PRODUCT_API_ENDPOINTS.PROVIDERS,
        providerData
      );
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      throw new Error('Error al crear el proveedor');
    }
  }

  /**
   * Actualiza un proveedor existente
   */
  async updateProvider(id: number, updateData: ProviderUpdate): Promise<Provider> {
    try {
      return await apiClient.patch<Provider>(
        PRODUCT_API_ENDPOINTS.PROVIDER_DETAIL(id),
        updateData
      );
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      throw new Error('Error al actualizar el proveedor');
    }
  }

  /**
   * Elimina un proveedor (soft delete)
   */
  async deleteProvider(id: number): Promise<void> {
    try {
      await apiClient.delete(
        PRODUCT_API_ENDPOINTS.PROVIDER_DETAIL(id)
      );
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      throw new Error('Error al eliminar el proveedor');
    }
  }

  /**
   * Restaura un proveedor eliminado
   */
  async restoreProvider(id: number): Promise<Provider> {
    try {
      return await apiClient.post<Provider>(
        PRODUCT_API_ENDPOINTS.PROVIDER_RESTORE(id)
      );
    } catch (error) {
      console.error('Error al restaurar proveedor:', error);
      throw new Error('Error al restaurar el proveedor');
    }
  }

  // ========================================
  // MÉTODOS DE CALIFICACIÓN
  // ========================================

  /**
   * Califica un proveedor
   */
  async rateProvider(providerId: number, rating: ProviderRating): Promise<Provider> {
    try {
      return await apiClient.post<Provider>(
        PRODUCT_API_ENDPOINTS.PROVIDER_RATE(providerId),
        rating
      );
    } catch (error) {
      console.error('Error al calificar proveedor:', error);
      throw new Error('Error al calificar el proveedor');
    }
  }

  // ========================================
  // MÉTODOS DE ESTADÍSTICAS
  // ========================================

  /**
   * Obtiene estadísticas de proveedores
   */
  async getProviderStats(): Promise<ProviderStats> {
    try {
      // Obtener proveedores activos e inactivos
      const [activeResponse, inactiveProviders] = await Promise.all([
        this.getProviders({ active: true, page_size: 1 }),
        this.getInactiveProviders()
      ]);

      // Calcular promedio de calificaciones (simplificado)
      const activeProviders = await this.getProviders({ active: true, page_size: 100 });
      const ratings = activeProviders.results
        .map((p: Provider) => p.average_rating || 0)
        .filter((r: number) => r > 0);
      
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        total: activeResponse.count + inactiveProviders.length,
        active: activeResponse.count,
        inactive: inactiveProviders.length,
        averageRating: Math.round(averageRating * 100) / 100,
        withProducts: 0, // Se implementará cuando esté disponible
        withoutProducts: 0, // Se implementará cuando esté disponible
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de proveedores:', error);
      throw new Error('Error al cargar las estadísticas de proveedores');
    }
  }

  // ========================================
  // MÉTODOS UTILITARIOS
  // ========================================

  /**
   * Valida si un email de proveedor está disponible
   */
  async validateProviderEmail(email: string, excludeId?: number): Promise<boolean> {
    try {
      const response = await this.searchProviders(email, 1);
      if (excludeId) {
        return !response.some(prov => prov.contact_email.toLowerCase() === email.toLowerCase() && prov.id !== excludeId);
      }
      return !response.some(prov => prov.contact_email.toLowerCase() === email.toLowerCase());
    } catch (error) {
      console.error('Error al validar email de proveedor:', error);
      return false;
    }
  }

  /**
   * Obtiene proveedores por país
   */
  async getProvidersByCountry(): Promise<Record<string, Provider[]>> {
    try {
      const response = await this.getProviders({ active: true, page_size: 1000 });
      const providersByCountry: Record<string, Provider[]> = {};
      
      response.results.forEach((provider: Provider) => {
        const country = provider.country || 'Sin especificar';
        if (!providersByCountry[country]) {
          providersByCountry[country] = [];
        }
        providersByCountry[country].push(provider);
      });
      
      return providersByCountry;
    } catch (error) {
      console.error('Error al obtener proveedores por país:', error);
      throw new Error('Error al obtener proveedores por país');
    }
  }

  /**
   * Obtiene top proveedores por calificación
   */
  async getTopRatedProviders(limit: number = 10): Promise<Provider[]> {
    try {
      const response = await this.getProviders({
        active: true,
        ordering: '-average_rating',
        page_size: limit
      });
      return response.results.filter((p: Provider) => p.average_rating && p.average_rating > 0);
    } catch (error) {
      console.error('Error al obtener top proveedores:', error);
      throw new Error('Error al obtener los mejores proveedores');
    }
  }
}

// ========================================
// EXPORTACIÓN SINGLETON
// ========================================

export const providerService = ProviderService.getInstance();