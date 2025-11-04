// src/features/products/services/categoryService.ts

/**
 * Servicio para gestión de categorías de productos
 * Maneja CRUD, árbol de categorías y funciones auxiliares
 */

// TODO: Crear archivo de tipos centralizados
// import type { 
//   Category, 
//   CategoryCreate, 
//   CategoryUpdate,
//   CategoryTreeItem 
// } from '../../../shared/types/category.types';

import { apiClient } from '../../../shared/services';
import { PRODUCT_API_ENDPOINTS } from '../constants';

// ========================================
// INTERFACES Y TIPOS LOCALES
// ========================================

interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  level: number;
  is_active: boolean;
  created_date: string;
  updated_date: string;
}

interface CategoryCreate {
  name: string;
  description?: string;
  parent_id?: number;
}

interface CategoryUpdate {
  name?: string;
  description?: string;
  parent_id?: number;
  is_active?: boolean;
}

interface CategoryTreeItem extends Category {
  children: CategoryTreeItem[];
}

interface CategoryListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
}

interface CategoryFilter {
  search?: string;
  active?: boolean;
  parent?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}

interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  withProducts: number;
  withoutProducts: number;
}

// ========================================
// SERVICIO DE CATEGORÍAS
// ========================================

export class CategoryService {
  private static instance: CategoryService;

  private constructor() {}

  /**
   * Singleton pattern para instancia única
   */
  static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  // ========================================
  // MÉTODOS DE CONSULTA
  // ========================================

