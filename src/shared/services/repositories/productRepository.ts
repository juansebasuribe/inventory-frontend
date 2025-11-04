// src/shared/services/repositories/productRepository.ts
import { BaseRepository } from './baseRepository';
import { ApiClient } from '../api/apiClient';
import type { 
  PaginatedResponse,
  FilterParams 
} from '../../types/api.types';
import type {
  Product
} from '../../types/product.types';
import type {
  ProductStatus
} from '../../types/entities';

// ========================
// PRODUCT DTOs
// ========================
export interface CreateProductDto {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category_id: number;
  provider_id: number;
  price: number;
  cost?: number;
  tax_rate?: number;
  weight?: number;
  dimensions?: string;
  status: ProductStatus;
  image?: string;
  is_active?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category_id?: number;
  provider_id?: number;
  price?: number;
  cost?: number;
  tax_rate?: number;
  weight?: number;
  dimensions?: string;
  status?: ProductStatus;
  image?: string;
  is_active?: boolean;
}

export interface ProductFilter extends FilterParams {
  category_id?: number;
  provider_id?: number;
  status?: ProductStatus;
  is_active?: boolean;
  price_min?: number;
  price_max?: number;
  search?: string;
  [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}

export interface ProductBulkPriceUpdateDto {
  products: Array<{
    id: number;
    price: number;
    cost?: number;
  }>;
}

export interface ProductInventoryDto {
  product_id: number;
  warehouse_id: number;
  current_stock: number;
  reserved_stock: number;
  minimum_stock: number;
  maximum_stock: number;
}

// ========================
// PRODUCT REPOSITORY INTERFACE
// ========================
export interface IProductRepository extends BaseRepository<Product, CreateProductDto, UpdateProductDto> {
  // Category management
  getProductsByCategory(categoryId: number): Promise<PaginatedResponse<Product>>;
  
  // Provider management
  getProductsByProvider(providerId: number): Promise<PaginatedResponse<Product>>;
  
  // SKU and Barcode operations
  findBySku(sku: string): Promise<Product | null>;
  findByBarcode(barcode: string): Promise<Product | null>;
  validateSku(sku: string, excludeId?: number): Promise<boolean>;
  
  // Price management
  updatePrice(id: number, price: number, cost?: number): Promise<Product>;
  bulkUpdatePrices(data: ProductBulkPriceUpdateDto): Promise<Product[]>;
  getProductsByPriceRange(minPrice: number, maxPrice: number): Promise<PaginatedResponse<Product>>;
  
  // Status management
  activateProduct(id: number): Promise<Product>;
  deactivateProduct(id: number): Promise<Product>;
  updateStatus(id: number, status: ProductStatus): Promise<Product>;
  
  // Search and filtering
  searchProducts(query: string, filters?: ProductFilter): Promise<PaginatedResponse<Product>>;
  getTopSellingProducts(limit?: number): Promise<Product[]>;
  getLowStockProducts(warehouseId?: number): Promise<Product[]>;
  
  // Inventory related
  getProductInventory(productId: number): Promise<ProductInventoryDto[]>;
  
  // Statistics
  getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  }>;
}

