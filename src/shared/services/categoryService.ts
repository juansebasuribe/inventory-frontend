// src/shared/services/categoryService.ts

/**
 * Servicio para gestión de categorías
 * FASE 7.3 - Componentes UI Profesionales
 */

import type { Category, CategoryTree, CategoryCreate } from '../types/product.types';
import { apiClient } from './index';

interface CategoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
}

class CategoryService {
  private static instance: CategoryService;
  private readonly baseUrl = '/api/category/v1/categories/';

  static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  /**
   * Obtener todas las categorías
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<CategoryResponse>(this.baseUrl);
      return response.results;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener categorías');
    }
  }

  /**
   * Obtener árbol de categorías jerárquico
   */
  async getCategoryTree(): Promise<CategoryTree[]> {
    try {
      const response = await apiClient.get<CategoryTree[]>(`${this.baseUrl}tree/`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener árbol de categorías');
    }
  }

  /**
   * Obtener categoría por ID
   */
  async getCategoryById(id: number): Promise<Category> {
    try {
      const response = await apiClient.get<Category>(`${this.baseUrl}${id}/`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener categoría');
    }
  }

  /**
   * Crear nueva categoría
   */
  async createCategory(categoryData: CategoryCreate): Promise<Category> {
    try {
      // Si hay imagen, usar FormData
      if (categoryData.image) {
        const formData = new FormData();
        formData.append('name', categoryData.name);
        if (categoryData.description) {
          formData.append('description', categoryData.description);
        }
        if (categoryData.parent) {
          formData.append('parent', categoryData.parent.toString());
        }
        if (categoryData.order) {
          formData.append('order', categoryData.order.toString());
        }
        formData.append('image', categoryData.image);

        const response = await apiClient.post<Category>(this.baseUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response;
      } else {
        // Sin imagen, usar JSON
        const payload: any = {
          name: categoryData.name,
        };
        
        if (categoryData.description) {
          payload.description = categoryData.description;
        }
        if (categoryData.parent) {
          payload.parent = categoryData.parent;
        }
        if (categoryData.order) {
          payload.order = categoryData.order;
        }

        const response = await apiClient.post<Category>(this.baseUrl, payload);
        return response;
      }
    } catch (error: any) {
      console.error('❌ Error creating category:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al crear categoría');
    }
  }

  /**
   * Actualizar categoría
   */
  async updateCategory(id: number, categoryData: Partial<CategoryCreate>): Promise<Category> {
    try {
      const formData = new FormData();
      
      if (categoryData.name) {
        formData.append('name', categoryData.name);
      }
      if (categoryData.description !== undefined) {
        formData.append('description', categoryData.description);
      }
      if (categoryData.parent !== undefined) {
        if (categoryData.parent) {
          formData.append('parent', categoryData.parent.toString());
        } else {
          formData.append('parent', '');
        }
      }
      if (categoryData.order !== undefined) {
        formData.append('order', categoryData.order.toString());
      }
      if (categoryData.image) {
        formData.append('image', categoryData.image);
      }

      const response = await apiClient.patch<Category>(`${this.baseUrl}${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar categoría');
    }
  }

  /**
   * Eliminar categoría
   */
  async deleteCategory(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}${id}/`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar categoría');
    }
  }

  /**
   * Obtener subcategorías de una categoría
   */
  async getSubcategories(parentId: number): Promise<Category[]> {
    try {
      const response = await apiClient.get<CategoryResponse>(`${this.baseUrl}?parent=${parentId}`);
      return response.results;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener subcategorías');
    }
  }

  /**
   * Buscar categorías por nombre
   */
  async searchCategories(search: string): Promise<Category[]> {
    try {
      const response = await apiClient.get<CategoryResponse>(`${this.baseUrl}?search=${encodeURIComponent(search)}`);
      return response.results;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al buscar categorías');
    }
  }
}

// Exportar instancia singleton
export const categoryService = CategoryService.getInstance();
export default categoryService;