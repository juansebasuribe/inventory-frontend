// src/shared/components/routing/RouteGuard.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores';

/**
 * RouteGuard - Middleware global para control de acceso por rol
 * 
 * Este componente se ejecuta ANTES de cualquier ruta y verifica:
 * 1. Si el usuario es 'seller' solo puede acceder a /seller y /seller/cart
 * 2. Si el usuario es 'seller_tt' solo puede acceder a /seller-tat y /seller-tat/cart
 * 3. Otros roles tienen acceso completo según sus permisos
 */
export const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();
  
  // LOG CRÍTICO - SIEMPRE SE DEBE VER ESTE LOG
  console.log('🔵 [RouteGuard] COMPONENTE RENDERIZADO', {
    isInitialized,
    isAuthenticated,
    hasUser: !!user,
    userRole: user?.profile?.role,
    currentPath: location.pathname
  });
  
  // Esperar a que se inicialice la autenticación
  if (!isInitialized) {
    console.log('⏳ [RouteGuard] Esperando inicialización...');
    return <>{children}</>;
  }
  
  // Si no está autenticado, dejar pasar (AuthRoute se encargará)
  if (!isAuthenticated || !user?.profile?.role) {
    console.log('👤 [RouteGuard] Usuario no autenticado o sin rol, pasando...', {
      isAuthenticated,
      hasUser: !!user,
      hasProfile: !!user?.profile,
      hasRole: !!user?.profile?.role
    });
    return <>{children}</>;
  }
  
  const userRole = user.profile.role;
  const currentPath = location.pathname;
  
  console.log('🛡️ [RouteGuard] Verificando acceso:', {
    userRole,
    currentPath,
    userId: user.id
  });
  
  // Rutas públicas que todos pueden acceder
  const publicPaths = ['/', '/auth/login', '/auth/logout', '/auth/forgot-password', '/auth/reset-password', '/unauthorized'];
  
  // Si es una ruta pública, permitir acceso
  if (publicPaths.includes(currentPath)) {
    console.log('✅ [RouteGuard] Ruta pública, acceso permitido');
    return <>{children}</>;
  }
  
  // ========================
  // RESTRICCIONES PARA SELLER
  // ========================
  if (userRole === 'seller') {
    // Rutas permitidas para seller
    const allowedPaths = ['/seller', '/seller/cart'];
    
    // Si la ruta actual NO está en la lista de permitidas, redirigir a /seller
    if (!allowedPaths.includes(currentPath)) {
      console.log('🚫 [RouteGuard] BLOQUEADO - Seller intentó acceder a:', currentPath, '→ Redirigiendo a /seller');
      return <Navigate to="/seller" replace />;
    }
    console.log('✅ [RouteGuard] Seller - acceso permitido a:', currentPath);
  }
  
  // ========================
  // RESTRICCIONES PARA SELLER_TT
  // ========================
  if (userRole === 'seller_tt') {
    // Rutas permitidas para seller_tt
    const allowedPaths = ['/seller-tat', '/seller-tat/cart'];
    
    // Si la ruta actual NO está en la lista de permitidas, redirigir a /seller-tat
    if (!allowedPaths.includes(currentPath)) {
      console.log('🚫 [RouteGuard] BLOQUEADO - Seller TaT intentó acceder a:', currentPath, '→ Redirigiendo a /seller-tat');
      return <Navigate to="/seller-tat" replace />;
    }
    console.log('✅ [RouteGuard] Seller TaT - acceso permitido a:', currentPath);
  }
  
  // Para otros roles, dejar pasar (ProtectedRoute se encargará de los permisos)
  console.log('✅ [RouteGuard] Rol superior detectado, delegando a ProtectedRoute');
  return <>{children}</>;
};

export default RouteGuard;
