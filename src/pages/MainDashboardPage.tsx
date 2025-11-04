import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Portal } from '../shared/components';
import { 
  Package, 
  Warehouse, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  TrendingUp,
  AlertTriangle,
  Plus,
  Download,
  Menu,
  X,
  MapPin
} from 'lucide-react';

// Importaciones estáticas (componentes ligeros)
import { ProviderList } from '../features/providers/components';
import { StockAlerts } from '../features/inventory/components';
import { LocationManager, WarehouseAssignmentManager } from '../features/warehouse/components';
import { CartSidebar } from '../features/cart/components';

// Lazy loading de componentes pesados (con named exports)
const ProductCreateModal = lazy(() => 
  import('../features/products/components/ProductCreateModal').then(module => ({ default: module.ProductCreateModal }))
);
const ProductEditModal = lazy(() => 
  import('../features/products/components/ProductEditModal').then(module => ({ default: module.ProductEditModal }))
);
const CategoryCreateModal = lazy(() => 
  import('../features/categories/components/CategoryCreateModal').then(module => ({ default: module.CategoryCreateModal }))
);
const ProviderCreateModal = lazy(() => 
  import('../features/providers/components/ProviderCreateModal').then(module => ({ default: module.ProviderCreateModal }))
);
const ProviderEditModal = lazy(() => 
  import('../features/providers/components/ProviderEditModal').then(module => ({ default: module.ProviderEditModal }))
);
const UserCreateModal = lazy(() => 
  import('../features/auth/components/UserCreateModal').then(module => ({ default: module.UserCreateModal }))
);
const UserEditModal = lazy(() => 
  import('../features/auth/components/UserEditModal').then(module => ({ default: module.UserEditModal }))
);
const UserList = lazy(() => 
  import('../features/auth/components/UserList').then(module => ({ default: module.UserList }))
);

// Loading fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
  </div>
);

interface DashboardMetrics {
  totalProducts: number;
  totalCategories: number;
  totalProviders: number;
  lowStockItems: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  revenue: number;
}

