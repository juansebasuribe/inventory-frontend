import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Home,
  RefreshCw,
  Filter,
  Calendar,
  X,
  CheckCircle2,
  Truck,
  PackageCheck,
  Ban,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../features/products/services/orderService';

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const STATUS_BADGES = {
  PENDING: { className: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
  CONFIRMED: { className: 'bg-blue-100 text-blue-800', label: 'Confirmada' },
  PROCESSING: { className: 'bg-amber-100 text-amber-800', label: 'Procesando' },
  SHIPPED: { className: 'bg-indigo-100 text-indigo-800', label: 'Enviada' },
  DELIVERED: { className: 'bg-green-100 text-green-800', label: 'Entregada' },
  CANCELLED: { className: 'bg-red-100 text-red-800', label: 'Cancelada' },
  REFUNDED: { className: 'bg-gray-200 text-gray-700', label: 'Reembolsada' },
};

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'PROCESSING', label: 'Procesando' },
  { value: 'SHIPPED', label: 'Enviadas' },
  { value: 'DELIVERED', label: 'Entregadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
  { value: 'REFUNDED', label: 'Reembolsadas' },
];

const ACTION_MAP = {
  PENDING: [
    {
      label: 'Confirmar',
      target: 'CONFIRMED',
      style: 'bg-green-600 hover:bg-green-700 text-white',
      icon: <CheckCircle2 className="w-4 h-4" />,
      confirmMessage: '¿Confirmar la orden seleccionada? Esto descontará inventario.',
    },
    {
      label: 'Cancelar',
      target: 'CANCELLED',
      style: 'bg-red-600 hover:bg-red-700 text-white',
      icon: <Ban className="w-4 h-4" />,
      confirmMessage: '¿Cancelar la orden? Esta acción no se puede deshacer.',
    },
  ],
  CONFIRMED: [
    {
      label: 'Marcar como Procesando',
      target: 'PROCESSING',
      style: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: <Filter className="w-4 h-4" />,
    },
    {
      label: 'Cancelar',
      target: 'CANCELLED',
      style: 'bg-red-600 hover:bg-red-700 text-white',
      icon: <Ban className="w-4 h-4" />,
    },
  ],
  PROCESSING: [
    {
      label: 'Marcar como Enviada',
      target: 'SHIPPED',
      style: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      icon: <Truck className="w-4 h-4" />,
    },
  ],
  SHIPPED: [
    {
      label: 'Marcar como Entregada',
      target: 'DELIVERED',
      style: 'bg-green-600 hover:bg-green-700 text-white',
      icon: <PackageCheck className="w-4 h-4" />,
    },
  ],
};

