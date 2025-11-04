// src/shared/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores';
import { AuthLoading } from '../../../features/auth/components/AuthLoading';
import type { UserRole } from '../../types/entities';

// ========================
// TYPES
// ========================
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
  'seller': 1,          // Menor nivel - solo su página
  'seller_tt': 2,       // Solo su página TaT
  'operator': 3,        // Operador básico
  'editor': 4,          // Puede editar
  'seller_executive': 5,// Vendedor con permisos especiales
  'supervisor': 6,      // Supervisor
  'manager': 7          // Máximo nivel
};

// ========================
// UTILITY FUNCTIONS
// ========================
const hasRequiredRole = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  if (!requiredRoles.length) return true;
  
  // Si el usuario tiene el rol exacto requerido, permitir acceso
  if (requiredRoles.includes(userRole)) {
    return true;
  }
  
  // Para roles de jerarquía, verificar si tiene nivel suficiente
  const userLevel = ROLE_HIERARCHY[userRole];
  const minRequiredLevel = Math.min(...requiredRoles.map(role => ROLE_HIERARCHY[role]));
  
  // Solo permitir si el nivel del usuario es mayor o igual al mínimo requerido
  // Y el rol no es seller o seller_tt (estos son especiales, no tienen jerarquía)
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