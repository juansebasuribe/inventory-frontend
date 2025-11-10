// src/shared/components/routing/RouteGuard.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores';


export const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();
  
  
  // Esperar a que se inicialice la autenticación
  if (!isInitialized) {
    return <>{children}</>;
  }
  
  // Si no está autenticado, dejar pasar (AuthRoute se encargará)
  if (!isAuthenticated || !user?.profile?.role) {
    return <>{children}</>;
  }
  
  const userRole = user.profile.role;
  const currentPath = location.pathname;
  
  
  // Rutas públicas que todos pueden acceder
  const publicPaths = ['/', '/auth/login', '/auth/logout', '/auth/forgot-password', '/auth/reset-password', '/unauthorized'];
  
  // Si es una ruta pública, permitir acceso
  if (publicPaths.includes(currentPath)) {
    return <>{children}</>;
  }
  
 
  if (userRole === 'seller') {
    // Rutas permitidas para seller
    const allowedPaths = ['/seller', '/seller/cart'];
    
    // Si la ruta actual NO está en la lista de permitidas, redirigir a /seller
    if (!allowedPaths.includes(currentPath)) {
      return <Navigate to="/seller" replace />;
    }
  }
  
  
  if (userRole === 'seller_tt') {
    // Rutas permitidas para seller_tt
    const allowedPaths = ['/seller-tat', '/seller-tat/cart'];
    
    // Si la ruta actual NO está en la lista de permitidas, redirigir a /seller-tat
    if (!allowedPaths.includes(currentPath)) {
      return <Navigate to="/seller-tat" replace />;
    }
  }
  
  return <>{children}</>;
};

export default RouteGuard;
