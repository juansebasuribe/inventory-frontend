// src/shared/components/routing/AppRoutes.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  ProtectedRoute, 
  AuthRoute,
  AdminRoute,
  SupervisorRoute,
  EditorRoute,
  SalesRoute,
  SellerRoute,
  SellerTaTRoute,
  UnauthorizedPage 
} from '../auth';

// import { HomePage } from '../../pages/HomePage';
// import { DashboardPage } from '../../pages/DashboardPage';
// import { ProductsPage } from '../../pages/ProductsPage';
// import { InventoryPage } from '../../pages/InventoryPage';
// import { UsersPage } from '../../pages/UsersPage';
// import { ReportsPage } from '../../pages/ReportsPage';
import { 
  LoginPage, 
  ForgotPasswordPage, 
  ResetPasswordPage, 
  LogoutPage, 
  DashboardPage, 
  HomePage,
  ProductServiceTestPage,
  ProductsPage,
  MainDashboardPage,
  SellerDashboardPage,
  SellerTaTDashboardPage,
  CartPage,
  ActivatePage,
  AdminUsersPage
} from '../../../pages';
import AdminOrdersPage from '../../../pages/AdminOrdersPage';
import AdminCategoriesPage from '../../../pages/AdminCategoriesPage';
import AdminInventoryPage from '../../../pages/AdminInventoryPage';
import AdminProductsPage from '../../../pages/AdminProductsPage';
const InventoryPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Inventario</h1></div>;
const UsersPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Usuarios</h1></div>;
const ReportsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Reportes</h1></div>;
const SettingsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Configuración</h1></div>;

