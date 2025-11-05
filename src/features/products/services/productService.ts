// src/features/products/services/productService.ts

/**
 * Servicio principal para gestión de productos
 * Implementa CRUD completo con soporte para imágenes, filtros y búsquedas
 */

import type {
  Product,
  ProductSimple,
  ProductCreate,
  ProductUpdate,
  ProductFilters,
  ProductSearchParams,
  ProductListResponse,
  ProductProviderRelationship,
  ProductProviderCreate
} from '../../../shared/types/product.types';
import { apiClient } from '../../../shared/services';
import { PRODUCT_API_ENDPOINTS, PAGINATION_CONFIG, FILTER_CONFIG } from '../constants';
import { imageService } from './imageService';

// ========================================
// INTERFACES DE RESPUESTA
// ========================================

interface ProductCreateResponse extends Product {
  message: string;
}

interface ProductUpdateResponse extends Product {
  message: string;
}

interface ProductSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[] | ProductSimple[];
}

// ========================================
// UTILIDADES DE FILTROS
// ========================================

class FilterHelper {
  /**
   * Construye parámetros de query para filtros
   */
  static buildQueryParams(filters: ProductFilters): URLSearchParams {
    const params = new URLSearchParams();

    // Filtros básicos
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    if (filters.category !== undefined) {
      params.append('category', filters.category.toString());
    }
    
    if (filters.provider !== undefined) {
      params.append('provider', filters.provider.toString());
    }
    
    if (filters.in_stock !== undefined) {
      params.append('in_stock', filters.in_stock.toString());
    }
    
    if (filters.needs_restock !== undefined) {
      params.append('needs_restock', filters.needs_restock.toString());
    }
    
    if (filters.price_min !== undefined) {
      params.append('price_min', filters.price_min.toString());
    }
    
    if (filters.price_max !== undefined) {
      params.append('price_max', filters.price_max.toString());
    }
    
    if (filters.active !== undefined) {
      params.append('active', filters.active.toString());
    }

    return params;
  }

  /**
   * Construye parámetros de búsqueda con paginación y ordenamiento
   */
  static buildSearchParams(searchParams: ProductSearchParams): URLSearchParams {
    const params = this.buildQueryParams(searchParams);

    // Paginación
    if (searchParams.page !== undefined) {
      params.append('page', searchParams.page.toString());
    }
    
    if (searchParams.page_size !== undefined) {
      params.append('page_size', searchParams.page_size.toString());
    }
    
    // Ordenamiento
    if (searchParams.ordering) {
      params.append('ordering', searchParams.ordering);
    }

    return params;
  }

  /**
   * Valida y limpia filtros
   */
  static sanitizeFilters(filters: ProductFilters): ProductFilters {
    const sanitized: ProductFilters = {};

    // Limpiar búsqueda
    if (filters.search && filters.search.trim().length >= FILTER_CONFIG.SEARCH_MIN_LENGTH) {
      sanitized.search = filters.search.trim();
    }

    // Validar números
    if (filters.category && filters.category > 0) {
      sanitized.category = filters.category;
    }
    
    if (filters.provider && filters.provider > 0) {
      sanitized.provider = filters.provider;
    }
    
    if (filters.price_min && filters.price_min >= 0) {
      sanitized.price_min = filters.price_min;
    }
    
    if (filters.price_max && filters.price_max >= 0) {
      sanitized.price_max = filters.price_max;
    }

    // Validar que price_max > price_min
    if (sanitized.price_min && sanitized.price_max) {
      if (sanitized.price_max < sanitized.price_min) {
        delete sanitized.price_max;
      }
    }

    // Booleans
    if (filters.in_stock !== undefined) {
      sanitized.in_stock = filters.in_stock;
    }
    
    if (filters.needs_restock !== undefined) {
      sanitized.needs_restock = filters.needs_restock;
    }
    
    if (filters.active !== undefined) {
      sanitized.active = filters.active;
    }

    return sanitized;
  }
}

// ========================================
// UTILIDADES DE TRANSFORMACIÓN
// ========================================

class DataTransformer {
  /**
   * Transforma datos de creación para el API
   */
  static transformCreateData(data: ProductCreate): FormData {
    const formData = new FormData();

    // Campos básicos
    formData.append('name', data.name);
    formData.append('bar_code', data.bar_code);
    formData.append('retail_price', data.retail_price.toString());
    formData.append('cost_price', data.cost_price.toString());
    formData.append('category', data.category.toString());

    // Campos opcionales
    if (data.description) {
      formData.append('description', data.description);
    }

    // Imagen principal
    if (data.main_image) {
      formData.append('main_image', data.main_image);
    }

    return formData;
  }

