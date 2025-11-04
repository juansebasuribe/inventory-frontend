// src/features/categories/components/CategorySelector.tsx

/**
 * Componente CategorySelector - Selector de categorías simple
 * Para formularios y filtros
 * FASE 7.3 - Componentes UI Profesionales
 */

import React, { useState, useEffect } from 'react';
import { categoryService } from '../../../shared/services/categoryService';
import type { Category } from '../../../shared/types/product.types';

interface CategorySelectorProps {
  value?: number | null;
  onChange?: (categoryId: number | null) => void;
  placeholder?: string;
  includeEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  refreshKey?: number;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar categoría',
  includeEmpty = true,
  emptyLabel = 'Sin categoría',
  disabled = false,
  className = '',
  refreshKey = 0
}) => {
  // Estados
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Cargar categorías al montar
  useEffect(() => {
    loadCategories();
  }, [refreshKey]); // ← Recargar cuando cambie refreshKey

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const categoriesData = await categoryService.getCategories();
      
      // Ordenar por nombre
      const sorted = categoriesData.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(sorted);
    } catch (err: any) {
      setError(err.message || 'Error al cargar categorías');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const categoryId = selectedValue === '' ? null : Number(selectedValue);
    
    if (onChange) {
      onChange(categoryId);
    }
  };

  const handleRefresh = () => {
    loadCategories();
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled || loading}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled || loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        } ${error ? 'border-red-300' : ''}`}
      >
        {/* Opción placeholder */}
        <option value="" disabled={!includeEmpty}>
          {loading ? 'Cargando...' : placeholder}
        </option>
        
        {/* Opción vacía */}
        {includeEmpty && (
          <option value="">
            {emptyLabel}
          </option>
        )}
        
        {/* Categorías */}
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      {/* Indicador de carga */}
      {loading && (
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Botón de refresh */}
      {!loading && !disabled && (
        <button
          onClick={handleRefresh}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
          title="Actualizar categorías"
        >
          🔄
        </button>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-1 text-sm text-red-600 flex items-center space-x-1">
          <span>⚠️</span>
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            className="text-red-600 hover:text-red-800 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Información adicional */}
      {!loading && !error && categories.length === 0 && (
        <div className="mt-1 text-sm text-gray-500">
          No hay categorías disponibles
        </div>
      )}
    </div>
  );
};

export default CategorySelector;