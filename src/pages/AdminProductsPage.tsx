// src/pages/AdminProductsPage.tsx

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Home, 
  RefreshCw, 
  Search, 
  Filter, 
  Package, 
  Edit, 
  Trash2,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../features/products/services/productService';
import { inventoryService } from '../features/products/services/inventoryService';
import { categoryService } from '../shared/services/categoryService';
import { ProductEditModal } from '../features/products/components/ProductEditModal';
import { ProductCreateModal } from '../features/products/components/ProductCreateModal';
import type { Product as ProductType } from '../shared/types/product.types';
import { getProductImageUrl as getImageUrl } from '../shared/utils/url.utils';

// Interfaces locales
interface ProductSimple {
  id: number;
  name: string;
  bar_code: string;
  description: string;
  retail_price: number;
  wholesale_price: number;
  cost_price: number;
  category?: {
    id: number;
    name: string;
  };
  active: boolean;
  image?: string;
}

interface InventoryItem {
  id: number;
  product_code: string;
  product_name: string;
  warehouse_code: string;
  warehouse_name: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  needs_restock?: boolean;
  overstock?: boolean;
}

interface ProductWithStock extends ProductSimple {
  total_stock: number;
  stock_by_location: InventoryItem[];
  low_stock_count: number;
  out_of_stock_count: number;
}

