import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  MapPin,
  AlertCircle,
  FileText,
  Store
} from 'lucide-react';
import { useAuth } from '../shared/stores';
import warehouseService, { type WarehouseAssignment } from '../shared/services/warehouseService';
import { cartService } from '../features/products/services/cartService';

// Lazy load components
const OrderHistory = lazy(() => import('../features/order/components/OrderHistory'));
const ProductList = lazy(() => import('../features/products/components/ProductList'));

// ========================
// TYPES
// ========================
interface DashboardMetrics {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSales: number;
  bulkOrders: number;
  storesServed: number;
}

const SellerTaTDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State - Cambiar estado inicial a 'products' en lugar de 'overview'
  const [activeSection, setActiveSection] = useState<string>('products');
  const [cartItemCount, setCartItemCount] = useState(0);
  const [warehouseAssignments, setWarehouseAssignments] = useState<WarehouseAssignment[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics] = useState<DashboardMetrics>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSales: 0,
    bulkOrders: 0,
    storesServed: 0
  });

  // ========================
  // EFFECTS
  // ========================
  useEffect(() => {
    loadWarehouseAssignments();
    loadCartCount();
  }, []);

  // ========================
  // HANDLERS
  // ========================
  const loadWarehouseAssignments = async () => {
    try {
      setLoading(true);
      const assignments = await warehouseService.getMyWarehouseAssignments();
      setWarehouseAssignments(assignments);
      
      // Seleccionar automáticamente la primera bodega activa
      if (assignments.length > 0) {
        setSelectedWarehouse(assignments[0].warehouse);
      }
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

  const handleWarehouseChange = useCallback((warehouseId: number) => {
    setSelectedWarehouse(warehouseId);
  }, []);

  const handleAddToCart = useCallback(() => {
    loadCartCount();
  }, []);

  const handleGoToCart = () => {
    navigate('/seller-tat/cart');
  };

  // ========================
  // RENDER SECTIONS
  // ========================
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Panel de Vendedor Tienda a Tienda
          </h2>
          <p className="text-gray-600 mt-2">
            Bienvenido, {user?.first_name || user?.username} - Ventas B2B
          </p>
        </div>
        
        <button
          onClick={handleGoToCart}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center space-x-2 shadow-lg relative"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Orden al Mayoreo</span>
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* TaT Info Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-3">
          <Store className="w-8 h-8" />
          <h3 className="text-xl font-bold">Ventas Tienda a Tienda (B2B)</h3>
        </div>
        <p className="text-purple-100 mb-3">
          Este panel está diseñado para gestionar órdenes al por mayor para negocios y tiendas. 
          Puedes crear pedidos en grandes volúmenes y gestionar múltiples ubicaciones.
        </p>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20">
          <p className="text-sm font-semibold text-white flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Nuestros productos 
          </p>
          <p className="text-xs text-purple-100 mt-1">
            Los precios que ves incluyen un 40% sobre el costo base. Este es tu precio mayorista.
          </p>
        </div>
      </div>

      {/* Warehouse Selection */}
      {warehouseAssignments.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Bodegas Asignadas
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouseAssignments.map((assignment) => (
              <div
                key={assignment.id}
                onClick={() => handleWarehouseChange(assignment.warehouse)}
                className={`
                  p-4 rounded-lg cursor-pointer transition-all
                  ${selectedWarehouse === assignment.warehouse
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">
                    {assignment.warehouse_details.name}
                  </span>
                  {selectedWarehouse === assignment.warehouse && (
                    <CheckCircle className="w-5 h-5" />
                  )}
                </div>
                <p className={`text-sm ${
                  selectedWarehouse === assignment.warehouse 
                    ? 'text-purple-100' 
                    : 'text-gray-600'
                }`}>
                  {assignment.warehouse_details.code}
                </p>
                <p className={`text-xs mt-2 ${
                  selectedWarehouse === assignment.warehouse 
                    ? 'text-purple-200' 
                    : 'text-gray-500'
                }`}>
                  {assignment.warehouse_details.address}
                </p>
                {assignment.warehouse_details.capacity && (
                  <p className={`text-xs mt-1 ${
                    selectedWarehouse === assignment.warehouse 
                      ? 'text-purple-200' 
                      : 'text-gray-500'
                  }`}>
                    Capacidad: {assignment.warehouse_details.capacity.toLocaleString()} unidades
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Warehouse Warning */}
      {warehouseAssignments.length === 0 && !loading && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">
                Sin Bodega Asignada
              </h3>
              <p className="text-yellow-700 mt-1">
                No tienes ninguna bodega asignada. Por favor contacta a tu supervisor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards - TaT Specific */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Órdenes Mayoreo"
          value={metrics.bulkOrders}
          icon={Package}
          color="purple"
          subtitle="Pedidos al por mayor"
        />
        <MetricCard
          title="Tiendas Atendidas"
          value={metrics.storesServed}
          icon={Store}
          color="indigo"
          subtitle="Clientes B2B activos"
        />
        <MetricCard
          title="Ventas Total"
          value={`$${metrics.totalSales.toLocaleString()}`}
          icon={TrendingUp}
          color="blue"
          subtitle="Volumen total"
        />
        <MetricCard
          title="Órdenes Pendientes"
          value={metrics.pendingOrders}
          icon={Clock}
          color="yellow"
          subtitle="Por procesar"
        />
        <MetricCard
          title="Órdenes Completadas"
          value={metrics.completedOrders}
          icon={CheckCircle}
          color="green"
          subtitle="Finalizadas"
        />
        <MetricCard
          title="Total Órdenes"
          value={metrics.totalOrders}
          icon={FileText}
          color="gray"
          subtitle="Histórico"
        />
      </div>

      {/* Quick Actions - TaT Specific */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard
          title="Catálogo Mayorista"
          description="Explora productos con precio especial B2B"
          icon={Package}
          onClick={() => setActiveSection('products')}
          color="purple"
        />
        <QuickActionCard
          title="Orden al Mayoreo"
          description="Crear pedido en grandes volúmenes para negocios"
          icon={ShoppingCart}
          onClick={handleGoToCart}
          color="indigo"
        />
        <QuickActionCard
          title="Historial B2B"
          description="Ver órdenes de clientes corporativos"
          icon={FileText}
          onClick={() => setActiveSection('orders')}
          color="blue"
        />
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      {/* Banner informativo de precios TAT */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-3">
          <Store className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold">Productos TITA Comercializadora</h3>
            <p className="text-purple-100 mt-2">
              Busca tus productos y crea la orden de compra
            </p>
          </div>
        </div>
        
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Catálogo Mayorista</h2>
          <p className="text-gray-600 mt-1">
            Productos con precio especial para ventas B2B
          </p>
        </div>
      </div>
      
      {/* Product List */}
      <Suspense fallback={
        <div className="text-center py-12">
          <div className="inline-block w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      }>
        <ProductList 
          onAddToCart={handleAddToCart}
          showFilters={true}
          pageSize={12}
        />
      </Suspense>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Órdenes</h2>
          <p className="text-gray-600 mt-1">Historial de pedidos</p>
        </div>
        
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
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TITA Inventory</h1>
                <p className="text-sm text-gray-600">Panel Tienda a Tienda (B2B)</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Navigation Tabs - Sin botón Panel */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveSection('products')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    activeSection === 'products'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Productos</span>
                </button>
                <button
                  onClick={() => setActiveSection('orders')}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    activeSection === 'orders'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Órdenes</span>
                </button>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-purple-600 font-medium">Vendedor TaT</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'products' && renderProducts()}
        {activeSection === 'orders' && renderOrders()}
      </main>

      {/* Botón flotante del carrito */}
      <button
        onClick={handleGoToCart}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 group"
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

// ========================
// HELPER COMPONENTS
// ========================
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'indigo' | 'gray';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
};

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  color: 'blue' | 'purple' | 'indigo';
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick,
  color 
}) => {
  const colorClasses = {
    blue: 'hover:bg-blue-50 border-blue-200',
    purple: 'hover:bg-purple-50 border-purple-200',
    indigo: 'hover:bg-indigo-50 border-indigo-200',
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} bg-white rounded-xl p-6 border-2 transition-all text-left hover:shadow-lg group`}
    >
      <Icon className={`w-10 h-10 mb-4 text-${color}-600 group-hover:scale-110 transition-transform`} />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
};

export default SellerTaTDashboardPage;
