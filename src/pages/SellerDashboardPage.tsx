// src/pages/SellerDashboardPage.tsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  AlertCircle,
  FileText,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../shared/stores';
import warehouseService, { type WarehouseAssignment } from '../shared/services/warehouseService';
import { cartService } from '../features/products/services/cartService';

// Lazy load components
const OrderHistory = lazy(() => import('../features/order/components/OrderHistory'));
const ProductList = lazy(() => import('../features/products/components/ProductList'));

// ========================
// SELLER DASHBOARD PAGE
// ========================
const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [activeSection, setActiveSection] = useState<string>('products');
  const [warehouseAssignments, setWarehouseAssignments] = useState<WarehouseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);

  // ========================
  // EFFECTS
  // ========================
  useEffect(() => {
    loadWarehouseAssignments();
    loadCartCount();
  }, []);

  // Recargar contador cuando vuelve a la página
  useEffect(() => {
    const handleFocus = () => {
      loadCartCount();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // ========================
  // HANDLERS
  // ========================
  const loadWarehouseAssignments = async () => {
    try {
      setLoading(true);
      const assignments = await warehouseService.getMyWarehouseAssignments();
      setWarehouseAssignments(assignments);
    } catch (error) {
      console.error('❌ Error al cargar asignaciones de warehouse:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async () => {
    try {
      const summary = await cartService.getCartSummary();
      setCartItemCount(summary.total_items || 0);
    } catch (error) {
      console.error('Error al cargar contador del carrito:', error);
      setCartItemCount(0);
    }
  };

  // ========================
  // RENDER SECTIONS
  // ========================
  const renderProducts = () => (
    <div className="space-y-6">
      {/* Banner informativo de precios */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900">
              Productos Tita comercializadora
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Busca tus productos y genera la orden de compra
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Catálogo de Productos</h2>
          <p className="text-gray-600 mt-1">
            Explora y agrega productos al carrito
          </p>
        </div>
      </div>
      
      <Suspense fallback={<div className="text-center py-12">Cargando productos...</div>}>
        <ProductList onAddToCart={loadCartCount} />
      </Suspense>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Mis Órdenes</h2>
        <button
          onClick={() => setActiveSection('products')}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Volver a Productos
        </button>
      </div>
      
      <Suspense fallback={<div className="text-center py-12">Cargando órdenes...</div>}>
        <OrderHistory />
      </Suspense>
    </div>
  );

  // ========================
  // RENDER
  // ========================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Warning si no tiene bodegas asignadas
  if (warehouseAssignments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-8 rounded-lg max-w-md">
          <div className="flex items-center space-x-4">
            <AlertCircle className="w-12 h-12 text-yellow-600" />
            <div>
              <h3 className="text-xl font-semibold text-yellow-900 mb-2">
                Sin Bodega Asignada
              </h3>
              <p className="text-yellow-700">
                No tienes ninguna bodega asignada. Por favor contacta a tu supervisor para que te asigne una ubicación.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TITA Inventory</h1>
                <p className="text-sm text-gray-600">Panel de Vendedor</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Navigation Tabs */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveSection('products')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    activeSection === 'products'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Productos</span>
                </button>
                <button
                  onClick={() => setActiveSection('orders')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    activeSection === 'orders'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Mis Órdenes</span>
                </button>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-600">Vendedor</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'products' && renderProducts()}
        {activeSection === 'orders' && renderOrders()}
      </main>

      {/* Botón flotante del carrito */}
      <button
        onClick={() => navigate('/seller/cart')}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 group"
      >
        <ShoppingCart className="w-7 h-7 group-hover:scale-110 transition-transform" />
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center animate-pulse shadow-lg">
            {cartItemCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default SellerDashboardPage;