// ========================
// APP ROUTES COMPONENT
// ========================
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ========================
          RUTAS PÚBLICAS
      ======================== */}
      
      {/* Página de inicio pública */}
      <Route path="/" element={<HomePage />} />
      
      {/* Rutas de autenticación */}
      <Route 
        path="/auth/login" 
        element={
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        } 
      />

      <Route 
        path="/auth/forgot-password" 
        element={
          <AuthRoute>
            <ForgotPasswordPage />
          </AuthRoute>
        } 
      />

      <Route 
        path="/auth/reset-password" 
        element={
          <AuthRoute>
            <ResetPasswordPage />
          </AuthRoute>
        } 
      />

      <Route 
        path="/auth/logout" 
        element={<LogoutPage />}
      />

      <Route 
        path="/activate/:uid/:token" 
        element={<ActivatePage/>} 
      />

      {/* Página de no autorizado */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* ========================
          RUTAS PROTEGIDAS BÁSICAS
      ======================== */}
      
      {/* Dashboard - Requiere autenticación - NO para sellers básicos */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute requiredRoles={['operator', 'editor', 'supervisor', 'manager', 'seller_executive']}>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />

      {/* TEMPORAL - Página de pruebas de servicios */}
      <Route 
        path="/test-services" 
        element={
          <ProtectedRoute requiredRoles={['operator', 'editor', 'supervisor', 'manager', 'seller_executive']}>
            <ProductServiceTestPage />
          </ProtectedRoute>
        } 
      />

      {/* Página de gestión interna - Requiere autenticación */}
      <Route 
        path="/home" 
        element={
          <ProtectedRoute requiredRoles={['operator', 'editor', 'supervisor', 'manager', 'seller_executive']}>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />

      {/* ========================
          RUTAS POR ROLES
      ======================== */}
      
      {/* Productos - Editor o superior */}
      <Route 
        path="/products/*" 
        element={
          <EditorRoute>
            <ProductsPage />
          </EditorRoute>
        } 
      />

      {/* Inventario - Editor o superior */}
      <Route 
        path="/inventory/*" 
        element={
          <EditorRoute>
            <InventoryPage />
          </EditorRoute>
        } 
      />

      {/* Ventas - Vendedor o superior */}
      <Route 
        path="/sales/*" 
        element={
          <SalesRoute>
            <div className="p-8">
              <h1 className="text-2xl font-bold">Módulo de Ventas</h1>
              <p>Acceso para vendedores y superiores</p>
            </div>
          </SalesRoute>
        } 
      />

      {/* Reportes - Supervisor o superior */}
      <Route 
        path="/reports/*" 
        element={
          <SupervisorRoute>
            <ReportsPage />
          </SupervisorRoute>
        } 
      />

      {/* Usuarios - Solo administradores */}
      <Route 
        path="/users/*" 
        element={
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        } 
      />

      {/* Configuración - Solo administradores */}
      <Route 
        path="/settings/*" 
        element={
          <AdminRoute>
            <SettingsPage />
          </AdminRoute>
        } 
      />

      {/* Panel Administrativo Completo - Solo administradores */}
      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <MainDashboardPage />
          </AdminRoute>
        } 
      />

      {/* Gestión de Órdenes del Administrador - Solo administradores */}
      <Route 
        path="/admin/orders" 
        element={
          <AdminRoute>
            <AdminOrdersPage />
          </AdminRoute>
        } 
      />

      {/* Gestión de Categorías del Administrador - Solo administradores */}
      <Route 
        path="/admin/categories" 
        element={
          <AdminRoute>
            <AdminCategoriesPage />
          </AdminRoute>
        } 
      />

      {/* Gestión de Inventario del Administrador - Solo administradores */}
      <Route 
        path="/admin/inventory" 
        element={
          <AdminRoute>
            <AdminInventoryPage />
          </AdminRoute>
        } 
      />

      {/* Gestión de Productos del Administrador - Solo administradores */}
      <Route 
        path="/admin/products" 
        element={
          <AdminRoute>
            <AdminProductsPage />
          </AdminRoute>
        } 
      />

      <Route 
        path="/admin/users" 
        element={
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        } 
      />

      {/* ========================
          RUTAS ESPECÍFICAS PARA VENDEDORES
      ======================== */}
      
      {/* Dashboard para Vendedor Normal */}
      <Route 
        path="/seller" 
        element={
          <SellerRoute>
            <SellerDashboardPage />
          </SellerRoute>
        } 
      />

      {/* Página del Carrito para Vendedor */}
      <Route 
        path="/seller/cart" 
        element={
          <SellerRoute>
            <CartPage />
          </SellerRoute>
        } 
      />

      {/* Dashboard para Vendedor Tienda a Tienda (TaT) */}
      <Route 
        path="/seller-tat" 
        element={
          <SellerTaTRoute>
            <SellerTaTDashboardPage />
          </SellerTaTRoute>
        } 
      />

      {/* Carrito para Vendedor Tienda a Tienda (TaT) */}
      <Route 
        path="/seller-tat/cart" 
        element={
          <SellerTaTRoute>
            <CartPage />
          </SellerTaTRoute>
        } 
      />

      {/* ========================
          RUTAS ESPECÍFICAS POR ROLES
      ======================== */}
      
      {/* Área de supervisión */}
      <Route 
        path="/supervision/*" 
        element={
          <ProtectedRoute requiredRoles={['supervisor', 'manager']}>
            <div className="p-8">
              <h1 className="text-2xl font-bold">Área de Supervisión</h1>
              <p>Solo supervisores y gerentes</p>
            </div>
          </ProtectedRoute>
        } 
      />

      {/* Panel de control gerencial */}
      <Route 
        path="/management/*" 
        element={
          <ProtectedRoute requiredRoles={['manager']}>
            <div className="p-8">
              <h1 className="text-2xl font-bold">Panel Gerencial</h1>
              <p>Solo gerentes</p>
            </div>
          </ProtectedRoute>
        } 
      />

      {/* ========================
          RUTA PÚBLICA DE PRODUCTOS
      ======================== */}
      
      {/* Productos públicos - Sin autenticación requerida */}
      <Route path="/productos" element={<ProductsPage />} />

      {/* ========================
          RUTA DE FALLBACK
      ======================== */}
      
      {/* 404 - Página no encontrada */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-6">Página no encontrada</p>
              <button 
                onClick={() => window.history.back()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Volver
              </button>
            </div>
          </div>
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
