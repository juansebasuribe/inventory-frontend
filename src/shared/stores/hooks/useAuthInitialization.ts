// src/shared/stores/hooks/useAuthInitialization.ts
import { useEffect } from 'react';
import { useAuthStore } from '../authStore';

/**
 * Hook para inicializar el estado de autenticación al cargar la aplicación
 * Debe ser usado en el componente raíz (App.tsx)
 */
export const useAuthInitialization = () => {
  const { isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return { isInitialized };
};

export default useAuthInitialization;