// src/pages/LogoutPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle } from 'lucide-react';
import { Button } from '../shared/components/ui/buttons/Button';
import { Card } from '../shared/components/ui/cards/Card';
import { AuthLayout } from '../shared/components/layouts/AuthLayout';
import { useAuth } from '../shared/stores';

// ========================
// LOGOUT PAGE COMPONENT
// ========================
export const LogoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isLoggedOut, setIsLoggedOut] = React.useState(false);

  // ========================
  // AUTO LOGOUT ON MOUNT
  // ========================
  React.useEffect(() => {
    const performLogout = async () => {
      if (user && !isLoggedOut) {
        setIsLoggingOut(true);
        try {
          await logout();
          setIsLoggedOut(true);
        } catch (error) {
          console.error('Logout error:', error);
          // Even if logout fails, redirect to login
          setIsLoggedOut(true);
        } finally {
          setIsLoggingOut(false);
        }
      }
    };

    performLogout();
  }, [user, logout, isLoggedOut]);

  // ========================
  // AUTO REDIRECT AFTER LOGOUT
  // ========================
  React.useEffect(() => {
    if (isLoggedOut && !isLoading) {
      const timer = setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoggedOut, isLoading, navigate]);

  // ========================
  // EVENT HANDLERS
  // ========================
  const handleGoToLogin = () => {
    navigate('/auth/login', { replace: true });
  };

  // ========================
  // LOADING STATE
  // ========================
  if (isLoggingOut || isLoading) {
    return (
      <AuthLayout
        title="Cerrando sesión"
        subtitle="Espera un momento..."
        showFeatures={false}
      >
        <Card className="shadow-xl">
          <div className="p-8 text-center">
            {/* Loading Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <LogOut className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
            </div>

            {/* Content */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Cerrando sesión...
              </h1>
              <p className="text-gray-600">
                Espera un momento mientras procesamos tu solicitud.
              </p>
            </div>

            {/* Loading Spinner */}
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          </div>
        </Card>
      </AuthLayout>
    );
  }

  // ========================
  // SUCCESS STATE
  // ========================
  return (
    <AuthLayout
      title="Sesión cerrada"
      subtitle="Has cerrado sesión exitosamente"
      showFeatures={false}
    >
      <Card className="shadow-xl">
        <div className="p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Content */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              ¡Hasta pronto!
            </h1>
            <p className="text-gray-600 mb-6">
              Has cerrado sesión correctamente. Gracias por usar el sistema de gestión de inventarios TITA.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                Serás redirigido automáticamente al login en unos segundos...
              </p>
            </div>
          </div>

          {/* Actions */}
          <Button
            onClick={handleGoToLogin}
            variant="primary"
            className="w-full"
          >
            Iniciar nueva sesión
          </Button>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              © 2025 COMERCIALIZADORA TITA - Sistema de Gestión de Inventarios
            </p>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
};

export default LogoutPage;