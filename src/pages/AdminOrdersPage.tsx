import React, { useState, useEffect } from 'react';
import { ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../features/products/services/orderService';
import type { Order } from '../features/products/services/orderService';

export const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrders({
        page: 1,
        page_size: 100
      });
      
      console.log('📦 Órdenes recibidas:', response.results);
      
      // Filtrar según el filtro seleccionado
      let filteredOrders = response.results || [];
      if (filter === 'pending') {
        filteredOrders = filteredOrders.filter(o => 
          o.status?.toUpperCase() === 'PENDING'
        );
      } else if (filter === 'confirmed') {
        filteredOrders = filteredOrders.filter(o => 
          o.status?.toUpperCase() === 'CONFIRMED'
        );
      }
      
      console.log(`📊 Órdenes filtradas (${filter}):`, filteredOrders.length);
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      alert('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (order: Order) => {
    const confirmMsg = `¿Confirmar orden de ${order.seller?.username || 'vendedor'}?\n\n` +
      `Items: ${order.total_items}\n` +
      `Total: $${order.total_amount?.toLocaleString() || order.total_price?.toLocaleString()}\n\n` +
      `Esto descontará el inventario de la bodega: ${order.location?.name || 'N/A'}`;

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      setLoading(true);
      console.log('👮 Aprobando orden:', order.order_uuid);
      
      await orderService.updateOrderStatus(order.order_uuid || order.id, {
        status: 'CONFIRMED' as any,
        notes: 'Orden aprobada por administrador'
      });

      alert('✅ Orden confirmada exitosamente!\n\nEl inventario ha sido actualizado.');
      
      // Recargar órdenes
      await loadOrders();
    } catch (error) {
      console.error('Error al aprobar orden:', error);
      alert('❌ Error al confirmar la orden. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase();
    
    if (statusUpper === 'PENDING') {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">⏳ Pendiente</span>;
    } else if (statusUpper === 'CONFIRMED') {
      return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">✅ Confirmada</span>;
    } else if (statusUpper === 'CANCELLED') {
      return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">❌ Cancelada</span>;
    } else {
      return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Volver al Dashboard</span>
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h1>
                <p className="text-sm text-gray-600">Administra y aprueba las órdenes de compra de los vendedores</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadOrders}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Actualizar"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ir al inicio"
              >
                <Home className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({orders.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏳ Pendientes
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'confirmed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✅ Confirmadas
            </button>
            <button
              onClick={loadOrders}
              disabled={loading}
              className="ml-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Lista de Órdenes */}
        {!loading && orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay órdenes</h3>
            <p className="text-gray-600">
              {filter === 'pending' ? 'No hay órdenes pendientes de aprobación' : 
               filter === 'confirmed' ? 'No hay órdenes confirmadas' : 
               'No hay órdenes registradas en el sistema'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <div key={order.order_uuid || order.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Info principal */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Orden #{(order.order_uuid || order.id)?.slice(0, 8)}
                        </h3>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {/* Vendedor */}
                        <div>
                          <p className="text-gray-500 mb-1">Vendedor</p>
                          <p className="font-medium text-gray-900">{order.seller?.username || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{order.seller?.email || ''}</p>
                        </div>

                        {/* Bodega */}
                        <div>
                          <p className="text-gray-500 mb-1">Bodega</p>
                          <p className="font-medium text-gray-900">{order.location?.name || 'N/A'}</p>
                        </div>

                        {/* Items */}
                        <div>
                          <p className="text-gray-500 mb-1">Items</p>
                          <p className="font-medium text-gray-900">{order.total_items || 0} productos</p>
                        </div>

                        {/* Total */}
                        <div>
                          <p className="text-gray-500 mb-1">Total</p>
                          <p className="font-bold text-gray-900 text-lg">
                            ${(order.total_amount || order.total_price || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Fecha */}
                      <div className="mt-3 text-xs text-gray-500">
                        📅 {new Date(order.order_date || order.created_date || '').toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 ml-6">
                      {(order.status?.toUpperCase() === 'PENDING') && (
                        <button
                          onClick={() => handleApproveOrder(order)}
                          disabled={loading}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          ✅ Aprobar Orden
                        </button>
                      )}
                      
                      {(order.status?.toUpperCase() === 'CONFIRMED') && (
                        <div className="px-6 py-3 bg-green-50 text-green-700 rounded-lg font-medium text-center">
                          ✓ Aprobada
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Productos (expandible) */}
                  {order.items && order.items.length > 0 && (
                    <details className="mt-4 pt-4 border-t border-gray-200">
                      <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                        Ver {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                      </summary>
                      <div className="mt-3 space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.product_name || 'Producto'}</p>
                              <p className="text-xs text-gray-500">Código: {item.product_bar_code || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {item.quantity || 0} x ${(item.unit_price || 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                = ${((item.final_price || item.total_price || (item.unit_price || 0) * (item.quantity || 0))).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
