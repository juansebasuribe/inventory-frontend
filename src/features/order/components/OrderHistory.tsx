import React, { useState, useEffect } from 'react';
import { orderService } from '../../products/services/orderService';
import type { Order, OrderFilters } from '../../products/services/orderService';
import { useAuth } from '../../../shared/stores';

interface OrderHistoryProps {
  showFilters?: boolean;
  pageSize?: number;
  onOrderSelect?: (order: Order) => void;
  className?: string;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  showFilters = true,
  pageSize = 10,
  onOrderSelect,
  className = ''
}) => {
  const { user } = useAuth();
  const userRole = user?.profile?.role;
  const isSeller = userRole === 'seller' || userRole === 'seller_tt';
  
  // Estados
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Estados de filtros
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    page_size: pageSize
  });

  // Cargar órdenes
  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');

      // Si es seller, agregar filtro por usuario actual
      const sellerFilters: OrderFilters = isSeller 
        ? { ...filters, seller: user?.id }
        : filters;

      const response = await orderService.getOrders(sellerFilters);
      
      console.log('📦 Órdenes recibidas del backend:', response);
      console.log('📊 Total órdenes:', response.count);
      console.log('📋 Results:', response.results);
      console.log('👤 Usuario actual:', user?.username, 'ID:', user?.id);
      console.log('🔒 Es seller:', isSeller);
      
      // Debug: Ver el status de cada orden
      response.results?.forEach((order, index) => {
        console.log(`🔍 Orden ${index + 1}:`, {
          id: order.order_uuid || order.id,
          status: order.status,
          status_display: order.status_display,
          seller: order.seller?.username
        });
      });
      
      setOrders(response.results || []);
      setTotalCount(response.count || 0);
      setTotalPages(Math.ceil((response.count || 0) / pageSize));
    } catch (err) {
      setError('Error al cargar las órdenes');
      setOrders([]);
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manejo de filtros
  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset a primera página al filtrar
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      page_size: pageSize
    });
    setCurrentPage(1);
  };

  // Manejo de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters(prev => ({ ...prev, page }));
  };

  // Manejo de selección de orden
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
    if (onOrderSelect) {
      onOrderSelect(order);
    }
  };

  // Aprobar/Confirmar orden (Admin)
  const handleApproveOrder = async (order: Order) => {
    if (!confirm(`¿Confirmar orden de ${order.seller?.username || 'vendedor'}?\n\nEsto descontará ${order.total_items} items del inventario.`)) {
      return;
    }

    try {
      setLoading(true);
      console.log('👮 Confirmando orden:', order.order_uuid || order.id);
      
      // El backend espera el status en MAYÚSCULAS
      await orderService.updateOrderStatus(order.order_uuid || order.id, {
        status: 'CONFIRMED' as any,
        notes: 'Orden aprobada por administrador'
      });

      alert('✅ Orden confirmada exitosamente!\n\nEl inventario ha sido actualizado.');
      
      // Recargar lista de órdenes
      await loadOrders();
    } catch (err) {
      console.error('Error al confirmar orden:', err);
      alert('❌ Error al confirmar la orden. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'processing': return 'Procesando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Historial de Órdenes
          </h2>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Cargando...' : '🔄 Actualizar'}
          </button>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="processing">Procesando</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Buscar por nombre"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
            <div className="text-sm text-blue-600">Total de Órdenes</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {(orders || []).filter(o => o.status === 'pending').length}
            </div>
            <div className="text-sm text-yellow-600">Pendientes</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {(orders || []).filter(o => o.status === 'delivered').length}
            </div>
            <div className="text-sm text-green-600">Entregadas</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              ${(orders || []).reduce((sum, order) => sum + Number(order.total_amount || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-purple-600">Total Vendido</div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <span className="text-red-600">⚠️</span>
              <div className="ml-3">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={loadOrders}
                  className="mt-2 text-red-600 underline hover:text-red-800"
                >
                  Intentar nuevamente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando órdenes...</span>
          </div>
        )}

        {/* Orders list */}
        {!loading && orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron órdenes
            </h3>
            <p className="text-gray-500">
              {Object.keys(filters).length > 2 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Aún no hay órdenes registradas'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleOrderClick(order)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.order_uuid?.slice(0, 8) || order.id?.slice(0, 8) || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.order_uuid || order.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.seller?.username || 'Sin vendedor'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.seller?.email || 'Sin email'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.order_date || order.created_date || '').toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${order.total_amount?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.items?.length || 0} productos
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Botón de aprobar para órdenes PENDING - SOLO para no-sellers */}
                          {!isSeller && (order.status === 'pending' || order.status === 'PENDING') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('🔘 Aprobando orden:', order);
                                handleApproveOrder(order);
                              }}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs font-medium"
                            >
                              ✅ Aprobar
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderClick(order);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver detalles
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{' '}
                      <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span>
                      {' '}a{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pageSize, totalCount)}
                      </span>
                      {' '}de{' '}
                      <span className="font-medium">{totalCount}</span>
                      {' '}resultados
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        ‹
                      </button>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = index + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + index;
                        } else {
                          pageNumber = currentPage - 2 + index;
                        }

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === pageNumber
                                ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        ›
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de detalles de orden */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  Detalles de Orden #{selectedOrder.order_uuid?.slice(0, 8) || selectedOrder.id?.slice(0, 8)}
                </h3>
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-3">Información del Vendedor</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Nombre:</span> {selectedOrder.seller?.username || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.seller?.email || 'N/A'}</p>
                    <p><span className="font-medium">Bodega:</span> {selectedOrder.location?.name || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Información de la Orden</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Estado:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </p>
                    <p><span className="font-medium">Fecha:</span> {new Date(selectedOrder.order_date || selectedOrder.created_date || '').toLocaleDateString()}</p>
                    <p><span className="font-medium">Dirección:</span> {typeof selectedOrder.shipping_address === 'string' ? selectedOrder.shipping_address : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-3">Productos</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.product_name || 'N/A'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.quantity || 0}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">${item.unit_price?.toLocaleString() || '0'}</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">${item.final_price?.toLocaleString() || item.total_price?.toLocaleString() || (item.unit_price && item.quantity ? (item.unit_price * item.quantity).toLocaleString() : '0')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-sm text-gray-500 text-center">
                            No hay items en esta orden
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Resumen</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${selectedOrder.subtotal?.toLocaleString() || '0'}</span>
                  </div>
                  {(selectedOrder.discount_amount && selectedOrder.discount_amount > 0) && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento:</span>
                      <span>-${selectedOrder.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  {(selectedOrder.tax_amount && selectedOrder.tax_amount > 0) && (
                    <div className="flex justify-between">
                      <span>Impuestos:</span>
                      <span>${selectedOrder.tax_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>${selectedOrder.total_amount?.toLocaleString() || selectedOrder.total_price?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Notas</h4>
                  <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;