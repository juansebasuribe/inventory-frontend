// src/features/auth/pages/LoginPage.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { AuthLoading } from '../components/AuthLoading';
import { useAuth } from '../../../shared/stores';

// ========================
// COMPONENT PROPS
// ========================
interface LoginPageProps {
  redirectTo?: string;
}

// ========================
// LOGIN PAGE COMPONENT
// ========================
export const LoginPage: React.FC<LoginPageProps> = ({
  redirectTo = '/dashboard'
}) => {
  const { user, isLoading, isInitialized } = useAuth();

  // ========================
  // LOADING STATE
  // ========================
  if (!isInitialized || isLoading) {
    return <AuthLoading message="Cargando aplicación..." />;
  }

  // ========================
  // ALREADY AUTHENTICATED
  // ========================
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  // ========================
  // SUCCESS HANDLER
  // ========================
  const handleLoginSuccess = () => {
    // Navigation will be handled by the auth state change
    // and the useEffect in App.tsx or the router guard
  };

  // ========================
  // FORGOT PASSWORD HANDLER
  // ========================
  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    console.log('Forgot password clicked');
    alert('Funcionalidad de recuperación de contraseña próximamente');
  };

  // ========================
  // RENDER
  // ========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      ></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            COMERCIALIZADORA TITA
          </h1>
          <p className="text-lg text-gray-600">
            Sistema de Gestión de Inventarios
          </p>
        </div>

        {/* Login Form */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <LoginForm
            onSuccess={handleLoginSuccess}
            onForgotPassword={handleForgotPassword}
            className="shadow-xl"
          />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Desarrollado con 💖 para COMERCIALIZADORA TITA
          </p>
          <p className="text-xs text-gray-400 mt-1">
            © 2025 Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;