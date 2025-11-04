// src/pages/LoginPage.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { AuthLayout } from '../shared/components/layouts/AuthLayout';
import { useAuth } from '../shared/stores';

// ========================
// LOGIN PAGE COMPONENT
// ========================
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Obtener la página de origen si existe
  const from = (location.state as any)?.from?.pathname;

  // ========================
  // EVENT HANDLERS
  // ========================
  const handleLoginSuccess = () => {
    // Si hay una página de origen específica, redirigir allá
    if (from && from !== '/auth/login') {
      navigate(from, { replace: true });
      return;
    }

    // Redirigir según el rol del usuario
    const userRole = user?.profile?.role;
    
    switch (userRole) {
      case 'seller':
        navigate('/seller', { replace: true });
        break;
      case 'seller_tt':
        navigate('/seller-tat', { replace: true });
        break;
      case 'seller_executive':
        navigate('/seller', { replace: true }); // Puede usar el mismo dashboard de seller normal
        break;
      case 'supervisor':
      case 'manager':
        navigate('/admin', { replace: true });
        break;
      case 'editor':
      case 'operator':
        navigate('/dashboard', { replace: true });
        break;
      default:
        navigate('/dashboard', { replace: true });
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implementar funcionalidad de recuperación de contraseña
    console.log('Forgot password clicked');
    navigate('/auth/forgot-password');
  };

  // ========================
  // RENDER
  // ========================
  return (
    <AuthLayout
      title="Accede a tu cuenta"
      subtitle="Gestiona tu inventario de manera profesional y eficiente"
    >
      <LoginForm
        onSuccess={handleLoginSuccess}
        onForgotPassword={handleForgotPassword}
        className="shadow-xl border-0"
      />
    </AuthLayout>
  );
};

export default LoginPage;