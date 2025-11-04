// src/features/categories/components/CategoryTree.tsx

/**
 * Componente CategoryTree - Árbol de categorías jerárquico
 * Navegación y gestión de categorías anidadas
 * FASE 7.3 - Componentes UI Profesionales
 */

import React, { useState, useEffect } from 'react';
import { categoryService } from '../../../shared/services/categoryService';
import type { CategoryTree as CategoryTreeType, Category } from '../../../shared/types/product.types';

interface CategoryTreeProps {
  onCategorySelect?: (category: Category) => void;
  onCategoryEdit?: (category: Category) => void;
  selectedCategoryId?: number;
  showProductCount?: boolean;
  allowEdit?: boolean;
  className?: string;
  refreshKey?: number;
}

interface CategoryNodeProps {
  category: CategoryTreeType;
  level: number;
  onSelect?: (category: Category) => void;
  onEdit?: (category: Category) => void;
  isSelected?: boolean;
  showProductCount?: boolean;
  allowEdit?: boolean;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level,
  onSelect,
  onEdit,
  isSelected,
  showProductCount,
  allowEdit
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Expandir primeros 2 niveles por defecto
  const hasChildren = category.subcategories && category.subcategories.length > 0;
  
  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(category);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(category);
    }
  };

  return (
    <div className="select-none">
      {/* Nodo de categoría */}
      <div
        className={`flex items-center space-x-2 py-2 px-3 rounded-md cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-blue-100 text-blue-800 border border-blue-300' 
            : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={handleSelect}
      >
        {/* Icono de expansión */}
        <div 
          className="w-4 h-4 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
        >
          {hasChildren ? (
            <span className={`text-gray-400 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
          ) : (
            <span className="text-gray-300">●</span>
          )}
        </div>

        {/* Icono de categoría */}
        <span className="text-lg">
          {hasChildren ? '📁' : '📄'}
        </span>

        {/* Nombre de categoría */}
        <span className="flex-1 font-medium text-gray-900">
          {category.name}
        </span>

        {/* Contador de productos */}
        {showProductCount && category.product_count !== undefined && (
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {category.product_count}
          </span>
        )}

        {/* Botón de edición */}
        {allowEdit && (
          <button
            onClick={handleEdit}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Editar categoría"
          >
            ✏️
          </button>
        )}
      </div>

      {/* Subcategorías */}
      {hasChildren && isExpanded && (
        <div className="ml-2">
          {category.subcategories.map((subcategory) => (
            <CategoryNode
              key={subcategory.id}
              category={subcategory}
              level={level + 1}
              onSelect={onSelect}
              onEdit={onEdit}
              isSelected={isSelected}
              showProductCount={showProductCount}
              allowEdit={allowEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryTree: React.FC<CategoryTreeProps> = ({
  onCategorySelect,
  onCategoryEdit,
  selectedCategoryId,
  showProductCount = true,
  allowEdit = false,
  className = '',
  refreshKey = 0
}) => {
  // Estados
  const [categories, setCategories] = useState<CategoryTreeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<CategoryTreeType[]>([]);

  // Cargar categorías
  useEffect(() => {
    loadCategories();
  }, [refreshKey]); // ← Recargar cuando cambie refreshKey

  // Filtrar categorías por búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = filterCategoriesBySearch(categories, searchTerm.toLowerCase());
      setFilteredCategories(filtered);
    }
  }, [categories, searchTerm]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const categoriesData = await categoryService.getCategoryTree();
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar categorías');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCategoriesBySearch = (categories: CategoryTreeType[], search: string): CategoryTreeType[] => {
    return categories.filter(category => {
      // Buscar en el nombre
      const nameMatches = category.name.toLowerCase().includes(search);
      
      // Buscar en subcategorías
      const hasMatchingChildren = category.subcategories && 
        filterCategoriesBySearch(category.subcategories, search).length > 0;
      
      if (nameMatches || hasMatchingChildren) {
        return {
          ...category,
          subcategories: hasMatchingChildren 
            ? filterCategoriesBySearch(category.subcategories, search)
            : category.subcategories
        };
      }
      
      return false;
    }).filter(Boolean);
  };

  const handleRefresh = () => {
    loadCategories();
  };

  // Loading state
  if (loading && categories.length === 0) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Categorías
        </h3>
        
        <div className="flex items-center space-x-2">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
          
          <button
            onClick={handleRefresh}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Actualizar"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar categorías..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">⚠️</span>
            <span className="text-red-600">{error}</span>
            <button
              onClick={handleRefresh}
              className="ml-auto text-sm text-red-600 hover:text-red-800 underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Lista de categorías */}
      {!error && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 
                'No se encontraron categorías que coincidan con la búsqueda' :
                'No hay categorías disponibles'
              }
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {filteredCategories.map((category) => (
                <CategoryNode
                  key={category.id}
                  category={category}
                  level={0}
                  onSelect={onCategorySelect}
                  onEdit={onCategoryEdit}
                  isSelected={selectedCategoryId === category.id}
                  showProductCount={showProductCount}
                  allowEdit={allowEdit}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Información adicional */}
      {!error && categories.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          {categories.length} categorías principales
          {searchTerm && ` • Filtrado: "${searchTerm}"`}
        </div>
      )}
    </div>
  );
};

export default CategoryTree;