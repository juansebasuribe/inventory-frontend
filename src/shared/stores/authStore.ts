// src/shared/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { AuthTokens } from '../types/api.types';
import type { User, UserRole } from '../types/entities';
import { services } from '../services';
import { apiClient } from '../services';

// ========================
// AUTH STATE INTERFACE
// ========================
export interface AuthState {
  // Estado de autenticación
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Datos del usuario
  user: User | null;
  tokens: AuthTokens | null;
  
  // Errores
  error: string | null;
  
  // Metadatos
  lastActivity: number | null;
  sessionTimeout: number;
}

// ========================
// AUTH ACTIONS INTERFACE
// ========================
export interface AuthActions {
  // Inicialización
  initialize: () => Promise<void>;
  
  // Autenticación
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  
  // Usuario
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  
  // Tokens
  setTokens: (tokens: AuthTokens | null) => void;
  clearTokens: () => void;
  
  // Estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Actividad
  updateActivity: () => void;
  checkSession: () => boolean;
  
  // Utilidades
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  canAccess: (resource: string) => boolean;
  reset: () => void;
}

// ========================
// AUTH STORE TYPE
// ========================
export type AuthStore = AuthState & AuthActions;

// ========================
// INITIAL STATE
// ========================
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  user: null,
  tokens: null,
  error: null,
  lastActivity: null,
  sessionTimeout: 30 * 60 * 1000, // 30 minutos en milisegundos
};

// ========================
// PERMISSIONS MAP - BASADO EN BACKEND DJANGO
// ========================
const PERMISSIONS: Record<string, UserRole[]> = {
  // Gestión de usuarios (solo manager y supervisor)
  'users.view': ['manager', 'supervisor'],
  'users.create': ['manager'],
  'users.edit': ['manager'],
  'users.delete': ['manager'],
  
  // Gestión de productos  
  'products.view': ['manager', 'supervisor', 'editor', 'operator', 'seller', 'seller_tt', 'seller_executive'],
  'products.create': ['manager', 'supervisor', 'editor'],
  'products.edit': ['manager', 'supervisor', 'editor'],
  'products.delete': ['manager', 'supervisor'],
  'products.price_edit': ['manager', 'supervisor', 'seller_executive'], // Solo ejecutivos pueden cambiar precios
  
  // Gestión de inventario
  'inventory.view': ['manager', 'supervisor', 'editor', 'operator'],
  'inventory.edit': ['manager', 'supervisor', 'editor'],
  'inventory.reports': ['manager', 'supervisor'],
  
  // Gestión de ventas y carrito
  'sales.view': ['manager', 'supervisor', 'editor', 'seller', 'seller_tt', 'seller_executive'],
  'sales.create': ['manager', 'supervisor', 'editor', 'seller', 'seller_tt', 'seller_executive'], 
  'sales.edit': ['manager', 'supervisor', 'editor'],
  'cart.access': ['manager', 'supervisor', 'editor', 'seller', 'seller_tt', 'seller_executive'],
  
  // Categorías y proveedores
  'categories.view': ['manager', 'supervisor', 'editor', 'operator'],
  'categories.create': ['manager', 'supervisor', 'editor'],
  'categories.edit': ['manager', 'supervisor', 'editor'],
  'categories.delete': ['manager', 'supervisor'],
  
  'providers.view': ['manager', 'supervisor', 'editor', 'operator'],
  'providers.create': ['manager', 'supervisor', 'editor'],
  'providers.edit': ['manager', 'supervisor', 'editor'],
  'providers.delete': ['manager', 'supervisor'],
  
  // Reportes
  'reports.view': ['manager', 'supervisor'],
  'reports.export': ['manager', 'supervisor'],
  
  // Configuración
  'settings.view': ['manager'],
  'settings.edit': ['manager'],
  
  // Dashboard
  'dashboard.access': ['manager', 'supervisor', 'editor', 'seller', 'seller_tt', 'seller_executive', 'operator'],
  'dashboard.view': ['manager', 'supervisor', 'editor', 'seller', 'seller_tt', 'seller_executive', 'operator'],
};

