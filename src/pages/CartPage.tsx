// src/pages/CartPage.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/stores';
import { cartService } from '../features/products/services/cartService';
import warehouseService, {
  type WarehouseAssignment,
  type WarehouseLocation,
} from '../shared/services/warehouseService';


type Cart = Awaited<ReturnType<typeof cartService.getCart>>;
type CartItem = Cart['items'][number];

const toNumber = (value: number | string | undefined | null): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatCurrency = (value: number | string, currency = 'COP') => {
  const numeric = toNumber(value);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(numeric);
};

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = (
    user?.profile?.role ||
    (user as any)?.role ||
    'seller'
  ) as string;


  const isExecutive = userRole === 'seller_executive';
  const sellerCanDiscount = isExecutive;
  

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [assignments, setAssignments] = useState<WarehouseAssignment[]>([]);
  const [locationCandidates, setLocationCandidates] = useState<WarehouseAssignment[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | ''>('');
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
  const [discountInputs, setDiscountInputs] = useState<Record<string, string>>({});

  const items = cart?.items ?? [];
  const hasItems = items.length > 0;
  const currencyCode = cart?.currency ?? 'COP';
  const getDisplayUnitPrice = useCallback(
    (item: CartItem) => {
      const sourceValue = item.current_price ?? item.unit_price ?? item.base_unit_price;
      return toNumber(sourceValue);
    },
    []
  );

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cartService.getCart();
      setCart(data);
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      alert('No se pudo cargar el carrito');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    try {
      setAssignmentsLoading(true);
      const data = await warehouseService.getMyWarehouseAssignments();
      setAssignments(data);
    if (data.length === 1) {
      setSelectedLocation(data[0].warehouse ?? data[0].id);
    }

    setLocationCandidates(data);

    if (!data.length && userRole === 'seller_tt') {
      try {
        const locations = await warehouseService.getLocations();
        const fallbackAssignments = locations.map((location) => ({
          id: location.id,
          user: user?.id ?? 0,
          user_username: user?.username ?? '',
          user_email: user?.email ?? '',
          warehouse: location.id,
          warehouse_details: location,
          role: 0,
          role_details: undefined as any,
          assigned_date: new Date().toISOString(),
          assigned_by: null,
          assigned_by_username: '',
          is_active: true,
        }));
        setLocationCandidates(fallbackAssignments);
        if (fallbackAssignments.length === 1) {
          setSelectedLocation(fallbackAssignments[0].warehouse ?? fallbackAssignments[0].id);
        }
      } catch (error) {
        console.warn('No se pudieron cargar las ubicaciones alternativas:', error);
      }
    }
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();
    void loadAssignments();
  }, [loadCart, loadAssignments]);

  useEffect(() => {
    if (!hasItems) {
      setQuantityInputs({});
      setDiscountInputs({});
      return;
    }

    const nextQty: Record<string, string> = {};
    const nextDiscount: Record<string, string> = {};

    items.forEach((item) => {
      const key = item.product_bar_code || item.product_code || String(item.id);
      nextQty[key] = String(item.quantity ?? 0);
      nextDiscount[key] = String(item.additional_discount_percent ?? 0);
    });

    setQuantityInputs(nextQty);
    setDiscountInputs(nextDiscount);
  }, [hasItems, items]);

  const handleRemoveItem = async (barCode: string) => {
    try {
      await cartService.removeCartItem(barCode);
      await loadCart();
    } catch (error) {
      console.error('Error eliminando item:', error);
      alert('No se pudo eliminar el producto');
    }
  };

  const handleClearCart = async () => {
    if (!confirm('¿Estás seguro de que deseas vaciar el carrito?')) return;
    try {
      await cartService.clearCart();
      await loadCart();
    } catch (error) {
      console.error('Error vaciando carrito:', error);
      alert('No se pudo vaciar el carrito');
    }
  };

  const handleUpdateQuantity = async (barCode: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(barCode);
      return;
    }

    try {
      await cartService.updateCartItem(barCode, { quantity: newQuantity });
      await loadCart();
    } catch (error) {
      console.error('Error actualizando cantidad:', error);
      alert('No se pudo actualizar la cantidad');
    }
  };

  const commitQuantityChange = (key: string, rawValue: string, current: number) => {
    const parsed = parseInt(rawValue, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setQuantityInputs((prev) => ({ ...prev, [key]: String(current) }));
      return;
    }
    if (parsed === current) return;
    void handleUpdateQuantity(key, parsed);
  };

  const handleDiscountChange = async (key: string, quantity: number, rawValue: string) => {
    if (!sellerCanDiscount) return;
    const capped = Math.max(0, Math.min(20, Math.round(Number(rawValue) || 0)));
    setDiscountInputs((prev) => ({ ...prev, [key]: String(capped) }));
    try {
      await cartService.updateCartItem(key, {
        quantity,
        additional_discount_percent: capped,
      });
      await loadCart();
    } catch (error) {
      console.error('Error al aplicar descuento:', error);
      alert('No se pudo actualizar el descuento');
      const fallback = items.find(
        (item) => (item.product_bar_code || item.product_code || String(item.id)) === key
      );
      setDiscountInputs((prev) => ({
        ...prev,
        [key]: String(fallback?.additional_discount_percent ?? 0),
      }));
    }
  };

  const handleCreateOrder = async () => {
    if (!cart?.cart_uuid) {
      alert('El carrito es inválido');
      return;
    }
    if (!hasItems) {
      alert('El carrito está vacío');
      return;
    }
    if (!selectedLocation || typeof selectedLocation !== 'number') {
      alert('Debes seleccionar una ubicación para crear la orden');
      return;
    }

    try {
      setCreatingOrder(true);
      const order = await cartService.createOrderFromActiveCart({
        shipping_address: 'Retiro en bodega',
        location_id: selectedLocation,
      });
      const shortCode = String(order?.order_uuid || '').slice(0, 8);
      alert(`✅ Orden ${shortCode ? `#${shortCode}` : ''} creada exitosamente`);
      const role = user?.profile?.role;
      navigate(role === 'seller_tt' ? '/seller-tat' : '/seller', { replace: true });
    } catch (error: any) {
      console.error('Error al crear orden:', error);
      alert(error?.message || 'No se pudo crear la orden');
    } finally {
      setCreatingOrder(false);
    }
  };

  const summarySubtotal = useMemo(() => {
    const apiValue = cart?.subtotal;
    if (apiValue !== undefined && apiValue !== null) return toNumber(apiValue);
    return items.reduce((sum, item) => {
      const fallback = getDisplayUnitPrice(item) * toNumber(item.quantity);
      return sum + toNumber(item.line_subtotal ?? fallback);
    }, 0);
  }, [cart?.subtotal, items, getDisplayUnitPrice]);

  const summaryDiscount = useMemo(() => {
    const apiValue = cart?.total_discount;
    if (apiValue !== undefined && apiValue !== null) return toNumber(apiValue);
    return items.reduce((sum, item) => {
      const fallback = toNumber(item.additional_discount_amount) * toNumber(item.quantity);
      return sum + Math.max(toNumber(item.line_discount ?? fallback), 0);
    }, 0);
  }, [cart?.total_discount, items]);

  const summaryTotal = useMemo(() => {
    const apiValue = cart?.total_amount;
    if (apiValue !== undefined && apiValue !== null) return toNumber(apiValue);
    return items.reduce((sum, item) => {
      const fallback = getDisplayUnitPrice(item) * toNumber(item.quantity);
      return sum + toNumber(item.line_total ?? item.total_price ?? fallback);
    }, 0);
  }, [cart?.total_amount, items, getDisplayUnitPrice]);

  const getItemCount = () => cart?.total_items ?? items.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-gray-600 text-lg">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/seller')}
              className="text-gray-600 hover:text-gray-900 text-2xl"
              aria-label="Volver"
            >
              ←
            </button>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Mi carrito</p>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                Productos seleccionados
                <span className="text-lg bg-blue-600 text-white px-3 py-1 rounded-full">
                  {getItemCount()} items
                </span>
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/seller')}
            className="hidden sm:inline-flex text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Seguir comprando →
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasItems ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-8xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h2>
            <p className="text-gray-600 mt-2">Agrega productos para comenzar a crear tu orden.</p>
            <button
              onClick={() => navigate('/seller')}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Explorar catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Productos ({items.length})
                  </h2>
                  <button
                    onClick={handleClearCart}
                    className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-2"
                  >
                    🗑️ Vaciar carrito
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item) => {
                    const key = item.product_bar_code || item.product_code || String(item.id);
                    const quantity = toNumber(item.quantity);
                    const baseUnitPrice = toNumber(item.base_unit_price ?? item.unit_price);
                    const unitPrice = getDisplayUnitPrice(item);
                    const discountAmount = toNumber(
                      item.line_discount ?? toNumber(item.additional_discount_amount) * quantity
                    );
                    const lineTotal = toNumber(item.line_total ?? item.total_price ?? unitPrice * quantity);
                    const discountPercent = discountInputs[key] ?? String(item.additional_discount_percent ?? 0);

                    return (
                      <article
                        key={item.id}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 bg-blue-50 rounded-lg flex items-center justify-center text-3xl">
                            📦
                          </div>

                          <div className="flex-1 space-y-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{item.product_name}</h3>
                              <p className="text-xs text-gray-500 font-mono">
                                {item.product_bar_code || item.product_code}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const next = quantity - 1;
                                    setQuantityInputs((prev) => ({ ...prev, [key]: String(Math.max(next, 0)) }));
                                    void handleUpdateQuantity(key, next);
                                  }}
                                  className="w-8 h-8 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-red-50 hover:border-red-400 text-gray-700 hover:text-red-600 transition-colors font-bold"
                                  aria-label="Disminuir cantidad"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={quantityInputs[key] ?? String(quantity)}
                                  onChange={(e) => {
                                    const sanitized = e.target.value.replace(/[^0-9]/g, '');
                                    setQuantityInputs((prev) => ({ ...prev, [key]: sanitized }));
                                  }}
                                  onBlur={(e) => commitQuantityChange(key, e.target.value, quantity)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      commitQuantityChange(key, (e.target as HTMLInputElement).value, quantity);
                                    }
                                  }}
                                  className="w-16 text-center text-lg font-bold text-gray-900 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => {
                                    const next = quantity + 1;
                                    setQuantityInputs((prev) => ({ ...prev, [key]: String(next) }));
                                    void handleUpdateQuantity(key, next);
                                  }}
                                  className="w-8 h-8 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-green-50 hover:border-green-400 text-gray-700 hover:text-green-600 transition-colors font-bold"
                                  aria-label="Aumentar cantidad"
                                >
                                  +
                                </button>
                              </div>

                              <div className="text-sm text-gray-600 leading-5">
                                <p>
                                  <span className="text-gray-500">Costo:</span>{' '}
                                  {formatCurrency(baseUnitPrice, currencyCode)}
                                </p>
                               
                              </div>
                            </div>

                            {isExecutive && (
                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                                  <span className="font-medium text-gray-600">💰 Desc. adicional:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="1"
                                    value={discountPercent}
                                    onChange={(e) => {
                                      const val = Math.max(0, Math.min(20, parseInt(e.target.value || '0', 10)));
                                      setDiscountInputs((prev) => ({ ...prev, [key]: String(val) }));
                                    }}
                                    onBlur={(e) => handleDiscountChange(key, quantity, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        void handleDiscountChange(key, quantity, (e.target as HTMLInputElement).value);
                                      }
                                    }}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-500">%</span>
                                  {discountAmount > 0 && (
                                    <span className="text-xs text-green-600 font-semibold">
                                      −{formatCurrency(discountAmount, currencyCode)}
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>

                          <div className="text-right">
                            <p className="text-xs uppercase text-gray-500 tracking-wide">Total línea</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatCurrency(lineTotal, currencyCode)}
                            </p>
                            <button
                              onClick={() => handleRemoveItem(key)}
                              className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4 space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Resumen de orden</h2>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Ubicación de entrega <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : '')}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">
                      {assignmentsLoading ? 'Cargando ubicaciones...' : 'Selecciona una ubicación'}
                    </option>
                    {(locationCandidates.length ? locationCandidates : assignments).map((assignment) => (
                      <option
                        key={assignment.id ?? assignment.warehouse}
                        value={assignment.warehouse ?? assignment.id}
                      >
                        {(assignment.warehouse_details?.name ||
                          assignment.role_details?.name ||
                          'Ubicación') +
                          ' (' +
                          (assignment.warehouse_details?.code ||
                            assignment.warehouse ||
                            assignment.id) +
                          ')'}
                      </option>
                    ))}
                  </select>
                  {!assignmentsLoading && !selectedLocation && (
                    <p className="text-xs text-red-600 mt-1">
                      Debes elegir dónde se entregará la orden.
                    </p>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg space-y-1">
                  <p className="text-sm font-semibold text-gray-700">👤 Vendedor</p>
                  <p className="text-sm text-gray-900">{user?.username ?? 'Usuario'}</p>
                  {user?.email && <p className="text-xs text-gray-500">{user.email}</p>}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      {formatCurrency(summarySubtotal, currencyCode)}
                    </span>
                  </div>
                  {summaryDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento:</span>
                      <span className="font-semibold">
                        −{formatCurrency(summaryDiscount, currencyCode)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>Impuestos:</span>
                    <span className="font-semibold">$0</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-200 pt-3">
                    <span>Total:</span>
                    <span className="text-blue-600">
                      {formatCurrency(summaryTotal, currencyCode)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCreateOrder}
                  disabled={creatingOrder || !selectedLocation}
                  className="w-full py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  {creatingOrder ? 'Creando orden…' : 'Confirmar orden'}
                </button>
                <button
                  onClick={() => navigate('/seller')}
                  className="w-full py-3 rounded-lg text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Seguir comprando
                </button>

                <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-3">
                  💡 Recuerda confirmar tu ubicación para garantizar que los productos se preparen en la bodega
                  correcta.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default CartPage;