const MainDashboardPage: React.FC = () => {
  // Estados básicos
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Estados de modales
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showCreateProviderModal, setShowCreateProviderModal] = useState(false);
  const [showEditProviderModal, setShowEditProviderModal] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState<any>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  
  // Control de refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // Métricas del dashboard
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    totalProducts: 0,
    totalCategories: 0,
    totalProviders: 0,
    lowStockItems: 0,
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    revenue: 0,
  });

  // Cargar métricas solo una vez
  useEffect(() => {
    let mounted = true;
    
    const loadMetrics = async () => {
      try {
        // Importar el servicio de dashboard
        const { dashboardService } = await import('../features/dashboard/services/dashboardService');

        // Obtener todas las métricas reales del backend
        const metrics = await dashboardService.getDashboardMetrics();

        if (mounted) {
          setDashboardMetrics(metrics);
        }
      } catch (error) {
        console.error('Error loading dashboard metrics:', error);
        // En caso de error, mantener valores en 0
        if (mounted) {
          setDashboardMetrics({
            totalProducts: 0,
            totalCategories: 0,
            totalProviders: 0,
            lowStockItems: 0,
            totalOrders: 0,
            pendingOrders: 0,
            deliveredOrders: 0,
            revenue: 0,
          });
        }
      }
    };

    loadMetrics();
    
    return () => { mounted = false; };
  }, []);

  // Handlers memoizados
  const handleCloseEditProductModal = useCallback(() => {
    setShowEditProductModal(false);
    setProductToEdit(null);
  }, []);

  const handleProductUpdated = useCallback((product: any) => {
    console.log('✅ Producto actualizado:', product);

    // Cerrar modal de forma síncrona para que React retire el árbol del modal
    try {
      flushSync(() => {
        setShowEditProductModal(false);
        setProductToEdit(null);
      });
      console.log('[MainDashboardPage] flushSync: modal cerrado');
    } catch (e) {
      // En entornos donde flushSync no tenga efecto, caeremos al fallback
      console.warn('[MainDashboardPage] flushSync falló, usando fallback', e);
      setShowEditProductModal(false);
      setProductToEdit(null);
    }

    // Forzar desmontaje del listado y refrescar de forma ordenada
    setRefreshKey(prev => {
      const next = prev + 1;
      console.log('[MainDashboardPage] refreshKey ->', next);
      return next;
    });
  }, []);

  // Handlers para usuarios
  const handleEditUser = useCallback((user: any) => {
    setUserToEdit(user);
    setShowEditUserModal(true);
  }, []);

  const handleUserCreated = useCallback(() => {
    console.log('✅ Usuario creado');
    setRefreshKey(prev => prev + 1);
    setShowCreateUserModal(false);
  }, []);

  const handleUserUpdated = useCallback(() => {
    console.log('✅ Usuario actualizado');
    setRefreshKey(prev => prev + 1);
    setShowEditUserModal(false);
    setUserToEdit(null);
  }, []);

  // Configuración de secciones (solo metadata)
  const sectionsConfig = useMemo(() => [
    {
      id: 'overview',
      name: 'Resumen',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Vista general del sistema',
    },
    {
      id: 'products',
      name: 'Productos',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Gestión completa de productos',
    },
    {
      id: 'inventory',
      name: 'Inventario',
      icon: Warehouse,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Control completo de stock y ubicaciones',
    },
    {
      id: 'categories',
      name: 'Categorías',
      icon: Settings,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Gestión de categorías de productos',
    },
    {
      id: 'providers',
      name: 'Proveedores',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Gestión de proveedores',
    },
    {
      id: 'users',
      name: 'Equipo',
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      description: 'Gestión de usuarios y vendedores',
    },
    {
      id: 'orders',
      name: 'Órdenes',
      icon: ShoppingCart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      description: 'Gestión de órdenes',
    },
    {
      id: 'locations',
      name: 'Ubicaciones',
      icon: MapPin,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Gestión de ubicaciones del almacén',
    },
    {
      id: 'assignments',
      name: 'Asignaciones',
      icon: Users,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      description: 'Asignar vendedores a bodegas',
    }
  ], []);

  // Renderizar sección activa (SOLO UNA A LA VEZ)
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Panel de Control TITA</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Download size={16} />
                <span>Exportar Reporte</span>
              </button>
            </div>
            
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Productos</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.totalProducts.toLocaleString()}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-green-600 mt-2">↗ +12% este mes</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                    <p className="text-2xl font-bold text-orange-600">{dashboardMetrics.lowStockItems}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-xs text-orange-600 mt-2">Requiere atención</p>
              </div>
              
              <button
                onClick={() => navigate('/admin/orders')}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Órdenes Pendientes</p>
                    <p className="text-2xl font-bold text-green-600">{dashboardMetrics.pendingOrders}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{dashboardMetrics.totalOrders} total</p>
                <p className="text-xs text-green-600 mt-1 font-medium">→ Click para gestionar</p>
              </button>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos</p>
                    <p className="text-2xl font-bold text-purple-600">${dashboardMetrics.revenue.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-xs text-purple-600 mt-2">↗ +8% este mes</p>
              </div>
            </div>

            {/* Alertas y acciones rápidas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Alertas Críticas</h3>
                  {dashboardMetrics.lowStockItems > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      {dashboardMetrics.lowStockItems} alertas
                    </span>
                  )}
                </div>
                <StockAlerts
                  onAlertResolve={(alert) => console.log('Alert resolved:', alert)}
                  onViewProduct={(productCode) => console.log('View product:', productCode)}
                />
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setActiveSection('products');
                      setShowCreateProductModal(true);
                    }}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center group"
                  >
                    <Plus className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-blue-700">Nuevo Producto</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('inventory')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center group"
                  >
                    <Warehouse className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-green-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-green-700">Ajustar Stock</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('providers')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center group"
                  >
                    <Users className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-purple-700">Nuevo Proveedor</span>
                  </button>
                  <button
                    onClick={() => navigate('/admin/orders')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-center group"
                  >
                    <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-orange-700">Ver Órdenes</span>
                  </button>
                  <button
                    onClick={() => navigate('/admin/categories')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center group"
                  >
                    <Settings className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-700">Gestionar Categorías</span>
                  </button>
                  <button
                    onClick={() => navigate('/admin/inventory')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center group"
                  >
                    <Warehouse className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-purple-700">Control de Inventario</span>
                  </button>
                  <button
                    onClick={() => navigate('/admin/products')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors text-center group"
                  >
                    <Package className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-pink-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-pink-700">Ver Productos</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Estadísticas adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-blue-900">Estado del Inventario</h4>
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Total productos:</span>
                    <span className="font-bold text-blue-900">{dashboardMetrics.totalProducts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Con stock bajo:</span>
                    <span className="font-bold text-orange-600">{dashboardMetrics.lowStockItems}</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: dashboardMetrics.totalProducts > 0 
                          ? `${Math.max(5, 100 - (dashboardMetrics.lowStockItems / dashboardMetrics.totalProducts * 100))}%` 
                          : '100%' 
                      }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 text-right mt-1">
                    {dashboardMetrics.totalProducts > 0 
                      ? `${((1 - dashboardMetrics.lowStockItems / dashboardMetrics.totalProducts) * 100).toFixed(1)}% saludable`
                      : 'Sin datos'}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-green-900">Estado de Órdenes</h4>
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Total órdenes:</span>
                    <span className="font-bold text-green-900">{dashboardMetrics.totalOrders}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Pendientes:</span>
                    <span className="font-bold text-amber-600">{dashboardMetrics.pendingOrders}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Entregadas:</span>
                    <span className="font-bold text-green-600">{dashboardMetrics.deliveredOrders}</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: dashboardMetrics.totalOrders > 0 
                          ? `${(dashboardMetrics.deliveredOrders / dashboardMetrics.totalOrders * 100)}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                  <p className="text-xs text-green-600 text-right mt-1">
                    {dashboardMetrics.totalOrders > 0 
                      ? `${((dashboardMetrics.deliveredOrders / dashboardMetrics.totalOrders) * 100).toFixed(1)}% completadas`
                      : 'Sin órdenes'}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-purple-900">Catálogo</h4>
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700">Categorías:</span>
                    <span className="font-bold text-purple-900">{dashboardMetrics.totalCategories}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700">Proveedores:</span>
                    <span className="font-bold text-purple-900">{dashboardMetrics.totalProviders}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700">Productos:</span>
                    <span className="font-bold text-purple-900">{dashboardMetrics.totalProducts}</span>
                  </div>
                  <div className="mt-3 p-2 bg-purple-200 rounded-lg">
                    <p className="text-xs text-purple-800 text-center font-medium">
                      {dashboardMetrics.totalCategories > 0 
                        ? `${(dashboardMetrics.totalProducts / dashboardMetrics.totalCategories).toFixed(1)} productos/categoría`
                        : 'Crea categorías primero'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'providers':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Gestión de Proveedores</h2>
                <p className="text-gray-600 mt-1">Control de proveedores y calificaciones</p>
              </div>
              <button 
                onClick={() => setShowCreateProviderModal(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Nuevo Proveedor</span>
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold">Lista de Proveedores</h3>
              </div>
              <div className="p-6">
                <ProviderList
                  onProviderEdit={(provider) => {
                    setProviderToEdit(provider);
                    setShowEditProviderModal(true);
                  }}
                  onProviderSelect={(provider) => {
                    setProviderToEdit(provider);
                    setShowEditProviderModal(true);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Gestión de Equipo</h2>
                <p className="text-gray-600 mt-1">Control de usuarios y vendedores</p>
              </div>
              <button 
                onClick={() => setShowCreateUserModal(true)}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Nuevo Usuario</span>
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold">Lista de Usuarios</h3>
              </div>
              <div className="p-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <UserList
                    refreshKey={refreshKey}
                    onUserEdit={handleEditUser}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        );

      case 'locations':
        return <LocationManager />;

      case 'assignments':
        return <WarehouseAssignmentManager />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Panel Administrativo TITA
                </h1>
                <p className="text-xs text-gray-500">Sistema de Inventario Comercializadora</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors hover:bg-gray-100 rounded-lg"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  0
                </span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">AD</span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Administrador</p>
                  <p className="text-xs text-gray-500">admin@tita.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden mb-4 flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span>{sidebarOpen ? 'Cerrar' : 'Menú'}</span>
          </button>

          {/* Sidebar Navigation */}
          <aside className={`${
            sidebarOpen ? 'block' : 'hidden'
          } lg:block w-full lg:w-72 flex-shrink-0 mb-8 lg:mb-0`}>
            <nav className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 p-6 lg:sticky lg:top-24">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Navegación
                </h3>
              </div>
              <ul className="space-y-2">
                {sectionsConfig.map((section) => {
                  const IconComponent = section.icon;
                  
                  // Para Categorías y Órdenes, navegar a páginas dedicadas
                  if (section.id === 'categories') {
                    return (
                      <li key={section.id}>
                        <button
                          onClick={() => {
                            navigate('/admin/categories');
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100/80 hover:scale-[1.02]`}
                        >
                          <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="block font-medium">{section.name}</span>
                            <span className="text-xs opacity-75">{section.description}</span>
                          </div>
                        </button>
                      </li>
                    );
                  }
                  
                  if (section.id === 'orders') {
                    return (
                      <li key={section.id}>
                        <button
                          onClick={() => {
                            navigate('/admin/orders');
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100/80 hover:scale-[1.02]`}
                        >
                          <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="block font-medium">{section.name}</span>
                            <span className="text-xs opacity-75">{section.description}</span>
                          </div>
                        </button>
                      </li>
                    );
                  }
                  
                  if (section.id === 'inventory') {
                    return (
                      <li key={section.id}>
                        <button
                          onClick={() => {
                            navigate('/admin/inventory');
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100/80 hover:scale-[1.02]`}
                        >
                          <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="block font-medium">{section.name}</span>
                            <span className="text-xs opacity-75">{section.description}</span>
                          </div>
                        </button>
                      </li>
                    );
                  }
                  
                  if (section.id === 'products') {
                    return (
                      <li key={section.id}>
                        <button
                          onClick={() => {
                            navigate('/admin/products');
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100/80 hover:scale-[1.02]`}
                        >
                          <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="block font-medium">{section.name}</span>
                            <span className="text-xs opacity-75">{section.description}</span>
                          </div>
                        </button>
                      </li>
                    );
                  }
                  
                  // Para las demás secciones, comportamiento normal
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => {
                          setActiveSection(section.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                          activeSection === section.id
                            ? `${section.bgColor} ${section.color} font-medium shadow-sm border border-current/20`
                            : 'text-gray-700 hover:bg-gray-100/80 hover:scale-[1.02]'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="block font-medium">{section.name}</span>
                          <span className="text-xs opacity-75">{section.description}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              
              {/* Quick Stats */}
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Métricas Rápidas
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Productos:</span>
                    <span className="font-bold text-blue-600">{dashboardMetrics.totalProducts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Categorías:</span>
                    <span className="font-bold text-purple-600">{dashboardMetrics.totalCategories}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Proveedores:</span>
                    <span className="font-bold text-orange-600">{dashboardMetrics.totalProviders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Órdenes Totales:</span>
                    <span className="font-bold text-green-600">{dashboardMetrics.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pendientes:</span>
                    <span className="font-bold text-amber-600">{dashboardMetrics.pendingOrders}</span>
                  </div>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-8 w-full">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-x-hidden overflow-y-auto">
              {renderActiveSection()}
            </div>
          </main>
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          console.log('Proceeding to checkout');
          setCartOpen(false);
        }}
        onItemUpdate={(item) => console.log('Item updated:', item)}
        onItemRemove={(itemId) => console.log('Item removed:', itemId)}
      />

      {/* Modales con Lazy Loading */}
      {showCreateProductModal && (
        <Suspense fallback={null}>
          <ProductCreateModal
            isOpen={showCreateProductModal}
            onClose={() => setShowCreateProductModal(false)}
            onProductCreated={(product: any) => {
              console.log('Product created:', product);
              setShowCreateProductModal(false);
              setRefreshKey(prev => prev + 1);
            }}
          />
        </Suspense>
      )}

      {showCreateCategoryModal && (
        <Suspense fallback={null}>
          <CategoryCreateModal
            isOpen={showCreateCategoryModal}
            onClose={() => setShowCreateCategoryModal(false)}
            onCategoryCreated={(category: any) => {
              console.log('✅ Category created:', category);
              setShowCreateCategoryModal(false);
              // Usar setTimeout para evitar conflictos con el cierre del modal
              setTimeout(() => {
                setRefreshKey(prev => prev + 1);
              }, 100);
            }}
          />
        </Suspense>
      )}

      {showCreateProviderModal && (
        <Suspense fallback={null}>
          <ProviderCreateModal
            isOpen={showCreateProviderModal}
            onClose={() => setShowCreateProviderModal(false)}
            onProviderCreated={(provider: any) => {
              console.log('✅ Provider created:', provider);
              setShowCreateProviderModal(false);
              // Usar setTimeout para evitar conflictos con el cierre del modal
              setTimeout(() => {
                setRefreshKey(prev => prev + 1);
              }, 100);
            }}
          />
        </Suspense>
      )}

      {showEditProviderModal && (
        <Suspense fallback={null}>
          <ProviderEditModal
            isOpen={showEditProviderModal}
            onClose={() => {
              setShowEditProviderModal(false);
              setProviderToEdit(null);
            }}
            provider={providerToEdit}
            onProviderUpdated={(provider: any) => {
              console.log('✅ Provider updated:', provider);
              setShowEditProviderModal(false);
              setProviderToEdit(null);
              setRefreshKey(prev => prev + 1);
            }}
          />
        </Suspense>
      )}

      {showCreateUserModal && (
        <Suspense fallback={null}>
          <UserCreateModal
            isOpen={showCreateUserModal}
            onClose={() => setShowCreateUserModal(false)}
            onSuccess={handleUserCreated}
          />
        </Suspense>
      )}

      {showEditUserModal && (
        <Suspense fallback={null}>
          <UserEditModal
            isOpen={showEditUserModal}
            onClose={() => {
              setShowEditUserModal(false);
              setUserToEdit(null);
            }}
            user={userToEdit}
            onSuccess={handleUserUpdated}
          />
        </Suspense>
      )}

      {showEditProductModal && (
        <Suspense fallback={null}>
          <Portal>
            <ProductEditModal
              isOpen={showEditProductModal}
              onClose={handleCloseEditProductModal}
              product={productToEdit}
              onProductUpdated={handleProductUpdated}
            />
          </Portal>
        </Suspense>
      )}
    </div>
  );
};

export default MainDashboardPage;
