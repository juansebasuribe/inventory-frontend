// src/features/products/services/inventoryService.ts

/**
 * Servicio para gestión de inventario
 * Maneja items, movimientos, alertas de stock y control de inventario
 */

import { apiClient } from '../../../shared/services';

// ========================================
// INTERFACES Y TIPOS
// ========================================

// Interfaz que coincide EXACTAMENTE con el backend Django
interface BackendInventoryItem {
  id: number;
  product: number;
  product_details: {
    id: number;
    name: string;
    bar_code: string;
    retail_price: number;
  };
  location: number;
  location_details: {
    id: number;
    name: string;
    code: string;
    aisle?: string | null;
    aisle_code?: string | null;
    shelf?: string | null;
    shelf_code?: string | null;
    bin?: string | null;
    bin_code?: string | null;
  };
  quantity: number | string | null;
  min_quantity?: number | string | null;
  max_quantity?: number | string | null;
  minimum_stock?: number | string | null;
  maximum_stock?: number | string | null;
  aisle?: string | null;
  shelf?: string | null;
  bin?: string | null;
  needs_restock?: boolean;
  overstock?: boolean;
  last_restocked: string | null;
  creation_date: string;
  update_date: string;
  active: boolean;
}

// Interfaz transformada para la UI (backward compatibility)
interface InventoryItem {
  id: number;
  product_code: string;
  product_name: string;
  warehouse_code: string;
  warehouse_name: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reserved_stock: number;
  available_stock: number;
  unit_cost: number;
  total_value: number;
  last_movement_date: string;
  creation_date: string;
  update_date: string;
  // Campos adicionales del backend
  aisle?: string;
  shelf?: string;
  bin?: string;
  needs_restock?: boolean;
  overstock?: boolean;
}

interface InventoryMovement {
  id: number;
  movement_code: string;
  product_code: string;
  warehouse_code: string;
  movement_type: 'entry' | 'exit' | 'transfer' | 'adjustment';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reason: string;
  reference_document: string;
  movement_date: string;
  created_by: number;
  created_date: string;
}

interface StockAlert {
  id: number;
  product_code: string;
  product_name: string;
  warehouse_code: string;
  alert_type: 'low_stock' | 'overstock' | 'out_of_stock';
  current_stock: number;
  threshold_value: number;
  is_resolved: boolean;
  created_date: string;
  resolved_date?: string;
  resolved_by?: number;
}

interface InventoryListResponse {
  count: number;
  total_pages: number;
  current_page: number;
  links: {
    next: string | null;
    previous: string | null;
  };
  results: InventoryItem[];
}

// Respuesta del backend (sin transformar)
interface BackendInventoryListResponse {
  count: number;
  total_pages: number;
  current_page: number;
  links: {
    next: string | null;
    previous: string | null;
  };
  results: BackendInventoryItem[];
}

interface MovementListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: InventoryMovement[];
}

interface AlertListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: StockAlert[];
}

interface InventoryFilter {
  search?: string;
  warehouse?: string;
  product_code?: string;
  low_stock?: boolean;
  overstock?: boolean;
  page?: number;
  page_size?: number;
}

