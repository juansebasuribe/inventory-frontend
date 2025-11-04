// src/features/cart/components/CartSidebar.tsx

/**
 * Componente CartSidebar - Sidebar del carrito de compras
 * Muestra items del carrito y permite gestión rápida
 * FASE 7.3 - Componentes UI Profesionales
 */

import React, { useState, useEffect } from 'react';
import { cartService, type Cart } from '../../products/services/cartService';
import { orderService } from '../../order/services/orderService';

// Importar la interface CartItem del servicio para evitar conflictos
type CartItemFromService = {
  id: number;
  product: number;
  product_name: string;
  product_bar_code: string;
  quantity: number;
  unit_price: number;
  get_total_price: number;
};

interface CartSummary {
  total_items: number;
  subtotal: number;
  total_discount: number;
  taxes: number;
  total_amount: number;
  currency?: string;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
  onItemUpdate?: (item: CartItemFromService) => void;
  onItemRemove?: (itemId: number) => void;
  onCartChange?: () => void;  // ✅ Nuevo callback para actualizar contador
  className?: string;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  onCheckout,
  onItemUpdate,
  onItemRemove,
  onCartChange,  // ✅ Recibir callback
  className = ''
}) => {
  // Estados
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartItems, setCartItems] = useState<CartItemFromService[]>([]);
  const [cartSummary, setCartSummary] = useState<CartSummary>({
    total_items: 0,
    subtotal: 0,
    total_discount: 0,
    taxes: 0,
    total_amount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Cargar carrito cuando se abre
  useEffect(() => {
    if (isOpen) {
      loadCartData();
    }
  }, [isOpen]);

  const loadCartData = async () => {
    try {
      setLoading(true);
      setError('');

      const cartResponse = await cartService.getCart();

      setCart(cartResponse);
      const items = (cartResponse.items || []) as any;
      setCartItems(items);
      
      // ✅ Calcular totales desde los items
      const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.get_total_price || 0), 0);
      
      setCartSummary({
        total_items: totalItems,
        subtotal: subtotal,
        total_discount: 0,
        taxes: 0,
        total_amount: subtotal
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cantidad de item
  const handleQuantityChange = async (item: CartItemFromService, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(item.product_bar_code);
      return;
    }

    try {
      await cartService.updateCartItem(item.product_bar_code, { quantity: newQuantity });
      
      // Recargar todo el carrito
      await loadCartData();
      
      // ✅ Notificar al padre para actualizar el contador
      if (onCartChange) {
        onCartChange();
      }
      
      if (onItemUpdate) {
        onItemUpdate({ ...item, quantity: newQuantity });
      }
    } catch (err: any) {
      console.error('Error al actualizar cantidad:', err);
      alert('Error al actualizar la cantidad');
    }
  };

  // Remover item del carrito
  const handleRemoveItem = async (barCode: string) => {
    try {
      await cartService.removeCartItem(barCode);
      
      // Recargar todo el carrito
      await loadCartData();
      
      // ✅ Notificar al padre para actualizar el contador
      if (onCartChange) {
        onCartChange();
      }
      
      if (onItemRemove) {
        const item = cartItems.find(i => i.product_bar_code === barCode);
        if (item) {
          onItemRemove(item.id);
        }
      }
    } catch (err: any) {
      console.error('Error al remover item:', err);
      alert('Error al eliminar el producto');
    }
  };

  // Limpiar carrito
  const handleClearCart = async () => {
    if (!confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      return;
    }

    try {
      await cartService.clearCart();
      setCartItems([]);
      setCartSummary({
        total_items: 0,
        subtotal: 0,
        total_discount: 0,
        taxes: 0,
        total_amount: 0
      });
      
      // ✅ Notificar al padre para actualizar el contador
      if (onCartChange) {
        onCartChange();
      }
    } catch (err: any) {
      console.error('Error al limpiar carrito:', err);
      alert('Error al vaciar el carrito');
    }
  };

  // ✅ Crear orden desde el carrito
  const handleCreateOrder = async () => {
    if (!cart?.cart_uuid) {
      alert('Error: No se puede crear la orden sin un carrito válido');
      return;
    }

    if (cartItems.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    try {
      setCreatingOrder(true);
      
      console.log('🛒 Cart UUID:', cart.cart_uuid);
      
      // Crear orden con el cart_uuid
      const order = await orderService.createOrderFromCart({
        cart_uuid: cart.cart_uuid,
        shipping_address: 'Retiro en bodega'  // Valor por defecto para vendedores
      });

      // Mostrar éxito
      alert(`✅ Orden #${order.order_uuid.slice(0, 8)} creada exitosamente!`);
      
      // ✅ Recargar la página inmediatamente para obtener un nuevo carrito
      // El backend creará automáticamente un nuevo carrito cuando se solicite
      window.location.reload();

    } catch (err: any) {
      console.error('❌ Error al crear orden:', err);
      alert(`Error al crear orden: ${err.message}`);
    } finally {
      setCreatingOrder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sidebar - Responsive */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[450px] md:w-[500px] lg:w-[550px] bg-white shadow-xl z-50 transform transition-transform duration-300 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            🛒 Mi Carrito
            <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full">
              {cartSummary?.total_items || 0}
            </span>
          </h2>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-white transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="m-4 sm:m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 text-sm">⚠️ {error}</div>
          </div>
        )}

        {/* Contenido del carrito */}
        {!loading && !error && (
          <>
            {/* Items del carrito */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4" style={{ height: 'calc(100vh - 260px)' }}>
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
                  <div className="text-7xl sm:text-8xl mb-4">🛒</div>
                  <div className="text-gray-600 text-xl sm:text-2xl font-semibold mb-2">
                    Tu carrito está vacío
                  </div>
                  <div className="text-gray-400 text-sm sm:text-base">
                    Agrega productos para comenzar a comprar
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        {/* Icono del producto */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-2xl sm:text-3xl">📦</span>
                        </div>

                        {/* Información del producto */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate mb-1">
                            {item.product_name}
                          </h4>
                          
                          <div className="text-xs text-gray-500 mb-2 font-mono">
                            {item.product_bar_code}
                          </div>

                          {/* Controles de cantidad */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <button
                                onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-red-50 hover:border-red-400 text-gray-700 hover:text-red-600 transition-colors font-bold"
                              >
                                −
                              </button>
                              
                              <span className="w-10 sm:w-12 text-center text-base sm:text-lg font-bold text-gray-900">
                                {item.quantity}
                              </span>
                              
                              <button
                                onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-green-50 hover:border-green-400 text-gray-700 hover:text-green-600 transition-colors font-bold"
                              >
                                +
                              </button>
                            </div>

                            {/* Botón eliminar */}
                            <button
                              onClick={() => handleRemoveItem(item.product_bar_code)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar producto"
                            >
                              <span className="text-xl">🗑️</span>
                            </button>
                          </div>

                          {/* Precios */}
                          <div className="flex justify-between items-center bg-white rounded-lg p-2">
                            <span className="text-xs sm:text-sm text-gray-600">
                              ${(item.unit_price || 0).toLocaleString()} c/u
                            </span>
                            
                            <div className="text-base sm:text-lg font-bold text-blue-600">
                              ${(item.get_total_price || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Botón limpiar carrito */}
                  {cartItems.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="w-full text-sm sm:text-base text-red-600 hover:text-red-800 hover:bg-red-50 py-3 rounded-lg transition-colors font-medium border-2 border-red-200 hover:border-red-400"
                    >
                      🗑️ Vaciar carrito
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Resumen y checkout */}
            {cartItems.length > 0 && (
              <div className="border-t-2 border-gray-200 p-4 sm:p-6 bg-gradient-to-b from-gray-50 to-white">
                {/* Resumen de precios */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600 font-medium">Subtotal:</span>
                    <span className="font-semibold">${(cartSummary?.subtotal || 0).toLocaleString()}</span>
                  </div>
                  
                  {(cartSummary?.total_discount || 0) > 0 && (
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600 font-medium">Descuentos:</span>
                      <span className="text-green-600 font-semibold">
                        -${(cartSummary?.total_discount || 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {(cartSummary?.taxes || 0) > 0 && (
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600 font-medium">Impuestos:</span>
                      <span className="font-semibold">${(cartSummary?.taxes || 0).toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg sm:text-xl font-bold border-t-2 border-gray-300 pt-3 text-gray-900">
                    <span>Total:</span>
                    <span className="text-blue-600">${(cartSummary?.total_amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Botón de checkout */}
                <button
                  onClick={handleCreateOrder}
                  disabled={creatingOrder}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 px-4 rounded-lg text-base sm:text-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {creatingOrder ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creando orden...
                    </span>
                  ) : (
                    '✅ Crear Orden de Compra'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default CartSidebar;