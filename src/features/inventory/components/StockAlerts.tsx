// src/features/inventory/components/StockAlerts.tsx

/**
 * Componente StockAlerts - Alertas de stock
 * Muestra alertas de stock bajo, sobrestock y productos agotados
 * FASE 7.3 - Componentes UI Profesionales
 */

import React, { useState, useEffect, useRef } from 'react';
import { inventoryService } from '../../products/services/inventoryService';

// Usar la interface del servicio para evitar conflictos
type StockAlertFromService = {
  id: number;
  product_code: string;
  product_name: string;
  warehouse_code: string;
  alert_type: 'low_stock' | 'overstock' | 'out_of_stock';
  current_stock: number;
  threshold_value: number;
  is_resolved: boolean;
  created_date: string;
  resolved_date?: string;
  resolved_by?: number;
};

interface StockAlertsProps {
  onAlertResolve?: (alert: StockAlertFromService) => void;
  onViewProduct?: (productCode: string) => void;
  showResolved?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export const StockAlerts: React.FC<StockAlertsProps> = ({
  onAlertResolve,
  onViewProduct,
  showResolved = false,
  autoRefresh = true,
  refreshInterval = 30000, // 30 segundos
  className = ''
}) => {
  // Estados
  const [alerts, setAlerts] = useState<StockAlertFromService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Instrumentación: id de instancia y logs de montaje/desmontaje
  const _instanceId = useRef<string>(Math.random().toString(36).slice(2, 9));
  useEffect(() => {
    console.log(`[mount] StockAlerts id=${_instanceId.current} time=${Date.now()}`);
    return () => console.log(`[unmount] StockAlerts id=${_instanceId.current} time=${Date.now()}`);
  }, []);

  // Cargar alertas
  useEffect(() => {
    loadAlerts();
    
    if (autoRefresh) {
      const interval = setInterval(loadAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, showResolved]);

  const loadAlerts = async () => {
    try {
      console.log(`[StockAlerts ${_instanceId.current}] loadAlerts showResolved=${showResolved}`);
      setLoading(true);
      setError('');

      const response = showResolved 
        ? await inventoryService.getStockAlerts()
        : await inventoryService.getUnresolvedAlerts();

      // getStockAlerts devuelve AlertListResponse, getUnresolvedAlerts devuelve StockAlert[]
      const alertsData = Array.isArray(response) ? response : response.results;
      console.log(`[StockAlerts ${_instanceId.current}] loaded ${alertsData.length} alerts`);
      setAlerts(alertsData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar alertas');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Resolver alerta
  const handleResolveAlert = async (alert: StockAlertFromService) => {
    try {
      await inventoryService.resolveAlert(alert.id);
      
      // Actualizar estado local
      setAlerts(prevAlerts =>
        prevAlerts.map(a =>
          a.id === alert.id 
            ? { ...a, is_resolved: true, resolution_date: new Date().toISOString() }
            : a
        )
      );

      if (onAlertResolve) {
        onAlertResolve(alert);
      }
    } catch (err: any) {
      console.error('Error al resolver alerta:', err);
    }
  };

  // Helper para obtener severidad basada en alert_type y stock
  const getSeverityFromAlert = (alert: StockAlertFromService): 'low' | 'medium' | 'high' | 'critical' => {
    switch (alert.alert_type) {
      case 'out_of_stock':
        return 'critical';
      case 'low_stock':
        // Si el stock actual es muy bajo (menos del 25% del threshold), es crítico
        if (alert.current_stock < alert.threshold_value * 0.25) {
          return 'critical';
        }
        // Si es menos del 50%, es alto
        if (alert.current_stock < alert.threshold_value * 0.5) {
          return 'high';
        }
        return 'medium';
      case 'overstock':
        // Si el overstock es muy alto (más del doble del threshold), es alto
        if (alert.current_stock > alert.threshold_value * 2) {
          return 'high';
        }
        return 'low';
      default:
        return 'low';
    }
  };

  // Filtrar alertas
  const filteredAlerts = alerts.filter(alert => {
    if (filterType !== 'all' && alert.alert_type !== filterType) {
      return false;
    }
    if (filterSeverity !== 'all' && getSeverityFromAlert(alert) !== filterSeverity) {
      return false;
    }
    return true;
  });

  // Configuración de alertas por tipo
  const getAlertConfig = (alertType: string) => {
    const configs = {
      low_stock: {
        icon: '⚠️',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        label: 'Stock Bajo'
      },
      overstock: {
        icon: '📦',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-800',
        label: 'Sobrestock'
      },
      out_of_stock: {
        icon: '🚨',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        label: 'Sin Stock'
      }
    };
    return configs[alertType as keyof typeof configs] || configs.low_stock;
  };

  // Configuración de severidad
  const getSeverityConfig = (severity: string) => {
    const configs = {
      low: { color: 'text-green-600', label: 'Baja' },
      medium: { color: 'text-yellow-600', label: 'Media' },
      high: { color: 'text-orange-600', label: 'Alta' },
      critical: { color: 'text-red-600', label: 'Crítica' }
    };
    return configs[severity as keyof typeof configs] || configs.low;
  };

  // Estadísticas de alertas
  const alertStats = {
    total: filteredAlerts.length,
    critical: filteredAlerts.filter(a => getSeverityFromAlert(a) === 'critical').length,
    high: filteredAlerts.filter(a => getSeverityFromAlert(a) === 'high').length,
    resolved: filteredAlerts.filter(a => a.is_resolved).length
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con estadísticas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Alertas de Stock
          </h3>
          
          <div className="flex items-center space-x-4">
            {autoRefresh && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-pulse h-2 w-2 bg-green-500 rounded-full"></div>
                <span>Auto-actualización</span>
              </div>
            )}
            
            <button
              onClick={loadAlerts}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔄' : '↻'} Actualizar
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{alertStats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
            <div className="text-sm text-gray-500">Críticas</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{alertStats.high}</div>
            <div className="text-sm text-gray-500">Altas</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{alertStats.resolved}</div>
            <div className="text-sm text-gray-500">Resueltas</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Alerta
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="low_stock">Stock Bajo</option>
              <option value="overstock">Sobrestock</option>
              <option value="out_of_stock">Sin Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severidad
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && filteredAlerts.length === 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600">⚠️ {error}</div>
        </div>
      )}

      {/* Lista de alertas */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
              <div className="text-gray-500 text-lg">
                {showResolved ? 'No hay alertas' : 'No hay alertas pendientes'}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                ¡Excelente! El inventario está bajo control
              </div>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const alertConfig = getAlertConfig(alert.alert_type);
              const severityConfig = getSeverityConfig(getSeverityFromAlert(alert));
              
              return (
                <div
                  key={alert.id}
                  className={`${alertConfig.bgColor} ${alertConfig.borderColor} border rounded-lg p-4 ${
                    alert.is_resolved ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{alertConfig.icon}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-sm font-medium ${alertConfig.textColor}`}>
                            {alertConfig.label}
                          </span>
                          
                          <span className={`text-xs font-medium ${severityConfig.color}`}>
                            {severityConfig.label}
                          </span>
                          
                          {alert.is_resolved && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              ✓ Resuelta
                            </span>
                          )}
                        </div>
                        
                        <div className="text-gray-900 font-medium mb-1">
                          {alert.product_name}
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <div>Código: {alert.product_code}</div>
                          <div>Almacén: {alert.warehouse_code}</div>
                          <div>Stock actual: {alert.current_stock}</div>
                          <div>Umbral: {alert.threshold_value}</div>
                        </div>
                        
                        <div className="text-sm text-gray-700 bg-white bg-opacity-50 p-2 rounded">
                          {alert.alert_type === 'low_stock' && `Stock por debajo del umbral mínimo (${alert.threshold_value})`}
                          {alert.alert_type === 'overstock' && `Stock por encima del umbral máximo (${alert.threshold_value})`}
                          {alert.alert_type === 'out_of_stock' && 'Producto agotado'}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex space-x-2">
                      {onViewProduct && (
                        <button
                          onClick={() => onViewProduct(alert.product_code)}
                          className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Ver Producto
                        </button>
                      )}
                      
                      {!alert.is_resolved && (
                        <button
                          onClick={() => handleResolveAlert(alert)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Resolver
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Footer con fechas */}
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Creada: {new Date(alert.created_date).toLocaleString()}</span>
                      {alert.resolved_date && (
                        <span>Resuelta: {new Date(alert.resolved_date).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default StockAlerts;