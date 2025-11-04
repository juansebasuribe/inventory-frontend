// src/features/auth/components/AuthLoading.tsx
import React from 'react';

// ========================
// COMPONENT PROPS
// ========================
interface AuthLoadingProps {
  message?: string;
  className?: string;
}

// ========================
// AUTH LOADING COMPONENT
// ========================
export const AuthLoading: React.FC<AuthLoadingProps> = ({
  message = 'Verificando autenticación...',
  className = ''
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
      <div className="text-center">
        {/* Logo/Spinner */}
        <div className="w-16 h-16 mx-auto mb-6">
          <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center relative">
            <span className="text-white text-xl font-bold">TITA</span>
            {/* Rotating border */}
            <div className="absolute inset-0 border-4 border-transparent border-t-red-300 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Message */}
        <p className="text-gray-600 text-lg mb-2">{message}</p>
        <p className="text-gray-400 text-sm">Por favor espere...</p>

        {/* Loading dots */}
        <div className="flex justify-center mt-4 space-x-1">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthLoading;