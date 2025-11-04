// src/shared/types/category.types.ts

/**
 * Tipos TypeScript para categorías de productos
 */

// ========================================
// INTERFACES PRINCIPALES
// ========================================

export interface Category {
  id: number;
  name: string;
  description: string;
  active: boolean;
  parent: number | null;
  creation_date: string;
  update_date: string;
  created_by: number;
  updated_by: number;
  
  // Campos computados/relacionados
  product_count?: number;
  subcategory_count?: number;
  parent_name?: string;
}

export interface CategoryTreeItem extends Category {
  children: CategoryTreeItem[];
  level: number;
  has_children: boolean;
}

// ========================================
// DTOS PARA OPERACIONES CRUD
// ========================================

export interface CategoryCreate {
  name: string;
  description: string;
  parent?: number | null;
  active?: boolean;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  parent?: number | null;
  active?: boolean;
}

// ========================================
// FILTROS Y CONSULTAS
// ========================================

export interface CategoryFilter {
  search?: string;
  active?: boolean;
  parent?: number | null;
  has_products?: boolean;
  ordering?: CategoryOrderBy;
  page?: number;
  page_size?: number;
}

export type CategoryOrderBy = 
  | 'name' 
  | '-name'
  | 'creation_date' 
  | '-creation_date'
  | 'update_date'
  | '-update_date'
  | 'product_count'
  | '-product_count';

// ========================================
// RESPUESTAS DE API
// ========================================

export interface CategoryListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
}

export interface CategoryStatsResponse {
  total: number;
  active: number;
  inactive: number;
  with_products: number;
  without_products: number;
  average_products_per_category: number;
}

// ========================================
// VALIDACIÓN
// ========================================

export interface CategoryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ========================================
// UTILITARIOS
// ========================================

export interface CategoryBreadcrumb {
  id: number;
  name: string;
  url?: string;
}

export interface CategorySelectOption {
  value: number;
  label: string;
  level: number;
  disabled?: boolean;
}

// ========================================
// CONSTANTES
// ========================================

export const CATEGORY_VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  MAX_DEPTH_LEVEL: 5,
} as const;

export const CATEGORY_ERRORS = {
  NAME_REQUIRED: 'El nombre de la categoría es obligatorio',
  NAME_TOO_SHORT: `El nombre debe tener al menos ${CATEGORY_VALIDATION_RULES.NAME_MIN_LENGTH} caracteres`,
  NAME_TOO_LONG: `El nombre no puede exceder ${CATEGORY_VALIDATION_RULES.NAME_MAX_LENGTH} caracteres`,
  NAME_ALREADY_EXISTS: 'Ya existe una categoría con este nombre',
  DESCRIPTION_TOO_LONG: `La descripción no puede exceder ${CATEGORY_VALIDATION_RULES.DESCRIPTION_MAX_LENGTH} caracteres`,
  PARENT_NOT_FOUND: 'La categoría padre no existe',
  CIRCULAR_REFERENCE: 'No se puede asignar una categoría como su propia subcategoría',
  MAX_DEPTH_EXCEEDED: `No se puede exceder ${CATEGORY_VALIDATION_RULES.MAX_DEPTH_LEVEL} niveles de profundidad`,
  HAS_PRODUCTS: 'No se puede eliminar una categoría que tiene productos asociados',
  HAS_SUBCATEGORIES: 'No se puede eliminar una categoría que tiene subcategorías',
} as const;