interface MovementFilter {
  search?: string;
  movement_type?: string;
  warehouse?: string;
  product_code?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

interface StockUpdateData {
  quantity: number;
  movement_type: 'adjustment' | 'entry' | 'exit';
  reason: string;
  reference_document?: string;
}

interface InventoryStats {
  total_items: number;
  low_stock_items: number;
  overstock_items: number;
  out_of_stock_items: number;
  total_value: number;
  average_stock_level: number;
}

// ========================================
// ENDPOINTS
// ========================================

const INVENTORY_ENDPOINTS = {
  ITEMS: '/api/inventory/v1/items/',
  ITEM_DETAIL: (id: number) => `/api/inventory/v1/items/${id}/`,
  ITEM_UPDATE_QUANTITY: (id: number) => `/api/inventory/v1/items/${id}/update-quantity/`,
  LOW_STOCK: '/api/inventory/v1/items/low-stock/',
  OVERSTOCK: '/api/inventory/v1/items/overstock/',
  
  MOVEMENTS: '/api/inventory/v1/movements/',
  MOVEMENT_DETAIL: (code: string) => `/api/inventory/v1/movements/${code}/`,
  MOVEMENTS_BY_PRODUCT: (code: string) => `/api/inventory/v1/movements/by-product/${code}/`,
  MOVEMENTS_BY_LOCATION: (code: string) => `/api/inventory/v1/movements/by-location/${code}/`,
  
  ALERTS: '/api/inventory/v1/alerts/',
  ALERT_DETAIL: (id: number) => `/api/inventory/v1/alerts/${id}/`,
  ALERT_RESOLVE: (id: number) => `/api/inventory/v1/alerts/${id}/resolve/`,
  ALERTS_UNRESOLVED: '/api/inventory/v1/alerts/unresolved/',
} as const;

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Transforma la respuesta del backend al formato esperado por la UI
 */
function toNumber(value: unknown, defaultValue = 0): number {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function pickFirstString(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return '';
}

function transformBackendItem(backendItem: BackendInventoryItem): InventoryItem {
  const locationDetails: BackendInventoryItem['location_details'] =
    backendItem.location_details ?? { id: 0, name: '', code: '' };

  const currentStock = toNumber(backendItem.quantity);
  const minimumStock = toNumber(
    backendItem.min_quantity ?? backendItem.minimum_stock,
    0
  );
  const maximumStock = toNumber(
    backendItem.max_quantity ?? backendItem.maximum_stock,
    0
  );

  const aisle = pickFirstString(
    backendItem.aisle,
    locationDetails?.aisle,
    locationDetails?.aisle_code
  );

  const shelf = pickFirstString(
    backendItem.shelf,
    locationDetails?.shelf,
    locationDetails?.shelf_code
  );

  const bin = pickFirstString(
    backendItem.bin,
    locationDetails?.bin,
    locationDetails?.bin_code
  );

  return {
    id: backendItem.id,
    product_code: backendItem.product_details?.bar_code || '',
    product_name: backendItem.product_details?.name || 'Sin nombre',
    warehouse_code: locationDetails?.code || '',
    warehouse_name: locationDetails?.name || 'Sin ubicación',
    current_stock: currentStock,
    minimum_stock: minimumStock,
    maximum_stock: maximumStock,
    reserved_stock: 0, // No disponible en backend
    available_stock: currentStock,
    unit_cost: toNumber(backendItem.product_details?.retail_price),
    total_value: currentStock * toNumber(backendItem.product_details?.retail_price),
    last_movement_date: backendItem.last_restocked || backendItem.update_date,
    creation_date: backendItem.creation_date,
    update_date: backendItem.update_date,
    // Campos adicionales
    aisle,
    shelf,
    bin,
    needs_restock: backendItem.needs_restock,
    overstock: backendItem.overstock,
  };
}

// ========================================
// SERVICIO DE INVENTARIO
// ========================================

export class InventoryService {
  private static instance: InventoryService;

  private constructor() {}

  /**
   * Singleton pattern para instancia única
   */
  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  // ========================================
  // MÉTODOS DE ITEMS DE INVENTARIO
  // ========================================

  /**
   * Obtiene lista de items de inventario
   */
  async getInventoryItems(filters: InventoryFilter = {}): Promise<InventoryListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.warehouse) params.append('location', filters.warehouse); // Backend usa 'location'
      if (filters.product_code) params.append('product__bar_code', filters.product_code); // Filtro correcto
      if (filters.low_stock) params.append('needs_restock', 'true'); // Backend usa 'needs_restock'
      if (filters.overstock) params.append('overstock', 'true');
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size) params.append('page_size', filters.page_size.toString());

      const queryString = params.toString();
      const url = `${INVENTORY_ENDPOINTS.ITEMS}${queryString ? `?${queryString}` : ''}`;
      
      console.log(`[InventoryService] Requesting: ${url}`);
      
      // Obtener respuesta del backend
      const backendResponse = await apiClient.get<BackendInventoryListResponse>(url);
      
      console.log(`[InventoryService] Backend response:`, {
        count: backendResponse.count,
        results: backendResponse.results?.length
      });
      
