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
  public async login(email: string, password: string) {
    return this.repositories.user.login(email, password);
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