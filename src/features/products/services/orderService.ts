// src/features/products/services/orderService.ts

/**
 * Servicio para gestión de órdenes
 * Maneja el procesamiento, seguimiento y historial de órdenes
 */

import { apiClient } from '../../../shared/services';

// ========================================
// INTERFACES Y TIPOS
// ========================================

interface OrderItem {
  id?: number;
  product_code?: string;
  product_name?: string;
  product_bar_code?: string;
  product_image?: string;
  unit_price?: number;
  quantity?: number;
  subtotal?: number;
  discount_percentage?: number;
  discount_amount?: number;
  final_price?: number;
  total_price?: number;
}

interface ShippingAddress {
  id: number;
  recipient_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

interface Order {
  id: string;  // UUID en Django (order_uuid)
  order_uuid: string;
  order_number?: string;
  user_id?: number;
  status: OrderStatus;
  status_display?: string;
  seller?: {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  location?: {
    id: number;
    name: string;
    type?: string;
  };
  items?: OrderItem[];
  total_items: number;
  total_price: number;
  shipping_address: string | ShippingAddress;
  billing_address?: ShippingAddress;
  subtotal: number;
  discount_amount?: number;
  tax_amount: number;
  shipping_cost?: number;
  total_amount: number;
  currency?: string;
  payment_method?: string;
  payment_status?: PaymentStatus;
  tracking_number?: string;
  estimated_delivery_date?: string;
  notes?: string;
  created_date?: string;
  order_date: string;
  updated_date?: string;
  shipped_date?: string;
  delivered_date?: string;
  processed_date?: string;
}

type OrderStatus = 
  | 'pending' | 'PENDING'
  | 'confirmed' | 'CONFIRMED'
  | 'processing' | 'PROCESSING'
  | 'shipped' | 'SHIPPED'
  | 'delivered' | 'DELIVERED'
  | 'cancelled' | 'CANCELLED'
  | 'returned' | 'RETURNED'
  | 'refunded' | 'REFUNDED';

type PaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'refunded' 
  | 'partially_refunded';

interface CreateOrderData {
  shipping_address_id: number;
  billing_address_id: number;
  payment_method: string;
  notes?: string;
}

interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  seller?: number;  // ID del vendedor para filtrar
  page?: number;
  page_size?: number;
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_this_month: number;
  revenue_this_month: number;
}

interface DjangoResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface UpdateOrderStatusData {
  status: OrderStatus;
  tracking_number?: string;
  notes?: string;
}

interface RefundData {
  amount: number;
  reason: string;
  items?: number[]; // IDs de items a reembolsar
}

// ========================================
// ENDPOINTS
// ========================================

const ORDER_ENDPOINTS = {
  ORDERS: '/api/order/v1/orders/',                    // OrderListCreateView - corregido
  ORDER_DETAIL: (id: string) => `/api/order/v1/orders/${id}/`,  // UUID en lugar de number
  CREATE_ORDER: '/api/order/v1/orders/',             // Mismo endpoint para crear
  CANCEL_ORDER: (id: string) => `/api/order/v1/orders/${id}/cancel/`,
  UPDATE_STATUS: (id: string) => `/api/order/v1/orders/${id}/status/`,
  ORDER_TRACKING: (orderNumber: string) => `/api/order/v1/tracking/${orderNumber}/`,
  ORDER_PDF: (id: string) => `/api/order/v1/orders/pdf/${id}/`,
  ORDER_PDF_DOWNLOAD: (id: string) => `/api/order/v1/orders/pdf/${id}/download/`,
  ORDER_REFUND: (id: string) => `/api/order/v1/orders/${id}/refund/`,
  ORDER_STATS: '/api/order/v1/stats/',
  ORDER_SUMMARY: '/api/order/v1/orders/summary/',    // OrderSummaryView
  USER_ORDERS: '/api/order/v1/orders/',              // Mismo endpoint con filtros
} as const;

// ========================================
// SERVICIO DE ÓRDENES
// ========================================

export class OrderService {
  private static instance: OrderService;

  private constructor() {}

  /**
   * Singleton pattern para instancia única
   */
  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  // ========================================
  // MÉTODOS PRINCIPALES DE ÓRDENES
  // ========================================