// ========================
// AUTH STORE IMPLEMENTATION
// ========================
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        ...initialState,

        // ========================
        // INICIALIZACIÓN
        // ========================
        initialize: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const tokens = apiClient.getAuthTokens();
            
            if (tokens) {
              // Recuperar también el usuario del localStorage
              const storedUser = localStorage.getItem('auth_user');
              let user = null;
              
              if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
                try {
                  user = JSON.parse(storedUser);
                } catch (error) {
                  console.warn('Error parsing user from localStorage:', error);
                  localStorage.removeItem('auth_user');
                }
              }
              
              set({
                isAuthenticated: true,
                user,
                tokens,
                lastActivity: Date.now(),
                isInitialized: true,
                isLoading: false
              });
            } else {
              set({
                ...initialState,
                isInitialized: true,
                isLoading: false
              });
            }
          } catch (error: any) {
            set({
              ...initialState,
              error: error.message || 'Error de inicialización',
              isInitialized: true,
              isLoading: false
            });
          }
        },

        // ========================
        // AUTENTICACIÓN
        // ========================
        login: async (usernameOrEmail: string, password: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // Realizar login (el parámetro se llama email pero en realidad es username)
            const tokens = await services.login(usernameOrEmail, password);
            
            // NO marcar como autenticado aún - primero obtener el usuario
            set({
              isAuthenticated: false, // ← Todavía no autenticado completamente
              user: null,
              tokens,
              lastActivity: Date.now(),
              isLoading: true, // ← Mantener loading mientras se carga el usuario
              error: null
            });
            
            // Pequeño delay para asegurar que el token se propague en apiClient
            await new Promise(resolve => setTimeout(resolve, 100));
            
            try {
              // Obtener información del usuario actual
              let user = await services.repositories.user.getCurrentUser();
              // Enriquecer con perfil/rol antes de continuar
              try {
                const profile = await apiClient.get<any>(`/api/user/v1/my-profile/${user.id}/`);
                if (profile && typeof profile === 'object') {
                  user = { ...(user as any), profile } as any;
                }
              } catch (e1) {
                try {
                  const profResp = await apiClient.get<any>(`/api/user/v1/profiles/?user=${user.id}`);
                  const arr = Array.isArray(profResp) ? profResp : (profResp?.results || []);
                  if (arr && arr.length) {
                    user = { ...(user as any), profile: arr[0] } as any;
                  }
                } catch {}
              }
              
              console.log('✅ [AuthStore] Usuario cargado completo:', user);
              console.log('🔍 [AuthStore] Tipo de user:', typeof user);
              console.log('🔍 [AuthStore] Es objeto:', user !== null && typeof user === 'object');
              console.log('🔍 [AuthStore] Keys del user:', Object.keys(user));
              console.log('🔍 [AuthStore] JSON.stringify:', JSON.stringify(user, null, 2));
              console.log('🔍 [AuthStore] Detalles del usuario:', {
                id: user.id,
                username: user.username,
                email: user.email,
                hasProfile: !!user.profile,
                profile: user.profile,
                profileKeys: user.profile ? Object.keys(user.profile) : [],
                role: user.profile?.role
              });
              
              // Guardar usuario en localStorage para persistencia
              localStorage.setItem('auth_user', JSON.stringify(user));
              
              // AHORA SÍ marcar como autenticado con el usuario completo
              set({ 
                isAuthenticated: true,
                user,
                isLoading: false
              });
            } catch (userError) {
              console.error('❌ [AuthStore] Error obteniendo información del usuario:', userError);
              // Si no podemos obtener el usuario, el login falla
              set({
                isAuthenticated: false,
                user: null,
                tokens: null,
                isLoading: false,
                error: 'Error obteniendo información del usuario'
              });
              throw new Error('No se pudo obtener la información del usuario');
            }
            
          } catch (error: any) {
            set({
              isAuthenticated: false,
              user: null,
              tokens: null,
              isLoading: false,
              error: error.message || 'Error de autenticación'
            });
            throw error;
          }
        },

        logout: async () => {
          set({ isLoading: true });
          
          try {
            await services.logout();
          } catch (error) {
            console.warn('Error durante logout:', error);
          } finally {
            // Limpiar también el usuario del localStorage
            localStorage.removeItem('auth_user');
            
            set({
              ...initialState,
              isInitialized: true,
              isLoading: false
            });
          }
        },

        refreshToken: async () => {
          const { tokens } = get();
          
          if (!tokens?.refresh) {
            throw new Error('No hay token de refresh disponible');
          }
          
          try {
            const newTokens = await services.repositories.user.refreshToken(tokens.refresh);
            
            set({
              tokens: newTokens,
              lastActivity: Date.now(),
              error: null
            });
          } catch (error: any) {
            // Token refresh falló, cerrar sesión
            await get().logout();
            throw error;
          }
        },

        // ========================
        // GESTIÓN DE USUARIO
        // ========================
        setUser: (user: User | null) => {
          set({ user });
        },

        updateUser: (updates: Partial<User>) => {
          const { user } = get();
          if (user) {
            set({ user: { ...user, ...updates } });
          }
        },

        // ========================
        // GESTIÓN DE TOKENS
        // ========================
        setTokens: (tokens: AuthTokens | null) => {
          set({ tokens });
        },

        clearTokens: () => {
          set({ tokens: null });
        },

        // ========================
        // GESTIÓN DE ESTADO
        // ========================
        setLoading: (isLoading: boolean) => {
          set({ isLoading });
        },

        setError: (error: string | null) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        },

        // ========================
        // GESTIÓN DE ACTIVIDAD
        // ========================
        updateActivity: () => {
          set({ lastActivity: Date.now() });
        },

        checkSession: () => {
          const { lastActivity, sessionTimeout, isAuthenticated } = get();
          
          if (!isAuthenticated || !lastActivity) {
            return false;
          }
          
          const now = Date.now();
          const isExpired = (now - lastActivity) > sessionTimeout;
          
          if (isExpired) {
            get().logout();
            return false;
          }
          
          return true;
        },

        // ========================
        // UTILIDADES DE PERMISOS
        // ========================
        hasRole: (role: UserRole) => {
          const { user } = get();
          return user?.profile?.role === role;
        },

        hasAnyRole: (roles: UserRole[]) => {
          const { user } = get();
          const userRole = user?.profile?.role;
          return userRole ? roles.includes(userRole) : false;
        },

        canAccess: (resource: string) => {
          const { user } = get();
          const userRole = user?.profile?.role;
          
          if (!userRole) return false;
          
          const allowedRoles = PERMISSIONS[resource];
          return allowedRoles ? allowedRoles.includes(userRole) : false;
        },

        // ========================
        // RESET
        // ========================
        reset: () => {
          set(initialState);
        }
      }),
      {
        name: 'tita-auth-storage',
        storage: createJSONStorage(() => localStorage),
        // Solo persistir datos esenciales
        partialize: (state) => ({
          tokens: state.tokens,
          user: state.user,
          lastActivity: state.lastActivity,
          isAuthenticated: state.isAuthenticated
        }),
        // Versión para manejar migraciones futuras
        version: 1,
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migración de versión anterior si es necesario
            return persistedState;
          }
          return persistedState;
        }
      }
    ),
    {
      name: 'auth-store', // Nombre para DevTools
      enabled: import.meta.env.DEV, // Solo en desarrollo
    }
  )
);

