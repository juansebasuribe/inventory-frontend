// src/features/providers/components/ProviderList.tsx

/**
 * Componente ProviderList - Lista de proveedores con filtros
 * Gestión completa de proveedores con búsqueda y paginación
 * FASE 7.3 - Componentes UI Profesionales
 */

import React, { useState, useEffect } from 'react';
import { providerService } from '../../../shared/services/providerService';
import { ProviderCard } from './ProviderCard';
import type { Provider, IdentificationType } from '../../../shared/types/product.types';

interface ProviderListProps {
  onProviderEdit?: (provider: Provider) => void;
  onProviderDelete?: (provider: Provider) => void;
  onProviderSelect?: (provider: Provider) => void;
  showActions?: boolean;
  pageSize?: number;
  className?: string;
}

interface ProviderFilters {
  search?: string;
  active?: boolean;
  identification_type?: IdentificationType;
  rating_min?: number;
}

export const ProviderList: React.FC<ProviderListProps> = ({
  onProviderEdit,
  onProviderDelete,
  onProviderSelect,
  showActions = true,
  pageSize = 12,
  className = ''
}) => {
  // Estados
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<ProviderFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0
  });

  // Cargar proveedores
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async (page: number = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      setError('');

      const response = await providerService.getProviders({
        page,
        page_size: pageSize,
        ordering: 'name',
        ...currentFilters
      });

      setProviders(response.results);
      setPagination({
        currentPage: page,
        totalPages: Math.ceil(response.count / pageSize),
        totalCount: response.count
      });

    } catch (err: any) {
      setError(err.message || 'Error al cargar proveedores');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters = { ...filters, search: searchInput };
    setFilters(newFilters);
    loadProviders(1, newFilters);
  };

  // Manejar cambio de filtros
  const handleFilterChange = (key: keyof ProviderFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadProviders(1, newFilters);
  };

  // Limpiar filtros
  const clearFilters = () => {
    const newFilters = {};
    setFilters(newFilters);
    setSearchInput('');
    loadProviders(1, newFilters);
  };

  // Manejar paginación
  const handlePageChange = (page: number) => {
    loadProviders(page);
  };

  // Manejar cambio de rating
  const handleRatingChange = (provider: Provider, newRating: number) => {
    setProviders(prevProviders =>
      prevProviders.map(p =>
        p.id === provider.id ? { ...p, rating: newRating } : p
      )
    );
  };

  // Renderizar paginación
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            i === pagination.currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Mostrando {((pagination.currentPage - 1) * pageSize) + 1} a{' '}
          {Math.min(pagination.currentPage * pageSize, pagination.totalCount)} de{' '}
          {pagination.totalCount} proveedores
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          {pages}
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        
        {/* Búsqueda */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar proveedores por nombre, email, teléfono..."
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

        {/* Filtros adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.active === undefined ? '' : filters.active.toString()}
              onChange={(e) => 
                handleFilterChange('active', e.target.value === '' ? undefined : e.target.value === 'true')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de identificación
            </label>
            <select
              value={filters.identification_type || ''}
              onChange={(e) => 
                handleFilterChange('identification_type', e.target.value || undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="nit">NIT</option>
              <option value="cc">Cédula de Ciudadanía</option>
              <option value="ce">Cédula de Extranjería</option>
              <option value="pasaporte">Pasaporte</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calificación mínima
            </label>
            <select
              value={filters.rating_min || ''}
              onChange={(e) => 
                handleFilterChange('rating_min', e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Cualquiera</option>
              <option value="1">1+ ⭐</option>
              <option value="2">2+ ⭐⭐</option>
              <option value="3">3+ ⭐⭐⭐</option>
              <option value="4">4+ ⭐⭐⭐⭐</option>
              <option value="5">5 ⭐⭐⭐⭐⭐</option>
            </select>
          </div>
        </div>

        {/* Acciones de filtros */}
        <div className="mt-4 flex justify-between">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Limpiar filtros
          </button>
          
          <div className="text-sm text-gray-600">
            {pagination.totalCount} proveedores encontrados
          </div>
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
          <div className="flex">
            <div className="text-red-600">
              ⚠️ {error}
            </div>
          </div>
        </div>
      )}

      {/* Lista de proveedores */}
      {!loading && !error && (
        <>
          {providers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No se encontraron proveedores</div>
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onEdit={onProviderEdit}
                  onDelete={onProviderDelete}
                  onViewDetails={onProviderSelect}
                  onRatingChange={handleRatingChange}
                  showActions={showActions}
                />
              ))}
            </div>
          )}

          {/* Paginación */}
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default ProviderList;