export const AdminProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStock, setFilterStock] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadCategories()
      ]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      // Cargar productos usando getProducts
      const productsResponse = await productService.getProducts({
        page: 1,
        page_size: 1000
      });

      // Cargar inventario
      const inventoryResponse = await inventoryService.getInventoryItems({
        page: 1,
        page_size: 5000
      });

      const inventoryItems = inventoryResponse.results || [];
      const productsList = productsResponse.results || [];

      console.log('📦 Productos raw:', productsList[0]); // Debug: ver estructura

      // Combinar productos con su inventario
      const productsWithStock: ProductWithStock[] = productsList.map((product: any) => {
        // Filtrar items de inventario de este producto
        const productInventory = inventoryItems.filter(
          (item: InventoryItem) => item.product_code === product.bar_code
        );

        const totalStock = productInventory.reduce((sum, item) => sum + item.current_stock, 0);
        const lowStockCount = productInventory.filter(
          item => item.current_stock <= item.minimum_stock && item.current_stock > 0
        ).length;
        const outOfStockCount = productInventory.filter(item => item.current_stock === 0).length;

        // Mapear la categoría si viene como ID
        let categoryInfo = product.category;
        if (typeof product.category === 'number') {
          const foundCategory = categories.find(cat => cat.id === product.category);
          categoryInfo = foundCategory ? { id: foundCategory.id, name: foundCategory.name } : null;
        }

        return {
          ...product,
          category: categoryInfo,
          total_stock: totalStock,
          stock_by_location: productInventory,
          low_stock_count: lowStockCount,
          out_of_stock_count: outOfStockCount
        };
      });

      console.log('📦 Productos con stock:', productsWithStock);
      setProducts(productsWithStock);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      console.log('📂 Categorías cargadas:', data);
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setCategories([]); // Establecer array vacío en caso de error
    }
  };

  const toggleProductExpand = (productId: number) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.bar_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === '' || 
      product.category?.id.toString() === filterCategory;
    
    let matchesStock = true;
    if (filterStock === 'in_stock') {
      matchesStock = product.total_stock > 0;
    } else if (filterStock === 'low_stock') {
      matchesStock = product.low_stock_count > 0;
    } else if (filterStock === 'out_of_stock') {
      matchesStock = product.total_stock === 0;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Calcular estadísticas
  const totalProducts = products.length;
  const productsInStock = products.filter(p => p.total_stock > 0).length;
  const productsLowStock = products.filter(p => p.low_stock_count > 0).length;
  const productsOutOfStock = products.filter(p => p.total_stock === 0).length;

  const getStockStatusBadge = (product: ProductWithStock) => {
    if (product.total_stock === 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Sin Stock</span>;
    } else if (product.low_stock_count > 0) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">Stock Bajo</span>;
    } else {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Stock Normal</span>;
    }
  };

  const handleEditProduct = async (product: ProductWithStock) => {
    console.log('Editando producto:', product);
    // Cargar el producto completo del servidor para tener todos los datos
    try {
      const fullProduct = await productService.getProductByBarCode(product.bar_code);
      setSelectedProduct(fullProduct);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error al cargar producto:', error);
      alert('Error al cargar el producto para editar');
    }
  };

  const handleCreateProduct = () => {
    console.log('🆕 Creando nuevo producto - abriendo modal');
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    console.log('❌ Cerrando modal de producto');
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleCreateModalClose = () => {
    console.log('❌ Cerrando modal de creación');
    setShowCreateModal(false);
  };

  const handleProductSaved = (product: ProductType) => {
    console.log('✅ Producto guardado:', product);
    setShowEditModal(false);
    setSelectedProduct(null);
    loadData(); // Recargar la lista de productos
  };

  const handleProductCreated = (product: any) => {
    console.log('✅ Producto creado:', product);
    setShowCreateModal(false);
    loadData(); // Recargar la lista de productos
  };

  const handleDeleteProduct = async (product: ProductWithStock) => {
    // Verificar si el producto tiene stock
    if (product.total_stock > 0) {
      const confirmWithStock = window.confirm(
        `⚠️ ADVERTENCIA: Este producto tiene ${product.total_stock} unidades en stock.\n\n` +
        `Si eliminas este producto, el inventario quedará inconsistente.\n\n` +
        `Se recomienda ajustar el stock a 0 antes de eliminar.\n\n` +
        `¿Deseas continuar de todos modos?`
      );
      
      if (!confirmWithStock) {
        return; // Usuario canceló
      }
    }

    // Confirmación con mensaje detallado
    const confirmMessage = `¿Estás seguro de que deseas eliminar el producto?

📦 Producto: ${product.name}
🔢 Código de barras: ${product.bar_code}
📊 Stock total: ${product.total_stock} unidades
💰 Precio de venta: $${product.retail_price?.toLocaleString() || '0'}

⚠️ Esta acción no se puede deshacer.`;

    if (!window.confirm(confirmMessage)) {
      return; // Usuario canceló
    }

    try {
      console.log('🗑️ Eliminando producto:', product.bar_code);
      setLoading(true);
      
      // Eliminar el producto usando el servicio
      await productService.deleteProduct(product.bar_code);
      
      console.log('✅ Producto eliminado exitosamente');
      
      // Mostrar mensaje de éxito
      alert(`✅ El producto "${product.name}" ha sido eliminado exitosamente.`);
      
      // Recargar la lista de productos
      await loadData();
      
    } catch (error: any) {
      console.error('❌ Error al eliminar producto:', error);
      
      // Mostrar mensaje de error detallado
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message
        || error.message 
        || 'Error desconocido al eliminar el producto';
      
      alert(`❌ Error al eliminar el producto:\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Volver al Dashboard</span>
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
                <p className="text-sm text-gray-600">Productos con stock por ubicación</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateProduct}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Crear Producto</span>
              </button>
              <button
                onClick={loadData}
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

      <div className="max-w-7xl mx-auto p-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Productos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalProducts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Con Stock</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{productsInStock}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Stock Bajo</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{productsLowStock}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Sin Stock</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{productsOutOfStock}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Package className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Buscar producto
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre o código de barras..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Categoría
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Stock
              </label>
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="in_stock">Con Stock</option>
                <option value="low_stock">Stock Bajo</option>
                <option value="out_of_stock">Sin Stock</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Mostrando {filteredProducts.length} de {totalProducts} productos
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('');
                setFilterStock('all');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Lista de Productos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Costo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Seller (+20%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio TAT (+40%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicaciones
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Cargando productos...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <React.Fragment key={product.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <img
                              src={getImageUrl(product)}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover mr-3 border border-gray-200"
                              onError={(e) => {
                                // Si la imagen falla al cargar, mostrar placeholder
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMjQgMjJDMjYuMjA5MSAyMiAyOCAyMC4yMDkxIDI4IDE4QzI4IDE1Ljc5MDkgMjYuMjA5MSAxNCAyNCAxNEMyMS43OTA5IDE0IDIwIDE1Ljc5MDkgMjAgMThDMjAgMjAuMjA5MSAyMS43OTA5IDIyIDI0IDIyWiIgZmlsbD0iIzlDQTNCMCIvPjxwYXRoIGQ9Ik0zNCAzMkwzMCAyOEwyNiAzMkwxNCAzMkwxNCAzNEwzNCAzNFYzMloiIGZpbGw9IiM5Q0EzQjAiLz48L3N2Zz4=';
                              }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.bar_code || 'Sin código'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {product.category?.name || 'Sin categoría'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${product.cost_price?.toLocaleString() || '0'}
                          </div>
                          <div className="text-xs text-gray-500">Costo base</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">
                            ${((product.cost_price || 0) * 1.20).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-xs text-gray-500">+20%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            ${((product.cost_price || 0) * 1.40).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-xs text-gray-500">+40%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-lg font-bold ${
                            product.total_stock === 0 ? 'text-red-600' : 
                            product.low_stock_count > 0 ? 'text-orange-600' : 
                            'text-green-600'
                          }`}>
                            {product.total_stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStockStatusBadge(product)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleProductExpand(product.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>{product.stock_by_location.length} ubicaciones</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              disabled={loading}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Editar producto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Fila expandida con stock por ubicación */}
                      {expandedProduct === product.id && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <div className="border-l-4 border-blue-500 pl-4">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                Stock por Ubicación
                              </h4>
                              {product.stock_by_location.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                  Este producto no tiene stock en ninguna ubicación
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {product.stock_by_location.map((stock) => (
                                    <div
                                      key={stock.id}
                                      className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <p className="font-semibold text-gray-900">
                                            {stock.warehouse_name}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {stock.warehouse_code}
                                          </p>
                                        </div>
                                        <MapPin className="w-5 h-5 text-blue-500" />
                                      </div>
                                      <div className="mt-3 space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm text-gray-600">Stock:</span>
                                          <span className={`text-lg font-bold ${
                                            stock.current_stock === 0 ? 'text-red-600' :
                                            stock.current_stock <= stock.minimum_stock ? 'text-orange-600' :
                                            'text-green-600'
                                          }`}>
                                            {stock.current_stock}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                          <span className="text-gray-600">Mínimo:</span>
                                          <span className="text-gray-900">{stock.minimum_stock || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                          <span className="text-gray-600">Máximo:</span>
                                          <span className="text-gray-900">{stock.maximum_stock || 0}</span>
                                        </div>
                                        {stock.needs_restock && (
                                          <div className="mt-2 pt-2 border-t border-gray-200">
                                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                                              ⚠️ Requiere reabastecimiento
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {showEditModal && (
        <ProductEditModal
          isOpen={showEditModal}
          product={selectedProduct}
          onClose={handleModalClose}
          onProductUpdated={handleProductSaved}
        />
      )}

      {/* Modal de Creación */}
      {showCreateModal && (
        <ProductCreateModal
          isOpen={showCreateModal}
          onClose={handleCreateModalClose}
          onProductCreated={handleProductCreated}
        />
      )}
    </div>
  );
};

export default AdminProductsPage;
