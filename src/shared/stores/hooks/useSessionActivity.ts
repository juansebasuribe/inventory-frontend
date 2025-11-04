// src/shared/stores/hooks/useSessionActivity.ts
import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../authStore';

/**
 * Hook para manejar la actividad de la sesión y auto-logout por inactividad
 */
export const useSessionActivity = (enabled: boolean = true) => {
  const { isAuthenticated, updateActivity, checkSession } = useAuthStore();

  const handleActivity = useCallback(() => {
    if (isAuthenticated && enabled) {
      updateActivity();
    }
  }, [isAuthenticated, updateActivity, enabled]);

  const handleSessionCheck = useCallback(() => {
    if (isAuthenticated && enabled) {
      checkSession();
    }
  }, [isAuthenticated, checkSession, enabled]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    // Eventos de actividad del usuario
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Agregar listeners de actividad
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Verificar sesión cada minuto
    const sessionInterval = setInterval(handleSessionCheck, 60 * 1000);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(sessionInterval);
    };
  }, [enabled, isAuthenticated, handleActivity, handleSessionCheck]);

  return {
    updateActivity: handleActivity,
    checkSession: handleSessionCheck
  };
};

export default useSessionActivity;