  /**
   * Obtiene lista paginada de categorías
   */
  async getCategories(filters: CategoryFilter = {}): Promise<CategoryListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.active !== undefined) params.append('active', filters.active.toString());
      if (filters.parent) params.append('parent', filters.parent.toString());
      if (filters.ordering) params.append('ordering', filters.ordering);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size) params.append('page_size', filters.page_size.toString());

      const queryString = params.toString();
      const url = `${PRODUCT_API_ENDPOINTS.CATEGORIES}${queryString ? `?${queryString}` : ''}`;
      
      return await apiClient.get<CategoryListResponse>(url);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw new Error('Error al cargar las categorías');
    }
  }

  /**
   * Obtiene una categoría por ID
   */
  async getCategory(id: number): Promise<Category> {
    try {
      return await apiClient.get<Category>(
        PRODUCT_API_ENDPOINTS.CATEGORY_DETAIL(id)
      );
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      throw new Error('Error al cargar la categoría');
    }
  }

  /**
   * Obtiene el árbol completo de categorías
   */
  async getCategoryTree(): Promise<CategoryTreeItem[]> {
    try {
      return await apiClient.get<CategoryTreeItem[]>(
        PRODUCT_API_ENDPOINTS.CATEGORY_TREE
      );
    } catch (error) {
      console.error('Error al obtener árbol de categorías:', error);
      throw new Error('Error al cargar el árbol de categorías');
    }
  }

  /**
   * Obtiene subcategorías de una categoría padre
   */
  async getSubcategories(parentId: number): Promise<Category[]> {
    try {
      return await apiClient.get<Category[]>(
        PRODUCT_API_ENDPOINTS.CATEGORY_SUBCATEGORIES(parentId)
      );
    } catch (error) {
      console.error('Error al obtener subcategorías:', error);
      throw new Error('Error al cargar las subcategorías');
    }
  }

  /**
   * Obtiene categorías inactivas
   */
  async getInactiveCategories(): Promise<Category[]> {
    try {
      return await apiClient.get<Category[]>(
        PRODUCT_API_ENDPOINTS.CATEGORY_INACTIVE
      );
    } catch (error) {
      console.error('Error al obtener categorías inactivas:', error);
      throw new Error('Error al cargar las categorías inactivas');
    }
  }

  // ========================================
  // MÉTODOS DE BÚSQUEDA
  // ========================================

  /**
   * Busca categorías por nombre
   */
  async searchCategories(query: string, limit: number = 10): Promise<Category[]> {
    try {
      const response = await this.getCategories({
        search: query,
        page_size: limit,
        active: true
      });
      return response.results;
    } catch (error) {
      console.error('Error en búsqueda de categorías:', error);
      throw new Error('Error al buscar categorías');
    }
  }

  // ========================================
  // MÉTODOS CRUD
  // ========================================

  /**
   * Crea una nueva categoría
   */
  async createCategory(categoryData: CategoryCreate): Promise<Category> {
    try {
      return await apiClient.post<Category>(
        PRODUCT_API_ENDPOINTS.CATEGORIES,
        categoryData
      );
    } catch (error) {
      console.error('Error al crear categoría:', error);
      throw new Error('Error al crear la categoría');
    }
  }

  /**
   * Actualiza una categoría existente
   */
  async updateCategory(id: number, updateData: CategoryUpdate): Promise<Category> {
    try {
      return await apiClient.patch<Category>(
        PRODUCT_API_ENDPOINTS.CATEGORY_DETAIL(id),
        updateData
      );
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      throw new Error('Error al actualizar la categoría');
    }
  }

  /**
   * Elimina una categoría (soft delete)
   */
  async deleteCategory(id: number): Promise<void> {
    try {
      await apiClient.delete(
        PRODUCT_API_ENDPOINTS.CATEGORY_DETAIL(id)
      );
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      throw new Error('Error al eliminar la categoría');
    }
  }

  /**
   * Restaura una categoría eliminada
   */
  async restoreCategory(id: number): Promise<Category> {
    try {
      return await apiClient.post<Category>(
        PRODUCT_API_ENDPOINTS.CATEGORY_RESTORE(id)
      );
    } catch (error) {
      console.error('Error al restaurar categoría:', error);
      throw new Error('Error al restaurar la categoría');
    }
  }

  // ========================================
  // MÉTODOS DE ESTADÍSTICAS
  // ========================================

  /**
   * Obtiene estadísticas de categorías
   */
  async getCategoryStats(): Promise<CategoryStats> {
    try {
      // Obtener categorías activas e inactivas
      const [activeResponse, inactiveCategories] = await Promise.all([
        this.getCategories({ active: true, page_size: 1 }),
        this.getInactiveCategories()
      ]);

      return {
        total: activeResponse.count + inactiveCategories.length,
        active: activeResponse.count,
        inactive: inactiveCategories.length,
        withProducts: 0, // Se implementará cuando esté disponible
        withoutProducts: 0, // Se implementará cuando esté disponible
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de categorías:', error);
      throw new Error('Error al cargar las estadísticas de categorías');
    }
  }

  // ========================================
  // MÉTODOS UTILITARIOS
  // ========================================

  /**
   * Valida si un nombre de categoría está disponible
   */
  async validateCategoryName(name: string, excludeId?: number): Promise<boolean> {
    try {
      const response = await this.searchCategories(name, 1);
      if (excludeId) {
        return !response.some(cat => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== excludeId);
      }
      return !response.some(cat => cat.name.toLowerCase() === name.toLowerCase());
    } catch (error) {
      console.error('Error al validar nombre de categoría:', error);
      return false;
    }
  }

  /**
   * Obtiene la ruta completa de una categoría (breadcrumb)
   */
  async getCategoryPath(categoryId: number): Promise<Category[]> {
    try {
      const path: Category[] = [];
      let currentCategory = await this.getCategory(categoryId);
      
      path.unshift(currentCategory);
      
      while (currentCategory.parent_id) {
        currentCategory = await this.getCategory(currentCategory.parent_id);
        path.unshift(currentCategory);
      }
      
      return path;
    } catch (error) {
      console.error('Error al obtener ruta de categoría:', error);
      throw new Error('Error al obtener la ruta de la categoría');
    }
  }
}

// ========================================
// EXPORTACIÓN SINGLETON
// ========================================

export const categoryService = CategoryService.getInstance();