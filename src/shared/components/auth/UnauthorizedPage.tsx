// src/shared/components/auth/UnauthorizedPage.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/buttons/Button';
import { Card } from '../ui/cards/Card';
import { useAuth } from '../../stores';
import type { UserRole } from '../../types/entities';

// ========================
// TYPES
// ========================
interface LocationState {
  from?: {
    pathname: string;
    search: string;
  };
  reason?: string;
  requiredRoles?: UserRole[];
  userRole?: UserRole;
}

// ========================
// ROLE DISPLAY NAMES
// ========================
const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  'operator': 'Operador',
  'editor': 'Editor',
  'supervisor': 'Supervisor',
  'manager': 'Gerente',
  'seller': 'Vendedor',
  'seller_tt': 'Vendedor TT',
  'seller_executive': 'Ejecutivo de Ventas',
  
};

// ========================
// UNAUTHORIZED PAGE COMPONENT
// ========================
export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const state = location.state as LocationState;
  const fromPath = state?.from?.pathname || '/';
  const reason = state?.reason || 'access_denied';
  const requiredRoles = state?.requiredRoles || [];
  const userRole = state?.userRole;

  // ========================
  // EVENT HANDLERS
  // ========================
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  // ========================
  // RENDER HELPERS
  // ========================
  const renderRoleRequirements = () => {
    if (requiredRoles.length === 0) return null;

    return (
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-800 mb-2">
              Roles requeridos:
            </h4>
            <ul className="text-sm text-amber-700 space-y-1">
              {requiredRoles.map(role => (
                <li key={role} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                  {ROLE_DISPLAY_NAMES[role]}
                </li>
              ))}
            </ul>
            {userRole && (
              <p className="mt-3 text-sm text-amber-700">
                <strong>Tu rol actual:</strong> {ROLE_DISPLAY_NAMES[userRole]}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (reason) {
      case 'insufficient_permissions':
        return {
          title: 'Permisos Insuficientes',
          description: 'No tienes los permisos necesarios para acceder a esta página.',
          icon: <ShieldX className="w-16 h-16 text-red-500" />
        };
      
      case 'access_denied':
      default:
        return {
          title: 'Acceso Denegado',
          description: 'No tienes autorización para acceder a este recurso.',
          icon: <ShieldX className="w-16 h-16 text-red-500" />
        };
    }
  };

  const content = renderContent();

  // ========================
  // RENDER
  // ========================
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {content.icon}
          </div>

          {/* Content */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {content.title}
            </h1>
            <p className="text-gray-600 mb-4">
              {content.description}
            </p>

            {/* User Info */}
            {user && (
              <div className="text-sm text-gray-500 mb-4">
                Conectado como: <strong>{user.email}</strong>
              </div>
            )}

            {/* Attempted Path */}
            {fromPath !== '/' && (
              <div className="text-sm text-gray-500 mb-4">
                Intentaste acceder a: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{fromPath}</code>
              </div>
            )}

            {/* Role Requirements */}
            {renderRoleRequirements()}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleGoHome}
              variant="primary"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir al Inicio
            </Button>

            <Button
              onClick={handleGoBack}
              variant="secondary"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full text-gray-600"
            >
              Cambiar de Usuario
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Si crees que esto es un error, contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;