      // Transformar los items del backend al formato de la UI
      const transformedResults = backendResponse.results.map(transformBackendItem);
      
      // Retornar en el formato esperado
      return {
        count: backendResponse.count,
        total_pages: backendResponse.total_pages,
        current_page: backendResponse.current_page,
        links: backendResponse.links,
        results: transformedResults
      };
    } catch (error: any) {
      console.error('[InventoryService] Error al obtener items de inventario:', error);
      
      // Mejorar el mensaje de error
      if (error.status === 500) {
        throw new Error('Error interno del servidor. Verifica que el backend esté funcionando correctamente.');
      } else if (error.status === 401) {
        throw new Error('No estás autenticado. Por favor inicia sesión nuevamente.');
      } else if (error.status === 403) {
        throw new Error('No tienes permisos para acceder al inventario.');
      }
      
      throw new Error(error.message || 'Error al cargar los items de inventario');
    }
  }

  /**
   * Obtiene un item de inventario por ID
   */
  async getInventoryItem(id: number): Promise<InventoryItem> {
    try {
      return await apiClient.get<InventoryItem>(
        INVENTORY_ENDPOINTS.ITEM_DETAIL(id)
      );
    } catch (error) {
      console.error('Error al obtener item de inventario:', error);
      throw new Error('Error al cargar el item de inventario');
    }
  }

  /**
   * Actualiza un item de inventario (incluye min/max quantity)
   */
  async updateInventoryItem(id: number, updateData: {
    product?: number;
    location?: number;
    quantity?: number;
    min_quantity?: number;
    max_quantity?: number;
    aisle?: string;
    shelf?: string;
    bin?: string;
  }): Promise<InventoryItem> {
    try {
      console.log(`[InventoryService] Actualizando item ${id}:`, updateData);
      
      // Primero obtener el item actual para tener todos los campos requeridos
      const currentItem = await apiClient.get<BackendInventoryItem>(
        INVENTORY_ENDPOINTS.ITEM_DETAIL(id)
      );
      console.log('[InventoryService] Item actual del backend:', currentItem);
      
      // Preparar datos completos para el PUT (el backend requiere todos los campos)
      const fullUpdateData = {
        product: updateData.product ?? currentItem.product,
        location: updateData.location ?? currentItem.location,
        quantity: updateData.quantity ?? currentItem.quantity ?? 0,
        min_quantity: updateData.min_quantity ?? currentItem.min_quantity ?? null,
        max_quantity: updateData.max_quantity ?? currentItem.max_quantity ?? null,
        aisle: updateData.aisle ?? currentItem.aisle ?? null,
        shelf: updateData.shelf ?? currentItem.shelf ?? null,
        bin: updateData.bin ?? currentItem.bin ?? null,
      };
      
      console.log('[InventoryService] Enviando datos completos:', fullUpdateData);
      
      // Usar PUT con datos completos
      const response = await apiClient.put<BackendInventoryItem>(
        INVENTORY_ENDPOINTS.ITEM_DETAIL(id),
        fullUpdateData
      );
      
      console.log('[InventoryService] Item actualizado (backend):', response);
      
      // Transformar respuesta del backend al formato de la UI
      const transformedItem = transformBackendItem(response);
      console.log('[InventoryService] Item transformado:', transformedItem);
      
      return transformedItem;
    } catch (error) {
      console.error('Error al actualizar item de inventario:', error);
      throw new Error('Error al actualizar el item de inventario');
    }
  }

  /**
   * Actualiza la cantidad de un item de inventario
   */
  async updateItemQuantity(id: number, updateData: StockUpdateData): Promise<InventoryItem> {
    try {
      return await apiClient.post<InventoryItem>(
        INVENTORY_ENDPOINTS.ITEM_UPDATE_QUANTITY(id),
        updateData
      );
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      throw new Error('Error al actualizar la cantidad del item');
    }
  }

  /**
   * Crea un movimiento de inventario (entrada, salida, transferencia)
   */
  async createMovement(data: {
    movement_type: 'entry' | 'exit' | 'transfer' | 'adjustment';  // ⚠️ DEBE ser minúsculas
    product_barcode: string;
    quantity: number;
    to_location_code?: string;
    from_location_code?: string;
    reference_number?: string;
    notes?: string;
    aisle?: string;
    shelf?: string;
    bin?: string;
  }): Promise<InventoryMovement> {
    try {
      console.log('📤 [InventoryService] Creando movimiento:', data);
      console.log('📤 [InventoryService] Tipos de datos:', {
        movement_type: typeof data.movement_type,
        product_barcode: typeof data.product_barcode,
        quantity: typeof data.quantity,
        to_location_code: typeof data.to_location_code,
        from_location_code: typeof data.from_location_code
      });
      
      const response = await apiClient.post<InventoryMovement>(
        INVENTORY_ENDPOINTS.MOVEMENTS,
        data
      );
      
      console.log('✅ [InventoryService] Movimiento creado:', response);
      return response;
    } catch (error: any) {
      console.error('❌ [InventoryService] Error al crear movimiento:', error);
      console.error('❌ [InventoryService] Error name:', error?.name);
      console.error('❌ [InventoryService] Error message:', error?.message);
      console.error('❌ [InventoryService] Error details:', error?.details);
      console.error('❌ [InventoryService] Error completo:', error);
      
      // Extraer mensaje de error
      let errorMessage = 'Error al registrar el movimiento de inventario';
      
      // Si es ValidationError o ApiClientError, tiene la propiedad details
      if (error.details) {
        console.log('🔍 [InventoryService] Analizando error.details:', error.details);
        
        const details = error.details;
        
        if (typeof details === 'string') {
          errorMessage = details;
        } else if (details.detail) {
          errorMessage = Array.isArray(details.detail) 
            ? details.detail.join(', ') 
            : String(details.detail);
        } else if (details.error) {
          errorMessage = String(details.error);
        } else if (details.message) {
          errorMessage = String(details.message);
        } else if (details.non_field_errors) {
          errorMessage = Array.isArray(details.non_field_errors) 
            ? details.non_field_errors.join(', ') 
            : String(details.non_field_errors);
        } else {
          // Si hay errores de campos específicos, construir mensaje
          const fieldErrors = Object.entries(details)
            .filter(([key]) => !['status', 'statusText'].includes(key))
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            });
          
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join(' | ');
          }
        }
      } else if (error.message) {
        // Si no hay details, usar el mensaje del error
        errorMessage = error.message;
      }
      
      console.error('🔴 [InventoryService] Error final:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Obtiene items con stock bajo
   */
  async getLowStockItems(): Promise<InventoryItem[]> {
    try {
      return await apiClient.get<InventoryItem[]>(
        INVENTORY_ENDPOINTS.LOW_STOCK
      );
    } catch (error) {
      console.error('Error al obtener items con stock bajo:', error);
      throw new Error('Error al cargar items con stock bajo');
    }
  }

  /**
   * Obtiene items con sobrestock
   */
  async getOverstockItems(): Promise<InventoryItem[]> {
    try {
      return await apiClient.get<InventoryItem[]>(
        INVENTORY_ENDPOINTS.OVERSTOCK
      );
    } catch (error) {
      console.error('Error al obtener items con sobrestock:', error);
      throw new Error('Error al cargar items con sobrestock');
    }
  }

  // ========================================
  // MÉTODOS DE MOVIMIENTOS
  // ========================================

  /**
   * Obtiene lista de movimientos de inventario
   */
  async getInventoryMovements(filters: MovementFilter = {}): Promise<MovementListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.movement_type) params.append('movement_type', filters.movement_type);
      if (filters.warehouse) params.append('warehouse', filters.warehouse);
      if (filters.product_code) params.append('product_code', filters.product_code);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size) params.append('page_size', filters.page_size.toString());

      const queryString = params.toString();
      const url = `${INVENTORY_ENDPOINTS.MOVEMENTS}${queryString ? `?${queryString}` : ''}`;
      
      return await apiClient.get<MovementListResponse>(url);
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
      throw new Error('Error al cargar los movimientos de inventario');
    }
  }

  /**
   * Obtiene movimientos por producto
   */
  async getMovementsByProduct(productCode: string): Promise<InventoryMovement[]> {
    try {
      return await apiClient.get<InventoryMovement[]>(
        INVENTORY_ENDPOINTS.MOVEMENTS_BY_PRODUCT(productCode)
      );
    } catch (error) {
      console.error('Error al obtener movimientos por producto:', error);
      throw new Error('Error al cargar movimientos del producto');
    }
  }

  /**
   * Obtiene movimientos por ubicación
   */
  async getMovementsByLocation(locationCode: string): Promise<InventoryMovement[]> {
    try {
      return await apiClient.get<InventoryMovement[]>(
        INVENTORY_ENDPOINTS.MOVEMENTS_BY_LOCATION(locationCode)
      );
    } catch (error) {
      console.error('Error al obtener movimientos por ubicación:', error);
      throw new Error('Error al cargar movimientos de la ubicación');
    }
  }

  // ========================================
  // MÉTODOS DE ALERTAS
  // ========================================

  /**
   * Obtiene lista de alertas de stock
   */
  async getStockAlerts(): Promise<AlertListResponse> {
    try {
      return await apiClient.get<AlertListResponse>(
        INVENTORY_ENDPOINTS.ALERTS
      );
    } catch (error) {
      console.error('Error al obtener alertas:', error);
      throw new Error('Error al cargar las alertas de stock');
    }
  }

  /**
   * Obtiene alertas sin resolver
   */
  async getUnresolvedAlerts(): Promise<StockAlert[]> {
    try {
      return await apiClient.get<StockAlert[]>(
        INVENTORY_ENDPOINTS.ALERTS_UNRESOLVED
      );
    } catch (error) {
      console.error('Error al obtener alertas sin resolver:', error);
      throw new Error('Error al cargar alertas sin resolver');
    }
  }

  /**
   * Resuelve una alerta de stock
   */
  async resolveAlert(alertId: number): Promise<StockAlert> {
    try {
      return await apiClient.post<StockAlert>(
        INVENTORY_ENDPOINTS.ALERT_RESOLVE(alertId)
      );
    } catch (error) {
      console.error('Error al resolver alerta:', error);
      throw new Error('Error al resolver la alerta');
    }
  }

  // ========================================
  // MÉTODOS DE ESTADÍSTICAS
  // ========================================

  /**
   * Obtiene estadísticas generales de inventario
   */
  async getInventoryStats(): Promise<InventoryStats> {
    try {
      const [
        itemsResponse,
        lowStockItems,
        overstockItems,
      ] = await Promise.all([
        this.getInventoryItems({ page_size: 1 }),
        this.getLowStockItems(),
        this.getOverstockItems(),
      ]);

      // Calcular valor total (simplificado)
      const allItems = await this.getInventoryItems({ page_size: 1000 });
      const totalValue = allItems.results.reduce((sum, item) => sum + (item.total_value || 0), 0);
      const averageStock = allItems.results.length > 0 
        ? allItems.results.reduce((sum, item) => sum + item.current_stock, 0) / allItems.results.length 
        : 0;

      return {
        total_items: itemsResponse.count,
        low_stock_items: lowStockItems.length,
        overstock_items: overstockItems.length,
        out_of_stock_items: allItems.results.filter(item => item.current_stock === 0).length,
        total_value: totalValue,
        average_stock_level: Math.round(averageStock * 100) / 100,
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de inventario:', error);
      throw new Error('Error al cargar las estadísticas de inventario');
    }
  }

  // ========================================
  // MÉTODOS UTILITARIOS
  // ========================================

  /**
   * Busca items de inventario
   */
  async searchInventoryItems(query: string, limit: number = 10): Promise<InventoryItem[]> {
    try {
      const response = await this.getInventoryItems({
        search: query,
        page_size: limit
      });
      return response.results;
    } catch (error) {
      console.error('Error en búsqueda de inventario:', error);
      throw new Error('Error al buscar items de inventario');
    }
  }
}

// ========================================
// EXPORTACIÓN SINGLETON
// ========================================

export const inventoryService = InventoryService.getInstance();