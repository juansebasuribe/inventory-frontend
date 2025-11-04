// src/features/inventory/components/InventoryTable.tsx

/**
 * Componente InventoryTable - Tabla de inventario
 * Gestión completa del inventario con filtros y acciones
 * FASE 7.3 - Componentes UI Profesionales
 */

import React, { useState, useEffect, useRef } from 'react';
import { inventoryService } from '../../products/services/inventoryService';

// Interfaces locales simplificadas basadas en el servicio existente
interface InventoryItem {
  id: number;
  product_code: string;
  product_name: string;
  warehouse_code: string;
  warehouse_name: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reserved_stock: number;
  available_stock: number;
  unit_cost: number;
  total_value: number;
  last_movement_date: string;
}

interface InventoryFilters {
  search?: string;
  warehouse?: string;
  product_code?: string;
  low_stock?: boolean;
  overstock?: boolean;
}

interface InventoryTableProps {
  onItemSelect?: (item: InventoryItem) => void;
  onAdjustStock?: (item: InventoryItem) => void;
  showActions?: boolean;
  pageSize?: number;
  className?: string;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  onItemSelect,
  onAdjustStock,
  showActions = true,
  pageSize = 20,
  className = ''
}) => {
  // Estados
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [sortField, setSortField] = useState<keyof InventoryItem>('product_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0
  });

  // Instrumentación: id de instancia y logs de montaje/desmontaje
  const _instanceId = useRef<string>(Math.random().toString(36).slice(2, 9));
  useEffect(() => {
    console.log(`[mount] InventoryTable id=${_instanceId.current} time=${Date.now()}`);
    return () => {
      console.log(`[unmount] InventoryTable id=${_instanceId.current} time=${Date.now()}`);
    };
  }, []);

  // Cargar items de inventario
  useEffect(() => {
    loadInventoryItems();
  }, []);

  const loadInventoryItems = async (page: number = 1, currentFilters = filters) => {
    try {
      console.log(`[InventoryTable ${_instanceId.current}] loadInventoryItems page=${page} filters=${JSON.stringify(currentFilters)}`);
      setLoading(true);
      setError('');

      const response = await inventoryService.getInventoryItems({
        page,
        page_size: pageSize,
        ...currentFilters
      });

      console.log(`[InventoryTable ${_instanceId.current}] loadInventoryItems response count=${response?.count}`);

      // Aplicar ordenamiento local si es necesario
      let sortedItems = response.results;
      if (sortField) {
        sortedItems = [...response.results].sort((a, b) => {
          const aValue = a[sortField];
          const bValue = b[sortField];
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue);
            return sortDirection === 'desc' ? -comparison : comparison;
          } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            const comparison = aValue - bValue;
            return sortDirection === 'desc' ? -comparison : comparison;
          }
          
          return 0;
        });
      }

      setItems(sortedItems);
      setPagination({
        currentPage: response.current_page || page,
        totalPages: response.total_pages || Math.ceil(response.count / pageSize),
        totalCount: response.count
      });

    } catch (err: any) {
      console.error(`[InventoryTable ${_instanceId.current}] Error:`, err);
      
      const errorMessage = err?.message || 'Error al cargar inventario';
      setError(errorMessage);
      setItems([]);
      setPagination({
        currentPage: 1,
        totalPages: 0,
        totalCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters = { ...filters, search: searchInput };
    setFilters(newFilters);
    loadInventoryItems(1, newFilters);
  };

  // Manejar cambio de filtros
  const handleFilterChange = (key: keyof InventoryFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadInventoryItems(1, newFilters);
  };

  // Manejar ordenamiento
  const handleSort = (field: keyof InventoryItem) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    loadInventoryItems(pagination.currentPage, filters);
  };

  // Limpiar filtros
  const clearFilters = () => {
    const newFilters = {};
    setFilters(newFilters);
    setSearchInput('');
    loadInventoryItems(1, newFilters);
  };

  // Obtener indicador de stock
  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock === 0) {
      return { label: 'Sin stock', color: 'bg-red-100 text-red-800' };
    } else if (item.current_stock <= item.minimum_stock) {
      return { label: 'Stock bajo', color: 'bg-yellow-100 text-yellow-800' };
    } else if (item.current_stock >= item.maximum_stock) {
      return { label: 'Sobrestock', color: 'bg-purple-100 text-purple-800' };
    } else {
      return { label: 'Normal', color: 'bg-green-100 text-green-800' };
    }
  };

  // Renderizar icono de ordenamiento
  const renderSortIcon = (field: keyof InventoryItem) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕️</span>;
    }
    return (
      <span className="text-blue-600">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Inventario</h3>
        
        {/* Búsqueda */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por producto o almacén..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleFilterChange('low_stock', !filters.low_stock)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filters.low_stock 
                ? 'bg-yellow-200 text-yellow-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Stock bajo
          </button>
          
          <button
            onClick={() => handleFilterChange('overstock', !filters.overstock)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filters.overstock 
                ? 'bg-purple-200 text-purple-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Sobrestock
          </button>

          {Object.values(filters).some(Boolean) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Información */}
        <div className="text-sm text-gray-600">
          {pagination.totalCount} items de inventario
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600">⚠️ {error}</div>
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('product_name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Producto</span>
                      {renderSortIcon('product_name')}
                    </div>
                  </th>
                  
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('warehouse_name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Almacén</span>
                      {renderSortIcon('warehouse_name')}
                    </div>
                  </th>
                  
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('current_stock')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Stock Actual</span>
                      {renderSortIcon('current_stock')}
                    </div>
                  </th>
                  
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Mín/Máx
                  </th>
                  
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disponible
                  </th>
                  
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total_value')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Valor Total</span>
                      {renderSortIcon('total_value')}
                    </div>
                  </th>
                  
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  
                  {showActions && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const stockStatus = getStockStatus(item);
                  
                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onItemSelect && onItemSelect(item)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.product_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.product_code}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {item.warehouse_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.warehouse_code}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {item.current_stock.toLocaleString()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-600">
                          {item.minimum_stock} / {item.maximum_stock}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {item.available_stock.toLocaleString()}
                        </div>
                        {item.reserved_stock > 0 && (
                          <div className="text-xs text-gray-500">
                            ({item.reserved_stock} reservado)
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ${item.total_value.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${item.unit_cost.toLocaleString()} c/u
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      
                      {showActions && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {onAdjustStock && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAdjustStock(item);
                              }}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              Ajustar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((pagination.currentPage - 1) * pageSize) + 1} a{' '}
                  {Math.min(pagination.currentPage * pageSize, pagination.totalCount)} de{' '}
                  {pagination.totalCount} items
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => loadInventoryItems(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  
                  <button
                    onClick={() => loadInventoryItems(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryTable;