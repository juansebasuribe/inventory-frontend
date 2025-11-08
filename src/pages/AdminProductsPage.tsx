// src/pages/AdminProductsPage.tsx

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Edit,
  Eye,
  Filter,
  Home,
  Loader2,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  Warehouse,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../features/products/services/productService';
import { inventoryService } from '../features/products/services/inventoryService';
import { categoryService } from '../shared/services/categoryService';
import { ProductEditModal } from '../features/products/components/ProductEditModal';
import { ProductCreateModal } from '../features/products/components/ProductCreateModal';
import type { Product as ProductType } from '../shared/types/product.types';
import { getProductImageUrl } from '../shared/utils/url.utils';

// ========================================
// TIPOS Y CONSTANTES
// ========================================

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

interface CategoryOption {
  id: number;
  name: string;
}

interface InventoryItem {
  id: number;
  product_code: string;
  product_name: string;
  warehouse_code: string;
  warehouse_name: string;
  current_stock: number;
  minimum_stock: number;  // min_quantity del backend
  maximum_stock: number;  // max_quantity del backend
  aisle?: string;
  shelf?: string;
  bin?: string;
  needs_restock?: boolean;
  overstock?: boolean;
}

interface ProductWithStock {
  id: number;
  name: string;
  bar_code: string;
  description?: string;
  retail_price: number;
  cost_price: number;
  category?: {
    id: number;
    name: string;
  };
  main_image?: string | null;
  total_stock: number;
  // NOTA: minimum_stock y maximum_stock NO existen a nivel de producto
  // Se almacenan en InventoryItem por ubicación
  stock_by_location: InventoryItem[];
  needs_restock?: boolean;
  primary_provider?: ProductType['primary_provider'];
  primary_cost_price?: number;
  provider_relationships?: ProductType['provider_relationships'];
}

const ITEMS_PER_PAGE = 10;

const STOCK_FILTER_OPTIONS: Array<{ value: StockFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'in_stock', label: 'Con stock' },
  { value: 'low_stock', label: 'Stock bajo' },
  { value: 'out_of_stock', label: 'Agotados' }
];

// Colores corporativos TITA
const COLORS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  primaryOutline: 'border-blue-600 text-blue-600 hover:bg-blue-50',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  card: 'bg-white border border-gray-200 rounded-xl shadow-sm',
  badge: {
    available: 'bg-green-100 text-green-700',
    low: 'bg-amber-100 text-amber-700',
    out: 'bg-red-100 text-red-700'
  }
};

// ========================================
// UTILIDADES
// ========================================

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);

const groupInventoryByProduct = (items: InventoryItem[]): Record<string, InventoryItem[]> => {
  return items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const key = item.product_code;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
};

const toProductWithStock = (
  product: ProductType,
  inventoryItems: InventoryItem[] = []
): ProductWithStock => {
  const totalStock = inventoryItems.reduce((sum, item) => sum + (item.current_stock || 0), 0);
  const needsRestock = inventoryItems.some(item => item.needs_restock);

  return {
    id: product.id,
    name: product.name,
    bar_code: product.bar_code,
    description: product.description,
    retail_price: product.retail_price,
    cost_price: product.cost_price,
    category: product.category
      ? { id: Number(product.category), name: product.category_name || '' }
      : undefined,
    main_image: product.main_image,
    total_stock: totalStock || product.total_stock || 0,
    // NOTA: minimum_stock y maximum_stock están en cada ubicación (InventoryItem),
    // no a nivel de producto
    stock_by_location: inventoryItems,
    needs_restock: needsRestock,
    primary_provider: product.primary_provider,
    primary_cost_price: product.primary_cost_price,
    provider_relationships: product.provider_relationships || []
  };
};

// ========================================
// COMPONENTE: MODAL DE UBICACIONES CON EDICIÓN
// ========================================

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductWithStock;
  onUpdateLocation?: (locationId: number, minStock: number, maxStock: number) => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, product, onUpdateLocation }) => {
  const [editingLocation, setEditingLocation] = React.useState<number | null>(null);
  const [editValues, setEditValues] = React.useState<{ min: number; max: number }>({ min: 0, max: 0 });
  const [saving, setSaving] = React.useState(false);

  if (!isOpen) return null;

  const startEdit = (location: InventoryItem) => {
    setEditingLocation(location.id);
    setEditValues({
      min: location.minimum_stock || 0,
      max: location.maximum_stock || 0,
    });
  };

  const cancelEdit = () => {
    setEditingLocation(null);
    setEditValues({ min: 0, max: 0 });
  };

  const saveEdit = async (locationId: number) => {
    if (editValues.max < editValues.min) {
      alert('El stock máximo debe ser mayor o igual al mínimo');
      return;
    }

    setSaving(true);
    try {
      if (onUpdateLocation) {
        await onUpdateLocation(locationId, editValues.min, editValues.max);
      }
      setEditingLocation(null);
    } catch (error) {
      console.error('Error al actualizar límites:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Warehouse className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Ubicaciones de inventario</h2>
              <p className="text-sm text-gray-500">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          {product.stock_by_location.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Sin ubicaciones registradas</h3>
              <p className="mt-2 text-sm text-gray-500">
                Este producto aún no tiene ubicaciones de almacenamiento.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {product.stock_by_location.map(location => {
                const isEditing = editingLocation === location.id;
                
                return (
                  <div
                    key={location.id}
                    className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
                      location.needs_restock
                        ? 'border-red-200 bg-red-50'
                        : location.overstock
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Warehouse info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                          location.needs_restock
                            ? 'bg-red-100'
                            : location.overstock
                              ? 'bg-amber-100'
                              : 'bg-blue-100'
                        }`}>
                          <MapPin className={`h-6 w-6 ${
                            location.needs_restock
                              ? 'text-red-600'
                              : location.overstock
                                ? 'text-amber-600'
                                : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{location.warehouse_name}</h3>
                          <p className="text-sm text-gray-500">{location.warehouse_code}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {location.needs_restock && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            Reabastecer
                          </span>
                        )}
                        {location.overstock && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            <AlertTriangle className="h-3 w-3" />
                            Sobrestock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock info - Editable */}
                    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-200 pt-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Actual</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{location.current_stock}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Mínimo</p>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editValues.min}
                            onChange={(e) => setEditValues({ ...editValues, min: parseInt(e.target.value) || 0 })}
                            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm font-semibold"
                            disabled={saving}
                          />
                        ) : (
                          <p className="mt-1 text-xl font-semibold text-gray-700">
                            {location.minimum_stock !== null && location.minimum_stock !== undefined ? location.minimum_stock : '-'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Máximo</p>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editValues.max}
                            onChange={(e) => setEditValues({ ...editValues, max: parseInt(e.target.value) || 0 })}
                            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm font-semibold"
                            disabled={saving}
                          />
                        ) : (
                          <p className="mt-1 text-xl font-semibold text-gray-700">
                            {location.maximum_stock !== null && location.maximum_stock !== undefined ? location.maximum_stock : '-'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botones de edición */}
                    {isEditing ? (
                      <div className="mt-4 flex gap-2 border-t border-gray-200 pt-4">
                        <button
                          onClick={() => saveEdit(location.id)}
                          disabled={saving}
                          className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="flex-1 rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(location)}
                        className="mt-4 w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      >
                        <Edit className="inline h-3 w-3 mr-1" />
                        Editar límites
                      </button>
                    )}

                    {/* Location details */}
                    {(location.aisle || location.shelf || location.bin) && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4">
                        {location.aisle && (
                          <div className="rounded-lg bg-gray-100 px-3 py-1.5">
                            <span className="text-xs font-medium text-gray-600">Pasillo:</span>
                            <span className="ml-1 text-xs font-semibold text-gray-900">{location.aisle}</span>
                          </div>
                        )}
                        {location.shelf && (
                          <div className="rounded-lg bg-gray-100 px-3 py-1.5">
                            <span className="text-xs font-medium text-gray-600">Estante:</span>
                            <span className="ml-1 text-xs font-semibold text-gray-900">{location.shelf}</span>
                          </div>
                        )}
                        {location.bin && (
                          <div className="rounded-lg bg-gray-100 px-3 py-1.5">
                            <span className="text-xs font-medium text-gray-600">Contenedor:</span>
                            <span className="ml-1 text-xs font-semibold text-gray-900">{location.bin}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{product.stock_by_location.length}</span> ubicaciones registradas
            </div>
            <button
              onClick={onClose}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${COLORS.secondary}`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export const AdminProductsPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados principales
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithStock[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState<StockFilter>('all');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
  const [isModalTransitioning, setIsModalTransitioning] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUnits: 0,
    lowStock: 0,
    inventoryValue: 0
  });

  // ========================================
  // CARGA DE DATOS
  // ========================================

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [categoryResponse, productsResponse, inventoryResponse] = await Promise.all([
        categoryService.getCategories(),
        // Backend solo expone /simple/ para productos
        productService.getProducts({ page_size: 500, ordering: 'name' }),
        inventoryService.getInventoryItems({ page_size: 1000 }).catch(() => ({ results: [] }))
      ]);

      const inventoryByProduct = groupInventoryByProduct(inventoryResponse.results || []);
      const productResults = (productsResponse.results as ProductType[]) || [];
      
      const mappedProducts = productResults
        .map(product => toProductWithStock(product, inventoryByProduct[product.bar_code]))
        .sort((a, b) => a.name.localeCompare(b.name));

      setProducts(mappedProducts);
      setCategories(
        categoryResponse
          .map(cat => ({ id: cat.id, name: cat.name }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      // Calcular estadísticas
      const totalUnits = mappedProducts.reduce((sum, p) => sum + (p.total_stock || 0), 0);
      const lowStock = mappedProducts.filter(p => p.needs_restock).length;
      const inventoryValue = mappedProducts.reduce(
        (sum, p) => sum + (p.total_stock || 0) * (p.cost_price || 0),
        0
      );

      setStats({
        totalProducts: mappedProducts.length,
        totalUnits,
        lowStock,
        inventoryValue
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ========================================
  // FILTRADO Y PAGINACIÓN
  // ========================================

  useEffect(() => {
    let filtered = products;

    // Filtro de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(term) ||
          p.bar_code.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    // Filtro de categoría
    if (filterCategory) {
      const categoryId = Number(filterCategory);
      filtered = filtered.filter(p => p.category?.id === categoryId);
    }

    // Filtro de stock
    if (filterStock === 'in_stock') {
      filtered = filtered.filter(p => (p.total_stock || 0) > 0);
    } else if (filterStock === 'low_stock') {
      filtered = filtered.filter(p => p.needs_restock);
    } else if (filterStock === 'out_of_stock') {
      filtered = filtered.filter(p => (p.total_stock || 0) === 0);
    }

    setFilteredProducts(filtered);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [products, searchTerm, filterCategory, filterStock]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ========================================
  // HANDLERS
  // ========================================

  const handleRefresh = useCallback(() => {
    void loadData();
  }, [loadData]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterStock('all');
  }, []);

  const handleEditProduct = useCallback((product: ProductWithStock) => {
    if (isModalTransitioning) return;
    
    setIsModalTransitioning(true);
    setSelectedProduct(product);
    
    setTimeout(() => {
      setShowEditModal(true);
      setIsModalTransitioning(false);
    }, 100);
  }, [isModalTransitioning]);

  const handleViewLocations = useCallback((product: ProductWithStock) => {
    if (isModalTransitioning) return;
    
    setIsModalTransitioning(true);
    setSelectedProduct(product);
    
    setTimeout(() => {
      setShowLocationModal(true);
      setIsModalTransitioning(false);
    }, 100);
  }, [isModalTransitioning]);

  const handleUpdateLocation = useCallback(async (locationId: number, minStock: number, maxStock: number) => {
    try {
      // Actualizar el item de inventario usando el servicio
      const response = await inventoryService.updateInventoryItem(locationId, {
        min_quantity: minStock,
        max_quantity: maxStock,
      });

      console.log('Límites de stock actualizados:', response);

      // Recargar los datos para reflejar los cambios
      await loadData();

      return response;
    } catch (error) {
      console.error('Error al actualizar límites de stock:', error);
      throw error;
    }
  }, [loadData]);

  const handleOpenCreateModal = useCallback(() => {
    if (isModalTransitioning) return;
    
    setIsModalTransitioning(true);
    
    setTimeout(() => {
      setShowCreateModal(true);
      setIsModalTransitioning(false);
    }, 100);
  }, [isModalTransitioning]);

  const handleProductSaved = useCallback(() => {
    // Inmediatamente recargar datos y limpiar estado
    void loadData();
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedProduct(null);
    setIsModalTransitioning(false);
  }, [loadData]);

  const handleCloseCreateModal = useCallback(() => {
    setIsModalTransitioning(true);
    setShowCreateModal(false);
    
    setTimeout(() => {
      setIsModalTransitioning(false);
    }, 300);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsModalTransitioning(true);
    setShowEditModal(false);
    
    setTimeout(() => {
      setSelectedProduct(null);
      setIsModalTransitioning(false);
    }, 300);
  }, []);

  const handleCloseLocationModal = useCallback(() => {
    setIsModalTransitioning(true);
    setShowLocationModal(false);
    
    setTimeout(() => {
      setSelectedProduct(null);
      setIsModalTransitioning(false);
    }, 300);
  }, []);

  const handleDeleteProduct = useCallback(async (product: ProductWithStock) => {
    // Verificar que el producto no tenga stock
    if ((product.total_stock || 0) > 0) {
      alert('No se puede eliminar un producto con stock. Primero debe mover o eliminar el inventario.');
      return;
    }

    // Confirmar eliminación
    const confirmed = window.confirm(
      `¿Está seguro de eliminar el producto "${product.name}"?\n\nCódigo: ${product.bar_code}\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      
      // Llamar al servicio para eliminar el producto (usa bar_code)
      await productService.deleteProduct(product.bar_code);
      
      console.log(`Producto ${product.bar_code} eliminado exitosamente`);
      
      // Recargar los datos
      await loadData();
      
      alert('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      alert('Error al eliminar el producto. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  const getStockBadge = (product: ProductWithStock) => {
    if ((product.total_stock || 0) === 0) {
      return { label: 'Agotado', className: COLORS.badge.out };
    }
    if (product.needs_restock) {
      return { label: 'Stock bajo', className: COLORS.badge.low };
    }
    return { label: 'Disponible', className: COLORS.badge.available };
  };

  const hasActiveFilters = Boolean(searchTerm || filterCategory || filterStock !== 'all');

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 lg:px-8">
      {/* Header */}
      <div className={`mb-6 ${COLORS.card} p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1 transition-colors hover:text-gray-900"
              >
                <Home className="h-4 w-4" />
                Inicio
              </button>
              <span className="text-gray-300">/</span>
              <span className="font-medium text-gray-700">Gestión de Productos</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
              <p className="mt-1 text-sm text-gray-500">
                Administra tu inventario, consulta stock y gestiona ubicaciones
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${COLORS.primaryOutline}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${COLORS.secondary} disabled:opacity-50`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              disabled={isModalTransitioning}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors ${COLORS.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Plus className="h-4 w-4" />
              Nuevo Producto
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className={COLORS.card + ' p-5'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Productos</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className={COLORS.card + ' p-5'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Unidades Totales</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalUnits}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className={COLORS.card + ' p-5'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Stock Bajo</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{stats.lowStock}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className={COLORS.card + ' p-5'}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Valor Inventario</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(stats.inventoryValue)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`mb-6 ${COLORS.card} p-6`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, código de barras o descripción..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-600">Filtros</span>
            </div>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STOCK_FILTER_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilterStock(option.value)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                filterStock === option.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={COLORS.card}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No se encontraron productos</h3>
            <p className="mt-2 text-sm text-gray-500">
              Ajusta los filtros o crea un nuevo producto para comenzar.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Precio</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedProducts.map(product => {
                    const badge = getStockBadge(product);
                    return (
                      <tr key={product.id} className="transition-colors hover:bg-gray-50/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                              {product.main_image ? (
                                <img
                                  src={getProductImageUrl(product)}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.bar_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {product.category?.name || 'Sin categoría'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{product.total_stock || 0}</span>
                            <span className="text-xs text-gray-500">
                              {product.stock_by_location.length} ubicaciones
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(product.retail_price)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewLocations(product)}
                              disabled={isModalTransitioning}
                              className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Ver y editar ubicaciones y límites de stock"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditProduct(product)}
                              disabled={isModalTransitioning}
                              className={`rounded-lg p-2 transition-colors ${COLORS.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
                              title="Editar producto"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {(product.total_stock || 0) === 0 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product)}
                                disabled={isModalTransitioning || loading}
                                className={`rounded-lg p-2 transition-colors ${COLORS.danger} disabled:opacity-50 disabled:cursor-not-allowed`}
                                title="Eliminar producto (solo disponible sin stock)"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                <div className="text-sm text-gray-600">
                  Mostrando{' '}
                  <span className="font-semibold">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{' '}
                  a{' '}
                  <span className="font-semibold">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}
                  </span>{' '}
                  de <span className="font-semibold">{filteredProducts.length}</span> productos
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`inline-flex items-center rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`inline-flex items-center rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      {showCreateModal && (
        <ProductCreateModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onProductCreated={handleProductSaved}
        />
      )}

      {showEditModal && selectedProduct && (
        <ProductEditModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          product={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            bar_code: selectedProduct.bar_code,
            description: selectedProduct.description || '',
            retail_price: selectedProduct.retail_price,
            cost_price: selectedProduct.cost_price,
            category: selectedProduct.category?.id || 0,
            category_name: selectedProduct.category?.name || '',
            main_image: selectedProduct.main_image || null,
            total_stock: selectedProduct.total_stock,
            current_price: selectedProduct.retail_price,
            in_stock: (selectedProduct.total_stock || 0) > 0,
            needs_restock: selectedProduct.needs_restock || false,
            active: true,
            additional_images: [],
            primary_provider: selectedProduct.primary_provider,
            primary_cost_price: selectedProduct.primary_cost_price,
            provider_relationships: selectedProduct.provider_relationships || [],
            can_modify_price: true,
            is_tt_discount: false,
            creation_date: '',
            update_date: ''
          }}
          onProductUpdated={handleProductSaved}
        />
      )}

      {showLocationModal && selectedProduct && (
        <LocationModal
          isOpen={showLocationModal}
          onClose={handleCloseLocationModal}
          product={selectedProduct}
          onUpdateLocation={handleUpdateLocation}
        />
      )}
    </div>
  );
};

export default AdminProductsPage;
