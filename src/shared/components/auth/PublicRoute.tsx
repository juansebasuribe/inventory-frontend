// src/shared/components/auth/PublicRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores';
import { AuthLoading } from '../../../features/auth/components/AuthLoading';

// ========================
// TYPES
// ========================
interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
}

// ========================
// PUBLIC ROUTE COMPONENT
// ========================
export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = '/',
  redirectIfAuthenticated = true
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

  // ========================
  // LOADING STATE
  // ========================
  if (!isInitialized || isLoading) {
    return <AuthLoading />;
  }

  // ========================
  // REDIRECT IF AUTHENTICATED
  // ========================
  if (redirectIfAuthenticated && isAuthenticated) {
    // Si hay un estado "from" (usuario intentó acceder a una página protegida),
    // redirigir a esa página, sino a la página por defecto
    const from = (location.state as any)?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  // ========================
  // RENDER PUBLIC CONTENT
  // ========================
  return <>{children}</>;
};

// ========================
// CONVENIENCE COMPONENTS
// ========================

// Para rutas de autenticación (login, register, etc.)
export const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <PublicRoute redirectTo="/" redirectIfAuthenticated={true}>
    {children}
  </PublicRoute>
);

// Para rutas completamente públicas (no redirigen si estás autenticado)
export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => (
  <PublicRoute redirectIfAuthenticated={false}>
    {children}
  </PublicRoute>
);

export default PublicRoute;