const STATUS_LABEL = (rawStatus) => {
  const normalized = (rawStatus || 'PENDING').toUpperCase();
  return STATUS_BADGES[normalized]?.label || normalized;
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (value) => {
  const num = Number(value ?? 0);
  return num.toLocaleString('es-CO');
};

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [actionOrderId, setActionOrderId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const filters = { page, page_size: pageSize };
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const response = await orderService.getOrders(filters);
      const baseResults = Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response)
          ? response
          : [];

      const enriched = await Promise.all(
        baseResults.map(async (order) => {
          if (Array.isArray(order.items) && order.items.length > 0 && Array.isArray(order.history)) {
            return order;
          }
          const identifier = order.order_uuid || order.id;
          if (!identifier) return order;
          try {
            const detail = await orderService.getOrderById(String(identifier));
            return {
              ...order,
              items: detail.items || order.items,
              history: detail.history || order.history,
            };
          } catch (error) {
            console.warn('No se pudo cargar detalle de orden', error);
            return order;
          }
        }),
      );

      setOrders(enriched);
      setTotalCount(response?.count ?? enriched.length);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      alert('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = async (order, targetStatus, confirmMessage) => {
    const identifier = order.order_uuid || order.id;
    if (!identifier) return;

    const shortId = String(identifier).slice(0, 8);
    const defaultMessage = `¿Marcar la orden #${shortId} como ${STATUS_LABEL(targetStatus)}?`;
    if (!window.confirm(confirmMessage || defaultMessage)) {
      return;
    }

    try {
      setActionOrderId(identifier);
      await orderService.updateOrderStatus(String(identifier), {
        status: targetStatus,
        notes: `Estado cambiado a ${STATUS_LABEL(targetStatus)}`,
      });
      await loadOrders();
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      alert('No se pudo actualizar la orden');
    } finally {
      setActionOrderId(null);
    }
  };

  const renderStatusBadges = (status) => {
    if (status === 'CANCELLED' || status === 'REFUNDED') {
      const badge = STATUS_BADGES[status] || STATUS_BADGES.PENDING;
      return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.className}`}>
          {badge.label}
        </span>
      );
    }

    const currentIndex = STATUS_STEPS.indexOf((status || 'PENDING').toUpperCase());
    return (
      <div className="flex flex-wrap gap-1">
        {STATUS_STEPS.map((step, index) => (
          <span
            key={step}
            className={`px-2 py-1 text-xs rounded-full border ${
              index <= currentIndex
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}
          >
            {STATUS_BADGES[step].label}
          </span>
        ))}
      </div>
    );
  };

  const renderActionsForOrder = (order) => {
    const normalized = (order.status || 'PENDING').toUpperCase();
    const actions = ACTION_MAP[normalized];
    if (!actions || normalized === 'DELIVERED' || normalized === 'REFUNDED') {
      return null;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.target}
            type="button"
            onClick={() => handleStatusUpdate(order, action.target, action.confirmMessage)}
            disabled={actionOrderId === (order.order_uuid || order.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.style}`}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const ordersEmpty = !loading && orders.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Volver al dashboard</span>
              </button>
              <div className="h-8 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de órdenes</h1>
                <p className="text-sm text-gray-600">
                  Supervisa el estado de cada orden y actualízala paso a paso.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadOrders()}
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

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 text-gray-700 font-medium">
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Desde</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Hasta</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => loadOrders()}
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                Aplicar filtros
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}

        {ordersEmpty && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay órdenes</h3>
            <p className="text-gray-600">Ajusta los filtros o espera nuevas órdenes.</p>
          </div>
        )}

        {!ordersEmpty && !loading && (
          <div className="space-y-4">
            {orders.map((order) => {
              const identifier = order.order_uuid || order.id;
              const badge = STATUS_BADGES[(order.status || 'PENDING').toUpperCase()] || STATUS_BADGES.PENDING;

              return (
                <div key={identifier} className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900">
                            Orden #{String(identifier).slice(0, 8)}
                          </h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        {renderStatusBadges(order.status)}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                          <div>
                            <p className="text-gray-500">Vendedor</p>
                            <p className="font-medium text-gray-900">{order.seller?.username || 'Sin asignar'}</p>
                            <p className="text-xs text-gray-500">{order.seller?.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Bodega</p>
                            <p className="font-medium text-gray-900">{order.location?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total</p>
                            <p className="font-bold text-gray-900 text-lg">
                              ${formatCurrency(order.total_amount || order.total_price || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Creada</p>
                            <p className="font-medium text-gray-900">{formatDate(order.order_date)}</p>
                          </div>
                        </div>
                      </div>
                      <div>{renderActionsForOrder(order)}</div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <details className="mt-2 rounded-lg border border-gray-100 bg-gray-50/60">
                        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-700">
                          Ver {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                        </summary>
                        <div className="divide-y divide-gray-100">
                          {order.items.map((item, index) => (
                            <div
                              key={`${identifier}-item-${index}`}
                              className="flex items-center justify-between px-4 py-3 text-sm"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">{item.product_name || 'Producto'}</p>
                                <p className="text-xs text-gray-500">
                                  Código: {item.product_bar_code || 'N/A'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  {item.quantity || 0} x ${formatCurrency(item.unit_price || 0)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  = $
                                  {formatCurrency(
                                    item.total_price ??
                                      item.final_price ??
                                      (item.unit_price || 0) * (item.quantity || 0),
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {order.history && order.history.length > 0 && (
                      <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900 mb-2">Historial</p>
                        <ul className="space-y-1">
                          {order.history.map((entry, idx) => (
                            <li key={`${identifier}-history-${idx}`} className="flex items-center justify-between text-xs">
                              <span>
                                {formatDate(entry.creation_date)} — {STATUS_LABEL(entry.new_status)}
                                {entry.notes ? ` • ${entry.notes}` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!ordersEmpty && !loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-semibold">{(page - 1) * pageSize + 1}</span> a{' '}
              <span className="font-semibold">{Math.min(page * pageSize, totalCount)}</span> de{' '}
              <span className="font-semibold">{totalCount}</span> órdenes
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || loading}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
