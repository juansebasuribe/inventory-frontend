// src/features/products/services/cartService.ts


import { apiClient } from '../../../shared/services';

// ========================================
// INTERFACES Y TIPOS
// ========================================

interface CartItem {
  id: number;
  product?: number;
  product_code?: string;
  product_bar_code?: string;
  product_name: string;
  quantity: number;
  base_unit_price: number | string;
  unit_price: number | string;
  additional_discount_percent: number | string;
  additional_discount_amount: number | string;
  line_subtotal: number | string;
  line_discount: number | string;
  line_total: number | string;
  total_price: number | string;
  updated_date?: string;
}

interface Cart {
  id: number;
  cart_uuid: string;  // ✅ UUID del carrito para crear órdenes
  user_id: number;
  items: CartItem[];
  total_items: number;
  subtotal: number | string;
  total_discount: number | string;
  taxes?: number;
  total_amount: number | string;
  currency?: string;
  created_date: string;
  updated_date: string;
}

interface AddToCartData {
  bar_code: string;  // ✅ El backend espera bar_code, no product_code
  quantity: number;
  // Para vendedores ejecutivos, el backend acepta 'custom_price'
  custom_price?: number;
}

interface UpdateCartItemData {
  quantity: number;
  discount_percentage?: number;
  additional_discount_percent?: number;  // ✅ Descuento adicional del vendedor
}

interface CartSummary {
  total_items: number;
  subtotal: number | string;
  total_discount: number | string;
  taxes: number;
  total_amount: number | string;
  currency: string;
}

interface CartValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  unavailable_items: CartItem[];
}

// ========================================
// ENDPOINTS
// ========================================

const CART_ENDPOINTS = {
  CART: '/api/cart/v1/',                    // CartDetailView - corregido
  CART_ITEMS: '/api/cart/v1/items/',        // CartItemsListView
  CART_ITEM_DETAIL: (barCode: string) => `/api/cart/v1/items/by-barcode/${barCode}/`, // ✅ Usa bar_code
  CART_CLEAR: '/api/cart/v1/items/clear/',  // CartClearView
  CART_ADD_ITEM: '/api/cart/v1/items/add/', // CartAddItemView
  CART_SUMMARY: '/api/cart/v1/summary/',    // CartSummaryView
  CART_VALIDATE: '/api/cart/v1/validate/',
  CART_APPLY_DISCOUNT: '/api/cart/v1/apply-discount/',
  CART_REMOVE_DISCOUNT: '/api/cart/v1/remove-discount/',
} as const;

// ========================================
// SERVICIO DEL CARRITO
// ========================================

export class CartService {
  private static instance: CartService;

  private constructor() {}

  /**
   * Singleton pattern para instancia única
   */
  static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  // ========================================
  // MÉTODOS PRINCIPALES DEL CARRITO
  // ========================================

  /**
   * Obtiene el carrito actual del usuario
   */
  async getCart(): Promise<Cart> {
    try {
      return await apiClient.get<Cart>(CART_ENDPOINTS.CART);
    } catch (error) {
      console.error('Error al obtener carrito:', error);
      throw new Error('Error al cargar el carrito');
    }
  }

  /**
   * Obtiene solo los items del carrito
   */
  async getCartItems(): Promise<CartItem[]> {
    try {
      return await apiClient.get<CartItem[]>(CART_ENDPOINTS.CART_ITEMS);
    } catch (error) {
      console.error('Error al obtener items del carrito:', error);
      throw new Error('Error al cargar los items del carrito');
    }
  }

  /**
   * Agrega un producto al carrito
   */
  async addToCart(itemData: AddToCartData): Promise<CartItem> {
    try {
      return await apiClient.post<CartItem>(
        CART_ENDPOINTS.CART_ADD_ITEM,  // Usar endpoint específico para agregar
        itemData
      );
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      throw new Error('Error al agregar el producto al carrito');
    }
  }

  /**
   * Actualiza un item del carrito usando bar_code
   */
  async updateCartItem(barCode: string, updateData: UpdateCartItemData): Promise<CartItem> {
    try {
      return await apiClient.put<CartItem>(
        CART_ENDPOINTS.CART_ITEM_DETAIL(barCode),
        updateData
      );
    } catch (error) {
      console.error('Error al actualizar item del carrito:', error);
      throw new Error('Error al actualizar el item del carrito');
    }
  }

  /**
   * Elimina un item del carrito usando bar_code
   */
  async removeCartItem(barCode: string): Promise<void> {
    try {
      await apiClient.delete(CART_ENDPOINTS.CART_ITEM_DETAIL(barCode));
    } catch (error) {
      console.error('Error al eliminar item del carrito:', error);
      throw new Error('Error al eliminar el item del carrito');
    }
  }

  /**
   * Vacía completamente el carrito
   */
  async clearCart(): Promise<void> {
    try {
      await apiClient.post(CART_ENDPOINTS.CART_CLEAR);
    } catch (error) {
      console.error('Error al vaciar carrito:', error);
      throw new Error('Error al vaciar el carrito');
    }
  }

  /**
   * Cierra el carrito activo y crea una orden (requiere location_id)
   */
  async createOrderFromActiveCart(data: { shipping_address: string; location_id: number }): Promise<any> {
    try {
      const endpoint = '/api/cart/v1/cart/close-and-create-order/';
      return await apiClient.post<any>(endpoint, data);
    } catch (error: any) {
      console.error('Error al crear orden desde carrito:', error);
      const msg = error?.message || error?.response?.data?.detail || 'Error al crear la orden desde el carrito';
      throw new Error(msg);
    }
  }

  // ========================================
  // MÉTODOS DE VALIDACIÓN
  // ========================================

