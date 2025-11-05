// src/features/products/components/ProductList.tsx


import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { ProductCard } from './ProductCard';
import type { 
  Product, 
  ProductSimple,
  ProductSearchParams
} from '../../../shared/types/product.types';

interface ProductListProps {
  onAddToCart?: (product: Product | ProductSimple) => void;
  onViewProduct?: (product: Product | ProductSimple) => void;
  onEditProduct?: (product: Product | ProductSimple) => void;
  initialFilters?: Partial<ProductSearchParams>;
  showFilters?: boolean;
  pageSize?: number;
  className?: string;
  refreshToken?: number;
}

// Filtros locales más simples para el componente
interface LocalFilters {
  search?: string;
  category?: string;
  in_stock?: boolean;
  active?: boolean;
  min_price?: number;
  max_price?: number;
  needs_restock?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  onAddToCart,
  onViewProduct,
  onEditProduct,
  initialFilters = {},
  showFilters = true,
  pageSize = 12,
  className = '',
  refreshToken,
}) => {
  // Estados
  const [products, setProducts] = useState<(Product | ProductSimple)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [pagination, setPagination] = useState<{
    count: number;
    currentPage: number;
    totalPages: number;
  }>({
    count: 0,
    currentPage: 1,
    totalPages: 0
  });

  // Filtros locales
  const [filters, setFilters] = useState<LocalFilters>({
    search: initialFilters.search,
    active: initialFilters.active
  });
  const [searchInput, setSearchInput] = useState(initialFilters.search || '');

  const _instanceId = React.useRef(Math.random().toString(36).slice(2, 9));
  React.useEffect(() => {
    // tslint:disable-next-line:no-console
    console.log(`[mount] ProductList id=${_instanceId.current} time=${Date.now()}`);
    return () => {
      // tslint:disable-next-line:no-console
      console.log(`[unmount] ProductList id=${_instanceId.current} time=${Date.now()}`);
    };
  }, []);

  // Cargar productos
  const loadProducts = async (page: number = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      setError('');

      // Convertir filtros locales a ProductSearchParams
      const searchParams: ProductSearchParams = {
        page,
        page_size: pageSize,
        ordering: 'name',
        search: currentFilters.search,
        active: currentFilters.active,
        in_stock: currentFilters.in_stock,
        needs_restock: currentFilters.needs_restock,
        price_min: currentFilters.min_price,
        price_max: currentFilters.max_price,
        category: currentFilters.category ? parseInt(currentFilters.category) : undefined
      };

      const response = await productService.getProducts(searchParams);

      setProducts(response.results);
      setPagination({
        count: response.count,
        currentPage: page,
        totalPages: Math.ceil(response.count / pageSize)
      });

    } catch (err: any) {
      setError(err.message || 'Error al cargar productos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Efecto inicial
  useEffect(() => {
    loadProducts();
  }, []);

  const hasRefreshedOnce = React.useRef(false);
  useEffect(() => {
    if (refreshToken === undefined) return;
    if (!hasRefreshedOnce.current) {
      hasRefreshedOnce.current = true;
      return;
    }
    console.log(`[ProductList ${_instanceId.current}] refreshToken=${refreshToken}`);
    loadProducts(pagination.currentPage || 1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters = { ...filters, search: searchInput };
    setFilters(newFilters);
    loadProducts(1, newFilters);
  };

  // Manejar agregar al carrito
  const handleAddToCart = async (product: Product | ProductSimple) => {
    try {
      const productCode = (product as Product).bar_code;
      
      if (!productCode) {
        alert('Error: Producto sin código de barras');
        return;
      }

      // ✅ El backend espera bar_code
      await cartService.addToCart({
        bar_code: productCode,
        quantity: 1
      });

      // Mostrar confirmación
      alert(`✅ ${product.name} agregado al carrito`);

      // Llamar callback si existe
      if (onAddToCart) {
        onAddToCart(product);
      }
    } catch (error: any) {
      console.error('Error al agregar al carrito:', error);
      alert(`❌ Error: ${error.message || 'No se pudo agregar al carrito'}`);
    }
  };

  // Manejar cambio de filtros
  const handleFilterChange = (key: keyof LocalFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadProducts(1, newFilters);
  };

  // Limpiar filtros
  const clearFilters = () => {
    const newFilters = {};
    setFilters(newFilters);
    setSearchInput('');
    loadProducts(1, newFilters);
  };

  // Manejar paginación
  const handlePageChange = (page: number) => {
    loadProducts(page);
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
          {Math.min(pagination.currentPage * pageSize, pagination.count)} de{' '}
          {pagination.count} productos
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
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
          
          {/* Búsqueda */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar productos..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                Stock
              </label>
              <select
                value={filters.in_stock === undefined ? '' : filters.in_stock.toString()}
                onChange={(e) => 
                  handleFilterChange('in_stock', e.target.value === '' ? undefined : e.target.value === 'true')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="true">Con stock</option>
                <option value="false">Sin stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio mínimo
              </label>
              <input
                type="number"
                value={filters.min_price || ''}
                onChange={(e) => 
                  handleFilterChange('min_price', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio máximo
              </label>
              <input
                type="number"
                value={filters.max_price || ''}
                onChange={(e) => 
                  handleFilterChange('max_price', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              {pagination.count} productos encontrados
            </div>
          </div>
        </div>
      )}

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

      {/* Lista de productos */}
      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No se encontraron productos</div>
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.bar_code}
                  product={product as Product}  // Cast temporal
                  onAddToCart={handleAddToCart}
                  onViewDetails={onViewProduct}
                  onEdit={onEditProduct}
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

// Usar React.memo para optimizar re-renderizados
export const MemoizedProductList = React.memo(ProductList);
export { MemoizedProductList as ProductList };
export default ProductList;