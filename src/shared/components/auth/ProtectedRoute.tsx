// src/shared/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores';
import { AuthLoading } from '../../../features/auth/components/AuthLoading';
import type { UserRole } from '../../types/entities';


interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallbackPath?: string;
  requireAuth?: boolean;
}

// ========================
// ROLE HIERARCHY (MAYOR = MÁS PERMISOS)
// ========================
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'seller': 1,          
  'seller_tt': 2,       
  'operator': 3,        
  'editor': 4,          
  'seller_executive': 5,
  'supervisor': 6,      
  'manager': 7          
};

// ========================
// UTILITY FUNCTIONS
// ========================
const hasRequiredRole = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  if (!requiredRoles.length) return true;
  
  if (requiredRoles.includes(userRole)) {
    return true;
  }
  
  const userLevel = ROLE_HIERARCHY[userRole];
  const minRequiredLevel = Math.min(...requiredRoles.map(role => ROLE_HIERARCHY[role]));
  
 
  if (userRole === 'seller' || userRole === 'seller_tt') {
    // Sellers solo pueden acceder si están explícitamente en requiredRoles
    return requiredRoles.includes(userRole);
  }
  
  return userLevel >= minRequiredLevel;
};

// ========================
// PROTECTED ROUTE COMPONENT
// ========================
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackPath = '/unauthorized',
  requireAuth = true
}) => {
  const location = useLocation();
  const { 
    isAuthenticated, 
    user, 
    isLoading, 
    isInitialized 
  } = useAuth();

  // ========================
  // LOADING STATE
  // ========================
  if (!isInitialized || isLoading) {
    return <AuthLoading />;
  }

  // ========================
  // AUTHENTICATION CHECK
  // ========================
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate 
        to="/auth/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // ========================
  // ROLE PERMISSION CHECK
  // ========================
  if (isAuthenticated && user && user.profile && requiredRoles.length > 0) {
    const hasPermission = hasRequiredRole(user.profile.role, requiredRoles);
    
    if (!hasPermission) {
      return (
        <Navigate 
          to={fallbackPath} 
          state={{ 
            from: location,
            reason: 'insufficient_permissions',
            requiredRoles,
            userRole: user.profile.role
          }} 
          replace 
        />
      );
    }
  }

  // ========================
  // RENDER PROTECTED CONTENT
  // ========================
  return <>{children}</>;
};

// ========================
// CONVENIENCE COMPONENTS
// ========================

// Requiere solo autenticación
export const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <ProtectedRoute requireAuth={true}>
    {children}
  </ProtectedRoute>
);

// Para rutas de administración (manager y supervisor)
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <ProtectedRoute requiredRoles={['manager', 'supervisor']}>
    {children}
  </ProtectedRoute>
);

// Para rutas de supervisión (supervisor y manager)
export const SupervisorRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <ProtectedRoute requiredRoles={['supervisor', 'manager']}>
    {children}
  </ProtectedRoute>
);

// Para rutas de ventas (todos los vendedores y superiores)
export const SalesRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <ProtectedRoute requiredRoles={['seller', 'seller_tt', 'seller_executive', 'editor', 'supervisor', 'manager']}>
    {children}
  </ProtectedRoute>
);

// Para rutas de edición (editor y superiores)
export const EditorRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <ProtectedRoute requiredRoles={['editor', 'supervisor', 'manager']}>
    {children}
  </ProtectedRoute>
);

// Para rutas de vendedores normales (seller) - SOLO /seller y /seller/cart
export const SellerRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Verificar que el usuario sea seller
  const isSeller = user?.profile?.role === 'seller';
  
  // Rutas permitidas para seller
  const allowedPaths = ['/seller', '/seller/cart'];
  const currentPath = location.pathname;
  
  // Si es seller y está intentando acceder a una ruta no permitida, redirigir a /seller
  if (isSeller && !allowedPaths.includes(currentPath)) {
    return <Navigate to="/seller" replace />;
  }
  
  return (
    <ProtectedRoute requiredRoles={['seller']}>
      {children}
    </ProtectedRoute>
  );
};

// Para rutas de vendedores Tienda a Tienda (seller_tt)
export const SellerTaTRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <ProtectedRoute requiredRoles={['seller_tt']}>
    {children}
  </ProtectedRoute>
);

// Para rutas que requieren poder modificar precios (solo seller_executive y superiores)
export const PriceEditorRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <ProtectedRoute requiredRoles={['seller_executive', 'supervisor', 'manager']}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;