  /**
   * Obtiene lista de órdenes con filtros opcionales
   */
  async getOrders(filters?: OrderFilters): Promise<DjangoResponse<Order>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const url = `${ORDER_ENDPOINTS.ORDERS}${params.toString() ? `?${params.toString()}` : ''}`;
      const resp = await apiClient.get<any>(url);
      if (Array.isArray(resp)) {
        return { count: resp.length, next: null, previous: null, results: resp } as DjangoResponse<Order>;
      }
      if (resp && typeof resp === 'object') {
        if (Array.isArray(resp.results)) return resp as DjangoResponse<Order>;
        const results = Array.isArray(resp.data) ? resp.data : (Array.isArray(resp.orders) ? resp.orders : []);
        if (results.length) return { count: results.length, next: null, previous: null, results } as DjangoResponse<Order>;
      }
      return { count: 0, next: null, previous: null, results: [] } as DjangoResponse<Order>;
    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      throw new Error('Error al cargar las órdenes');
    }
  }

  /**
   * Obtiene una orden específica por ID
   */
  async getOrderById(id: string): Promise<Order> {
    try {
      return await apiClient.get<Order>(ORDER_ENDPOINTS.ORDER_DETAIL(id));
    } catch (error) {
      console.error('Error al obtener orden:', error);
      throw new Error('Error al cargar la orden');
    }
  }

  /**
   * Obtiene órdenes del usuario actual
   */
  async getUserOrders(filters?: OrderFilters): Promise<DjangoResponse<Order>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const url = `${ORDER_ENDPOINTS.USER_ORDERS}${params.toString() ? `?${params.toString()}` : ''}`;
      return await apiClient.get<DjangoResponse<Order>>(url);
    } catch (error) {
      console.error('Error al obtener órdenes del usuario:', error);
      throw new Error('Error al cargar las órdenes del usuario');
    }
  }

  /**
   * Crea una nueva orden desde el carrito
   */
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    try {
      return await apiClient.post<Order>(
        ORDER_ENDPOINTS.CREATE_ORDER,
        orderData
      );
    } catch (error) {
      console.error('Error al crear orden:', error);
      throw new Error('Error al crear la orden');
    }
  }

  // ========================================
  // MÉTODOS DE GESTIÓN DE ÓRDENES
  // ========================================

  /**
   * Actualiza el estado de una orden (Admin confirma/aprueba orden)
   */
  async updateOrderStatus(orderId: string, statusData: UpdateOrderStatusData): Promise<Order> {
    try {
      // Usar PATCH al endpoint de detalle de la orden
      return await apiClient.patch<Order>(
        ORDER_ENDPOINTS.ORDER_DETAIL(orderId),
        statusData
      );
    } catch (error) {
      console.error('Error al actualizar estado de orden:', error);
      throw new Error('Error al actualizar el estado de la orden');
    }
  }

  /**
   * Cancela una orden
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    try {
      return await apiClient.post<Order>(
        ORDER_ENDPOINTS.CANCEL_ORDER(orderId),
        { reason }
      );
    } catch (error) {
      console.error('Error al cancelar orden:', error);
      throw new Error('Error al cancelar la orden');
    }
  }

  // ========================================
  // MÉTODOS DE SEGUIMIENTO
  // ========================================

  /**
   * Obtiene información de seguimiento de una orden
   */
  async getOrderTracking(orderNumber: string): Promise<any> {
    try {
      return await apiClient.get(ORDER_ENDPOINTS.ORDER_TRACKING(orderNumber));
    } catch (error) {
      console.error('Error al obtener seguimiento:', error);
      throw new Error('Error al obtener información de seguimiento');
    }
  }

  // ========================================
  // MÉTODOS DE FACTURACIÓN Y DOCUMENTOS
  // ========================================

  /**
   * Obtiene la factura de una orden
   */
  private async fetchOrderPdf(orderId: string, download = true): Promise<Blob> {
    try {
      const baseUrl =
        (typeof apiClient.getBaseURL === 'function' && apiClient.getBaseURL()) ||
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' ? window.location.origin : '');

      const path = download
        ? ORDER_ENDPOINTS.ORDER_PDF_DOWNLOAD(orderId)
        : ORDER_ENDPOINTS.ORDER_PDF(orderId);
      const endpoint = `${baseUrl.replace(/\/$/, '')}${path}`;

      const tokens = typeof apiClient.getAuthTokens === 'function' ? apiClient.getAuthTokens() : null;
      const fallbackToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('access_token') ||
            (() => {
              try {
                const stored = localStorage.getItem('auth_tokens');
                return stored ? JSON.parse(stored)?.access || '' : '';
              } catch {
                return '';
              }
            })()
          : '';
      const token = tokens?.access || fallbackToken;

      if (!token) {
        throw new Error('No hay un token de autenticación válido. Inicia sesión nuevamente.');
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `JWT ${token}`,
        },
      });

      if (!response.ok) {
        let message = `Error ${response.status}: ${response.statusText}`;
        try {
          const data = await response.json();
          message = data?.detail || message;
        } catch {
          // ignore json parse errors
        }
        throw new Error(message);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('application/pdf')) {
        const fallbackText = await response.text();
        throw new Error(fallbackText || 'El servidor no devolvió un PDF válido.');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error al obtener PDF de la orden:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Error al obtener el PDF de la orden'
      );
    }
  }

  async downloadOrderPdf(orderId: string, orderNumber: string): Promise<void> {
    try {
      const blob = await this.fetchOrderPdf(orderId, true);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orden-${orderNumber || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar PDF de la orden:', error);
      throw new Error('Error al descargar el PDF de la orden');
    }
  }

  // ========================================
  // MÉTODOS DE REEMBOLSOS
  // ========================================

  /**
   * Procesa un reembolso para una orden
   */
  async processRefund(orderId: string, refundData: RefundData): Promise<any> {
    try {
      return await apiClient.post(
        ORDER_ENDPOINTS.ORDER_REFUND(orderId),
        refundData
      );
    } catch (error) {
      console.error('Error al procesar reembolso:', error);
      throw new Error('Error al procesar el reembolso');
    }
  }

  // ========================================
  // MÉTODOS DE ESTADÍSTICAS
  // ========================================

  /**
   * Obtiene estadísticas de órdenes
   */
  async getOrderStats(): Promise<OrderStats> {
    try {
      return await apiClient.get<OrderStats>(ORDER_ENDPOINTS.ORDER_STATS);
    } catch (error) {
      console.error('Error al obtener estadísticas de órdenes:', error);
      throw new Error('Error al cargar las estadísticas de órdenes');
    }
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA Y FILTRADO
  // ========================================

  /**
   * Busca órdenes por término de búsqueda
   */
  async searchOrders(searchTerm: string, filters?: Omit<OrderFilters, 'search'>): Promise<DjangoResponse<Order>> {
    try {
      return await this.getOrders({
        ...filters,
        search: searchTerm
      });
    } catch (error) {
      console.error('Error al buscar órdenes:', error);
      throw new Error('Error al buscar órdenes');
    }
  }

  /**
   * Obtiene órdenes por estado
   */
  async getOrdersByStatus(status: OrderStatus, filters?: Omit<OrderFilters, 'status'>): Promise<DjangoResponse<Order>> {
    try {
      return await this.getOrders({
        ...filters,
        status
      });
    } catch (error) {
      console.error('Error al obtener órdenes por estado:', error);
      throw new Error('Error al obtener órdenes por estado');
    }
  }

  /**
   * Obtiene órdenes por estado de pago
   */
  async getOrdersByPaymentStatus(paymentStatus: PaymentStatus, filters?: Omit<OrderFilters, 'payment_status'>): Promise<DjangoResponse<Order>> {
    try {
      return await this.getOrders({
        ...filters,
        payment_status: paymentStatus
      });
    } catch (error) {
      console.error('Error al obtener órdenes por estado de pago:', error);
      throw new Error('Error al obtener órdenes por estado de pago');
    }
  }

  /**
   * Obtiene órdenes en un rango de fechas
   */
  async getOrdersByDateRange(dateFrom: string, dateTo: string, filters?: Omit<OrderFilters, 'date_from' | 'date_to'>): Promise<DjangoResponse<Order>> {
    try {
      return await this.getOrders({
        ...filters,
        date_from: dateFrom,
        date_to: dateTo
      });
    } catch (error) {
      console.error('Error al obtener órdenes por rango de fechas:', error);
      throw new Error('Error al obtener órdenes por rango de fechas');
    }
  }

  // ========================================
  // MÉTODOS UTILITARIOS
  // ========================================

  /**
   * Obtiene el color de estado para UI
   */
  getStatusColor(status: OrderStatus): string {
    const statusLower = status?.toLowerCase();
    const statusColors: Record<string, string> = {
      pending: 'yellow',
      confirmed: 'blue',
      processing: 'orange',
      shipped: 'purple',
      delivered: 'green',
      cancelled: 'red',
      returned: 'gray'
    };
    return statusColors[statusLower] || 'gray';
  }

  /**
   * Obtiene la etiqueta de estado en español
   */
  getStatusLabel(status: OrderStatus): string {
    const statusLower = status?.toLowerCase();
    const statusLabels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      processing: 'Procesando',
      shipped: 'Enviada',
      delivered: 'Entregada',
      cancelled: 'Cancelada',
      returned: 'Devuelta'
    };
    return statusLabels[statusLower] || status;
  }

  /**
   * Obtiene la etiqueta de estado de pago en español
   */
  getPaymentStatusLabel(paymentStatus: PaymentStatus): string {
    const paymentLabels: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagada',
      failed: 'Falló',
      refunded: 'Reembolsada',
      partially_refunded: 'Reembolso Parcial'
    };
    return paymentLabels[paymentStatus] || paymentStatus;
  }

  /**
   * Calcula el progreso de la orden (0-100)
   */
  getOrderProgress(status: OrderStatus): number {
    const statusLower = status?.toLowerCase();
    const progressMap: Record<string, number> = {
      pending: 10,
      confirmed: 25,
      processing: 50,
      shipped: 75,
      delivered: 100,
      cancelled: 0,
      returned: 0
    };
    return progressMap[statusLower] || 0;
  }
}

// ========================================
// EXPORTACIÓN SINGLETON E INTERFACES
// ========================================

export const orderService = OrderService.getInstance();

// Exportar interfaces principales para uso en componentes
export type { Order, OrderItem, OrderFilters, OrderStatus };
