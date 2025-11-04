// src/pages/ProductsPage.tsx

/**
 * ProductsPage - Página de productos hermosa para Tita Comercializadora
 * Catálogo organizado por categorías con diseño atractivo
 * Conectada con backend para datos reales
 */

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  WrenchScrewdriverIcon,
  HomeIcon,
  GiftIcon,
  SparklesIcon,
  TagIcon,
  StarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ProductCard } from '../features/products/components/ProductCard';
import { ProductList } from '../features/products/components/ProductList';
import { categoryService } from '../shared/services/categoryService';
import type { Category } from '../shared/types/product.types';

const ProductsPage: React.FC = () => {
  // Estados de UI
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000000]);

  // Estados de datos del backend  
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Categorías predefinidas con iconos para UI (se combinan con datos del backend)
  const categoryIcons = {
    'all': { icon: Squares2X2Icon, color: 'bg-gray-500', emoji: '📦' },
    'ferreteria': { icon: WrenchScrewdriverIcon, color: 'bg-orange-500', emoji: '🔧' },
    'jugueteria': { icon: GiftIcon, color: 'bg-pink-500', emoji: '🧸' },
    'hogar': { icon: HomeIcon, color: 'bg-blue-500', emoji: '🏠' },
    'cacharreria': { icon: SparklesIcon, color: 'bg-green-500', emoji: '🍽️' }
  };

  // Helper para obtener iconos de categoría
  const getCategoryIcon = (category: Category) => {
    const key = category.id === 0 ? 'all' : category.name.toLowerCase();
    const iconConfig = categoryIcons[key as keyof typeof categoryIcons] || categoryIcons.all;
    return iconConfig;
  };

  // Efectos para cargar categorías
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setError(null);
      const backendCategories = await categoryService.getCategories();
      
      // Crear categoría "Todos" siempre como primera opción
      const allCategory: Category = {
        id: 0,
        name: 'Todos los Productos',
        description: 'Todas las categorías de productos',
        active: true,
        parent: null,
        order: 0,
        image: null,
        creation_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
        created_by: 1,
        updated_by: 1
      };
      
      setCategories([allCategory, ...backendCategories]);
    } catch (err) {
      console.error('Error loading categories:', err);
      
      // Categorías de fallback para desarrollo/demo
      const fallbackCategories: Category[] = [
        {
          id: 0,
          name: 'Todos los Productos',
          description: 'Todas las categorías de productos',
          active: true,
          parent: null,
          order: 0,
          image: null,
          creation_date: new Date().toISOString(),
          update_date: new Date().toISOString(),
          created_by: 1,
          updated_by: 1
        },
        {
          id: 1,
          name: 'Ferretería',
          description: 'Herramientas y materiales de construcción',
          active: true,
          parent: null,
          order: 1,
          image: null,
          creation_date: new Date().toISOString(),
          update_date: new Date().toISOString(),
          created_by: 1,
          updated_by: 1
        },
        {
          id: 2,
          name: 'Juguetería',
          description: 'Juguetes y entretenimiento infantil',
          active: true,
          parent: null,
          order: 2,
          image: null,
          creation_date: new Date().toISOString(),
          update_date: new Date().toISOString(),
          created_by: 1,
          updated_by: 1
        },
        {
          id: 3,
          name: 'Artículos del Hogar',
          description: 'Productos para el hogar y decoración',
          active: true,
          parent: null,
          order: 3,
          image: null,
          creation_date: new Date().toISOString(),
          update_date: new Date().toISOString(),
          created_by: 1,
          updated_by: 1
        },
        {
          id: 4,
          name: 'Cacharrería',
          description: 'Utensilios de cocina y hogar',
          active: true,
          parent: null,
          order: 4,
          image: null,
          creation_date: new Date().toISOString(),
          update_date: new Date().toISOString(),
          created_by: 1,
          updated_by: 1
        }
      ];
      
      setCategories(fallbackCategories);
    }
  };



  // Estados para filtros adicionales de UI
  const [filters, setFilters] = useState({
    onSale: false,
    isNew: false,
    inStock: true
  });

  // Mostrar error si existe
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar productos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadCategories();
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Catálogo de Productos
              </h1>
              <p className="text-gray-600">
                Encuentra todo lo que necesitas en Tita Comercializadora
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="mt-4 md:mt-0 md:w-96">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories and Filters */}
          <div className="lg:w-80">
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorías</h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const iconConfig = getCategoryIcon(category);
                  const IconComponent = iconConfig.icon;
                  const isSelected = selectedCategory === category.id || (selectedCategory === 'all' && category.id === 0);
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id === 0 ? 'all' : category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                        isSelected
                          ? 'bg-orange-50 border-2 border-orange-200 text-orange-700'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{iconConfig.emoji}</span>
                        <IconComponent className={`h-5 w-5 ${
                          isSelected ? 'text-orange-600' : 'text-gray-500'
                        }`} />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        isSelected
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {category.id === 0 ? '...' : '...'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                </button>
              </div>
              
              {showFilters && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rango de Precio
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        placeholder="Mín"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        placeholder="Máx"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000000])}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.onSale}
                          onChange={(e) => setFilters({...filters, onSale: e.target.checked})}
                          className="rounded text-orange-600 focus:ring-orange-500" 
                        />
                        <span className="ml-2 text-sm">En oferta</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.isNew}
                          onChange={(e) => setFilters({...filters, isNew: e.target.checked})}
                          className="rounded text-orange-600 focus:ring-orange-500" 
                        />
                        <span className="ml-2 text-sm">Productos nuevos</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.inStock}
                          onChange={(e) => setFilters({...filters, inStock: e.target.checked})}
                          className="rounded text-orange-600 focus:ring-orange-500" 
                        />
                        <span className="ml-2 text-sm">Solo en stock</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* View Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    <TagIcon className="h-4 w-4 mr-1" />
                    {categories.find(c => c.id === selectedCategory)?.name || 'Categoría'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid'
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list'
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <ViewColumnsIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Featured Products Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl p-6 mb-8 text-white">
              <h2 className="text-2xl font-bold mb-2">Productos Destacados</h2>
              <p className="opacity-90">Los favoritos de nuestros clientes</p>
            </div>

            {/* Products List usando componente real */}
            <ProductList
              initialFilters={{
                search: searchTerm,
                active: true
              }}
              onViewProduct={(product) => {
                console.log('Producto seleccionado:', product);
                // Aquí se puede agregar lógica para mostrar detalle del producto
              }}
              onAddToCart={(product) => {
                console.log('Agregar al carrito:', product);
                // Aquí se integraría con el servicio de carrito
              }}
              className="min-h-[400px]"
            />


          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;