// src/shared/services/repositories/index.ts

// ========================
// EXPORT BASE REPOSITORY
// ========================
export { 
  BaseRepository, 
  type IBaseRepository,
  type QueryBuilder,
  type RepositoryConfig,
  ApiQueryBuilder,
  RepositoryFactory 
} from './baseRepository';

// ========================
// EXPORT USER REPOSITORY
// ========================
export { 
  UserRepository,
  type IUserRepository,
  type CreateUserDto,
  type UpdateUserDto,
  type UserFilter,
  type ChangePasswordDto,
  type ResetPasswordDto,
  createUserRepository
} from './userRepository';

// ========================
// EXPORT PRODUCT REPOSITORY
// ========================
export { 
  ProductRepository,
  type IProductRepository,
  type CreateProductDto as CreateProductDto,
  type UpdateProductDto as UpdateProductDto,
  type ProductFilter,
  type ProductBulkPriceUpdateDto,
  type ProductInventoryDto,
  createProductRepository
} from './productRepository';

// ========================
// API CLIENT SINGLETON
// ========================
export { apiClient } from '../api/apiClient';

// ========================
// REPOSITORY FACTORY FUNCTIONS
// ========================
import { apiClient } from '../api/apiClient';
import { UserRepository, createUserRepository } from './userRepository';
import { ProductRepository, createProductRepository } from './productRepository';

export const repositories = {
  user: createUserRepository(apiClient),
  product: createProductRepository(apiClient),
};

// ========================
// REPOSITORY MANAGER
// ========================
export class RepositoryManager {
  private static instance: RepositoryManager;
  
  public readonly user: UserRepository;
  public readonly product: ProductRepository;

  private constructor() {
    this.user = createUserRepository(apiClient);
    this.product = createProductRepository(apiClient);
  }

  public static getInstance(): RepositoryManager {
    if (!RepositoryManager.instance) {
      RepositoryManager.instance = new RepositoryManager();
    }
    return RepositoryManager.instance;
  }

  // ========================
  // UTILITY METHODS
  // ========================
  public isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  public clearAuth(): void {
    apiClient.clearAuthTokens();
  }

  public getBaseUrl(): string {
    return apiClient.getBaseURL();
  }
}

// ========================
// DEFAULT EXPORT
// ========================
export default RepositoryManager.getInstance();