// ========================
// PRODUCT REPOSITORY IMPLEMENTATION
// ========================
export class ProductRepository extends BaseRepository<Product, CreateProductDto, UpdateProductDto> 
  implements IProductRepository {

  constructor(apiClient: ApiClient) {
    super(apiClient, {
      endpoint: '/api/product/v1/products/',
      idField: 'id'
    });
  }

  // ========================
  // CATEGORY MANAGEMENT
  // ========================
  async getProductsByCategory(categoryId: number): Promise<PaginatedResponse<Product>> {
    if (!categoryId) {
      throw new Error('Category ID is required');
    }
    
    return this.findAll({
      filter: { category_id: categoryId },
      include: ['category', 'provider']
    });
  }

  // ========================
  // PROVIDER MANAGEMENT
  // ========================
  async getProductsByProvider(providerId: number): Promise<PaginatedResponse<Product>> {
    if (!providerId) {
      throw new Error('Provider ID is required');
    }
    
    return this.findAll({
      filter: { provider_id: providerId },
      include: ['category', 'provider']
    });
  }

  // ========================
  // SKU AND BARCODE OPERATIONS
  // ========================
  async findBySku(sku: string): Promise<Product | null> {
    if (!sku) {
      throw new Error('SKU is required');
    }
    
    try {
      const response = await this.findAll({
        filter: { sku },
        pagination: { pageSize: 1 }
      });
      
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    if (!barcode) {
      throw new Error('Barcode is required');
    }
    
    try {
      const response = await this.findAll({
        filter: { barcode },
        pagination: { pageSize: 1 }
      });
      
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async validateSku(sku: string, excludeId?: number): Promise<boolean> {
    if (!sku) {
      throw new Error('SKU is required');
    }
    
    const product = await this.findBySku(sku);
    
    if (!product) {
      return true; // SKU is available
    }
    
    if (excludeId && product.id === excludeId) {
      return true; // SKU belongs to the same product being updated
    }
    
    return false; // SKU is already taken
  }

  // ========================
  // PRICE MANAGEMENT
  // ========================
  async updatePrice(id: number, price: number, cost?: number): Promise<Product> {
    this.validateId(id);
    
    if (price < 0) {
      throw new Error('Price cannot be negative');
    }
    
    const updateData: UpdateProductDto = { price };
    if (cost !== undefined) {
      if (cost < 0) {
        throw new Error('Cost cannot be negative');
      }
      updateData.cost = cost;
    }
    
    return this.update(id, updateData);
  }

  async bulkUpdatePrices(data: ProductBulkPriceUpdateDto): Promise<Product[]> {
    this.validateData(data);
    
    if (!data.products || data.products.length === 0) {
      throw new Error('At least one product price update is required');
    }
    
    const url = this.buildEndpointUrl('bulk-update-prices/');
    return this.apiClient.post<Product[]>(url, data);
  }

  async getProductsByPriceRange(minPrice: number, maxPrice: number): Promise<PaginatedResponse<Product>> {
    if (minPrice < 0 || maxPrice < 0) {
      throw new Error('Prices cannot be negative');
    }
    
    if (minPrice > maxPrice) {
      throw new Error('Minimum price cannot be greater than maximum price');
    }
    
    return this.findAll({
      filter: { 
        price_min: minPrice, 
        price_max: maxPrice 
      },
      include: ['category', 'provider']
    });
  }

  // ========================
  // STATUS MANAGEMENT
  // ========================
  async activateProduct(id: number): Promise<Product> {
    this.validateId(id);
    
    const url = this.buildEndpointUrl(`${id}/activate/`);
    return this.apiClient.post<Product>(url);
  }

  async deactivateProduct(id: number): Promise<Product> {
    this.validateId(id);
    
    const url = this.buildEndpointUrl(`${id}/deactivate/`);
    return this.apiClient.post<Product>(url);
  }

  async updateStatus(id: number, status: ProductStatus): Promise<Product> {
    this.validateId(id);
    
    if (!status) {
      throw new Error('Status is required');
    }
    
    return this.update(id, { status });
  }

  // ========================
  // SEARCH AND FILTERING
  // ========================
  async searchProducts(query: string, filters?: ProductFilter): Promise<PaginatedResponse<Product>> {
    return this.search(query, {
      fields: ['name', 'description', 'sku', 'barcode'],
      filter: filters,
      pagination: { pageSize: 20 }
    });
  }

  async getTopSellingProducts(limit: number = 10): Promise<Product[]> {
    const url = this.buildEndpointUrl(`top-selling/?limit=${limit}`);
    return this.apiClient.get<Product[]>(url);
  }

  async getLowStockProducts(warehouseId?: number): Promise<Product[]> {
    let url = this.buildEndpointUrl('low-stock/');
    
    if (warehouseId) {
      url += `?warehouse_id=${warehouseId}`;
    }
    
    return this.apiClient.get<Product[]>(url);
  }

  // ========================
  // INVENTORY RELATED
  // ========================
  async getProductInventory(productId: number): Promise<ProductInventoryDto[]> {
    this.validateId(productId);
    
    const url = this.buildEndpointUrl(`${productId}/inventory/`);
    return this.apiClient.get<ProductInventoryDto[]>(url);
  }

  // ========================
  // STATISTICS
  // ========================
  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const url = this.buildEndpointUrl('stats/');
    return this.apiClient.get<{
      total: number;
      active: number;
      inactive: number;
      byCategory: Record<string, number>;
      byStatus: Record<string, number>;
    }>(url);
  }
}

// ========================
// SINGLETON EXPORT
// ========================
export const createProductRepository = (apiClient: ApiClient): ProductRepository => {
  return new ProductRepository(apiClient);
};