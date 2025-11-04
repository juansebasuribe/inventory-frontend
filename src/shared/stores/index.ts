// src/shared/stores/index.ts

// ========================
// AUTH STORE
// ========================
export { 
  useAuthStore, 
  authSelectors,
  useAuth,
  useCurrentUser,
  useUserRole,
  usePermissions 
} from './authStore';

export type { 
  AuthState, 
  AuthActions, 
  AuthStore 
} from './authStore';

// ========================
// HOOKS
// ========================
export * from './hooks';

// ========================
// FUTURE STORES
// ========================
// TODO: Agregar otros stores aquí cuando sean necesarios
// export { useProductStore } from './productStore';
// export { useInventoryStore } from './inventoryStore';
// export { useDashboardStore } from './dashboardStore';