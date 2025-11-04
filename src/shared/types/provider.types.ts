// src/shared/types/provider.types.ts

/**
 * Tipos TypeScript para proveedores
 */

// ========================================
// INTERFACES PRINCIPALES
// ========================================

export interface Provider {
  id: number;
  name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  website?: string;
  tax_id: string;
  active: boolean;
  
  // Campos de calificación
  average_rating?: number;
  total_ratings?: number;
  
  // Campos de auditoría
  creation_date: string;
  update_date: string;
  created_by: number;
  updated_by: number;
  
  // Campos computados
  product_count?: number;
  last_order_date?: string;
}

// ========================================
// DTOS PARA OPERACIONES CRUD
// ========================================

export interface ProviderCreate {
  name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  website?: string;
  tax_id: string;
  active?: boolean;
}

export interface ProviderUpdate {
  name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  tax_id?: string;
  active?: boolean;
}

// ========================================
// CALIFICACIONES
// ========================================

export interface ProviderRating {
  rating: number; // 1-5
  comment?: string;
  criteria?: {
    quality: number;
    delivery_time: number;
    communication: number;
    price: number;
  };
}

export interface ProviderRatingResponse {
  id: number;
  provider: number;
  rating: number;
  comment: string;
  criteria: {
    quality: number;
    delivery_time: number;
    communication: number;
    price: number;
  };
  created_date: string;
  created_by: number;
}

// ========================================
// FILTROS Y CONSULTAS
// ========================================

export interface ProviderFilter {
  search?: string;
  active?: boolean;
  country?: string;
  city?: string;
  rating_min?: number;
  rating_max?: number;
  has_products?: boolean;
  ordering?: ProviderOrderBy;
  page?: number;
  page_size?: number;
}

export type ProviderOrderBy = 
  | 'name' 
  | '-name'
  | 'creation_date' 
  | '-creation_date'
  | 'update_date'
  | '-update_date'
  | 'average_rating'
  | '-average_rating'
  | 'country'
  | '-country';

// ========================================
// RESPUESTAS DE API
// ========================================

export interface ProviderListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Provider[];
}

export interface ProviderStatsResponse {
  total: number;
  active: number;
  inactive: number;
  average_rating: number;
  with_products: number;
  without_products: number;
  by_country: Record<string, number>;
}

// ========================================
// VALIDACIÓN
// ========================================

export interface ProviderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ========================================
// CONSTANTES
// ========================================

export const PROVIDER_VALIDATION_RULES = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MIN_LENGTH: 7,
  PHONE_MAX_LENGTH: 20,
  ADDRESS_MAX_LENGTH: 255,
  CITY_MAX_LENGTH: 100,
  COUNTRY_MAX_LENGTH: 100,
  POSTAL_CODE_MAX_LENGTH: 20,
  TAX_ID_MAX_LENGTH: 50,
  WEBSITE_MAX_LENGTH: 255,
  RATING_MIN: 1,
  RATING_MAX: 5,
} as const;

export const PROVIDER_ERRORS = {
  NAME_REQUIRED: 'El nombre del proveedor es obligatorio',
  NAME_TOO_SHORT: `El nombre debe tener al menos ${PROVIDER_VALIDATION_RULES.NAME_MIN_LENGTH} caracteres`,
  NAME_TOO_LONG: `El nombre no puede exceder ${PROVIDER_VALIDATION_RULES.NAME_MAX_LENGTH} caracteres`,
  EMAIL_REQUIRED: 'El email de contacto es obligatorio',
  EMAIL_INVALID: 'Formato de email inválido',
  EMAIL_ALREADY_EXISTS: 'Ya existe un proveedor con este email',
  PHONE_REQUIRED: 'El teléfono de contacto es obligatorio',
  PHONE_INVALID: 'Formato de teléfono inválido',
  ADDRESS_REQUIRED: 'La dirección es obligatoria',
  CITY_REQUIRED: 'La ciudad es obligatoria',
  COUNTRY_REQUIRED: 'El país es obligatorio',
  TAX_ID_REQUIRED: 'El ID fiscal es obligatorio',
  TAX_ID_INVALID: 'Formato de ID fiscal inválido',
  RATING_OUT_OF_RANGE: `La calificación debe estar entre ${PROVIDER_VALIDATION_RULES.RATING_MIN} y ${PROVIDER_VALIDATION_RULES.RATING_MAX}`,
  HAS_PRODUCTS: 'No se puede eliminar un proveedor que tiene productos asociados',
} as const;