// src/features/order/services/orderService.ts

/**
 * Servicio para gestión de órdenes de compra
 * Permite crear órdenes desde el carrito y consultar historial
 */

import { apiClient } from '../../../shared/services';

// ========================================
// INTERFACES Y TIPOS
// ========================================

export interface OrderItem {
  id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  total_price: number;
}

export interface Order {
  id: number;
  order_uuid: string;
  seller: number;
  seller_name?: string;
  status: string;
  status_display?: string;
  total_amount: number;
  subtotal: number;
  total_discount: number;
  taxes: number;
  shipping_address?: string;
  items?: OrderItem[];
  created_date: string;
  updated_date: string;
}

export interface CreateOrderData {
  cart_uuid: string;
  shipping_address?: string;
}

export interface OrderListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

// ========================================
// ENDPOINTS
// ========================================

const ORDER_ENDPOINTS = {
  ORDERS: '/api/order/v1/orders/',
  ORDER_DETAIL: (uuid: string) => `/api/order/v1/orders/${uuid}/`,
  ORDER_CANCEL: (uuid: string) => `/api/order/v1/orders/${uuid}/cancel/`,
  ORDER_SUMMARY: '/api/order/v1/orders/summary/',
} as const;

// ========================================
// SERVICIO DE ÓRDENES
// ========================================

export class OrderService {
  private static instance: OrderService;

  private constructor() {}

  /**
   * Singleton pattern
   */
  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  // ========================================
  // MÉTODOS PRINCIPALES
  // ========================================

  /**
   * Crea una orden desde el carrito actual
   */
  async createOrderFromCart(data: CreateOrderData): Promise<Order> {
    try {
      console.log('📦 Creando orden desde carrito:', data);
      const response = await apiClient.post<Order>(ORDER_ENDPOINTS.ORDERS, data);
      console.log('✅ Orden creada:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error al crear orden:', error);
      console.error('❌ Detalles del error:', error.response?.data);
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.cart_uuid?.[0]
        || error.response?.data?.shipping_address?.[0]
        || error.message 
        || 'Error al crear la orden';
      throw new Error(errorMessage);
    }
  }

  /**
   * Obtiene el historial de órdenes del usuario actual
   */
  async getMyOrders(): Promise<Order[]> {
    try {
      const response = await apiClient.get<OrderListResponse>(ORDER_ENDPOINTS.ORDERS);
      return response.results || [];
    } catch (error: any) {
      console.error('❌ Error al obtener órdenes:', error);
      throw new Error('Error al cargar el historial de órdenes');
    }
  }

  /**
   * Obtiene el detalle de una orden específica
   */
  async getOrderDetail(orderUuid: string): Promise<Order> {
    try {
      return await apiClient.get<Order>(ORDER_ENDPOINTS.ORDER_DETAIL(orderUuid));
    } catch (error: any) {
      console.error('❌ Error al obtener detalle de orden:', error);
      throw new Error('Error al cargar los detalles de la orden');
    }
  }

  /**
   * Cancela una orden
   */
  async cancelOrder(orderUuid: string, reason?: string): Promise<Order> {
    try {
      return await apiClient.post<Order>(ORDER_ENDPOINTS.ORDER_CANCEL(orderUuid), {
        notes: reason
      });
    } catch (error: any) {
      console.error('❌ Error al cancelar orden:', error);
      throw new Error('Error al cancelar la orden');
    }
  }
}

// ========================================
// EXPORTACIÓN SINGLETON
// ========================================

export const orderService = OrderService.getInstance();
