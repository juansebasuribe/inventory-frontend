// src/shared/types/store.types.ts

/**
 * Tipos para los stores de Zustand del módulo de productos
 */

import type { Product, ProductSimple, Category, Provider, ProductFilters, ProductImage } from './product.types';

// ========================================
// ESTADO BASE PARA STORES
// ========================================

export interface BaseStoreState {
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// ========================================
// STORE DE PRODUCTOS
// ========================================

export interface ProductStoreState extends BaseStoreState {
  // Datos principales
  products: Product[];
  currentProduct: Product | null;
  simpleProducts: ProductSimple[];
  
  // Paginación
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  
  // Filtros y búsqueda
  filters: ProductFilters;
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Estados de UI
  selectedProducts: number[];
  viewMode: 'grid' | 'list' | 'table';
  showInactiveProducts: boolean;
}

export interface ProductStoreActions {
  // Obtener datos
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProduct: (id: number) => Promise<Product>;
  fetchProductByBarCode: (barCode: string) => Promise<Product>;
  
  // CRUD
  createProduct: (productData: any) => Promise<Product>;
  updateProduct: (id: number, productData: any) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  activateProduct: (barCode: string) => Promise<void>;
  
  // Gestión de imágenes
  uploadProductImage: (productId: number, imageData: any) => Promise<ProductImage>;
  deleteProductImage: (productId: number, imageId: number) => Promise<void>;
  updateProductImage: (productId: number, imageId: number, imageData: any) => Promise<ProductImage>;
  
  // Filtros y búsqueda
  setFilters: (filters: Partial<ProductFilters>) => void;
  clearFilters: () => void;
  setSearchTerm: (term: string) => void;
  setSorting: (field: string, order: 'asc' | 'desc') => void;
  
  // Paginación
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  
  // Selección
  selectProduct: (id: number) => void;
  selectProducts: (ids: number[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  
  // UI
  setViewMode: (mode: 'grid' | 'list' | 'table') => void;
  toggleShowInactive: () => void;
  setCurrentProduct: (product: Product | null) => void;
  
  // Utilidades
  clearError: () => void;
  reset: () => void;
}

export type ProductStore = ProductStoreState & ProductStoreActions;

// ========================================
// STORE DE CATEGORÍAS
// ========================================

export interface CategoryStoreState extends BaseStoreState {
  categories: Category[];
  categoryTree: Category[];
  currentCategory: Category | null;
  selectedCategories: number[];
}

export interface CategoryStoreActions {
  fetchCategories: () => Promise<void>;
  fetchCategoryTree: () => Promise<void>;
  fetchCategory: (id: number) => Promise<Category>;
  createCategory: (categoryData: any) => Promise<Category>;
  updateCategory: (id: number, categoryData: any) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  setCurrentCategory: (category: Category | null) => void;
  selectCategory: (id: number) => void;
  clearSelection: () => void;
  clearError: () => void;
  reset: () => void;
}

export type CategoryStore = CategoryStoreState & CategoryStoreActions;

// ========================================
// STORE DE PROVEEDORES
// ========================================

export interface ProviderStoreState extends BaseStoreState {
  providers: Provider[];
  currentProvider: Provider | null;
  selectedProviders: number[];
  showInactiveProviders: boolean;
}

export interface ProviderStoreActions {
  fetchProviders: () => Promise<void>;
  fetchProvider: (id: number) => Promise<Provider>;
  createProvider: (providerData: any) => Promise<Provider>;
  updateProvider: (id: number, providerData: any) => Promise<Provider>;
  deleteProvider: (id: number) => Promise<void>;
  rateProvider: (id: number, rating: number) => Promise<void>;
  setCurrentProvider: (provider: Provider | null) => void;
  selectProvider: (id: number) => void;
  clearSelection: () => void;
  toggleShowInactive: () => void;
  clearError: () => void;
  reset: () => void;
}

export type ProviderStore = ProviderStoreState & ProviderStoreActions;

// ========================================
// STORE COMBINADO DE PRODUCTOS (PRINCIPAL)
// ========================================

export interface ProductModuleState {
  products: ProductStoreState;
  categories: CategoryStoreState;
  providers: ProviderStoreState;
  
  // Estado global del módulo
  isInitialized: boolean;
  globalLoading: boolean;
  globalError: string | null;
}

export interface ProductModuleActions {
  // Inicialización
  initializeModule: () => Promise<void>;
  
  // Acciones globales
  setGlobalLoading: (loading: boolean) => void;
  setGlobalError: (error: string | null) => void;
  clearAllErrors: () => void;
  resetModule: () => void;
  
  // Acciones combinadas
  searchAll: (term: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

export type ProductModuleStore = ProductModuleState & ProductModuleActions;

// ========================================
// TIPOS PARA ACTIONS
// ========================================

export interface StoreAction<T = any> {
  type: string;
  payload?: T;
  meta?: {
    timestamp: string;
    source: string;
  };
}

// ========================================
// TIPOS PARA MIDDLEWARE
// ========================================

export interface StoreMiddleware {
  onAction?: (action: StoreAction) => void;
  onStateChange?: (prevState: any, nextState: any) => void;
  onError?: (error: Error, action: StoreAction) => void;
}

// ========================================
// CONFIGURACIÓN DE STORES
// ========================================

export interface StoreConfig {
  persistKey?: string;
  persistWhitelist?: string[];
  persistBlacklist?: string[];
  middleware?: StoreMiddleware[];
  devtools?: boolean;
}

export interface ProductStoreConfig extends StoreConfig {
  defaultPageSize: number;
  defaultSortBy: string;
  defaultSortOrder: 'asc' | 'desc';
  cacheTimeout: number;
  maxCachedProducts: number;
}