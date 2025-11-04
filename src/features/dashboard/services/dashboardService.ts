// src/features/dashboard/services/dashboardService.ts

/**
 * Servicio para métricas del dashboard
 * Recopila estadísticas en tiempo real desde múltiples endpoints
 */

import { apiClient } from '../../../shared/services';

// ========================================
// INTERFACES Y TIPOS
// ========================================

export interface DashboardMetrics {
  totalProducts: number;
  totalCategories: number;
  totalProviders: number;
  lowStockItems: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  revenue: number;
}

interface OrderSummary {
  total_orders: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
}

interface ProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
  results: any[];
}

interface CategoriesResponse {
  results: any[];
}

interface ProvidersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
  results: any[];
}

interface StockAlertsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
  results: any[];
}

// ========================================
// SERVICIO DE DASHBOARD
// ========================================

class DashboardService {
  /**
   * Obtiene todas las métricas del dashboard en paralelo
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    console.log('📊 [DashboardService] Cargando métricas...');

    try {
      // Ejecutar todas las peticiones en paralelo
      const [
        productsData,
        categoriesData,
        providersData,
        stockAlertsData,
        orderSummaryData
      ] = await Promise.allSettled([
        this.getTotalProducts(),
        this.getTotalCategories(),
        this.getTotalProviders(),
        this.getLowStockItems(),
        this.getOrderSummary()
      ]);

      // Extraer valores o usar defaults si falla alguna petición
      const metrics: DashboardMetrics = {
        totalProducts: productsData.status === 'fulfilled' ? productsData.value : 0,
        totalCategories: categoriesData.status === 'fulfilled' ? categoriesData.value : 0,
        totalProviders: providersData.status === 'fulfilled' ? providersData.value : 0,
        lowStockItems: stockAlertsData.status === 'fulfilled' ? stockAlertsData.value : 0,
        totalOrders: orderSummaryData.status === 'fulfilled' ? orderSummaryData.value.total : 0,
        pendingOrders: orderSummaryData.status === 'fulfilled' ? orderSummaryData.value.pending : 0,
        deliveredOrders: orderSummaryData.status === 'fulfilled' ? orderSummaryData.value.delivered : 0,
        revenue: 0, // Por ahora en 0, podemos calcularlo después desde las órdenes
      };

      console.log('✅ [DashboardService] Métricas cargadas:', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ [DashboardService] Error al cargar métricas:', error);
      
      // Retornar métricas vacías en caso de error
      return {
        totalProducts: 0,
        totalCategories: 0,
        totalProviders: 0,
        lowStockItems: 0,
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        revenue: 0,
      };
    }
  }

  /**
   * Obtiene el total de productos
   */
  private async getTotalProducts(): Promise<number> {
    try {
      const response = await apiClient.get<ProductsResponse>(
        '/api/product/v1/products/simple/?page=1&page_size=1'
      );
      return response.count || 0;
    } catch (error) {
      console.error('Error obteniendo total de productos:', error);
      return 0;
    }
  }

  /**
   * Obtiene el total de categorías
   */
  private async getTotalCategories(): Promise<number> {
    try {
      const response = await apiClient.get<CategoriesResponse>('/api/category/v1/categories/');
      return response.results?.length || 0;
    } catch (error) {
      console.error('Error obteniendo total de categorías:', error);
      return 0;
    }
  }

  /**
   * Obtiene el total de proveedores
   */
  private async getTotalProviders(): Promise<number> {
    try {
      const response = await apiClient.get<ProvidersResponse>(
        '/api/provider/v1/providers/?page_size=1'
      );
      return response.count || 0;
    } catch (error) {
      console.error('Error obteniendo total de proveedores:', error);
      return 0;
    }
  }

  /**
   * Obtiene items con stock bajo (alertas no resueltas)
   */
  private async getLowStockItems(): Promise<number> {
    try {
      const response = await apiClient.get<StockAlertsResponse>(
        '/api/inventory/v1/alerts/unresolved/?page_size=1'
      );
      return response.count || 0;
    } catch (error) {
      console.error('Error obteniendo alertas de stock:', error);
      return 0;
    }
  }

  /**
   * Obtiene el resumen de órdenes
   */
  private async getOrderSummary(): Promise<{ total: number; pending: number; delivered: number }> {
    try {
      const response = await apiClient.get<OrderSummary>('/api/order/v1/orders/summary/');
      
      return {
        total: response.total_orders || 0,
        pending: (response.pending || 0) + (response.confirmed || 0),
        delivered: response.delivered || 0,
      };
    } catch (error) {
      console.error('Error obteniendo resumen de órdenes:', error);
      return { total: 0, pending: 0, delivered: 0 };
    }
  }
}

// Exportar instancia singleton
export const dashboardService = new DashboardService();
