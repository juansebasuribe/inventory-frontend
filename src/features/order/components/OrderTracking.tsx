import React, { useState, useEffect } from 'react';
import { orderService } from '../../products/services/orderService';

// Interface para el evento de tracking
interface TrackingEvent {
  id: number;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
  notes?: string;
}

// Importar interfaces del orderService
import type { Order } from '../../products/services/orderService';

// Interface para el tracking completo
interface OrderTracking {
  order_id: string;  // UUID
  order_number: string;
  current_status: string;
  estimated_delivery?: string;
  tracking_number?: string;
  carrier?: string;
  events: TrackingEvent[];
}

interface OrderTrackingProps {
  orderId?: string;  // UUID
  orderNumber?: string;
  showSearch?: boolean;
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
  className?: string;
}

export const OrderTrackingComponent: React.FC<OrderTrackingProps> = ({
  orderId,
  orderNumber,
  showSearch = true,
  onStatusUpdate,
  className = ''
}) => {
  // Estados
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchValue, setSearchValue] = useState(orderNumber || '');

  // Estados para actualización de status
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const formatDate = (value?: string | number | Date) =>
    value ? new Date(value).toLocaleDateString() : '—';

  const formatDateTime = (value?: string | number | Date) =>
    value ? new Date(value).toLocaleString() : '—';

  // Cargar tracking al montar o cuando cambie el orderId
  useEffect(() => {
    if (orderId) {
      // Si tenemos orderId, buscar la orden primero para obtener el order_number
      const loadOrderById = async () => {
        try {
          const orderData = await orderService.getOrderById(orderId);
          setOrder(orderData);
          if (orderData.order_number) {
            await loadOrderTracking(orderData.order_number);
          } else {
            setError('La orden no tiene número asignado');
          }
        } catch (_err) {
          setError('Error al cargar la orden');
        }
      };
      loadOrderById();
    }
  }, [orderId]);

  // Función para buscar orden por número
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('Ingrese un número de orden');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Buscar la orden por número usando el filtro search
      const orders = await orderService.getOrders({ 
        search: searchValue.trim(),
        page_size: 1 
      });

      if (orders.results.length === 0) {
        setError('No se encontró ninguna orden con ese número');
        return;
      }

      const foundOrder = orders.results[0];
      setOrder(foundOrder);
      if (foundOrder.order_number) {
        await loadOrderTracking(foundOrder.order_number);
      } else {
        setError('La orden encontrada no tiene número asignado');
      }
    } catch (err) {
      setError('Error al buscar la orden');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar el tracking de una orden
  const loadOrderTracking = async (orderNumber: string) => {
    try {
      setLoading(true);
      setError('');

      const trackingData = await orderService.getOrderTracking(orderNumber);
      setTracking(trackingData);

      // Si no tenemos la orden cargada, buscarla por número
      if (!order) {
        const orderData = await orderService.getOrderById(trackingData.order_id);
        setOrder(orderData);
      }
    } catch (err) {
      setError('Error al cargar el seguimiento de la orden');
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el estado de la orden
  const handleStatusUpdate = async () => {
    if (!tracking || !newStatus) return;

    try {
      setUpdating(true);
      
      await orderService.updateOrderStatus(tracking.order_id, {
        status: newStatus as any, // Usar type assertion por ahora
        notes: statusNotes
      });

      // Recargar el tracking usando order_number
      if (order?.order_number) {
        await loadOrderTracking(order.order_number);
      }
      
      // Limpiar formulario
      setNewStatus('');
      setStatusNotes('');
      setShowStatusUpdate(false);

      if (onStatusUpdate) {
        onStatusUpdate(tracking.order_id, newStatus);
      }
    } catch (err) {
      setError('Error al actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
      case 'procesando':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
      case 'enviado':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
      case 'entregado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el icono del estado
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pendiente':
        return '⏳';
      case 'processing':
      case 'procesando':
        return '⚙️';
      case 'shipped':
      case 'enviado':
        return '🚚';
      case 'delivered':
      case 'entregado':
        return '✅';
      case 'cancelled':
      case 'cancelado':
        return '❌';
      default:
        return '📦';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6">
        {/* Header con búsqueda */}
        {showSearch && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Seguimiento de Orden
            </h2>
            <div className="flex space-x-3">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese el número de orden (ej: ORD-2024-001)"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <span className="text-red-600">⚠️</span>
              <div className="ml-3">
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando seguimiento...</span>
          </div>
        )}

        {/* Información de la orden */}
        {order && !loading && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-medium text-gray-900">Orden #{order.order_number}</h3>
                <p className="text-sm text-gray-600">Cliente: Usuario #{order.user_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Fecha: {formatDate(order?.created_date)}
                </p>
                <p className="text-sm text-gray-600">
                  Total: ${order.total_amount.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                  <span className="mr-2">{getStatusIcon(order.status)}</span>
                  {order.status}
                </span>
                <button
                  onClick={() => setShowStatusUpdate(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Actualizar estado
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Información de envío */}
        {tracking && (
          <>
            {(tracking.tracking_number || tracking.carrier || tracking.estimated_delivery) && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-3">Información de Envío</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {tracking.tracking_number && (
                    <div>
                      <span className="font-medium text-blue-700">Número de seguimiento:</span>
                      <p className="text-blue-600">{tracking.tracking_number}</p>
                    </div>
                  )}
                  {tracking.carrier && (
                    <div>
                      <span className="font-medium text-blue-700">Transportista:</span>
                      <p className="text-blue-600">{tracking.carrier}</p>
                    </div>
                  )}
                  {tracking.estimated_delivery && (
                    <div>
                      <span className="font-medium text-blue-700">Entrega estimada:</span>
                      <p className="text-blue-600">
                        {formatDate(tracking.estimated_delivery)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline de eventos */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Historial de Seguimiento</h3>
              
              {tracking.events.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📋</div>
                  <p className="text-gray-500">No hay eventos de seguimiento registrados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tracking.events.map((event, index) => (
                    <div key={event.id} className="relative">
                      {/* Línea conectora */}
                      {index < tracking.events.length - 1 && (
                        <div className="absolute left-4 top-10 w-0.5 h-16 bg-gray-300"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        {/* Icono del evento */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getStatusColor(event.status)}`}>
                          {getStatusIcon(event.status)}
                        </div>
                        
                        {/* Contenido del evento */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {event.description}
                            </h4>
                            <time className="text-sm text-gray-500">
                              {formatDateTime(event.timestamp)}
                            </time>
                          </div>
                          
                          {event.location && (
                            <p className="text-sm text-gray-600 mt-1">
                              📍 {event.location}
                            </p>
                          )}
                          
                          {event.notes && (
                            <p className="text-sm text-gray-500 mt-1 italic">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal para actualizar estado */}
        {showStatusUpdate && tracking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Actualizar Estado</h3>
                  <button
                    onClick={() => setShowStatusUpdate(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nuevo estado
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar estado</option>
                      <option value="pending">Pendiente</option>
                      <option value="processing">Procesando</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Agregar notas sobre el cambio de estado"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowStatusUpdate(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updating ? 'Actualizando...' : 'Actualizar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state cuando no hay orden seleccionada */}
        {!order && !loading && !error && showSearch && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Buscar orden para seguimiento
            </h3>
            <p className="text-gray-500">
              Ingrese el número de orden para ver el estado y seguimiento
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingComponent;