// ========================
// SELECTORS OPTIMIZADOS
// ========================
export const authSelectors = {
  // Estado básico
  isAuthenticated: (state: AuthStore) => state.isAuthenticated,
  isLoading: (state: AuthStore) => state.isLoading,
  isInitialized: (state: AuthStore) => state.isInitialized,
  
  // Usuario y datos
  user: (state: AuthStore) => state.user,
  userRole: (state: AuthStore) => state.user?.profile?.role,
  userFullName: (state: AuthStore) => 
    state.user ? `${state.user.first_name} ${state.user.last_name}` : '',
  
  // Errores
  error: (state: AuthStore) => state.error,
  
  // Permisos
  canViewUsers: (state: AuthStore) => state.canAccess('users.view'),
  canViewProducts: (state: AuthStore) => state.canAccess('products.view'),
  canViewInventory: (state: AuthStore) => state.canAccess('inventory.view'),
  canViewReports: (state: AuthStore) => state.canAccess('reports.view'),
  
  // Estado de sesión
  sessionValid: (state: AuthStore) => state.checkSession(),
};

// ========================
// HOOKS PERSONALIZADOS
// ========================
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    // Estado
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    user: store.user,
    tokens: store.tokens,
    error: store.error,
    
    // Acciones
    login: store.login,
    logout: store.logout,
    initialize: store.initialize,
    clearError: store.clearError,
    updateActivity: store.updateActivity,
    
    // Utilidades
    hasRole: store.hasRole,
    hasAnyRole: store.hasAnyRole,
    canAccess: store.canAccess,
    checkSession: store.checkSession,
  };
};

export const useCurrentUser = () => {
  return useAuthStore(authSelectors.user);
};

export const useUserRole = () => {
  return useAuthStore(authSelectors.userRole);
};

export const usePermissions = () => {
  const store = useAuthStore();
  
  return {
    canViewUsers: store.canAccess('users.view'),
    canEditUsers: store.canAccess('users.edit'),
    canViewProducts: store.canAccess('products.view'),
    canEditProducts: store.canAccess('products.edit'),
    canViewInventory: store.canAccess('inventory.view'),
    canEditInventory: store.canAccess('inventory.edit'),
    canViewReports: store.canAccess('reports.view'),
    canAccess: store.canAccess,
  };
};
