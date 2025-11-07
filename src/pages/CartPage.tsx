// src/pages/CartPage.tsx

/**
 * Página del Carrito de Compras
 * Vista completa del carrito con gestión de items y creación de órdenes
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/stores';
import { cartService } from '../features/products/services/cartService';
import warehouseService, { type WarehouseAssignment } from '../shared/services/warehouseService';

// Usar tipos del servicio
type Cart = Awaited<ReturnType<typeof cartService.getCart>>;

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [assignments, setAssignments] = useState<WarehouseAssignment[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | ''>('');
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  useEffect(() => {
    loadCart();
    loadAssignments();
    console.log('👤 Usuario en CartPage:', user);
    console.log('📧 Email:', user?.email);
    console.log('👨 First name:', user?.first_name);
  }, [user]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await cartService.getCart();
      console.log('🛒 Datos del carrito:', cartData);
      console.log('📊 Items:', cartData.items);
      console.log('💰 Total amount:', cartData.total_amount);
      console.log('🔢 Total items:', cartData.total_items);
      setCart(cartData);
    } catch (error) {
      console.error('Error al cargar carrito:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (barCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(barCode);
      return;
    }

    try {
      await cartService.updateCartItem(barCode, { 
        quantity: newQuantity
      });
      await loadCart();
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      alert('Error al actualizar la cantidad');
    }
  };

  const handleUpdateDiscount = async (barCode: string, currentQuantity: number, newDiscount: number) => {
    // Capar a 0-20%
    const capped = Math.max(0, Math.min(20, Math.round(newDiscount)));
    setDiscountInputs(prev => ({ ...prev, [barCode]: String(capped) }));
    // Nota: El backend actual no procesa descuentos adicionales por item.
    // Solo refrescamos el carrito para mantener consistencia visual.
    await loadCart();
  };

  const loadAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      const data = await warehouseService.getMyWarehouseAssignments();
      setAssignments(data);
      // Seleccionar por defecto si hay una sola
      if (data && data.length === 1) {
        setSelectedLocation(data[0].warehouse);
      }
    } catch (error) {
      console.error('Error al cargar asignaciones de bodega:', error);
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const [discountInputs, setDiscountInputs] = React.useState<Record<string, string>>({});

  const handleRemoveItem = async (barCode: string) => {
    try {
      await cartService.removeCartItem(barCode);
      await loadCart();
    } catch (error) {
      console.error('Error al eliminar item:', error);
      alert('Error al eliminar el producto');
    }
  };

  const handleClearCart = async () => {
    if (!confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      return;
    }

    try {
      await cartService.clearCart();
      await loadCart();
    } catch (error) {
      console.error('Error al limpiar carrito:', error);
      alert('Error al vaciar el carrito');
    }
  };

  const handleCreateOrder = async () => {
    if (!cart?.cart_uuid) {
      alert('Error: Carrito no válido');
      return;
    }

    if (!cart.items || cart.items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    if (!selectedLocation || typeof selectedLocation !== 'number') {
      alert('Debes seleccionar una bodega/ubicación para crear la orden');
      return;
    }

    try {
      setCreatingOrder(true);

      const order = await cartService.createOrderFromActiveCart({
        shipping_address: 'Retiro en bodega',
        location_id: selectedLocation
      });

      const orderCode = (order?.order_uuid || '').toString();
      const shortCode = orderCode ? orderCode.slice(0, 8) : '';
      alert(`✅ Orden ${shortCode ? '#' + shortCode + ' ' : ''}creada exitosamente!`);
      
      // Redirigir al dashboard del vendedor
      // Redirigir según rol
      const role = user?.profile?.role;
      if (role === 'seller_tt') {
        navigate('/seller-tat', { replace: true });
      } else {
        navigate('/seller', { replace: true });
      }
      
    } catch (error: any) {
      console.error('Error al crear orden:', error);
      alert(`Error al crear orden: ${error.message}`);
    } finally {
      setCreatingOrder(false);
    }
  };

  const calculateTotal = () => {
    // Calcular desde items (más confiable)
    if (!cart?.items || cart.items.length === 0) return 0;
    
    const total = cart.items.reduce((sum, item) => {
      const itemTotal = Number(item.total_price) || (item.unit_price * item.quantity) || 0;
      console.log(`Item ${item.product_name}: ${itemTotal}`);
      return sum + itemTotal;
    }, 0);
    
    console.log('💰 Total calculado:', total);
    // Redondear a 2 decimales
    return Math.round(total * 100) / 100;
  };

  const calculateSubtotalWithoutDiscount = () => {
    // Subtotal base sin descuentos (estimado):
    // - seller_tt: retail estimado = unit_price / 0.8
    // - otros: retail = unit_price
    if (!cart?.items || cart.items.length === 0) return 0;
    const role = user?.profile?.role;
    const subtotal = cart.items.reduce((sum, item: any) => {
      const unit = Number(item.unit_price) || 0;
      const qty = Number(item.quantity) || 0;
      const estimatedRetail = role === 'seller_tt' ? unit / 0.8 : unit;
      return sum + estimatedRetail * qty;
    }, 0);
    return Math.round(subtotal * 100) / 100;
  };

  const calculateTotalDiscount = () => {
    // Calcular el descuento total aplicado
    const subtotal = calculateSubtotalWithoutDiscount();
    const total = calculateTotal();
    return Math.round((subtotal - total) * 100) / 100;
  };

  const formatCurrency = (value: number) => {
    // Formatear con separador de miles y máximo 2 decimales
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Estado local para inputs de cantidad
  const [quantityInputs, setQuantityInputs] = React.useState<Record<string, string>>({});

  const getItemCount = () => {
    const count = cart?.total_items || cart?.items?.length || 0;
    console.log('🔢 Item count:', count);
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/seller')}
                className="text-gray-600 hover:text-gray-900"
              >
                <span className="text-2xl">←</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  🛒 Mi Carrito
                  <span className="text-lg bg-blue-600 text-white px-3 py-1 rounded-full">
                    {getItemCount()} items
                  </span>
                </h1>
                <p className="text-gray-600 mt-1">Revisa y confirma tu orden de compra</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!cart?.items || cart.items.length === 0 ? (
          // Carrito vacío
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-8xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-600 mb-6">Agrega productos para comenzar a crear tu orden</p>
            <button
              onClick={() => navigate('/seller')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Ver Productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Productos ({cart.items.length})
                  </h2>
                  {cart.items.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      🗑️ Vaciar carrito
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icono */}
                        <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-3xl">📦</span>
                        </div>

                        {/* Info del producto */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.product_name}
                          </h3>
                          <p className="text-sm text-gray-500 font-mono mb-3">
                            {item.product_bar_code || item.product_code}
                          </p>

                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.product_bar_code || item.product_code, item.quantity - 1)}
                                className="w-8 h-8 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-red-50 hover:border-red-400 text-gray-700 hover:text-red-600 transition-colors font-bold"
                              >
                                −
                              </button>
                              <span className="w-16 text-center text-lg font-bold text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.product_bar_code || item.product_code, item.quantity + 1)}
                                className="w-8 h-8 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-green-50 hover:border-green-400 text-gray-700 hover:text-green-600 transition-colors font-bold"
                              >
                                +
                              </button>
                            </div>

                            <div className="text-sm text-gray-600">
                              ${formatCurrency(item.unit_price)} c/u
                            </div>
                          </div>

                          {/* Campo de descuento adicional */}
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 font-medium">
                              💰 Desc. adicional:
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="1"
                              value={discountInputs[item.product_bar_code || item.product_code] ?? 0}
                              onChange={(e) => {
                                // Solo actualizar el estado local mientras escribe
                                const barCode = item.product_bar_code || item.product_code;
                                const val = Math.max(0, Math.min(20, parseInt(e.target.value || '0', 10)));
                                setDiscountInputs(prev => ({ ...prev, [barCode]: String(val) }));
                              }}
                              onBlur={(e) => {
                                // Cuando pierde el foco, enviar al servidor
                                const newDiscount = Math.max(0, Math.min(20, parseInt(e.target.value || '0', 10)));
                                handleUpdateDiscount(item.product_bar_code || item.product_code, item.quantity, newDiscount);
                              }}
                              onKeyPress={(e) => {
                                // También actualizar al presionar Enter
                                if (e.key === 'Enter') {
                                  const val = Math.max(0, Math.min(20, parseInt((e.target as HTMLInputElement).value || '0', 10)));
                                  handleUpdateDiscount(item.product_bar_code || item.product_code, item.quantity, val);
                                  (e.target as HTMLInputElement).blur(); // Quitar el foco
                                }
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              placeholder="0"
                            />
                            <span className="text-sm text-gray-600">%</span>
                            {Number(discountInputs[item.product_bar_code || item.product_code] || 0) > 0 && (
                              <span className="text-xs text-green-600 font-medium">
                                (-${formatCurrency((Number(discountInputs[item.product_bar_code || item.product_code] || 0) / 100) * Number(item.unit_price) * item.quantity)})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Precio y eliminar */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            ${formatCurrency(Number(item.total_price) || 0)}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.product_bar_code || item.product_code)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Resumen de Orden
                </h2>

                {/* Selección de ubicación requerida */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación de entrega <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{assignmentsLoading ? 'Cargando ubicaciones...' : 'Seleccione una ubicación'}</option>
                    {Array.isArray(assignments) && assignments.length > 0 && assignments.map((a: any) => (
                      <option key={a.id ?? a.warehouse} value={a.warehouse ?? a.id}>
                        {(a.warehouse_details?.name || a.location_name || 'Ubicación')} ({a.warehouse_details?.code || a.location_code || a.warehouse || a.id})
                      </option>
                    ))}
                  </select>
                  {!selectedLocation && !assignmentsLoading && (
                    <p className="mt-2 text-xs text-red-600">Debe seleccionar una ubicación para crear la orden.</p>
                  )}
                </div>

                {/* Información del vendedor */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">👤 Vendedor</h3>
                  {user ? (
                    <>
                      <p className="text-sm text-gray-900 font-medium">{user.username}</p>
                      {user.email && (
                        <p className="text-xs text-gray-600 mt-1">{user.email}</p>
                      )}
                      {user.first_name && (
                        <p className="text-xs text-gray-600 mt-1">{user.first_name} {user.last_name}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Cargando información...</p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${formatCurrency(calculateSubtotalWithoutDiscount())}</span>
                  </div>
                  {calculateTotalDiscount() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>💰 Descuento:</span>
                      <span className="font-semibold">-${formatCurrency(calculateTotalDiscount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>Impuestos:</span>
                    <span className="font-semibold">$0</span>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-3 flex justify-between text-xl font-bold text-gray-900">
                    <span>Total:</span>
                    <span className="text-blue-600">${formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleCreateOrder}
                    disabled={creatingOrder || !selectedLocation}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-4 rounded-lg text-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
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

                  <button
                    onClick={() => navigate('/seller')}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    ← Continuar comprando
                  </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Nota:</strong> Los productos se entregarán en la bodega asignada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
