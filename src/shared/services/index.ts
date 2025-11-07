// src/shared/services/index.ts

// ========================
// EXPORT API CLIENT
// ========================
export { 
  ApiClient,
  type ApiClientError,
  type NetworkError,
  type AuthenticationError,
  type ValidationError,
  apiClient 
} from './api/apiClient';

// ========================
// EXPORT SERVICES
// ========================
export { default as warehouseService } from './warehouseService';
export type { 
  WarehouseRole, 
  WarehouseLocation, 
  WarehouseAssignment, 
  WarehouseAssignmentsResponse 
} from './warehouseService';

// ========================
// EXPORT ALL REPOSITORIES
// ========================
export * from './repositories';

// ========================
// MAIN SERVICE PROVIDER
// ========================
import RepositoryManager from './repositories';

export class ServiceProvider {
  private static instance: ServiceProvider;
  
  public readonly repositories: typeof RepositoryManager;

  private constructor() {
    this.repositories = RepositoryManager;
  }

  public static getInstance(): ServiceProvider {
    if (!ServiceProvider.instance) {
      ServiceProvider.instance = new ServiceProvider();
    }
    return ServiceProvider.instance;
  }

  // ========================
  // AUTHENTICATION HELPERS
  // ========================
  public async login(identifier: string, password: string) {
    // Intento por el repositorio (usa username por defecto)
    try {
      return await this.repositories.user.login(identifier, password);
    } catch (e1: any) {
      const { apiClient } = await import('./api/apiClient');
      const looksLikeEmail = (identifier || '').includes('@');
      const isAuthErr = !!e1 && typeof e1 === 'object' && (e1.status === 401 || e1.code === 'AUTH_ERROR');

      // Si falló por credenciales, probar variante con email
      if (isAuthErr) {
        try {
          const resp = await apiClient.post<any>('/auth/jwt/create/', {
            email: (identifier || '').toLowerCase().trim(),
            password: (password || '').trim(),
          });
          apiClient.setAuthTokens(resp as any);
          return resp as any;
        } catch (e2) {
          // Último intento: si parecía email, probar username en minúsculas
          if (looksLikeEmail) {
            const resp2 = await apiClient.post<any>('/auth/jwt/create/', {
              username: (identifier || '').toLowerCase().trim(),
              password: (password || '').trim(),
            });
            apiClient.setAuthTokens(resp2 as any);
            return resp2 as any;
          }
          throw e2;
        }
      }
      throw e1;
    }
  }

  public async logout() {
    return this.repositories.user.logout();
  }

  public getCurrentUser() {
    return this.repositories.user.getCurrentUser();
  }

  public isAuthenticated(): boolean {
    return this.repositories.isAuthenticated();
  }

  // ========================
  // UTILITY METHODS
  // ========================
  public clearAuthTokens(): void {
    this.repositories.clearAuth();
  }

  public getApiBaseUrl(): string {
    return this.repositories.getBaseUrl();
  }
}

// ========================
// DEFAULT EXPORT - SINGLETON
// ========================
export default ServiceProvider.getInstance();

// ========================
// CONVENIENT EXPORTS
// ========================
export const services = ServiceProvider.getInstance();
export const { repositories } = services;