  /**
   * Transforma datos de actualización para el API
   */
  static transformUpdateData(data: ProductUpdate): FormData {
    const formData = new FormData();

    // IMPORTANT: Solo agregar campos que realmente han cambiado y no están vacíos
    
    // Campos de texto - validar que no estén vacíos
    if (data.name !== undefined && data.name.trim() !== '') {
      formData.append('name', data.name.trim());
    }
    
    if (data.description !== undefined) {
      // Permitir descripción vacía
      formData.append('description', data.description.trim());
    }
    
    // Campos numéricos - validar que sean números válidos
    if (data.retail_price !== undefined && !isNaN(data.retail_price) && data.retail_price > 0) {
      formData.append('retail_price', data.retail_price.toString());
    }
    
    if (data.cost_price !== undefined && !isNaN(data.cost_price) && data.cost_price > 0) {
      formData.append('cost_price', data.cost_price.toString());
    }
    
    if (data.category !== undefined && !isNaN(data.category) && data.category > 0) {
      formData.append('category', data.category.toString());
    }

    // Manejo especial para imagen principal
    // IMPORTANTE: Solo enviar si es un archivo nuevo válido
    if (data.main_image instanceof File) {
      // Validar que sea un archivo de imagen válido
      if (data.main_image.type.startsWith('image/') && data.main_image.size > 0) {
        formData.append('main_image', data.main_image, data.main_image.name);
        console.log('📸 Imagen a enviar:', {
          name: data.main_image.name,
          size: data.main_image.size,
          type: data.main_image.type
        });
      } else {
        console.warn('⚠️ Invalid image file provided, skipping main_image update');
      }
    }
    // Si main_image es null o undefined, NO agregar nada (no actualizar imagen)

    // Log para debugging (solo en desarrollo)
    // @ts-ignore - process.env está disponible en Vite
    if (import.meta.env.DEV) {
      console.log('🔄 FormData contents for product update:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    }

    return formData;
  }

  /**
   * Transforma respuesta del API para consistencia
   */
  static transformProductResponse(product: any): Product {
    return {
      ...product,
      // Asegurar que arrays existan
      additional_images: product.additional_images || [],
      provider_relationships: product.provider_relationships || [],
      // Asegurar precios como números
      retail_price: Number(product.retail_price),
      current_price: Number(product.current_price),
      cost_price: Number(product.cost_price),
      total_stock: Number(product.total_stock),
      // Asegurar booleans
      in_stock: Boolean(product.in_stock),
      needs_restock: Boolean(product.needs_restock),
      active: Boolean(product.active),
      can_modify_price: Boolean(product.can_modify_price),
      is_tt_discount: Boolean(product.is_tt_discount)
    };
  }
}

// ========================================
// SERVICIO PRINCIPAL DE PRODUCTOS
// ========================================

export class ProductService {
  private static instance: ProductService;

  private constructor() {}

  /**
   * Singleton pattern para instancia única
   */
  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  // ========================================
  // MÉTODOS CRUD BÁSICOS
  // ========================================

  /**
   * Obtiene lista de productos con filtros y paginación
   */
  async getProducts(searchParams: ProductSearchParams = {}): Promise<ProductListResponse> {
    try {
      // Sanitizar y validar parámetros
      const sanitizedFilters = FilterHelper.sanitizeFilters(searchParams);
      const finalParams = {
        ...sanitizedFilters,
        page: searchParams.page || 1,
        page_size: searchParams.page_size || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        ordering: searchParams.ordering || FILTER_CONFIG.SORT_FIELDS.NAME
      };

      const queryParams = FilterHelper.buildSearchParams(finalParams);
      
      const response = await apiClient.get<ProductSearchResponse>(
        `${PRODUCT_API_ENDPOINTS.PRODUCTS}?${queryParams.toString()}`
      );

      // Transformar resultados
      const transformedResults = response.results.map((product: any) => 
        DataTransformer.transformProductResponse(product)
      );

      return {
        ...response,
        results: transformedResults
      };
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw new Error('Error al cargar la lista de productos');
    }
  }

  /**
   * Obtiene un producto por su código de barras
   */
  async getProductByBarCode(barCode: string): Promise<Product> {
    try {
      const response = await apiClient.get<Product>(
        PRODUCT_API_ENDPOINTS.PRODUCT_DETAIL_BY_CODE(barCode)
      );
      
      return DataTransformer.transformProductResponse(response);
    } catch (error) {
      console.error('Error al obtener producto:', error);
      throw new Error('Producto no encontrado');
    }
  }

  /**
   * Crea un nuevo producto
   */
  async createProduct(productData: ProductCreate): Promise<Product> {
    try {
      console.log('🔍 [ProductService] Iniciando creación de producto...');
      console.log('📦 Datos recibidos:', productData);
      
      // Validar imagen principal si existe
      if (productData.main_image) {
        console.log('🖼️ Validando imagen principal...');
        const validation = await imageService.validateImage(productData.main_image);
        if (!validation.isValid) {
          throw new Error(`Imagen inválida: ${validation.errors.join(', ')}`);
        }
        console.log('✅ Imagen principal válida');
      }

      // Transformar datos para envío
      console.log('🔄 Transformando datos a FormData...');
      const formData = DataTransformer.transformCreateData(productData);
      
      // Log de FormData (para debugging)
      console.log('📋 FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      console.log('📡 Enviando POST a:', PRODUCT_API_ENDPOINTS.PRODUCTS);
      const response = await apiClient.post<ProductCreateResponse>(
        PRODUCT_API_ENDPOINTS.PRODUCTS,
        formData
      );

      console.log('✅ Producto creado en backend:', response);
      const createdProduct = DataTransformer.transformProductResponse(response);

      // Subir imágenes adicionales si existen - pero manejar errores sin fallar la creación
      if (productData.additional_images && productData.additional_images.length > 0) {
        try {
          await this.uploadAdditionalImages(createdProduct.bar_code, productData.additional_images);
          
          // Volver a obtener el producto con todas las imágenes
          return this.getProductByBarCode(createdProduct.bar_code);
        } catch (imageError) {
          console.warn('⚠️ Warning: Could not upload additional images, but product was created successfully:', imageError);
          // No lanzar error - el producto se creó exitosamente, solo fallaron las imágenes adicionales
          // TODO: Informar al usuario que las imágenes adicionales no se pudieron subir
        }
      }

      return createdProduct;
    } catch (error) {
      console.error('❌ Error al crear producto:', error);
      throw new Error('Error al crear el producto');
    }
  }

  /**
   * Actualiza un producto existente
   */
  async updateProduct(barCode: string, productData: ProductUpdate): Promise<Product> {
    try {
      // Validar que tenemos datos para actualizar
      if (!barCode || !productData) {
        throw new Error('Datos inválidos para actualizar');
      }

      // Validar nueva imagen principal si existe
      if (productData.main_image && productData.main_image instanceof File) {
        const validation = await imageService.validateImage(productData.main_image);
        if (!validation.isValid) {
          throw new Error(`Imagen inválida: ${validation.errors.join(', ')}`);
        }
      }

      // Transformar datos para envío
      const formData = DataTransformer.transformUpdateData(productData);

      // Validar que FormData no esté vacío
      let isEmpty = true;
      for (let [_key, _value] of formData.entries()) {
        isEmpty = false;
        break;
      }

      if (isEmpty) {
        throw new Error('No hay cambios para guardar');
      }

      console.log('📤 Enviando actualización:', { barCode, fields: Array.from(formData.keys()) });

      const response = await apiClient.patch<ProductUpdateResponse>(
        PRODUCT_API_ENDPOINTS.PRODUCT_DETAIL_BY_CODE(barCode),
        formData
      );

      const updatedProduct = DataTransformer.transformProductResponse(response);
      console.log('✅ Producto actualizado:', updatedProduct.name);

      // Manejar imágenes adicionales si existen
      if (productData.additional_images && productData.additional_images.length > 0) {
        await this.uploadAdditionalImages(barCode, productData.additional_images);
        
        // Volver a obtener el producto con todas las imágenes
        return this.getProductByBarCode(barCode);
      }

      return updatedProduct;
    } catch (error) {
      console.error('❌ Error al actualizar producto:', error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Error al actualizar el producto');
    }
  }

  /**
   * Elimina un producto (soft delete)
   */
  async deleteProduct(barCode: string): Promise<void> {
    try {
      await apiClient.delete(PRODUCT_API_ENDPOINTS.PRODUCT_DETAIL_BY_CODE(barCode));
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw new Error('Error al eliminar el producto');
    }
  }

  /**
   * Activa un producto
   */
  async activateProduct(barCode: string): Promise<Product> {
    try {
      const response = await apiClient.patch<Product>(
        PRODUCT_API_ENDPOINTS.PRODUCT_ACTIVATE(barCode)
      );
      
      return DataTransformer.transformProductResponse(response);
    } catch (error) {
      console.error('Error al activar producto:', error);
      throw new Error('Error al activar el producto');
    }
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA Y FILTRADO
  // ========================================

  /**
   * Búsqueda rápida de productos
   */
  async searchProducts(query: string, limit: number = 10): Promise<ProductSimple[]> {
    try {
      const params = new URLSearchParams({
        search: query,
        page_size: limit.toString(),
        ordering: FILTER_CONFIG.SORT_FIELDS.NAME
      });

      const response = await apiClient.get<ProductSearchResponse>(
        `${PRODUCT_API_ENDPOINTS.PRODUCTS}?${params.toString()}`
      );

      return response.results as ProductSimple[];
    } catch (error) {
      console.error('Error en búsqueda de productos:', error);
      throw new Error('Error en la búsqueda');
    }
  }

  /**
   * Obtiene productos inactivos
   */
  async getInactiveProducts(): Promise<ProductListResponse> {
    try {
      const response = await apiClient.get<ProductSearchResponse>(
        PRODUCT_API_ENDPOINTS.PRODUCT_INACTIVE
      );

      const transformedResults = response.results.map((product: any) => 
        DataTransformer.transformProductResponse(product)
      );

      return {
        ...response,
        results: transformedResults
      };
    } catch (error) {
      console.error('Error al obtener productos inactivos:', error);
      throw new Error('Error al cargar productos inactivos');
    }
  }

  // ========================================
  // MÉTODOS DE PROVEEDORES
  // ========================================

  /**
   * Obtiene proveedores de un producto
   */
  async getProductProviders(barCode: string): Promise<ProductProviderRelationship[]> {
    try {
      const response = await apiClient.get<ProductProviderRelationship[]>(
        PRODUCT_API_ENDPOINTS.PRODUCT_PROVIDERS(barCode)
      );
      return response;
    } catch (error) {
      console.error('Error al obtener proveedores del producto:', error);
      throw new Error('Error al cargar proveedores del producto');
    }
  }

  /**
   * Agrega un proveedor a un producto
   */
  async addProductProvider(
    barCode: string, 
    providerData: ProductProviderCreate
  ): Promise<ProductProviderRelationship> {
    try {
      const response = await apiClient.post<ProductProviderRelationship>(
        PRODUCT_API_ENDPOINTS.PRODUCT_PROVIDERS(barCode),
        providerData
      );
      return response;
    } catch (error) {
      console.error('Error al agregar proveedor:', error);
      throw new Error('Error al agregar proveedor al producto');
    }
  }

  /**
   * Establece un proveedor como principal
   */
  async setPrimaryProvider(barCode: string, providerId: number): Promise<void> {
    try {
      await apiClient.post(
        PRODUCT_API_ENDPOINTS.PRODUCT_PROVIDER_SET_PRIMARY(barCode, providerId)
      );
    } catch (error) {
      console.error('Error al establecer proveedor principal:', error);
      throw new Error('Error al establecer proveedor principal');
    }
  }

  // ========================================
  // MÉTODOS AUXILIARES PARA IMÁGENES
  // ========================================

  /**
   * Sube múltiples imágenes adicionales
   */
  private async uploadAdditionalImages(
    barCode: string, 
    images: ProductCreate['additional_images']
  ): Promise<void> {
    if (!images || images.length === 0) return;

    try {
      const uploadPromises = images.map(imageData =>
        imageService.uploadProductImage(barCode, imageData)
      );

      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error al subir imágenes adicionales:', error);
      throw new Error('Error al subir imágenes adicionales');
    }
  }

  // ========================================
  // MÉTODOS UTILITARIOS
  // ========================================

  /**
   * Valida si un código de barras está disponible
   */
  async validateBarCode(barCode: string, excludeId?: number): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        search: barCode,
        bar_code: barCode
      });

      const response = await apiClient.get<ProductSearchResponse>(
        `${PRODUCT_API_ENDPOINTS.PRODUCTS}?${params.toString()}`
      );

      // Si no hay resultados, el código está disponible
      if (response.results.length === 0) {
        return true;
      }

      // Si hay resultados pero estamos excluyendo un ID específico
      if (excludeId) {
        return !response.results.some(product => product.id !== excludeId);
      }

      return false;
    } catch (error) {
      console.error('Error al validar código de barras:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de productos
   */
  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    outOfStock: number;
  }> {
    try {
      // Hacer múltiples llamadas para obtener estadísticas
      const [allProducts, inactiveProducts] = await Promise.all([
        this.getProducts({ page_size: 1 }),
        this.getInactiveProducts()
      ]);

      const [lowStockProducts, outOfStockProducts] = await Promise.all([
        this.getProducts({ needs_restock: true, page_size: 1 }),
        this.getProducts({ in_stock: false, page_size: 1 })
      ]);

      return {
        total: allProducts.count,
        active: allProducts.count - inactiveProducts.count,
        inactive: inactiveProducts.count,
        lowStock: lowStockProducts.count,
        outOfStock: outOfStockProducts.count
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error('Error al cargar estadísticas de productos');
    }
  }
}

// ========================================
// EXPORTACIÓN SINGLETON
// ========================================

export const productService = ProductService.getInstance();