  /**
   * Valida el carrito antes del checkout
   */
  async validateCart(): Promise<CartValidationResult> {
    try {
      return await apiClient.get<CartValidationResult>(
        CART_ENDPOINTS.CART_VALIDATE
      );
    } catch (error) {
      console.error('Error al validar carrito:', error);
      throw new Error('Error al validar el carrito');
    }
  }

  // ========================================
  // MÉTODOS DE DESCUENTOS
  // ========================================

  /**
   * Aplica un descuento al carrito
   */
  async applyDiscount(discountCode: string): Promise<Cart> {
    try {
      return await apiClient.post<Cart>(
        CART_ENDPOINTS.CART_APPLY_DISCOUNT,
        { discount_code: discountCode }
      );
    } catch (error) {
      console.error('Error al aplicar descuento:', error);
      throw new Error('Error al aplicar el descuento');
    }
  }

  /**
   * Remueve el descuento del carrito
   */
  async removeDiscount(): Promise<Cart> {
    try {
      return await apiClient.post<Cart>(CART_ENDPOINTS.CART_REMOVE_DISCOUNT);
    } catch (error) {
      console.error('Error al remover descuento:', error);
      throw new Error('Error al remover el descuento');
    }
  }

  // ========================================
  // MÉTODOS DE CÁLCULO
  // ========================================

  /**
   * Obtiene resumen de totales del carrito
   */
  async getCartSummary(): Promise<CartSummary> {
    try {
      const cart = await this.getCart();
      return {
        total_items: cart.total_items,
        subtotal: cart.subtotal,
        total_discount: cart.total_discount,
        taxes: cart.taxes,
        total_amount: cart.total_amount,
        currency: cart.currency,
      };
    } catch (error) {
      console.error('Error al obtener resumen del carrito:', error);
      throw new Error('Error al obtener el resumen del carrito');
    }
  }

  /**
   * Calcula el total de items en el carrito
   */
  async getCartItemsCount(): Promise<number> {
    try {
      const items = await this.getCartItems();
      return items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      console.error('Error al contar items del carrito:', error);
      return 0;
    }
  }

  // ========================================
  // MÉTODOS UTILITARIOS
  // ========================================

  /**
   * Verifica si un producto está en el carrito
   */
  async isProductInCart(productCode: string): Promise<boolean> {
    try {
      const items = await this.getCartItems();
      return items.some(item => (item.product_code || item.product_bar_code) === productCode);
    } catch (error) {
      console.error('Error al verificar producto en carrito:', error);
      return false;
    }
  }

  /**
   * Obtiene un item específico del carrito por código de producto
   */
  async getCartItemByProduct(productCode: string): Promise<CartItem | null> {
    try {
      const items = await this.getCartItems();
      return items.find(item => (item.product_code || item.product_bar_code) === productCode) || null;
    } catch (error) {
      console.error('Error al obtener item del carrito:', error);
      return null;
    }
  }

  /**
   * Incrementa la cantidad de un producto en el carrito
   */
  async incrementQuantity(productCode: string, increment: number = 1): Promise<CartItem> {
    try {
      const existingItem = await this.getCartItemByProduct(productCode);
      
      if (existingItem) {
        // ✅ Usar product_code del item para actualizar
        const barCode = existingItem.product_bar_code || existingItem.product_code;
        return await this.updateCartItem(barCode, {
          quantity: existingItem.quantity + increment
        });
      } else {
        return await this.addToCart({
          bar_code: productCode,  // ✅ Cambio product_code → bar_code
          quantity: increment
        });
      }
    } catch (error) {
      console.error('Error al incrementar cantidad:', error);
      throw new Error('Error al incrementar la cantidad del producto');
    }
  }

  /**
   * Decrementa la cantidad de un producto en el carrito
   */
  async decrementQuantity(productCode: string, decrement: number = 1): Promise<CartItem | null> {
    try {
      const existingItem = await this.getCartItemByProduct(productCode);
      
      if (!existingItem) {
        throw new Error('Producto no encontrado en el carrito');
      }

      const newQuantity = existingItem.quantity - decrement;
      const barCode = existingItem.product_bar_code || existingItem.product_code;
      
      if (newQuantity <= 0) {
        await this.removeCartItem(barCode);
        return null;
      } else {
        return await this.updateCartItem(barCode, {
          quantity: newQuantity
        });
      }
    } catch (error) {
      console.error('Error al decrementar cantidad:', error);
      throw new Error('Error al decrementar la cantidad del producto');
    }
  }

  /**
   * Establece una cantidad específica para un producto
   */
  async setQuantity(productCode: string, quantity: number): Promise<CartItem | null> {
    try {
      if (quantity <= 0) {
        const existingItem = await this.getCartItemByProduct(productCode);
        if (existingItem) {
          const barCode = existingItem.product_bar_code || existingItem.product_code;
          await this.removeCartItem(barCode);
        }
        return null;
      }

      const existingItem = await this.getCartItemByProduct(productCode);
      
      if (existingItem) {
        const barCode = existingItem.product_bar_code || existingItem.product_code;
        return await this.updateCartItem(barCode, { quantity });
      } else {
        return await this.addToCart({
          bar_code: productCode,  // ✅ Cambio product_code → bar_code
          quantity
        });
      }
    } catch (error) {
      console.error('Error al establecer cantidad:', error);
      throw new Error('Error al establecer la cantidad del producto');
    }
  }
}

// ========================================
// EXPORTACIÓN SINGLETON
// ========================================

export const cartService = CartService.getInstance();

// ========================================
// EXPORTAR TIPOS PARA OTROS MÓDULOS
// ========================================

export type { Cart, CartItem, CartSummary, CartValidationResult };
