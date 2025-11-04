// src/shared/stores/hooks/index.ts

// ========================
// AUTH HOOKS EXPORTS
// ========================
export { useAuthInitialization } from './useAuthInitialization';
export { useSessionActivity } from './useSessionActivity';

// Re-export hooks from authStore
export { 
  useAuth, 
  useCurrentUser, 
  useUserRole, 
  usePermissions 
} from '../authStore';